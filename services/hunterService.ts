/**
 * Hunter.io Service
 * Email verification and finder
 * 
 * FREE TIER:
 * - 50 email verifications/månad
 * - 25 email searches/månad
 * - Perfekt för att börja!
 * 
 * PAID TIER:
 * - $49/månad för 1,000 verifieringar
 * - $99/månad för 5,000 verifieringar
 */

import axios from 'axios';

const HUNTER_API_BASE = 'https://api.hunter.io/v2';

interface EmailVerificationResult {
  email: string;
  valid: boolean;
  score: number;
  smtp_check: boolean;
  deliverable: boolean;
  accept_all: boolean;
  disposable: boolean;
  free: boolean;
  mx_records: boolean;
  sources: any[];
}

interface EmailFinderResult {
  email: string;
  score: number;
  first_name: string;
  last_name: string;
  position: string;
  linkedin: string;
  twitter: string;
  phone_number: string;
  sources: any[];
}

/**
 * Verifiera email-adress
 * FREE: 50/månad
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  try {
    const response = await axios.get(`${HUNTER_API_BASE}/email-verifier`, {
      params: {
        email: email,
        api_key: import.meta.env.VITE_HUNTER_API_KEY
      }
    });

    const data = response.data.data;

    return {
      email: data.email,
      valid: data.status === 'valid',
      score: data.score,
      smtp_check: data.smtp_check,
      deliverable: data.result === 'deliverable',
      accept_all: data.accept_all,
      disposable: data.disposable,
      free: data.free,
      mx_records: data.mx_records,
      sources: data.sources || []
    };

  } catch (error: any) {
    console.error('Hunter.io email verification failed:', error.response?.data || error.message);
    
    // Om quota är slut, returnera fallback
    if (error.response?.status === 429) {
      console.warn('⚠️ Hunter.io quota exceeded - using fallback validation');
      return fallbackEmailValidation(email);
    }
    
    throw error;
  }
}

/**
 * Hitta email för person på företag
 * FREE: 25/månad
 */
export async function findEmail(
  domain: string,
  firstName: string,
  lastName: string
): Promise<EmailFinderResult | null> {
  try {
    const response = await axios.get(`${HUNTER_API_BASE}/email-finder`, {
      params: {
        domain: domain,
        first_name: firstName,
        last_name: lastName,
        api_key: import.meta.env.VITE_HUNTER_API_KEY
      }
    });

    const data = response.data.data;

    if (!data.email) {
      return null;
    }

    return {
      email: data.email,
      score: data.score,
      first_name: data.first_name,
      last_name: data.last_name,
      position: data.position,
      linkedin: data.linkedin,
      twitter: data.twitter,
      phone_number: data.phone_number,
      sources: data.sources || []
    };

  } catch (error: any) {
    console.error('Hunter.io email finder failed:', error.response?.data || error.message);
    
    // Om quota är slut, returnera null
    if (error.response?.status === 429) {
      console.warn('⚠️ Hunter.io quota exceeded');
      return null;
    }
    
    return null;
  }
}

/**
 * Hämta email-mönster för domän
 * Gratis - ingen quota
 */
export async function getDomainPattern(domain: string): Promise<string | null> {
  try {
    const response = await axios.get(`${HUNTER_API_BASE}/domain-search`, {
      params: {
        domain: domain,
        api_key: import.meta.env.VITE_HUNTER_API_KEY,
        limit: 1
      }
    });

    return response.data.data.pattern || null;

  } catch (error) {
    console.error('Hunter.io domain pattern failed:', error);
    return null;
  }
}

/**
 * Gissa email baserat på mönster
 * Ingen API-anrop - lokalt
 */
export function guessEmail(
  firstName: string,
  lastName: string,
  domain: string,
  pattern?: string
): string[] {
  const f = firstName.toLowerCase();
  const l = lastName.toLowerCase();
  const d = domain.toLowerCase();

  // Vanliga svenska mönster
  const patterns = pattern ? [pattern] : [
    '{first}.{last}@{domain}',
    '{first}@{domain}',
    '{f}{last}@{domain}',
    '{first}{l}@{domain}',
    '{last}@{domain}'
  ];

  return patterns.map(p => 
    p.replace('{first}', f)
     .replace('{last}', l)
     .replace('{f}', f.charAt(0))
     .replace('{l}', l.charAt(0))
     .replace('{domain}', d)
  );
}

/**
 * Fallback email-validering (utan API)
 * Används när Hunter.io quota är slut
 */
function fallbackEmailValidation(email: string): EmailVerificationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  // Enkla checks
  const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com'];
  const freeDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  
  const domain = email.split('@')[1]?.toLowerCase();
  
  return {
    email: email,
    valid: isValid,
    score: isValid ? 50 : 0,
    smtp_check: false,
    deliverable: isValid,
    accept_all: false,
    disposable: disposableDomains.includes(domain),
    free: freeDomains.includes(domain),
    mx_records: false,
    sources: []
  };
}

/**
 * Batch-verifiera emails (smart quota management)
 * Använd endast för viktiga leads
 */
export async function batchVerifyEmails(
  emails: string[],
  maxVerifications: number = 10
): Promise<Map<string, EmailVerificationResult>> {
  const results = new Map<string, EmailVerificationResult>();
  
  // Prioritera emails (företags-emails före personliga)
  const sortedEmails = emails.sort((a, b) => {
    const aIsCorporate = !a.includes('gmail') && !a.includes('hotmail');
    const bIsCorporate = !b.includes('gmail') && !b.includes('hotmail');
    return bIsCorporate ? 1 : -1;
  });

  // Verifiera endast de viktigaste
  const toVerify = sortedEmails.slice(0, maxVerifications);
  
  for (const email of toVerify) {
    try {
      const result = await verifyEmail(email);
      results.set(email, result);
      
      // Vänta lite mellan anrop
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Failed to verify ${email}:`, error);
      results.set(email, fallbackEmailValidation(email));
    }
  }

  // Använd fallback för resten
  for (const email of sortedEmails.slice(maxVerifications)) {
    results.set(email, fallbackEmailValidation(email));
  }

  return results;
}

/**
 * Kolla quota
 */
export async function checkQuota(): Promise<{
  requests_available: number;
  requests_used: number;
  reset_date: string;
}> {
  try {
    const response = await axios.get(`${HUNTER_API_BASE}/account`, {
      params: {
        api_key: import.meta.env.VITE_HUNTER_API_KEY
      }
    });

    return {
      requests_available: response.data.data.requests.available,
      requests_used: response.data.data.requests.used,
      reset_date: response.data.data.reset_date
    };

  } catch (error) {
    console.error('Failed to check Hunter.io quota:', error);
    return {
      requests_available: 0,
      requests_used: 0,
      reset_date: ''
    };
  }
}

export default {
  verifyEmail,
  findEmail,
  getDomainPattern,
  guessEmail,
  batchVerifyEmails,
  checkQuota
};
