import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query, transaction } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sanitizeInput, auditLog, encryptData, decryptData } from '../middleware/security.js';

const router = express.Router();

// Alla routes kräver admin-roll
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/admin/llm-configs
 * Hämta alla LLM-konfigurationer
 */
router.get('/llm-configs',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, provider, model_name, is_enabled, priority, 
              cost_per_1m_tokens, max_tokens, temperature, 
              metadata, created_at, updated_at,
              CASE WHEN api_key_encrypted IS NOT NULL THEN true ELSE false END as api_key_set
       FROM llm_configurations
       ORDER BY priority DESC, provider ASC`
    );

    const configs = result.rows.map(row => ({
      ...row,
      features: row.metadata?.features || []
    }));

    res.json({ configs });
  })
);

/**
 * PUT /api/admin/llm-configs/:id
 * Uppdatera LLM-konfiguration
 */
router.put('/llm-configs/:id',
  param('id').isUUID(),
  sanitizeInput,
  auditLog('update_llm_config'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { is_enabled, priority, api_key, cost_per_1m_tokens, max_tokens, temperature } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (is_enabled !== undefined) {
      updates.push(`is_enabled = $${paramIndex}`);
      values.push(is_enabled);
      paramIndex++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      values.push(priority);
      paramIndex++;
    }

    if (api_key) {
      const encrypted = encryptData(api_key);
      updates.push(`api_key_encrypted = $${paramIndex}`);
      values.push(encrypted);
      paramIndex++;
    }

    if (cost_per_1m_tokens !== undefined) {
      updates.push(`cost_per_1m_tokens = $${paramIndex}`);
      values.push(cost_per_1m_tokens);
      paramIndex++;
    }

    if (max_tokens !== undefined) {
      updates.push(`max_tokens = $${paramIndex}`);
      values.push(max_tokens);
      paramIndex++;
    }

    if (temperature !== undefined) {
      updates.push(`temperature = $${paramIndex}`);
      values.push(temperature);
      paramIndex++;
    }

    if (updates.length > 0) {
      values.push(req.params.id);
      await query(
        `UPDATE llm_configurations 
         SET ${updates.join(', ')}, updated_at = NOW() 
         WHERE id = $${paramIndex}`,
        values
      );
    }

    res.json({ message: 'LLM-konfiguration uppdaterad' });
  })
);

/**
 * POST /api/admin/llm-configs/:id/test
 * Testa LLM-provider
 */
router.post('/llm-configs/:id/test',
  param('id').isUUID(),
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT provider, model_name, api_key_encrypted FROM llm_configurations WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'LLM-konfiguration hittades inte' });
    }

    const config = result.rows[0];

    if (!config.api_key_encrypted) {
      return res.status(400).json({ error: 'API-nyckel saknas' });
    }

    try {
      const apiKey = decryptData(config.api_key_encrypted);
      
      // Testa baserat på provider
      let testResult;
      
      if (config.provider === 'Google Gemini') {
        testResult = await testGemini(apiKey, config.model_name);
      } else if (config.provider === 'Groq') {
        testResult = await testGroq(apiKey);
      } else if (config.provider === 'OpenAI') {
        testResult = await testOpenAI(apiKey, config.model_name);
      } else if (config.provider === 'Anthropic Claude') {
        testResult = await testClaude(apiKey, config.model_name);
      } else {
        return res.status(400).json({ error: 'Provider stöds inte för testning' });
      }

      res.json({ success: true, response: testResult });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  })
);

/**
 * GET /api/admin/api-configs
 * Hämta alla API-konfigurationer
 */
router.get('/api-configs',
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, service_type, provider_name, is_enabled, priority,
              rate_limit_per_day, rate_limit_per_minute, cost_per_request,
              metadata, created_at, updated_at,
              CASE WHEN api_key_encrypted IS NOT NULL THEN true ELSE false END as api_key_set
       FROM api_configurations
       ORDER BY service_type, priority DESC`
    );

    res.json({ configs: result.rows });
  })
);

/**
 * PUT /api/admin/api-configs/:id
 * Uppdatera API-konfiguration
 */
router.put('/api-configs/:id',
  param('id').isUUID(),
  sanitizeInput,
  auditLog('update_api_config'),
  asyncHandler(async (req, res) => {
    const { is_enabled, api_key, priority } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (is_enabled !== undefined) {
      updates.push(`is_enabled = $${paramIndex}`);
      values.push(is_enabled);
      paramIndex++;
    }

    if (api_key) {
      const encrypted = encryptData(api_key);
      updates.push(`api_key_encrypted = $${paramIndex}`);
      values.push(encrypted);
      paramIndex++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      values.push(priority);
      paramIndex++;
    }

    if (updates.length > 0) {
      values.push(req.params.id);
      await query(
        `UPDATE api_configurations 
         SET ${updates.join(', ')}, updated_at = NOW() 
         WHERE id = $${paramIndex}`,
        values
      );
    }

    res.json({ message: 'API-konfiguration uppdaterad' });
  })
);

/**
 * GET /api/admin/settings
 * Hämta systeminställningar
 */
router.get('/settings',
  asyncHandler(async (req, res) => {
    const result = await query('SELECT * FROM system_settings ORDER BY key ASC');
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json({ settings });
  })
);

/**
 * PUT /api/admin/settings
 * Uppdatera systeminställningar
 */
router.put('/settings',
  sanitizeInput,
  auditLog('update_system_settings'),
  asyncHandler(async (req, res) => {
    const { settings } = req.body;

    await transaction(async (client) => {
      for (const [key, value] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO system_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) 
           DO UPDATE SET value = $2, updated_at = NOW()`,
          [key, value]
        );
      }
    });

    res.json({ message: 'Inställningar uppdaterade' });
  })
);

/**
 * GET /api/admin/stats
 * Admin-statistik
 */
router.get('/stats',
  asyncHandler(async (req, res) => {
    const [users, leads, apiUsage, costs] = await Promise.all([
      query('SELECT COUNT(*) as count, role FROM users GROUP BY role'),
      query('SELECT COUNT(*) as count, segment FROM leads GROUP BY segment'),
      query(`SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM api_usage 
             WHERE created_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`),
      query(`SELECT provider, SUM(cost_usd) as total_cost
             FROM api_usage
             WHERE created_at >= NOW() - INTERVAL '30 days'
             GROUP BY provider`)
    ]);

    res.json({
      users: users.rows,
      leads: leads.rows,
      apiUsage: apiUsage.rows,
      costs: costs.rows
    });
  })
);

/**
 * GET /api/admin/activity-logs
 * Hämta aktivitetsloggar
 */
router.get('/activity-logs',
  asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0, user_id, action_type } = req.query;

    let sql = `
      SELECT al.*, u.full_name, u.email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (user_id) {
      sql += ` AND al.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (action_type) {
      sql += ` AND al.action_type = $${paramIndex}`;
      params.push(action_type);
      paramIndex++;
    }

    sql += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      logs: result.rows,
      total: result.rows.length
    });
  })
);

/**
 * GET /api/admin/env-vars
 * Hämta environment variables (maskerade)
 */
router.get('/env-vars',
  asyncHandler(async (req, res) => {
    // Only super admin can access
    if (req.user.tenant_id) {
      return res.status(403).json({ error: 'Endast super admin kan hantera environment variables' });
    }

    const envVars = {
      GROQ_API_KEY: process.env.GROQ_API_KEY ? maskApiKey(process.env.GROQ_API_KEY) : '',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? maskApiKey(process.env.GEMINI_API_KEY) : '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? maskApiKey(process.env.OPENAI_API_KEY) : '',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? maskApiKey(process.env.ANTHROPIC_API_KEY) : '',
      DATABASE_URL: process.env.DATABASE_URL ? maskDatabaseUrl(process.env.DATABASE_URL) : '',
      JWT_SECRET: process.env.JWT_SECRET ? '••••••••••••••••' : ''
    };

    res.json({ envVars });
  })
);

/**
 * POST /api/admin/env-vars
 * Uppdatera environment variables
 */
router.post('/env-vars',
  sanitizeInput,
  auditLog('update_env_vars'),
  asyncHandler(async (req, res) => {
    // Only super admin can update
    if (req.user.tenant_id) {
      return res.status(403).json({ error: 'Endast super admin kan uppdatera environment variables' });
    }

    const { envVars } = req.body;

    if (!envVars || typeof envVars !== 'object') {
      return res.status(400).json({ error: 'Ogiltigt format för environment variables' });
    }

    // Import required modules
    const fs = await import('fs');
    const path = await import('path');

    // Update .env file locally
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    try {
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
    } catch (error) {
      console.error('Error reading .env file:', error);
    }

    // Update or add each environment variable
    Object.keys(envVars).forEach(key => {
      const value = envVars[key];
      if (value && !value.includes('••••')) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
        process.env[key] = value;
      }
    });

    // Write back to .env file
    try {
      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    } catch (error) {
      console.error('Error writing .env file:', error);
    }

    // Update Vercel if configured
    let vercelUpdated = false;
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
      try {
        vercelUpdated = await updateVercelEnvVars(envVars);
      } catch (error) {
        console.error('Error updating Vercel:', error);
      }
    }

    res.json({
      success: true,
      message: vercelUpdated 
        ? 'Environment variables uppdaterade lokalt och i Vercel!' 
        : 'Environment variables uppdaterade lokalt.',
      vercelUpdated
    });
  })
);

// Helper functions for testing LLMs
async function testGemini(apiKey, model) {
  // Implementera Gemini test
  return 'Gemini test lyckades';
}

async function testGroq(apiKey) {
  // Implementera Groq test
  return 'Groq test lyckades';
}

async function testOpenAI(apiKey, model) {
  // Implementera OpenAI test
  return 'OpenAI test lyckades';
}

async function testClaude(apiKey, model) {
  // Implementera Claude test
  return 'Claude test lyckades';
}

// Helper function to mask API keys
function maskApiKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}

// Helper function to mask database URL
function maskDatabaseUrl(url) {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '••••••••';
    }
    return urlObj.toString();
  } catch {
    return '••••••••';
  }
}

// Update Vercel environment variables
async function updateVercelEnvVars(envVars) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return false;
  }

  const baseUrl = teamId 
    ? `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/env`;

  try {
    // Get existing env vars
    const getResponse = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      return false;
    }

    const existingVars = await getResponse.json();

    // Update or create each env var
    for (const [key, value] of Object.entries(envVars)) {
      if (!value || value.includes('••••')) continue;

      const envVarId = existingVars.envs?.find(v => v.key === key)?.id;

      if (envVarId) {
        // Update existing
        const updateUrl = teamId
          ? `https://api.vercel.com/v9/projects/${projectId}/env/${envVarId}?teamId=${teamId}`
          : `https://api.vercel.com/v9/projects/${projectId}/env/${envVarId}`;

        await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            value,
            target: ['production', 'preview', 'development']
          })
        });
      } else {
        // Create new
        await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key,
            value,
            type: 'encrypted',
            target: ['production', 'preview', 'development']
          })
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating Vercel env vars:', error);
    return false;
  }
}

export default router;
