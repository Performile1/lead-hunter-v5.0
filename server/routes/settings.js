import express from 'express';
import { pool } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const router = express.Router();

/**
 * GET /api/settings
 * Hämta alla system-inställningar (endast admin)
 */
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        description,
        updated_at
      FROM system_settings
      ORDER BY setting_key
    `);

    // Konvertera till strukturerat objekt
    const settings = {
      scraping: {},
      api: {},
      search: {},
      ui: {},
      data: {},
      security: {}
    };

    result.rows.forEach(row => {
      const key = row.setting_key;
      let value = row.setting_value;

      // Parse värde baserat på typ
      if (row.setting_type === 'json') {
        value = JSON.parse(value);
      } else if (row.setting_type === 'number') {
        value = parseFloat(value);
      } else if (row.setting_type === 'boolean') {
        value = value === 'true';
      }

      // Placera i rätt kategori
      if (key.startsWith('scraping_')) {
        settings.scraping[key.replace('scraping_', '')] = value;
      } else if (key.startsWith('api_')) {
        settings.api[key.replace('api_', '')] = value;
      } else if (key.startsWith('search_')) {
        settings.search[key.replace('search_', '')] = value;
      } else if (key.startsWith('ui_')) {
        settings.ui[key.replace('ui_', '')] = value;
      } else if (key.startsWith('data_')) {
        settings.data[key.replace('data_', '')] = value;
      } else if (key.startsWith('security_')) {
        settings.security[key.replace('security_', '')] = value;
      }
    });

    res.json(settings);
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * POST /api/settings
 * Uppdatera system-inställningar (endast admin)
 */
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { scraping, api, search, ui, data, security } = req.body;
    const userId = req.user.id;

    // Funktion för att spara inställning
    const saveSetting = async (category, key, value) => {
      const fullKey = `${category}_${key}`;
      let settingType = 'string';
      let settingValue = value;

      if (typeof value === 'boolean') {
        settingType = 'boolean';
        settingValue = value.toString();
      } else if (typeof value === 'number') {
        settingType = 'number';
        settingValue = value.toString();
      } else if (typeof value === 'object') {
        settingType = 'json';
        settingValue = JSON.stringify(value);
      }

      await client.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = $2,
          setting_type = $3,
          updated_by = $4,
          updated_at = NOW()
      `, [fullKey, settingValue, settingType, userId]);
    };

    // Spara alla kategorier
    if (scraping) {
      for (const [key, value] of Object.entries(scraping)) {
        await saveSetting('scraping', key, value);
      }
    }

    if (api) {
      for (const [key, value] of Object.entries(api)) {
        // Kryptera API-nycklar innan lagring
        if (key.includes('_key') && value) {
          // TODO: Implementera kryptering
          await saveSetting('api', key, value);
        } else {
          await saveSetting('api', key, value);
        }
      }
    }

    if (search) {
      for (const [key, value] of Object.entries(search)) {
        await saveSetting('search', key, value);
      }
    }

    if (ui) {
      for (const [key, value] of Object.entries(ui)) {
        await saveSetting('ui', key, value);
      }
    }

    if (data) {
      for (const [key, value] of Object.entries(data)) {
        await saveSetting('data', key, value);
      }
    }

    if (security) {
      for (const [key, value] of Object.entries(security)) {
        await saveSetting('security', key, value);
      }
    }

    await client.query('COMMIT');

    logger.info(`Settings updated by user ${userId}`);
    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/settings/:category
 * Hämta inställningar för en specifik kategori
 */
router.get('/:category', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await pool.query(`
      SELECT 
        setting_key,
        setting_value,
        setting_type
      FROM system_settings
      WHERE setting_key LIKE $1
      ORDER BY setting_key
    `, [`${category}_%`]);

    const settings = {};
    result.rows.forEach(row => {
      const key = row.setting_key.replace(`${category}_`, '');
      let value = row.setting_value;

      if (row.setting_type === 'json') {
        value = JSON.parse(value);
      } else if (row.setting_type === 'number') {
        value = parseFloat(value);
      } else if (row.setting_type === 'boolean') {
        value = value === 'true';
      }

      settings[key] = value;
    });

    res.json(settings);
  } catch (error) {
    logger.error('Error fetching category settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * POST /api/settings/export
 * Exportera alla inställningar som JSON
 */
router.post('/export', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        setting_key,
        setting_value,
        setting_type,
        description
      FROM system_settings
      ORDER BY setting_key
    `);

    const exportData = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      settings: result.rows
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=dhl-settings-export.json');
    res.json(exportData);
  } catch (error) {
    logger.error('Error exporting settings:', error);
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

/**
 * POST /api/settings/import
 * Importera inställningar från JSON
 */
router.post('/import', authenticate, authorize(['admin']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { settings } = req.body;
    const userId = req.user.id;

    for (const setting of settings) {
      await client.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = $2,
          setting_type = $3,
          description = $4,
          updated_by = $5,
          updated_at = NOW()
      `, [setting.setting_key, setting.setting_value, setting.setting_type, setting.description, userId]);
    }

    await client.query('COMMIT');

    logger.info(`Settings imported by user ${userId}`);
    res.json({ message: 'Settings imported successfully', count: settings.length });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error importing settings:', error);
    res.status(500).json({ error: 'Failed to import settings' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/settings
 * Uppdatera UI-inställningar (färgschema, login-text, logo)
 */
router.put('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { colorScheme, loginText, logoUrl, customLogo } = req.body;
    const userId = req.user.id;

    // Spara som JSON i system_settings
    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
      VALUES ('ui_color_scheme', $1, 'json', $2, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = $1,
        updated_by = $2,
        updated_at = NOW()
    `, [JSON.stringify(colorScheme), userId]);

    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
      VALUES ('ui_login_text', $1, 'json', $2, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = $1,
        updated_by = $2,
        updated_at = NOW()
    `, [JSON.stringify(loginText), userId]);

    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
      VALUES ('ui_logo_url', $1, 'string', $2, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = $1,
        updated_by = $2,
        updated_at = NOW()
    `, [logoUrl || '', userId]);

    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
      VALUES ('ui_custom_logo', $1, 'boolean', $2, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = $1,
        updated_by = $2,
        updated_at = NOW()
    `, [customLogo ? 'true' : 'false', userId]);

    logger.info(`UI settings updated by user ${userId}`);
    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    logger.error('Error saving UI settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

/**
 * POST /api/settings/upload-logo
 * Ladda upp logo-fil
 */
router.post('/upload-logo', authenticate, authorize(['admin']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    logger.info(`Logo uploaded: ${logoUrl}`);
    
    res.json({ url: logoUrl, filename: req.file.filename });
  } catch (error) {
    logger.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

export default router;
