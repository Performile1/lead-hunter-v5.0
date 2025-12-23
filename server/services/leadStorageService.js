/**
 * Lead Storage Service
 * Handles saving, retrieving, and managing leads per tenant
 * Includes auto-refresh logic and shared pool functionality
 */

const pool = require('../db');

/**
 * Save or update a lead for a tenant
 */
async function saveLead(leadData, tenantId, userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if lead already exists for this tenant
    const existingLead = await client.query(
      `SELECT id, analysis_version FROM leads 
       WHERE (company_name = $1 OR org_number = $2) 
       AND tenant_id = $3
       LIMIT 1`,
      [leadData.company_name, leadData.org_number, tenantId]
    );
    
    let leadId;
    let isUpdate = false;
    
    if (existingLead.rows.length > 0) {
      // Update existing lead
      leadId = existingLead.rows[0].id;
      isUpdate = true;
      
      const updateQuery = `
        UPDATE leads SET
          company_name = $1,
          org_number = $2,
          website = $3,
          industry = $4,
          employees = $5,
          revenue = $6,
          city = $7,
          region = $8,
          country = $9,
          description = $10,
          ceo_name = $11,
          founded_year = $12,
          segment = $13,
          checkout_data = $14,
          competitive_intelligence = $15,
          decision_makers = $16,
          news_insights = $17,
          last_analyzed_at = NOW(),
          analysis_version = analysis_version + 1,
          updated_at = NOW()
        WHERE id = $18
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [
        leadData.company_name,
        leadData.org_number,
        leadData.website,
        leadData.industry,
        leadData.employees,
        leadData.revenue,
        leadData.city,
        leadData.region,
        leadData.country || 'Sweden',
        leadData.description,
        leadData.ceo_name,
        leadData.founded_year,
        leadData.segment,
        JSON.stringify(leadData.checkout_data || {}),
        JSON.stringify(leadData.competitive_intelligence || {}),
        JSON.stringify(leadData.decision_makers || []),
        JSON.stringify(leadData.news_insights || []),
        leadId
      ]);
      
      await client.query('COMMIT');
      return { lead: result.rows[0], isUpdate: true };
      
    } else {
      // Insert new lead
      const insertQuery = `
        INSERT INTO leads (
          tenant_id,
          source_tenant_id,
          company_name,
          org_number,
          website,
          industry,
          employees,
          revenue,
          city,
          region,
          country,
          description,
          ceo_name,
          founded_year,
          segment,
          checkout_data,
          competitive_intelligence,
          decision_makers,
          news_insights,
          last_analyzed_at,
          analysis_version,
          is_shared,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), 1, false, $20
        )
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        tenantId,
        tenantId, // source_tenant_id same as tenant_id for new leads
        leadData.company_name,
        leadData.org_number,
        leadData.website,
        leadData.industry,
        leadData.employees,
        leadData.revenue,
        leadData.city,
        leadData.region,
        leadData.country || 'Sweden',
        leadData.description,
        leadData.ceo_name,
        leadData.founded_year,
        leadData.segment,
        JSON.stringify(leadData.checkout_data || {}),
        JSON.stringify(leadData.competitive_intelligence || {}),
        JSON.stringify(leadData.decision_makers || []),
        JSON.stringify(leadData.news_insights || []),
        userId
      ]);
      
      await client.query('COMMIT');
      return { lead: result.rows[0], isUpdate: false };
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving lead:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all leads for a tenant (including shared pool)
 */
async function getTenantLeads(tenantId, includeShared = true) {
  try {
    let query = `
      SELECT 
        l.*,
        t.company_name as source_tenant_name,
        CASE 
          WHEN l.tenant_id = $1 THEN 'owned'
          WHEN l.is_shared = true THEN 'shared'
          ELSE 'unknown'
        END as ownership_status,
        EXTRACT(DAY FROM (NOW() - l.last_analyzed_at))::INTEGER as days_since_analysis
      FROM leads l
      LEFT JOIN tenants t ON l.source_tenant_id = t.id
      WHERE l.tenant_id = $1
    `;
    
    if (includeShared) {
      query += ` OR l.is_shared = true`;
    }
    
    query += ` ORDER BY l.last_analyzed_at DESC, l.created_at DESC`;
    
    const result = await pool.query(query, [tenantId]);
    return result.rows;
    
  } catch (error) {
    console.error('Error getting tenant leads:', error);
    throw error;
  }
}

/**
 * Search for a lead before making API calls
 * Searches in tenant's own leads and shared pool
 */
async function searchLeadBeforeAPI(searchTerm, tenantId) {
  try {
    const query = `
      SELECT 
        l.*,
        CASE 
          WHEN l.tenant_id = $2 THEN 'owned'
          WHEN l.is_shared = true THEN 'shared'
          ELSE 'unknown'
        END as ownership_status,
        EXTRACT(DAY FROM (NOW() - l.last_analyzed_at))::INTEGER as days_since_analysis
      FROM leads l
      WHERE (
        LOWER(l.company_name) = LOWER($1)
        OR l.org_number = $1
        OR LOWER(l.website) LIKE LOWER($1 || '%')
      )
      AND (l.tenant_id = $2 OR l.is_shared = true)
      ORDER BY 
        CASE WHEN l.tenant_id = $2 THEN 0 ELSE 1 END,
        l.last_analyzed_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [searchTerm, tenantId]);
    
    if (result.rows.length > 0) {
      // Log search in cache
      await logSearchCache(tenantId, searchTerm, result.rows[0].id);
      return result.rows[0];
    }
    
    return null;
    
  } catch (error) {
    console.error('Error searching lead:', error);
    throw error;
  }
}

/**
 * Check if a lead needs refresh based on system settings
 */
async function checkLeadNeedsRefresh(leadId) {
  try {
    // Get refresh interval from system settings
    const settingResult = await pool.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'lead_refresh_interval_months'`
    );
    
    const refreshIntervalMonths = settingResult.rows.length > 0 
      ? parseInt(settingResult.rows[0].setting_value) 
      : 6;
    
    // Check if lead needs refresh
    const result = await pool.query(
      `SELECT 
        id,
        company_name,
        last_analyzed_at,
        analysis_version,
        (NOW() - last_analyzed_at) > ($2 || ' months')::INTERVAL as needs_refresh,
        EXTRACT(DAY FROM (NOW() - last_analyzed_at))::INTEGER as days_since_analysis
       FROM leads
       WHERE id = $1`,
      [leadId, refreshIntervalMonths]
    );
    
    if (result.rows.length === 0) {
      return { found: false };
    }
    
    return {
      found: true,
      lead: result.rows[0],
      needsRefresh: result.rows[0].needs_refresh,
      daysSinceAnalysis: result.rows[0].days_since_analysis,
      refreshIntervalMonths
    };
    
  } catch (error) {
    console.error('Error checking lead refresh:', error);
    throw error;
  }
}

/**
 * Get leads that need refresh
 */
async function getLeadsNeedingRefresh(tenantId = null, limit = 100) {
  try {
    const settingResult = await pool.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'lead_refresh_interval_months'`
    );
    
    const refreshIntervalMonths = settingResult.rows.length > 0 
      ? parseInt(settingResult.rows[0].setting_value) 
      : 6;
    
    let query = `
      SELECT 
        l.id,
        l.tenant_id,
        l.company_name,
        l.last_analyzed_at,
        l.analysis_version,
        EXTRACT(DAY FROM (NOW() - l.last_analyzed_at))::INTEGER as days_since_analysis,
        t.company_name as tenant_name
      FROM leads l
      LEFT JOIN tenants t ON l.tenant_id = t.id
      WHERE (NOW() - l.last_analyzed_at) > ($1 || ' months')::INTERVAL
    `;
    
    const params = [refreshIntervalMonths];
    
    if (tenantId) {
      query += ` AND l.tenant_id = $2`;
      params.push(tenantId);
    }
    
    query += ` ORDER BY l.last_analyzed_at ASC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    return result.rows;
    
  } catch (error) {
    console.error('Error getting leads needing refresh:', error);
    throw error;
  }
}

/**
 * Mark lead as shared (add to shared pool)
 */
async function markLeadAsShared(leadId, userId) {
  try {
    const result = await pool.query(
      `UPDATE leads 
       SET is_shared = true, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [leadId]
    );
    
    return result.rows[0];
    
  } catch (error) {
    console.error('Error marking lead as shared:', error);
    throw error;
  }
}

/**
 * Claim a shared lead (copy to tenant)
 */
async function claimSharedLead(leadId, tenantId, userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get the shared lead
    const leadResult = await client.query(
      `SELECT * FROM leads WHERE id = $1 AND is_shared = true`,
      [leadId]
    );
    
    if (leadResult.rows.length === 0) {
      throw new Error('Lead not found or not shared');
    }
    
    const sharedLead = leadResult.rows[0];
    
    // Check if tenant already has this lead
    const existingLead = await client.query(
      `SELECT id FROM leads 
       WHERE company_name = $1 AND tenant_id = $2`,
      [sharedLead.company_name, tenantId]
    );
    
    if (existingLead.rows.length > 0) {
      // Already claimed
      await client.query('COMMIT');
      return { alreadyClaimed: true, leadId: existingLead.rows[0].id };
    }
    
    // Copy lead to tenant
    const insertQuery = `
      INSERT INTO leads (
        tenant_id,
        source_tenant_id,
        company_name,
        org_number,
        website,
        industry,
        employees,
        revenue,
        city,
        region,
        country,
        description,
        ceo_name,
        founded_year,
        segment,
        checkout_data,
        competitive_intelligence,
        decision_makers,
        news_insights,
        last_analyzed_at,
        analysis_version,
        is_shared,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false, $22
      )
      RETURNING *
    `;
    
    const newLead = await client.query(insertQuery, [
      tenantId,
      sharedLead.source_tenant_id,
      sharedLead.company_name,
      sharedLead.org_number,
      sharedLead.website,
      sharedLead.industry,
      sharedLead.employees,
      sharedLead.revenue,
      sharedLead.city,
      sharedLead.region,
      sharedLead.country,
      sharedLead.description,
      sharedLead.ceo_name,
      sharedLead.founded_year,
      sharedLead.segment,
      sharedLead.checkout_data,
      sharedLead.competitive_intelligence,
      sharedLead.decision_makers,
      sharedLead.news_insights,
      sharedLead.last_analyzed_at,
      sharedLead.analysis_version,
      userId
    ]);
    
    // Log in shared_lead_access
    await client.query(
      `INSERT INTO shared_lead_access (
        lead_id, accessed_by_tenant_id, accessed_by_user_id, access_type, first_accessed_at, last_accessed_at
      ) VALUES ($1, $2, $3, 'claim', NOW(), NOW())
      ON CONFLICT (lead_id, accessed_by_tenant_id) 
      DO UPDATE SET 
        access_count = shared_lead_access.access_count + 1,
        last_accessed_at = NOW(),
        access_type = 'claim'`,
      [leadId, tenantId, userId]
    );
    
    await client.query('COMMIT');
    return { alreadyClaimed: false, lead: newLead.rows[0] };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error claiming shared lead:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Log search in cache
 */
async function logSearchCache(tenantId, searchQuery, leadId) {
  try {
    await pool.query(
      `INSERT INTO lead_search_cache (tenant_id, search_query, lead_id, first_searched_at, last_searched_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (tenant_id, search_query)
       DO UPDATE SET
         search_count = lead_search_cache.search_count + 1,
         last_searched_at = NOW(),
         lead_id = $3`,
      [tenantId, searchQuery.toLowerCase(), leadId]
    );
  } catch (error) {
    console.error('Error logging search cache:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Get system setting value
 */
async function getSystemSetting(settingKey, defaultValue = null) {
  try {
    const result = await pool.query(
      `SELECT setting_value, data_type FROM system_settings WHERE setting_key = $1`,
      [settingKey]
    );
    
    if (result.rows.length === 0) {
      return defaultValue;
    }
    
    const { setting_value, data_type } = result.rows[0];
    
    // Parse based on data type
    switch (data_type) {
      case 'integer':
        return parseInt(setting_value);
      case 'boolean':
        return setting_value === 'true';
      case 'json':
        return JSON.parse(setting_value);
      default:
        return setting_value;
    }
    
  } catch (error) {
    console.error('Error getting system setting:', error);
    return defaultValue;
  }
}

module.exports = {
  saveLead,
  getTenantLeads,
  searchLeadBeforeAPI,
  checkLeadNeedsRefresh,
  getLeadsNeedingRefresh,
  markLeadAsShared,
  claimSharedLead,
  logSearchCache,
  getSystemSetting
};
