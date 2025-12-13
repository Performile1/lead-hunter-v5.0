/**
 * Bolagsverket Öppna Data API
 * GRATIS och officiell källa för företagsdata
 * Dokumentation: https://bolagsverket.se/foretag/etjanster/oppnadata
 */

export interface BolagsverketCompany {
  organisationsnummer: string;
  namn: string;
  juridiskForm: string;
  registreringsdatum: string;
  avregistreringsdatum?: string;
  status: "Aktiv" | "Avregistrerad" | "Konkurs" | "Likvidation";
  adress: {
    utdelningsadress: string;
    postnummer: string;
    postort: string;
    land?: string;
  };
  verksamhetsbeskrivning?: string;
  sni?: string; // SNI-kod
}

/**
 * Normaliserar organisationsnummer till format XXXXXX-XXXX
 */
export function normalizeOrgNumber(orgNr: string): string | null {
  if (!orgNr) return null;
  
  // Ta bort allt utom siffror
  let cleanOrg = orgNr.replace(/[^0-9]/g, '');
  
  // Ta bort 16-prefix om det finns (personnummer-format)
  if (cleanOrg.length === 12 && cleanOrg.startsWith('16')) {
    cleanOrg = cleanOrg.substring(2);
  }
  
  // Ta bort -01 suffix om det finns
  if (cleanOrg.length === 12 && cleanOrg.endsWith('01')) {
    cleanOrg = cleanOrg.substring(0, 10);
  }
  
  if (cleanOrg.length !== 10) {
    console.warn("Invalid org.nr format:", orgNr);
    return null;
  }
  
  return `${cleanOrg.substring(0, 6)}-${cleanOrg.substring(6)}`;
}

/**
 * Hämtar företagsdata från Bolagsverket
 * OBS: Bolagsverket har inte ett publikt REST API ännu (2024)
 * Men de har öppna datafiler som kan laddas ner
 * 
 * För nu använder vi en fallback-metod via Allabolag's öppna sidor
 */
export async function getCompanyFromBolagsverket(
  orgNr: string
): Promise<BolagsverketCompany | null> {
  try {
    const formattedOrg = normalizeOrgNumber(orgNr);
    if (!formattedOrg) return null;
    
    // Bolagsverket har tyvärr inget publikt REST API ännu
    // Men vi kan använda deras öppna datafiler eller scrapa deras sidor
    // För produktionsmiljö, använd UC eller Allabolag API istället
    
    console.log(`⚠️ Bolagsverket API: Inte implementerat ännu. Använd UC/Allabolag API för produktionsdata.`);
    console.log(`   Org.nr: ${formattedOrg} skulle verifierats här.`);
    
    // Placeholder - returnera null tills vi har ett riktigt API
    return null;
    
  } catch (error: any) {
    console.error("Bolagsverket API Error:", error);
    return null;
  }
}

/**
 * Verifierar att ett organisationsnummer är giltigt (Luhn-algoritmen)
 */
export function validateOrgNumber(orgNr: string): boolean {
  const normalized = normalizeOrgNumber(orgNr);
  if (!normalized) return false;
  
  const digits = normalized.replace(/[^0-9]/g, '');
  if (digits.length !== 10) return false;
  
  // Luhn-algoritmen för checksiffra
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(digits[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(digits[9]);
}

/**
 * Söker företag baserat på namn
 * OBS: Kräver extern datakälla (UC/Allabolag)
 */
export async function searchCompaniesByName(
  companyName: string,
  limit: number = 10
): Promise<BolagsverketCompany[]> {
  console.log(`⚠️ Bolagsverket Search: Inte implementerat. Använd UC/Allabolag API.`);
  return [];
}

/**
 * Hämtar företagsdata från Allabolag (öppen scraping som fallback)
 * OBS: Detta är en workaround tills Bolagsverket API finns
 */
export async function getCompanyFromAllabolag(
  orgNr: string
): Promise<BolagsverketCompany | null> {
  try {
    const formattedOrg = normalizeOrgNumber(orgNr);
    if (!formattedOrg) return null;
    
    // Allabolag URL-format
    const cleanOrg = formattedOrg.replace('-', '');
    const url = `https://www.allabolag.se/${cleanOrg}`;
    
    console.log(`🔍 Försöker hämta data från Allabolag: ${url}`);
    console.log(`⚠️ OBS: Detta kräver web scraping. Använd officiell API för produktion.`);
    
    // För att undvika CORS-problem i browser, returnera null
    // I en riktig implementation skulle detta köras server-side
    return null;
    
  } catch (error) {
    console.error("Allabolag scraping error:", error);
    return null;
  }
}
