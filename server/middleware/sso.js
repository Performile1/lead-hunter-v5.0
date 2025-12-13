import passport from 'passport';
import { Strategy as AzureAdOAuth2Strategy } from 'passport-azure-ad-oauth2';
import jwt from 'jsonwebtoken';
import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Azure AD SSO Configuration för DHL
 * Konfigurerar Single Sign-On med Microsoft Azure AD
 */

// Azure AD konfiguration
const azureConfig = {
  clientID: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  callbackURL: process.env.AZURE_CALLBACK_URL || 'http://localhost:3001/api/auth/sso/callback',
  tenant: process.env.AZURE_TENANT_ID || 'common',
  resource: 'https://graph.microsoft.com/',
  scope: ['user.read', 'email', 'profile']
};

/**
 * Passport Azure AD Strategy
 */
passport.use(
  new AzureAdOAuth2Strategy(
    {
      clientID: azureConfig.clientID,
      clientSecret: azureConfig.clientSecret,
      callbackURL: azureConfig.callbackURL,
      tenant: azureConfig.tenant,
      resource: azureConfig.resource
    },
    async (accessToken, refreshToken, params, profile, done) => {
      try {
        // Dekoda ID token från Azure AD
        const idToken = params.id_token;
        const decodedToken = jwt.decode(idToken);

        if (!decodedToken) {
          return done(new Error('Kunde inte dekoda Azure AD token'));
        }

        // Extrahera användarinfo
        const email = decodedToken.email || decodedToken.preferred_username;
        const fullName = decodedToken.name;
        const azureId = decodedToken.oid; // Object ID från Azure AD

        // Validera att det är en DHL-email
        if (!email.endsWith('@dhl.se') && !email.endsWith('@dhl.com')) {
          logger.warn('Non-DHL email attempted SSO login', { email });
          return done(null, false, { 
            message: 'Endast DHL-anställda kan logga in' 
          });
        }

        // Använd transaction för att säkerställa atomicitet
        const user = await transaction(async (client) => {
          // Kolla om användaren redan finns
          const existingUser = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
          );

          let userId;

          if (existingUser.rows.length > 0) {
            // Uppdatera befintlig användare
            userId = existingUser.rows[0].id;
            
            await client.query(
              `UPDATE users 
               SET last_login = NOW(), 
                   azure_id = $1,
                   full_name = $2
               WHERE id = $3`,
              [azureId, fullName, userId]
            );

            logger.info('SSO login - existing user', { userId, email });
          } else {
            // Skapa ny användare (auto-provisioning)
            // Default roll baserat på email-domän eller manuell godkännande
            const defaultRole = 'fs'; // Kan anpassas baserat på Azure AD groups

            const newUser = await client.query(
              `INSERT INTO users (email, full_name, role, status, azure_id, password_hash)
               VALUES ($1, $2, $3, 'pending', $4, 'sso')
               RETURNING id`,
              [email, fullName, defaultRole, azureId]
            );

            userId = newUser.rows[0].id;

            logger.info('SSO login - new user created (pending approval)', { 
              userId, 
              email 
            });

            // Skicka notifikation till admin om ny användare (TODO)
          }

          // Hämta komplett användarinfo
          const userResult = await client.query(
            `SELECT id, email, full_name, role, status, azure_id
             FROM users 
             WHERE id = $1`,
            [userId]
          );

          return userResult.rows[0];
        });

        // Kontrollera status
        if (user.status !== 'active') {
          logger.warn('Inactive user attempted login', { 
            userId: user.id, 
            status: user.status 
          });
          return done(null, false, { 
            message: 'Ditt konto väntar på godkännande från en administratör' 
          });
        }

        // Hämta användarens regioner
        const regionsResult = await query(
          'SELECT region_name FROM user_regions WHERE user_id = $1',
          [user.id]
        );
        user.regions = regionsResult.rows.map(r => r.region_name);

        return done(null, user);
      } catch (error) {
        logger.error('SSO authentication error', { error: error.message });
        return done(error);
      }
    }
  )
);

/**
 * Serialize user för session
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user från session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, role, status FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return done(null, false);
    }

    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

/**
 * SSO Middleware - Initierar Azure AD login
 */
export const initiateSSOLogin = passport.authenticate('azure_ad_oauth2', {
  session: false,
  failureRedirect: '/login?error=sso_failed'
});

/**
 * SSO Callback Middleware - Hanterar callback från Azure AD
 */
export const handleSSOCallback = (req, res, next) => {
  passport.authenticate('azure_ad_oauth2', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('SSO callback error', { error: err.message });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=sso_error`);
    }

    if (!user) {
      const message = info?.message || 'SSO authentication failed';
      logger.warn('SSO authentication failed', { message });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
    }

    // Generera JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Logga aktivitet
    query(
      `INSERT INTO activity_log (user_id, action_type, details, ip_address)
       VALUES ($1, 'sso_login', $2, $3)`,
      [user.id, JSON.stringify({ method: 'azure_ad' }), req.ip]
    ).catch(err => logger.error('Failed to log SSO activity', { error: err.message }));

    // Redirect till frontend med token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  })(req, res, next);
};

/**
 * Kontrollera om SSO är konfigurerat
 */
export const isSSOConfigured = () => {
  return !!(
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_TENANT_ID
  );
};

/**
 * Middleware för att kräva SSO för specifika routes
 */
export const requireSSO = (req, res, next) => {
  if (!isSSOConfigured()) {
    return res.status(503).json({
      error: 'SSO är inte konfigurerat',
      code: 'SSO_NOT_CONFIGURED'
    });
  }

  // Kontrollera att användaren är SSO-autentiserad
  if (req.user && req.user.azure_id) {
    return next();
  }

  res.status(401).json({
    error: 'SSO-autentisering krävs',
    code: 'SSO_REQUIRED'
  });
};

export default passport;
