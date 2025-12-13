import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Permission middleware för roll-baserad åtkomstkontroll
 */

// Helper: Kontrollera om användare är super admin
export const isSuperAdmin = (user) => {
  return user.role === 'admin' && !user.tenant_id;
};

// Helper: Kontrollera om användare är tenant admin
export const isTenantAdmin = (user) => {
  return user.role === 'admin' && user.tenant_id;
};

// Helper: Kontrollera om användare kan hantera andra användare
export const canManageUsers = (user) => {
  return isSuperAdmin(user) || isTenantAdmin(user) || user.role === 'manager';
};

// Helper: Kontrollera om användare kan allokera leads
export const canAllocateLeads = (user) => {
  return isSuperAdmin(user) || isTenantAdmin(user) || user.role === 'manager' || user.role === 'terminal_manager';
};

// Middleware: Kräv super admin
export const requireSuperAdmin = (req, res, next) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ 
      error: 'Åtkomst nekad. Kräver super admin-behörighet.' 
    });
  }
  next();
};

// Middleware: Kräv admin (super eller tenant)
export const requireAdmin = (req, res, next) => {
  if (!isSuperAdmin(req.user) && !isTenantAdmin(req.user)) {
    return res.status(403).json({ 
      error: 'Åtkomst nekad. Kräver admin-behörighet.' 
    });
  }
  next();
};

// Middleware: Kräv manager eller högre
export const requireManagerOrHigher = (req, res, next) => {
  const allowedRoles = ['admin', 'manager'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Åtkomst nekad. Kräver manager-behörighet eller högre.' 
    });
  }
  next();
};

// Middleware: Filtrera leads baserat på användarens roll och område
export const filterLeadsByPermission = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Super admin ser allt
    if (isSuperAdmin(user)) {
      req.leadFilter = {}; // Ingen filtrering
      return next();
    }
    
    // Tenant admin ser allt inom sin tenant
    if (isTenantAdmin(user)) {
      req.leadFilter = { tenant_id: user.tenant_id };
      return next();
    }
    
    // Manager ser leads för sitt team
    if (user.role === 'manager') {
      // Hämta användare i managerns team
      const teamResult = await query(
        `SELECT id FROM users WHERE manager_id = $1 OR id = $1`,
        [user.id]
      );
      const teamUserIds = teamResult.rows.map(r => r.id);
      req.leadFilter = { assigned_to: teamUserIds };
      return next();
    }
    
    // Terminal manager ser leads för sin terminal/postnummer
    if (user.role === 'terminal_manager') {
      // Hämta postnummer för terminalen
      const postalResult = await query(
        `SELECT postal_codes FROM terminal_postal_codes 
         WHERE terminal_id = (SELECT id FROM terminals WHERE code = $1)`,
        [user.terminal_code]
      );
      
      if (postalResult.rows.length > 0) {
        const postalCodes = postalResult.rows.flatMap(r => r.postal_codes);
        req.leadFilter = { postal_code_prefix: postalCodes };
      } else {
        req.leadFilter = { assigned_to: user.id }; // Fallback
      }
      return next();
    }
    
    // Säljare ser endast sina egna leads
    req.leadFilter = { assigned_to: user.id };
    next();
    
  } catch (error) {
    logger.error('Error in filterLeadsByPermission:', error);
    return res.status(500).json({ error: 'Serverfel vid behörighetskontroll' });
  }
};

// Middleware: Filtrera kunder baserat på användarens roll
export const filterCustomersByPermission = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Super admin ser allt
    if (isSuperAdmin(user)) {
      req.customerFilter = {};
      return next();
    }
    
    // Tenant admin ser allt inom sin tenant
    if (isTenantAdmin(user)) {
      req.customerFilter = { tenant_id: user.tenant_id };
      return next();
    }
    
    // Manager ser kunder för sitt team
    if (user.role === 'manager') {
      const teamResult = await query(
        `SELECT id FROM users WHERE manager_id = $1 OR id = $1`,
        [user.id]
      );
      const teamUserIds = teamResult.rows.map(r => r.id);
      req.customerFilter = { account_manager_id: teamUserIds };
      return next();
    }
    
    // Terminal manager ser kunder i sitt område
    if (user.role === 'terminal_manager') {
      const postalResult = await query(
        `SELECT postal_codes FROM terminal_postal_codes 
         WHERE terminal_id = (SELECT id FROM terminals WHERE code = $1)`,
        [user.terminal_code]
      );
      
      if (postalResult.rows.length > 0) {
        const postalCodes = postalResult.rows.flatMap(r => r.postal_codes);
        req.customerFilter = { postal_code_prefix: postalCodes };
      } else {
        req.customerFilter = { account_manager_id: user.id };
      }
      return next();
    }
    
    // Säljare ser endast sina egna kunder
    req.customerFilter = { account_manager_id: user.id };
    next();
    
  } catch (error) {
    logger.error('Error in filterCustomersByPermission:', error);
    return res.status(500).json({ error: 'Serverfel vid behörighetskontroll' });
  }
};

// Middleware: Verifiera att användare kan allokera lead
export const canAllocateLead = async (req, res, next) => {
  try {
    const user = req.user;
    const { lead_id, target_user_id } = req.body;
    
    // Super admin kan allokera till vem som helst
    if (isSuperAdmin(user)) {
      return next();
    }
    
    // Tenant admin kan allokera inom sin tenant
    if (isTenantAdmin(user)) {
      const targetUser = await query(
        'SELECT tenant_id FROM users WHERE id = $1',
        [target_user_id]
      );
      
      if (targetUser.rows.length === 0) {
        return res.status(404).json({ error: 'Användare hittades inte' });
      }
      
      if (targetUser.rows[0].tenant_id !== user.tenant_id) {
        return res.status(403).json({ 
          error: 'Du kan endast allokera leads till användare inom din tenant' 
        });
      }
      
      return next();
    }
    
    // Manager kan allokera till sitt team
    if (user.role === 'manager') {
      const targetUser = await query(
        'SELECT manager_id FROM users WHERE id = $1',
        [target_user_id]
      );
      
      if (targetUser.rows.length === 0) {
        return res.status(404).json({ error: 'Användare hittades inte' });
      }
      
      if (targetUser.rows[0].manager_id !== user.id) {
        return res.status(403).json({ 
          error: 'Du kan endast allokera leads till ditt team' 
        });
      }
      
      return next();
    }
    
    // Terminal manager kan allokera till sin terminal
    if (user.role === 'terminal_manager') {
      const targetUser = await query(
        'SELECT terminal_code FROM users WHERE id = $1',
        [target_user_id]
      );
      
      if (targetUser.rows.length === 0) {
        return res.status(404).json({ error: 'Användare hittades inte' });
      }
      
      if (targetUser.rows[0].terminal_code !== user.terminal_code) {
        return res.status(403).json({ 
          error: 'Du kan endast allokera leads till användare på din terminal' 
        });
      }
      
      return next();
    }
    
    // Säljare kan inte allokera
    return res.status(403).json({ 
      error: 'Du har inte behörighet att allokera leads' 
    });
    
  } catch (error) {
    logger.error('Error in canAllocateLead:', error);
    return res.status(500).json({ error: 'Serverfel vid behörighetskontroll' });
  }
};

export default {
  isSuperAdmin,
  isTenantAdmin,
  canManageUsers,
  canAllocateLeads,
  requireSuperAdmin,
  requireAdmin,
  requireManagerOrHigher,
  filterLeadsByPermission,
  filterCustomersByPermission,
  canAllocateLead
};
