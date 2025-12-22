/**
 * PROTOCOL CREDITS SYSTEM
 * Olika protokoll kostar olika mycket credits
 * Groq-protokoll är billigast (gratis API)
 * Gemini-protokoll kostar mer beroende på komplexitet
 */

export interface ProtocolCost {
  credits: number;
  name: string;
  description: string;
  estimatedTime: number; // sekunder
  features: string[];
}

export const PROTOCOL_COSTS: Record<string, ProtocolCost> = {
  'groq_fast': {
    credits: 0.5,
    name: 'Groq Snabbskanning',
    description: 'Snabbaste alternativet. Grundläggande företagsdata.',
    estimatedTime: 10,
    features: [
      'Org.nummer',
      'Omsättning',
      'Adress',
      'Webbplats',
      'Juridisk status',
      'GRATIS API (Groq)',
      '10x snabbare än Gemini'
    ]
  },
  'groq_deep': {
    credits: 1,
    name: 'Groq Djupanalys',
    description: 'Komplett 3-stegs analys med Groq. Bästa pris/prestanda.',
    estimatedTime: 30,
    features: [
      'Alla grunddata',
      'Logistikprofil',
      'Transportörer & E-handel',
      'Beslutsfattare',
      'Website scraping (Firecrawl)',
      'Kronofogden-kontroll',
      'GRATIS API (Groq)',
      '10x snabbare än Gemini'
    ]
  },
  'quick': {
    credits: 2,
    name: 'Gemini Snabbskanning',
    description: 'Snabb översikt med Gemini AI.',
    estimatedTime: 15,
    features: [
      'Grundläggande företagsdata',
      'Gemini AI',
      'Bra för initial screening'
    ]
  },
  'deep': {
    credits: 3,
    name: 'Gemini Djupanalys',
    description: 'Standard djupanalys med Gemini Flash.',
    estimatedTime: 45,
    features: [
      'Alla grunddata',
      'Logistikprofil',
      'Transportörer & E-handel',
      'Beslutsfattare',
      'Website scraping',
      'Search Grounding för kontakter',
      'Gemini 2.5 Flash'
    ]
  },
  'deep_pro': {
    credits: 5,
    name: 'Gemini Deep PRO',
    description: 'Mest omfattande analys med Gemini Pro.',
    estimatedTime: 60,
    features: [
      'Alla Deep-funktioner',
      'Gemini 3 Pro (kraftfullaste modellen)',
      'Högsta precision',
      'Bäst för kritiska leads',
      'Längre timeout för komplex data'
    ]
  },
  'batch_prospecting': {
    credits: 1.5,
    name: 'Batch Prospecting',
    description: 'Batch-sökning för prospektering.',
    estimatedTime: 20,
    features: [
      'Snabb batch-analys',
      'Optimerad för stora volymer',
      'Gemini Flash'
    ]
  }
};

/**
 * Beräkna total kostnad för ett protokoll
 */
export function calculateProtocolCost(protocol: string, count: number = 1): number {
  const cost = PROTOCOL_COSTS[protocol];
  if (!cost) return 0;
  return cost.credits * count;
}

/**
 * Kontrollera om användaren har tillräckligt med credits
 */
export function hasEnoughCredits(userCredits: number, protocol: string, count: number = 1): boolean {
  const cost = calculateProtocolCost(protocol, count);
  return userCredits >= cost;
}

/**
 * Få rekommenderat protokoll baserat på användningsfall
 */
export function getRecommendedProtocol(useCase: 'speed' | 'cost' | 'quality' | 'balanced'): string {
  switch (useCase) {
    case 'speed':
      return 'groq_fast'; // Snabbast
    case 'cost':
      return 'groq_deep'; // Bästa pris/prestanda
    case 'quality':
      return 'deep_pro'; // Högsta kvalitet
    case 'balanced':
    default:
      return 'groq_deep'; // Bästa balans
  }
}

/**
 * Få protokoll-information för UI
 */
export function getProtocolInfo(protocol: string): ProtocolCost | null {
  return PROTOCOL_COSTS[protocol] || null;
}

/**
 * Sortera protokoll efter kostnad (lägst först)
 */
export function getProtocolsSortedByCost(): Array<{ protocol: string; info: ProtocolCost }> {
  return Object.entries(PROTOCOL_COSTS)
    .map(([protocol, info]) => ({ protocol, info }))
    .sort((a, b) => a.info.credits - b.info.credits);
}

/**
 * Få alla tillgängliga protokoll
 */
export function getAllProtocols(): Array<{ protocol: string; info: ProtocolCost }> {
  return Object.entries(PROTOCOL_COSTS).map(([protocol, info]) => ({ protocol, info }));
}
