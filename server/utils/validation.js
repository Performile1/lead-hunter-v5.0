/**
 * Validation Utilities
 * Hjälpfunktioner för validering av data
 */

/**
 * Validera org.nummer (svenskt format)
 * @param {string} orgNumber - Org.nummer att validera
 * @returns {boolean} - True om giltigt
 */
export function validateOrgNumber(orgNumber) {
  if (!orgNumber || typeof orgNumber !== 'string') {
    return false;
  }

  // Ta bort bindestreck och mellanslag
  const cleaned = orgNumber.replace(/[-\s]/g, '');

  // Måste vara exakt 10 siffror
  if (!/^\d{10}$/.test(cleaned)) {
    return false;
  }

  // Luhn-algoritm för kontrollsiffra
  const digits = cleaned.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
}

/**
 * Normalisera org.nummer till standard format
 * @param {string} orgNumber - Org.nummer
 * @returns {string} - Normaliserat org.nummer (XXXXXX-XXXX)
 */
export function normalizeOrgNumber(orgNumber) {
  if (!orgNumber) return '';
  
  const cleaned = orgNumber.replace(/[-\s]/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 6)}-${cleaned.substring(6)}`;
  }
  
  return cleaned;
}

/**
 * Validera email-adress
 * @param {string} email - Email att validera
 * @returns {boolean} - True om giltig
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validera telefonnummer (svenskt format)
 * @param {string} phone - Telefonnummer
 * @returns {boolean} - True om giltigt
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Ta bort mellanslag, bindestreck, parenteser
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Svenskt format: 07XXXXXXXX eller +467XXXXXXXX eller 08XXXXXXX
  return /^(\+46|0)[1-9]\d{7,9}$/.test(cleaned);
}

/**
 * Validera postnummer (svenskt format)
 * @param {string} postalCode - Postnummer
 * @returns {boolean} - True om giltigt
 */
export function validatePostalCode(postalCode) {
  if (!postalCode || typeof postalCode !== 'string') {
    return false;
  }

  // Ta bort mellanslag
  const cleaned = postalCode.replace(/\s/g, '');

  // Svenskt format: XXXXX eller XXX XX
  return /^\d{5}$/.test(cleaned) || /^\d{3}\s?\d{2}$/.test(postalCode);
}

/**
 * Validera segment
 * @param {string} segment - Segment att validera
 * @returns {boolean} - True om giltigt
 */
export function validateSegment(segment) {
  const validSegments = ['DM', 'TS', 'FS', 'KAM', 'UNKNOWN'];
  return validSegments.includes(segment);
}

/**
 * Validera URL
 * @param {string} url - URL att validera
 * @returns {boolean} - True om giltig
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validera revenue (omsättning i TKR)
 * @param {number} revenue - Omsättning
 * @returns {boolean} - True om giltig
 */
export function validateRevenue(revenue) {
  return typeof revenue === 'number' && revenue >= 0 && revenue <= 10000000;
}

/**
 * Sanitera string (ta bort farliga tecken)
 * @param {string} str - String att sanitera
 * @returns {string} - Saniterad string
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/[<>]/g, '') // Ta bort < och >
    .replace(/javascript:/gi, '') // Ta bort javascript:
    .replace(/on\w+=/gi, '') // Ta bort event handlers
    .trim();
}

/**
 * Validera lead-objekt
 * @param {object} lead - Lead att validera
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validateLead(lead) {
  const errors = [];

  // Företagsnamn (required)
  if (!lead.companyName || lead.companyName.trim().length === 0) {
    errors.push('Företagsnamn är obligatoriskt');
  }

  // Org.nummer (optional men måste vara giltigt om angivet)
  if (lead.orgNumber && !validateOrgNumber(lead.orgNumber)) {
    errors.push('Ogiltigt org.nummer');
  }

  // Segment (optional men måste vara giltigt om angivet)
  if (lead.segment && !validateSegment(lead.segment)) {
    errors.push('Ogiltigt segment');
  }

  // Email (optional men måste vara giltig om angiven)
  if (lead.email && !validateEmail(lead.email)) {
    errors.push('Ogiltig email-adress');
  }

  // Telefon (optional men måste vara giltig om angiven)
  if (lead.phoneNumber && !validatePhone(lead.phoneNumber)) {
    errors.push('Ogiltigt telefonnummer');
  }

  // Postnummer (optional men måste vara giltigt om angivet)
  if (lead.postalCode && !validatePostalCode(lead.postalCode)) {
    errors.push('Ogiltigt postnummer');
  }

  // Website (optional men måste vara giltig om angiven)
  if (lead.websiteUrl && !validateUrl(lead.websiteUrl)) {
    errors.push('Ogiltig webbadress');
  }

  // Revenue (optional men måste vara giltig om angiven)
  if (lead.revenueTkr !== undefined && !validateRevenue(lead.revenueTkr)) {
    errors.push('Ogiltig omsättning');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validera user-objekt
 * @param {object} user - User att validera
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validateUser(user) {
  const errors = [];

  // Email (required)
  if (!user.email || !validateEmail(user.email)) {
    errors.push('Giltig email är obligatorisk');
  }

  // Full name (required)
  if (!user.full_name || user.full_name.trim().length < 2) {
    errors.push('Fullständigt namn är obligatoriskt (minst 2 tecken)');
  }

  // Role (required)
  const validRoles = ['admin', 'manager', 'terminal_manager', 'fs', 'ts', 'kam', 'dm'];
  if (!user.role || !validRoles.includes(user.role)) {
    errors.push('Ogiltig roll');
  }

  // Password (required för nya användare)
  if (user.password && user.password.length < 8) {
    errors.push('Lösenord måste vara minst 8 tecken');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validera batch av leads
 * @param {array} leads - Array av leads
 * @returns {object} - { valid: boolean, errors: object[], validCount: number }
 */
export function validateLeadBatch(leads) {
  if (!Array.isArray(leads)) {
    return {
      valid: false,
      errors: [{ index: -1, errors: ['Input måste vara en array'] }],
      validCount: 0
    };
  }

  const results = leads.map((lead, index) => {
    const validation = validateLead(lead);
    return {
      index,
      valid: validation.valid,
      errors: validation.errors
    };
  });

  const validCount = results.filter(r => r.valid).length;
  const invalidResults = results.filter(r => !r.valid);

  return {
    valid: invalidResults.length === 0,
    errors: invalidResults,
    validCount,
    totalCount: leads.length
  };
}

export default {
  validateOrgNumber,
  normalizeOrgNumber,
  validateEmail,
  validatePhone,
  validatePostalCode,
  validateSegment,
  validateUrl,
  validateRevenue,
  sanitizeString,
  validateLead,
  validateUser,
  validateLeadBatch
};
