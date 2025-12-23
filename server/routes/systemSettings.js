/**
 * System Settings API Routes
 * Handles global system configuration (SuperAdmin only)
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db');

/**
 * Middleware to check if user is SuperAdmin
 */
function requireSuperAdmin(req, res, next) {
  const isSuperAdmin = req.user.role === 'admin' && !req.user.tenant_id;
  
  if (!isSuperAdmin) {
    return res.status(403).json({ error: 'SuperAdmin access required' });
  }
  
  next();
}

/**
 * GET /api/system-settings
 * Get all system settings
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM system_settings ORDER BY category, setting_key`
    );
    
    res.json({
      success: true,
      settings: result.rows
    });
    
  } catch (error) {
    console.error('Error getting system settings:', error);
    res.status(500).json({ error: 'Failed to get settings', details: error.message });
  }
});

/**
 * GET /api/system-settings/:key
 * Get a specific setting by key
 */
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM system_settings WHERE setting_key = $1`,
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    const setting = result.rows[0];
    
    // Check if setting is public or user is SuperAdmin
    const isSuperAdmin = req.user.role === 'admin' && !req.user.tenant_id;
    
    if (!setting.is_public && !isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      success: true,
      setting: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting setting:', error);
    res.status(500).json({ error: 'Failed to get setting', details: error.message });
  }
});

/**
 * PUT /api/system-settings/:key
 * Update a system setting
 */
router.put('/:key', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const userId = req.user.id;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    // Check if setting exists
    const checkResult = await pool.query(
      `SELECT * FROM system_settings WHERE setting_key = $1`,
      [key]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    // Update setting
    const updateQuery = `
      UPDATE system_settings
      SET 
        setting_value = $1,
        description = COALESCE($2, description),
        updated_at = NOW(),
        updated_by = $3
      WHERE setting_key = $4
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      value.toString(),
      description,
      userId,
      key
    ]);
    
    res.json({
      success: true,
      setting: result.rows[0],
      message: 'Setting updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting', details: error.message });
  }
});

/**
 * POST /api/system-settings
 * Create a new system setting
 */
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { setting_key, setting_value, description, data_type, category, is_public } = req.body;
    const userId = req.user.id;
    
    if (!setting_key || setting_value === undefined) {
      return res.status(400).json({ error: 'setting_key and setting_value are required' });
    }
    
    const insertQuery = `
      INSERT INTO system_settings (
        setting_key,
        setting_value,
        description,
        data_type,
        category,
        is_public,
        updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      setting_key,
      setting_value.toString(),
      description || null,
      data_type || 'string',
      category || 'general',
      is_public || false,
      userId
    ]);
    
    res.json({
      success: true,
      setting: result.rows[0],
      message: 'Setting created successfully'
    });
    
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Setting key already exists' });
    }
    
    console.error('Error creating setting:', error);
    res.status(500).json({ error: 'Failed to create setting', details: error.message });
  }
});

/**
 * DELETE /api/system-settings/:key
 * Delete a system setting
 */
router.delete('/:key', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await pool.query(
      `DELETE FROM system_settings WHERE setting_key = $1 RETURNING *`,
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting', details: error.message });
  }
});

/**
 * GET /api/system-settings/category/:category
 * Get settings by category
 */
router.get('/category/:category', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM system_settings WHERE category = $1 ORDER BY setting_key`,
      [category]
    );
    
    res.json({
      success: true,
      settings: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error getting settings by category:', error);
    res.status(500).json({ error: 'Failed to get settings', details: error.message });
  }
});

module.exports = router;
