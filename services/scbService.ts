/**
 * SCB (Statistiska Centralbyrån) API Service
 * Hämtar branschkoder (SNI), statistik och företagsdata
 * 
 * API: https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/
 * Dokumentation: https://www.scb.se/api/
 */

export interface SCBCompanyData {
  organisationsnummer: string;
  sniKod: string;
  sniBeskrivning: string;
  bransch: string;
  antalAnstallda?: number;
  anstallningsintervall?: string; // "1-9", "10-49", "50-249", "250+"
  omsattningsintervall?: string;
}

export interface SNICode {
  kod: string;
  beskrivning: string;
  huvudgrupp: string;
}

/**
 * Hämtar företagets SNI-kod och branschbeskrivning
 * OBS: SCB har företagsregister men det är inte publikt via REST API
 * Använd UC/Allabolag för företagsspecifik data
 */
export async function getCompanySNI(orgNr: string): Promise<SCBCompanyData | null> {
  try {
    console.log(`⚠️ SCB Företagsregister: Inte publikt tillgängligt via REST API`);
    console.log(`   Rekommendation: Använd UC eller Allabolag API för SNI-kod`);
    
    return null;
    
  } catch (error) {
    console.error("SCB API Error:", error);
    return null;
  }
}

/**
 * Hämtar branschstatistik från SCB
 * Detta API är publikt och kan användas för att få genomsnittlig omsättning per bransch
 */
export async function getBranschStatistik(sniKod: string): Promise<any> {
  try {
    // SCB API endpoint för företagsstatistik
    const url = `https://api.scb.se/OV0104/v1/doris/sv/ssd/START/NV/NV0101/NV0101A/FoRetag01`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "query": [
          {
            "code": "SNI2007",
            "selection": {
              "filter": "item",
              "values": [sniKod]
            }
          }
        ],
        "response": {
          "format": "json"
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`SCB API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("SCB Branschstatistik Error:", error);
    return null;
  }
}

/**
 * Söker SNI-kod baserat på branschbeskrivning
 * Använder SCB:s SNI 2007 klassificering
 */
export async function searchSNICode(searchTerm: string): Promise<SNICode[]> {
  try {
    // SCB har en SNI-klassificering som kan sökas
    // För nu returnerar vi en statisk lista med vanliga SNI-koder
    
    const commonSNICodes: SNICode[] = [
      { kod: "47.91", beskrivning: "Detaljhandel via postorder eller Internet", huvudgrupp: "Handel" },
      { kod: "49.41", beskrivning: "Godstransport på väg", huvudgrupp: "Transport" },
      { kod: "52.10", beskrivning: "Magasinering och varulagring", huvudgrupp: "Logistik" },
      { kod: "52.29", beskrivning: "Övrig serviceverksamhet inom transport", huvudgrupp: "Logistik" },
      { kod: "46.90", beskrivning: "Icke specialiserad partihandel", huvudgrupp: "Handel" },
      { kod: "47.11", beskrivning: "Varuhus och stormarknader", huvudgrupp: "Handel" },
      { kod: "47.19", beskrivning: "Övrig detaljhandel med brett sortiment", huvudgrupp: "Handel" },
      { kod: "10.89", beskrivning: "Tillverkning av övriga livsmedel", huvudgrupp: "Tillverkning" },
      { kod: "25.61", beskrivning: "Ytbehandling och överdragning av metall", huvudgrupp: "Tillverkning" },
      { kod: "62.01", beskrivning: "Dataprogrammering", huvudgrupp: "IT" }
    ];
    
    const lowerSearch = searchTerm.toLowerCase();
    return commonSNICodes.filter(sni => 
      sni.beskrivning.toLowerCase().includes(lowerSearch) ||
      sni.huvudgrupp.toLowerCase().includes(lowerSearch) ||
      sni.kod.includes(searchTerm)
    );
    
  } catch (error) {
    console.error("SNI search error:", error);
    return [];
  }
}

/**
 * Hämtar antal anställda per bransch (genomsnitt)
 * Användbart för att uppskatta företagsstorlek
 */
export async function getAverageEmployeesByIndustry(sniKod: string): Promise<number | null> {
  try {
    // SCB har statistik över genomsnittligt antal anställda per bransch
    const url = `https://api.scb.se/OV0104/v1/doris/sv/ssd/START/NV/NV0101/NV0101B/ArbStDoNAr`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "query": [
          {
            "code": "SNI2007",
            "selection": {
              "filter": "item",
              "values": [sniKod]
            }
          }
        ],
        "response": {
          "format": "json"
        }
      })
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Extrahera genomsnittligt antal anställda från response
    // (Strukturen varierar beroende på dataset)
    return null; // Placeholder
    
  } catch (error) {
    console.error("SCB Employee stats error:", error);
    return null;
  }
}

/**
 * Uppskattar företagsstorlek baserat på bransch och omsättning
 */
export function estimateCompanySize(
  omsattning: number, // i TKR
  sniKod?: string
): "Mikro" | "Litet" | "Medelstort" | "Stort" {
  // EU:s definition av företagsstorlek
  if (omsattning < 20000) return "Mikro"; // < 20 MSEK
  if (omsattning < 100000) return "Litet"; // < 100 MSEK
  if (omsattning < 500000) return "Medelstort"; // < 500 MSEK
  return "Stort"; // > 500 MSEK
}

/**
 * Hämtar branschspecifik information från SCB
 */
export async function getIndustryInsights(sniKod: string): Promise<{
  genomsnittOmsattning?: number;
  genomsnittAnstallda?: number;
  tillvaxtTrend?: "Positiv" | "Negativ" | "Stabil";
  konkurrensNiva?: "Hög" | "Medel" | "Låg";
} | null> {
  try {
    console.log(`📊 SCB Branschinsikter för SNI ${sniKod}`);
    console.log(`⚠️ Kräver komplex databearbetning av SCB:s dataset`);
    
    // Detta skulle kräva att man laddar ner och bearbetar SCB:s stora dataset
    // För produktion, överväg att cacha denna data lokalt
    
    return null;
    
  } catch (error) {
    console.error("Industry insights error:", error);
    return null;
  }
}

/**
 * Hämtar regional statistik (användbart för geografisk segmentering)
 */
export async function getRegionalStats(lan: string): Promise<{
  antalForetag: number;
  genomsnittOmsattning: number;
  storstaBranscher: string[];
} | null> {
  try {
    console.log(`📍 SCB Regional statistik för ${lan}`);
    
    // SCB har omfattande regional statistik
    // Kräver specifika dataset-ID:n och queries
    
    return null;
    
  } catch (error) {
    console.error("Regional stats error:", error);
    return null;
  }
}
