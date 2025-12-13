import express from 'express';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.use(authenticate);

const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'sv',
  notifications_enabled: true,
  email_notifications: true,
  default_view: 'dashboard',
  leads_per_page: 20,
  show_onboarding: true,
  default_segment: null,
  default_protocol: 'deep',
  auto_enrich: false,
  notify_new_leads: true,
  notify_customer_updates: true,
  notify_cronjob_complete: false,
  share_analytics: true
};

/**
 * GET /api/user-settings
 * Hämtar inloggad användares personliga inställningar.
 * Skapar en default-rad om den inte finns.
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      const created = await pool.query(
        `INSERT INTO user_settings (
          user_id,
          theme,
          language,
          notifications_enabled,
          email_notifications,
          default_view,
          leads_per_page,
          show_onboarding,
          default_segment,
          default_protocol,
          auto_enrich,
          notify_new_leads,
          notify_customer_updates,
          notify_cronjob_complete,
          share_analytics
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        ) RETURNING *`,
        [
          userId,
          DEFAULT_SETTINGS.theme,
          DEFAULT_SETTINGS.language,
          DEFAULT_SETTINGS.notifications_enabled,
          DEFAULT_SETTINGS.email_notifications,
          DEFAULT_SETTINGS.default_view,
          DEFAULT_SETTINGS.leads_per_page,
          DEFAULT_SETTINGS.show_onboarding,
          DEFAULT_SETTINGS.default_segment,
          DEFAULT_SETTINGS.default_protocol,
          DEFAULT_SETTINGS.auto_enrich,
          DEFAULT_SETTINGS.notify_new_leads,
          DEFAULT_SETTINGS.notify_customer_updates,
          DEFAULT_SETTINGS.notify_cronjob_complete,
          DEFAULT_SETTINGS.share_analytics
        ]
      );

      return res.json({ settings: created.rows[0] });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

/**
 * PUT /api/user-settings
 * Uppdaterar inloggad användares personliga inställningar.
 */
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const allowedFields = [
      'theme',
      'language',
      'notifications_enabled',
      'email_notifications',
      'default_view',
      'leads_per_page',
      'show_onboarding',
      'default_segment',
      'default_protocol',
      'auto_enrich',
      'notify_new_leads',
      'notify_customer_updates',
      'notify_cronjob_complete',
      'share_analytics'
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(req.body || {})) {
      if (!allowedFields.includes(key)) continue;
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const queryText = `
      UPDATE user_settings
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(queryText, values);

    if (result.rows.length === 0) {
      // Om raden saknas (edge case), skapa den och be klienten försöka igen
      return res.status(404).json({ error: 'User settings not found (try GET first)' });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    logger.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

export default router;
