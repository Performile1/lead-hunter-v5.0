/**
 * Skatteverket API Service
 * Kontrollerar F-skatt, momsregistrering och arbetsgivarregistrering
 * 
 * OBS: Skatteverket har begränsade öppna API:er
 * Mest tillförlitlig data kommer från UC/Allabolag som har avtal med Skatteverket
 */

import { normalizeOrgNumber } from './bolagsverketService';

export interface SkatteverketData {
  organisationsnummer: string;
  foretag: string;
  fSkatt: {
    status: "Godkänd" | "Ej godkänd" | "Avregistrerad" | "Okänd";
    registreringsdatum?: string;
    avregistreringsdatum?: string;
  };
  moms: {
    registrerad: boolean;
    registreringsdatum?: string;
  };
  arbetsgivare: {
    registrerad: boolean;
    antalAnstallda?: number;
  };
}

/**
 * Kontrollerar F-skattstatus via Skatteverkets öppna tjänst
 * OBS: Skatteverket har ingen officiell REST API för detta ännu
 * Data måste hämtas via deras webbformulär eller via UC/Allabolag
 */
export async function checkFSkatt(orgNr: string): Promise<SkatteverketData | null> {
  if (!orgNr) return null;
  
  const formattedOrg = normalizeOrgNumber(orgNr);
  if (!formattedOrg) return null;
  
  try {
    // Skatteverkets F-skatt kontroll
    // URL: https://www.skatteverket.se/privat/skatter/arbeteochinkomst/fskatt.4.233f91f71260075abe8800020817.html
    
    console.log(`⚠️ Skatteverket API: Inget publikt REST API tillgängligt`);
    console.log(`   Rekommendation: Använd UC eller Allabolag API för F-skatt data`);
    console.log(`   Alternativ: Scrapa Skatteverkets webbformulär (juridisk gråzon)`);
    
    // Placeholder - returnera null tills vi har ett riktigt API
    return null;
    
  } catch (error) {
    console.error("Skatteverket API Error:", error);
    return null;
  }
}

/**
 * Kontrollerar momsregistrering
 * OBS: Kräver UC/Allabolag API eller web scraping
 */
export async function checkMomsRegistrering(orgNr: string): Promise<{
  registered: boolean;
  registration_date?: string;
  is_new_registration?: boolean;
}> {
  console.log(`⚠️ Momsregistrering: Använd UC/Allabolag API`);
  
  // TODO: Implementera via UC/Allabolag API
  // För nu, returnera mock data
  return {
    registered: false,
    registration_date: undefined,
    is_new_registration: false
  };
}

/**
 * Upptäck ny momsregistrering (trigger för expansion)
 * Ny momsregistrering = Företaget börjar sälja = Behöver logistik!
 */
export async function detectNewVATRegistration(
  orgNr: string,
  previousCheck?: { registered: boolean; registration_date?: string }
): Promise<{
  trigger_detected: boolean;
  registration_date?: string;
  days_since_registration?: number;
}> {
  const current = await checkMomsRegistrering(orgNr);
  
  // Om tidigare inte registrerad, men nu registrerad = NY REGISTRERING!
  if (previousCheck && !previousCheck.registered && current.registered) {
    const regDate = current.registration_date ? new Date(current.registration_date) : new Date();
    const daysSince = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      trigger_detected: true,
      registration_date: current.registration_date,
      days_since_registration: daysSince
    };
  }
  
  // Om nyligen registrerad (senaste 90 dagarna)
  if (current.registered && current.registration_date) {
    const regDate = new Date(current.registration_date);
    const daysSince = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 90) {
      return {
        trigger_detected: true,
        registration_date: current.registration_date,
        days_since_registration: daysSince
      };
    }
  }
  
  return {
    trigger_detected: false
  };
}

/**
 * Kontrollerar arbetsgivarregistrering och uppskattar antal anställda
 * Data finns i SCB:s register
 */
export async function checkArbetsgivare(orgNr: string): Promise<{ registrerad: boolean; antalAnstallda?: number }> {
  console.log(`⚠️ Arbetsgivarregistrering: Använd SCB API eller UC/Allabolag`);
  return { registrerad: false };
}

/**
 * Hämtar företagets SNI-kod från Skatteverket/SCB
 */
export async function getSNICode(orgNr: string): Promise<string | null> {
  // SNI-koder finns i SCB:s företagsregister
  // Se scbService.ts för implementation
  return null;
}

/**
 * WORKAROUND: Kontrollera F-skatt via Allabolag (scraping)
 * OBS: Detta är en nödlösning tills officiellt API finns
 */
export async function checkFSkattViaAllabolag(orgNr: string): Promise<"Ja" | "Nej" | "Okänd"> {
  const formattedOrg = normalizeOrgNumber(orgNr);
  if (!formattedOrg) return "Okänd";
  
  try {
    // Detta skulle kräva server-side scraping för att undvika CORS
    console.log(`🔍 F-skatt check via Allabolag: ${formattedOrg}`);
    console.log(`⚠️ Kräver server-side implementation eller UC API`);
    
    return "Okänd";
    
  } catch (error) {
    console.error("F-skatt check failed:", error);
    return "Okänd";
  }
}

/**
 * Formaterar F-skatt status till läsbar text
 */
export function formatFSkattStatus(data: SkatteverketData | null): string {
  if (!data) return "Kunde inte verifieras";
  
  switch (data.fSkatt.status) {
    case "Godkänd":
      return `✅ Godkänd för F-skatt${data.fSkatt.registreringsdatum ? ` (sedan ${data.fSkatt.registreringsdatum})` : ''}`;
    case "Ej godkänd":
      return "❌ Ej godkänd för F-skatt";
    case "Avregistrerad":
      return `⚠️ Avregistrerad${data.fSkatt.avregistreringsdatum ? ` (${data.fSkatt.avregistreringsdatum})` : ''}`;
    default:
      return "❓ Status okänd";
  }
}
