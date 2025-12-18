import { query } from '../../server/config/database.js';
import { logger } from '../../server/utils/logger.js';
import { requireSuperAdmin } from '../../server/middleware/permissions.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  try {
    // Verify super admin
    const user = req.user;
    if (!user || user.role !== 'admin' || user.tenant_id) {
      return res.status(403).json({ error: 'Åtkomst nekad. Kräver super admin-behörighet.' });
    }

    if (req.method === 'GET') {
      // Return current environment variables (masked for security)
      const envVars = {
        GROQ_API_KEY: process.env.GROQ_API_KEY ? maskApiKey(process.env.GROQ_API_KEY) : '',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? maskApiKey(process.env.GEMINI_API_KEY) : '',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? maskApiKey(process.env.OPENAI_API_KEY) : '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? maskApiKey(process.env.ANTHROPIC_API_KEY) : '',
        DATABASE_URL: process.env.DATABASE_URL ? maskDatabaseUrl(process.env.DATABASE_URL) : '',
        JWT_SECRET: process.env.JWT_SECRET ? '••••••••••••••••' : ''
      };

      return res.json({ envVars });
    }

    if (req.method === 'POST') {
      const { envVars } = req.body;

      if (!envVars || typeof envVars !== 'object') {
        return res.status(400).json({ error: 'Ogiltigt format för environment variables' });
      }

      // Update .env file locally
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';

      try {
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }
      } catch (error) {
        logger.error('Error reading .env file:', error);
      }

      // Update or add each environment variable
      Object.keys(envVars).forEach(key => {
        const value = envVars[key];
        if (value && !value.includes('••••')) { // Only update if not masked
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
          } else {
            envContent += `\n${key}=${value}`;
          }
          // Update process.env
          process.env[key] = value;
        }
      });

      // Write back to .env file
      try {
        fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
        logger.info('Environment variables updated in .env file');
      } catch (error) {
        logger.error('Error writing .env file:', error);
      }

      // Update Vercel environment variables if VERCEL_TOKEN is available
      let vercelUpdated = false;
      if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
        try {
          vercelUpdated = await updateVercelEnvVars(envVars);
        } catch (error) {
          logger.error('Error updating Vercel env vars:', error);
        }
      }

      // Log the change
      await query(
        `INSERT INTO system_logs (action, user_id, details, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        ['env_vars_updated', user.id, JSON.stringify({ keys: Object.keys(envVars) })]
      );

      return res.json({
        success: true,
        message: vercelUpdated 
          ? 'Environment variables uppdaterade lokalt och i Vercel!' 
          : 'Environment variables uppdaterade lokalt. Vercel-integration ej konfigurerad.',
        vercelUpdated
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    logger.error('Error in env-vars handler:', error);
    return res.status(500).json({ error: 'Serverfel vid hantering av environment variables' });
  }
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
    logger.warn('Vercel token or project ID not configured');
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
      logger.error('Failed to fetch Vercel env vars:', await getResponse.text());
      return false;
    }

    const existingVars = await getResponse.json();
    const existingKeys = new Set(existingVars.envs?.map(v => v.key) || []);

    // Update or create each env var
    for (const [key, value] of Object.entries(envVars)) {
      if (!value || value.includes('••••')) continue; // Skip masked values

      const envVarId = existingVars.envs?.find(v => v.key === key)?.id;

      if (envVarId) {
        // Update existing
        const updateUrl = teamId
          ? `https://api.vercel.com/v9/projects/${projectId}/env/${envVarId}?teamId=${teamId}`
          : `https://api.vercel.com/v9/projects/${projectId}/env/${envVarId}`;

        const updateResponse = await fetch(updateUrl, {
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

        if (!updateResponse.ok) {
          logger.error(`Failed to update ${key} in Vercel:`, await updateResponse.text());
        }
      } else {
        // Create new
        const createResponse = await fetch(baseUrl, {
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

        if (!createResponse.ok) {
          logger.error(`Failed to create ${key} in Vercel:`, await createResponse.text());
        }
      }
    }

    logger.info('Vercel environment variables updated successfully');
    return true;

  } catch (error) {
    logger.error('Error updating Vercel env vars:', error);
    return false;
  }
}
