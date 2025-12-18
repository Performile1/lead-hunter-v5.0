/**
 * Vercel Sync Service
 * Synkroniserar API-nycklar och environment variables till Vercel
 */

import { logger } from '../utils/logger.js';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

/**
 * Uppdatera environment variables i Vercel
 * @param {Object} envVars - Key-value pairs av environment variables
 * @returns {Promise<boolean>}
 */
export async function syncToVercel(envVars) {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    logger.warn('Vercel credentials not configured. Skipping Vercel sync.');
    return false;
  }

  try {
    logger.info('Starting Vercel environment variables sync...');

    // 1. Hämta befintliga env vars från Vercel
    const listUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`;
    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      logger.error('Failed to list Vercel env vars:', error);
      return false;
    }

    const existingData = await listResponse.json();
    const existingVars = existingData.envs || [];

    // 2. Uppdatera eller skapa varje env var
    const results = [];
    for (const [key, value] of Object.entries(envVars)) {
      // Skippa maskerade värden (som inte ändrats)
      if (value.includes('••••') || value.includes('***')) {
        logger.info(`Skipping masked value for ${key}`);
        continue;
      }

      // Skippa tomma värden
      if (!value || value.trim() === '') {
        logger.info(`Skipping empty value for ${key}`);
        continue;
      }

      // Hitta befintlig env var
      const existing = existingVars.find(e => e.key === key);

      try {
        if (existing) {
          // Uppdatera befintlig
          logger.info(`Updating ${key} in Vercel...`);
          const updateUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${existing.id}`;
          const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              value: value,
              target: ['production', 'preview', 'development'],
              type: 'encrypted'
            })
          });

          if (!updateResponse.ok) {
            const error = await updateResponse.text();
            logger.error(`Failed to update ${key}:`, error);
            results.push({ key, success: false, error });
          } else {
            logger.info(`✅ Updated ${key}`);
            results.push({ key, success: true, action: 'updated' });
          }
        } else {
          // Skapa ny
          logger.info(`Creating ${key} in Vercel...`);
          const createUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`;
          const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: key,
              value: value,
              target: ['production', 'preview', 'development'],
              type: 'encrypted'
            })
          });

          if (!createResponse.ok) {
            const error = await createResponse.text();
            logger.error(`Failed to create ${key}:`, error);
            results.push({ key, success: false, error });
          } else {
            logger.info(`✅ Created ${key}`);
            results.push({ key, success: true, action: 'created' });
          }
        }
      } catch (error) {
        logger.error(`Error processing ${key}:`, error);
        results.push({ key, success: false, error: error.message });
      }
    }

    // Sammanfatta resultat
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info(`Vercel sync complete: ${successful} successful, ${failed} failed`);

    return failed === 0;
  } catch (error) {
    logger.error('Vercel sync failed:', error);
    return false;
  }
}

/**
 * Trigger en re-deploy i Vercel (optional)
 * @returns {Promise<boolean>}
 */
export async function triggerVercelRedeploy() {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    logger.warn('Vercel credentials not configured. Skipping redeploy.');
    return false;
  }

  try {
    logger.info('Triggering Vercel redeploy...');

    const url = `https://api.vercel.com/v13/deployments`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: VERCEL_PROJECT_ID,
        target: 'production',
        gitSource: {
          type: 'github',
          ref: 'master'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to trigger redeploy:', error);
      return false;
    }

    const data = await response.json();
    logger.info(`✅ Redeploy triggered: ${data.url}`);
    return true;
  } catch (error) {
    logger.error('Failed to trigger redeploy:', error);
    return false;
  }
}

/**
 * Hämta environment variables från Vercel
 * @returns {Promise<Object|null>}
 */
export async function getVercelEnvVars() {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    logger.warn('Vercel credentials not configured.');
    return null;
  }

  try {
    const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to get Vercel env vars:', error);
      return null;
    }

    const data = await response.json();
    
    // Konvertera till key-value format (maskera värden)
    const envVars = {};
    for (const env of data.envs || []) {
      envVars[env.key] = '••••••••'; // Maskera värden för säkerhet
    }

    return envVars;
  } catch (error) {
    logger.error('Failed to get Vercel env vars:', error);
    return null;
  }
}
