/**
 * Lead Storage API Routes
 * Handles tenant-based lead storage, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const leadStorageService = require('../services/leadStorageService');

/**
 * POST /api/lead-storage/save
 * Save or update a lead for the current tenant
 */
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { leadData } = req.body;
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    
    if (!leadData) {
      return res.status(400).json({ error: 'Lead data is required' });
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const result = await leadStorageService.saveLead(leadData, tenantId, userId);
    
    res.json({
      success: true,
      lead: result.lead,
      isUpdate: result.isUpdate,
      message: result.isUpdate ? 'Lead updated successfully' : 'Lead saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving lead:', error);
    res.status(500).json({ error: 'Failed to save lead', details: error.message });
  }
});

/**
 * GET /api/lead-storage/tenant
 * Get all leads for the current tenant
 */
router.get('/tenant', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const includeShared = req.query.includeShared !== 'false';
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const leads = await leadStorageService.getTenantLeads(tenantId, includeShared);
    
    res.json({
      success: true,
      leads,
      count: leads.length
    });
    
  } catch (error) {
    console.error('Error getting tenant leads:', error);
    res.status(500).json({ error: 'Failed to get leads', details: error.message });
  }
});

/**
 * POST /api/lead-storage/search
 * Search for a lead before making API calls
 */
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { searchTerm, companyName, orgNumber } = req.body;
    const tenantId = req.user.tenant_id;
    
    const term = searchTerm || companyName || orgNumber;
    
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const lead = await leadStorageService.searchLeadBeforeAPI(term, tenantId);
    
    if (lead) {
      // Check if needs refresh
      const refreshCheck = await leadStorageService.checkLeadNeedsRefresh(lead.id);
      
      res.json({
        success: true,
        found: true,
        lead,
        needsRefresh: refreshCheck.needsRefresh,
        daysSinceAnalysis: refreshCheck.daysSinceAnalysis,
        ownershipStatus: lead.ownership_status
      });
    } else {
      res.json({
        success: true,
        found: false,
        lead: null
      });
    }
    
  } catch (error) {
    console.error('Error searching lead:', error);
    res.status(500).json({ error: 'Failed to search lead', details: error.message });
  }
});

/**
 * POST /api/lead-storage/check-refresh
 * Check if a lead needs refresh
 */
router.post('/check-refresh', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.body;
    
    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }
    
    const result = await leadStorageService.checkLeadNeedsRefresh(leadId);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error checking lead refresh:', error);
    res.status(500).json({ error: 'Failed to check refresh status', details: error.message });
  }
});

/**
 * GET /api/lead-storage/needs-refresh
 * Get leads that need refresh
 */
router.get('/needs-refresh', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const limit = parseInt(req.query.limit) || 100;
    
    // SuperAdmin can see all leads needing refresh
    const isSuperAdmin = req.user.role === 'admin' && !tenantId;
    
    const leads = await leadStorageService.getLeadsNeedingRefresh(
      isSuperAdmin ? null : tenantId,
      limit
    );
    
    res.json({
      success: true,
      leads,
      count: leads.length
    });
    
  } catch (error) {
    console.error('Error getting leads needing refresh:', error);
    res.status(500).json({ error: 'Failed to get leads', details: error.message });
  }
});

/**
 * POST /api/lead-storage/mark-shared
 * Mark a lead as shared (add to shared pool)
 */
router.post('/mark-shared', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.body;
    const userId = req.user.id;
    
    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }
    
    const lead = await leadStorageService.markLeadAsShared(leadId, userId);
    
    res.json({
      success: true,
      lead,
      message: 'Lead added to shared pool'
    });
    
  } catch (error) {
    console.error('Error marking lead as shared:', error);
    res.status(500).json({ error: 'Failed to mark lead as shared', details: error.message });
  }
});

/**
 * POST /api/lead-storage/claim-shared
 * Claim a shared lead (copy to tenant)
 */
router.post('/claim-shared', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.body;
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    
    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const result = await leadStorageService.claimSharedLead(leadId, tenantId, userId);
    
    if (result.alreadyClaimed) {
      res.json({
        success: true,
        alreadyClaimed: true,
        leadId: result.leadId,
        message: 'Lead already claimed by your tenant'
      });
    } else {
      res.json({
        success: true,
        alreadyClaimed: false,
        lead: result.lead,
        message: 'Lead claimed successfully'
      });
    }
    
  } catch (error) {
    console.error('Error claiming shared lead:', error);
    res.status(500).json({ error: 'Failed to claim lead', details: error.message });
  }
});

/**
 * GET /api/lead-storage/shared-pool
 * Get all shared leads (excluding tenant's own leads)
 */
router.get('/shared-pool', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const pool = require('../db');
    const result = await pool.query(
      `SELECT 
        l.*,
        t.company_name as source_tenant_name,
        EXTRACT(DAY FROM (NOW() - l.last_analyzed_at))::INTEGER as days_since_analysis,
        sla.access_count,
        sla.last_accessed_at
       FROM leads l
       LEFT JOIN tenants t ON l.source_tenant_id = t.id
       LEFT JOIN shared_lead_access sla ON sla.lead_id = l.id AND sla.accessed_by_tenant_id = $1
       WHERE l.is_shared = true
       AND l.tenant_id != $1
       ORDER BY l.last_analyzed_at DESC`,
      [tenantId]
    );
    
    res.json({
      success: true,
      leads: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error getting shared pool:', error);
    res.status(500).json({ error: 'Failed to get shared pool', details: error.message });
  }
});

/**
 * GET /api/lead-storage/:id
 * Get a specific lead by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    
    const pool = require('../db');
    const result = await pool.query(
      `SELECT 
        l.*,
        t.company_name as source_tenant_name,
        EXTRACT(DAY FROM (NOW() - l.last_analyzed_at))::INTEGER as days_since_analysis
       FROM leads l
       LEFT JOIN tenants t ON l.source_tenant_id = t.id
       WHERE l.id = $1
       AND (l.tenant_id = $2 OR l.is_shared = true OR $3 = true)`,
      [id, tenantId, req.user.role === 'admin' && !tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found or access denied' });
    }
    
    res.json({
      success: true,
      lead: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({ error: 'Failed to get lead', details: error.message });
  }
});

/**
 * DELETE /api/lead-storage/:id
 * Delete a lead (tenant admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const isSuperAdmin = req.user.role === 'admin' && !tenantId;
    
    // Check if user has permission
    if (!isSuperAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const pool = require('../db');
    
    // Verify lead belongs to tenant (unless SuperAdmin)
    if (!isSuperAdmin) {
      const checkResult = await pool.query(
        'SELECT id FROM leads WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lead not found or access denied' });
      }
    }
    
    await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead', details: error.message });
  }
});

module.exports = router;
