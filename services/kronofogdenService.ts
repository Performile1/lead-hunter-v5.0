/**
 * Kronofogden API Service
 * Kontrollerar konkurs, rekonstruktion och betalningsanmärkningar
 * API: https://kronofogden.entryscape.net/
 */

import { normalizeOrgNumber } from './bolagsverketService';

export interface KronofogdenRecord {
  organisationsnummer: string;
  foretag: string;
  status: string; // "Konkurs", "Rekonstruktion", "Betalningsanmärkning"
  datum: string;
  arende: string;
  mal?: string;
  beskrivning?: string;
}

/**
 * Kontrollerar om företaget finns i Kronofogdens register
 * Returnerar information om konkurs, rekonstruktion eller betalningsanmärkningar
 */
export async function checkKronofogden(orgNr: string): Promise<KronofogdenRecord | null> {
  if (!orgNr) return null;
  
  const formattedOrg = normalizeOrgNumber(orgNr);
  if (!formattedOrg) return null;
  
  // Kronofogden EntryScape API - Dataset för konkurser och rekonstruktioner
  const datasetId = "4e789168-1d3d-468c-b9a1-0cce9a9a4f1e";
  const url = `https://kronofogden.entryscape.net/rowstore/dataset/${datasetId}?organisationsnummer=${formattedOrg}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // Inget ärende = Bra!
        return null;
      }
      throw new Error(`Kronofogden API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Om results array har items, finns det ett ärende
    if (data && data.results && data.results.length > 0) {
      const record = data.results[0];
      
      return {
        organisationsnummer: formattedOrg,
        foretag: record.foretag || record.namn || "",
        status: record.status || record.arendetyp || "Insolvensärende",
        datum: record.datum || record.beslutsdatum || "",
        arende: record.arendenummer || "",
        mal: record.malnummer || "",
        beskrivning: record.beskrivning || ""
      };
    }
    
    // Inget ärende hittat = Bra!
    return null;
    
  } catch (error: any) {
    console.warn("Kronofogden check failed:", error);
    return null; // Fail silently - bättre att missa en varning än att krascha
  }
}

/**
 * Kontrollerar betalningsanmärkningar för företag
 * OBS: Kronofogden har separata dataset för olika ärendetyper
 */
export async function checkPaymentRemarks(orgNr: string): Promise<number> {
  if (!orgNr) return 0;
  
  const formattedOrg = normalizeOrgNumber(orgNr);
  if (!formattedOrg) return 0;
  
  // Dataset för betalningsanmärkningar
  const datasetId = "betalningsanmarkningar"; // Placeholder - kolla Kronofogdens dokumentation
  
  try {
    // Detta är en förenklad implementation
    // I verkligheten behöver du hitta rätt dataset-ID från Kronofogden
    console.log(`⚠️ Betalningsanmärkningar: API-endpoint behöver verifieras`);
    return 0;
    
  } catch (error) {
    console.warn("Payment remarks check failed:", error);
    return 0;
  }
}

/**
 * Formaterar Kronofogden-resultat till läsbar text
 */
export function formatKronofogdenResult(record: KronofogdenRecord | null): string {
  if (!record) return "";
  
  const parts = [
    `⚠️ KRONOFOGDEN: ${record.status}`,
    record.datum ? `Datum: ${record.datum}` : "",
    record.arende ? `Ärende: ${record.arende}` : "",
    record.beskrivning || ""
  ].filter(Boolean);
  
  return parts.join(" | ");
}

/**
 * Kontrollerar om företaget har allvarliga problem
 */
export function hasSerioussIssues(record: KronofogdenRecord | null): boolean {
  if (!record) return false;
  
  const status = record.status.toLowerCase();
  return status.includes('konkurs') || 
         status.includes('likvidation') || 
         status.includes('rekonstruktion');
}
