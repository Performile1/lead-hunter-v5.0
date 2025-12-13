import { pool } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Lead Service
 * Centraliserad business logic för lead-hantering
 */

export class LeadService {
  /**
   * Sök leads med avancerade filter
   */
  static async searchLeads(filters, userContext) {
    const {
      search,
      segment,
      city,
      postal_code,
      status,
      min_revenue,
      max_revenue,
      has_dhl,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    let sql = `
      SELECT 
        l.*,
        t.name as terminal_name,
        u.full_name as assigned_to_name,
        (
          SELECT COUNT(*) 
          FROM decision_makers dm 
          WHERE dm.lead_id = l.id
        ) as decision_maker_count,
        (
          SELECT json_agg(json_build_object(
            'name', dm.name,
            'title', dm.title,
            'email', dm.email,
            'phone', dm.phone
          ))
          FROM decision_makers dm
          WHERE dm.lead_id = l.id
        ) as decision_makers
      FROM leads l
      LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
      LEFT JOIN users u ON l.assigned_salesperson_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Rollbaserad filtrering
    if (userContext.role === 'terminal_manager') {
      sql += ` AND l.assigned_terminal_id = (
        SELECT id FROM terminals WHERE manager_user_id = $${paramIndex}
      )`;
      params.push(userContext.userId);
      paramIndex++;
    } else if (!['admin', 'manager'].includes(userContext.role)) {
      // FS/TS/KAM/DM ser bara sina egna regioner
      if (userContext.regions && userContext.regions.length > 0) {
        sql += ` AND l.city = ANY($${paramIndex})`;
        params.push(userContext.regions);
        paramIndex++;
      }
      if (userContext.postal_codes && userContext.postal_codes.length > 0) {
        sql += ` AND LEFT(l.postal_code, 3) = ANY($${paramIndex})`;
        params.push(userContext.postal_codes);
        paramIndex++;
      }
    }

    // Sökfilter
    if (search) {
      sql += ` AND (
        l.company_name ILIKE $${paramIndex} 
        OR l.org_number LIKE $${paramIndex}
        OR l.city ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (segment) {
      sql += ` AND l.segment = $${paramIndex}`;
      params.push(segment);
      paramIndex++;
    }

    if (city) {
      sql += ` AND l.city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (postal_code) {
      sql += ` AND l.postal_code LIKE $${paramIndex}`;
      params.push(`${postal_code}%`);
      paramIndex++;
    }

    if (status) {
      sql += ` AND l.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (min_revenue) {
      sql += ` AND l.revenue_tkr >= $${paramIndex}`;
      params.push(min_revenue);
      paramIndex++;
    }

    if (max_revenue) {
      sql += ` AND l.revenue_tkr <= $${paramIndex}`;
      params.push(max_revenue);
      paramIndex++;
    }

    if (has_dhl !== undefined) {
      if (has_dhl) {
        sql += ` AND l.delivery_services::text ILIKE '%dhl%'`;
      } else {
        sql += ` AND (l.delivery_services IS NULL OR l.delivery_services::text NOT ILIKE '%dhl%')`;
      }
    }

    // Sortering
    const allowedSortFields = ['created_at', 'company_name', 'revenue_tkr', 'city', 'status'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    sql += ` ORDER BY l.${sortField} ${sortDirection}`;

    // Paginering
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Räkna totalt antal
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').split('ORDER BY')[0];
    const countParams = params.slice(0, -2); // Ta bort limit och offset

    const [leadsResult, countResult] = await Promise.all([
      pool.query(sql, params),
      pool.query(countSql, countParams)
    ]);

    return {
      leads: leadsResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Hämta ett lead med all relaterad data
   */
  static async getLeadById(leadId) {
    const result = await pool.query(`
      SELECT 
        l.*,
        t.name as terminal_name,
        t.code as terminal_code,
        u.full_name as assigned_to_name,
        u.email as assigned_to_email,
        (
          SELECT json_agg(json_build_object(
            'id', dm.id,
            'name', dm.name,
            'title', dm.title,
            'email', dm.email,
            'phone', dm.phone,
            'linkedin_url', dm.linkedin_url,
            'verified', dm.verified,
            'last_contacted', dm.last_contacted
          ))
          FROM decision_makers dm
          WHERE dm.lead_id = l.id
        ) as decision_makers,
        (
          SELECT json_agg(json_build_object(
            'id', n.id,
            'title', n.title,
            'content', n.content,
            'created_at', n.created_at,
            'created_by', u2.full_name
          ))
          FROM notes n
          LEFT JOIN users u2 ON n.created_by = u2.id
          WHERE n.lead_id = l.id
          ORDER BY n.created_at DESC
        ) as notes,
        (
          SELECT json_agg(json_build_object(
            'action', al.action,
            'created_at', al.created_at,
            'created_by', u3.full_name,
            'details', al.details
          ))
          FROM audit_log al
          LEFT JOIN users u3 ON al.user_id = u3.id
          WHERE al.resource_type = 'leads' AND al.resource_id::text = l.id::text
          ORDER BY al.created_at DESC
          LIMIT 20
        ) as activity_log
      FROM leads l
      LEFT JOIN terminals t ON l.assigned_terminal_id = t.id
      LEFT JOIN users u ON l.assigned_salesperson_id = u.id
      WHERE l.id = $1
    `, [leadId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Skapa nytt lead
   */
  static async createLead(leadData, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        company_name,
        org_number,
        address,
        postal_code,
        city,
        segment,
        revenue_tkr,
        freight_budget_tkr,
        website_url,
        decision_makers = []
      } = leadData;

      // Kolla om lead redan finns
      const existingLead = await client.query(`
        SELECT id FROM leads WHERE org_number = $1
      `, [org_number]);

      if (existingLead.rows.length > 0) {
        throw new Error('Lead with this org_number already exists');
      }

      // Skapa lead
      const leadResult = await client.query(`
        INSERT INTO leads (
          company_name, org_number, address, postal_code, city,
          segment, revenue_tkr, freight_budget_tkr, website_url,
          created_by, source, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *
      `, [
        company_name, org_number, address, postal_code, city,
        segment, revenue_tkr, freight_budget_tkr, website_url,
        userId, 'manual', 'new'
      ]);

      const newLead = leadResult.rows[0];

      // Lägg till decision makers
      if (decision_makers.length > 0) {
        for (const dm of decision_makers) {
          await client.query(`
            INSERT INTO decision_makers (
              lead_id, name, title, email, phone, linkedin_url
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [newLead.id, dm.name, dm.title, dm.email, dm.phone, dm.linkedin_url]);
        }
      }

      // Logga skapande
      await client.query(`
        INSERT INTO audit_log (
          user_id, action, resource_type, resource_id, details, created_at
        ) VALUES ($1, 'create_lead', 'leads', $2, $3, NOW())
      `, [userId, newLead.id, JSON.stringify({ company_name, segment })]);

      await client.query('COMMIT');

      return newLead;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Uppdatera lead
   */
  static async updateLead(leadId, updates, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const allowedFields = [
        'company_name', 'address', 'postal_code', 'city', 'segment',
        'revenue_tkr', 'freight_budget_tkr', 'website_url', 'status',
        'legal_status', 'credit_rating', 'notes'
      ];

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(leadId);
      
      const result = await client.query(`
        UPDATE leads 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      // Logga uppdatering
      await client.query(`
        INSERT INTO audit_log (
          user_id, action, resource_type, resource_id, details, created_at
        ) VALUES ($1, 'update_lead', 'leads', $2, $3, NOW())
      `, [userId, leadId, JSON.stringify(updates)]);

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Radera leads med anledning
   */
  static async deleteLeads(leadIds, reason, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Hämta leads
      const leadsResult = await client.query(`
        SELECT id, company_name, org_number FROM leads WHERE id = ANY($1)
      `, [leadIds]);

      const leads = leadsResult.rows;

      // Hantera olika anledningar
      switch (reason) {
        case 'duplicate':
          // Bara radera
          break;

        case 'existing_customer':
          // Lägg till i exkluderingar
          for (const lead of leads) {
            await client.query(`
              INSERT INTO exclusions (
                exclusion_type, value, reason, created_by, created_at
              ) VALUES ('company', $1, 'Befintlig kund', $2, NOW())
              ON CONFLICT (exclusion_type, value) DO NOTHING
            `, [lead.org_number || lead.company_name, userId]);
          }
          break;

        case 'hallucination':
        case 'not_relevant':
          // Blockera permanent
          for (const lead of leads) {
            await client.query(`
              INSERT INTO exclusions (
                exclusion_type, value, reason, created_by, created_at
              ) VALUES ('company', $1, $2, $3, NOW())
              ON CONFLICT (exclusion_type, value) DO NOTHING
            `, [lead.org_number || lead.company_name, reason, userId]);
          }
          break;

        case 'already_processed':
          // Lägg till i historik
          for (const lead of leads) {
            await client.query(`
              INSERT INTO download_history (
                lead_id, user_id, downloaded_at, manual_entry
              ) VALUES ($1, $2, NOW(), true)
            `, [lead.id, userId]);
          }
          break;
      }

      // Radera leads
      await client.query(`
        DELETE FROM leads WHERE id = ANY($1)
      `, [leadIds]);

      // Logga radering
      await client.query(`
        INSERT INTO audit_log (
          user_id, action, resource_type, resource_id, details, created_at
        ) VALUES ($1, 'delete_leads', 'leads', $2, $3, NOW())
      `, [userId, leadIds[0], JSON.stringify({ count: leadIds.length, reason })]);

      await client.query('COMMIT');

      return { deleted: leadIds.length, reason };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Batch-operationer
   */
  static async batchUpdateStatus(leadIds, status, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      await client.query(`
        UPDATE leads 
        SET status = $1, updated_at = NOW()
        WHERE id = ANY($2)
      `, [status, leadIds]);

      await client.query(`
        INSERT INTO audit_log (
          user_id, action, resource_type, resource_id, details, created_at
        ) VALUES ($1, 'batch_update_status', 'leads', $2, $3, NOW())
      `, [userId, leadIds[0], JSON.stringify({ count: leadIds.length, status })]);

      await client.query('COMMIT');

      return { updated: leadIds.length, status };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Statistik
   */
  static async getLeadStats(userContext) {
    let sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new_count,
        COUNT(*) FILTER (WHERE status = 'analyzing') as analyzing_count,
        COUNT(*) FILTER (WHERE status = 'analyzed') as analyzed_count,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted_count,
        AVG(revenue_tkr) as avg_revenue,
        SUM(freight_budget_tkr) as total_freight_budget
      FROM leads
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Rollbaserad filtrering
    if (userContext.role === 'terminal_manager') {
      sql += ` AND assigned_terminal_id = (
        SELECT id FROM terminals WHERE manager_user_id = $${paramIndex}
      )`;
      params.push(userContext.userId);
      paramIndex++;
    } else if (!['admin', 'manager'].includes(userContext.role)) {
      if (userContext.regions && userContext.regions.length > 0) {
        sql += ` AND city = ANY($${paramIndex})`;
        params.push(userContext.regions);
        paramIndex++;
      }
    }

    const result = await pool.query(sql, params);
    return result.rows[0];
  }
}

export default LeadService;
