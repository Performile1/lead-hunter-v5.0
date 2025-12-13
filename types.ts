

export enum Segment {
  DM = 'DM',
  TS = 'TS',
  FS = 'FS',
  KAM = 'KAM',
  UNKNOWN = 'UNKNOWN'
}

export interface DecisionMaker {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  directPhone?: string; // New: Direct number
}

export interface SourceLink {
  title: string;
  url: string;
  domain?: string;
}

export interface FinancialRecord {
  year: string;
  revenue: number; // in TKR
}

export interface LeadData {
  id: string; // Unique Identifier
  companyName: string;
  orgNumber: string;
  address: string; // Registered / Main Address
  visitingAddress?: string; 
  warehouseAddress?: string; 
  returnAddress?: string;
  
  phoneNumber?: string; // New: Switchboard number
  
  segment: Segment;
  revenue: string; // Display string (Latest)
  revenueSource?: string; // New: Specific source for revenue (e.g. Allabolag)
  
  // New Financial Data for Trends
  financials?: {
    history?: FinancialRecord[]; // New: List of historical data
    yearCurrent?: string; // e.g. "2023" or "2023/24"
    revenueCurrent?: number; // raw value in TKR
    yearPrevious?: string; // e.g. "2022"
    revenuePrevious?: number; // raw value in TKR
    growthPercent?: number; // e.g. 15.5 or -10
  };

  freightBudget: string;
  
  // Credit & Legal
  legalStatus: string; 
  creditRatingLabel: string; 
  creditRatingDescription: string; 
  kronofogdenCheck?: string; // New: Result from Kronofogden API
  
  // New V8.1 Fields
  ecommercePlatform?: string;
  hasFtax?: string; // "Ja" / "Nej"
  
  // Updated V8.2 Fields (Replaces SeaFreight)
  logisticsProfile?: string; // "B2B, B2C, Import, Export, Väg"
  markets?: string; // New: "Sverige, Norden, Europa, USA"
  multiBrands?: string; // "Butik A, Butik B" or "Nej"
  
  // NEW V8.3 Fields
  deliveryServices?: string[]; // "Hemleverans", "Paketskåp", "Ombud"
  checkoutPosition?: string; // "1. Postnord, 2. DHL"

  parentCompany?: string; // Name of parent company or "Nej"

  liquidity: string;
  trendRisk: string;
  trigger: string;
  emailStructure: string;
  decisionMakers: DecisionMaker[];
  icebreaker: string;
  latestNews?: string; // New: News from Breakit/Ehandel etc.
  latestNewsUrl?: string; // New: URL to the news article

  websiteUrl: string;
  carriers: string;
  usesDhl: string;
  shippingTermsLink: string;

  // New Rating Fields
  rating?: {
    score: string;
    count: string;
    source: string;
    sentiment: string;
  };

  searchLog?: {
    primaryQuery: string;
    secondaryQuery: string;
    credibilitySource: string; // Legacy string
  };
  
  sourceLinks?: SourceLink[]; // New: Structured links with titles

  // Website Scraping Data
  websiteAnalysis?: {
    url: string;
    scraped_at: string;
    ecommerce_platform?: string;
    has_checkout: boolean;
    checkout_providers: string[];
    shipping_providers: string[];
    international_shipping: boolean;
    technologies: string[];
    product_categories?: string[];
    financial_metrics?: {
      revenue?: number;
      employees?: number;
      year?: string;
    };
  };

  source?: 'ai' | 'cache' | 'manual'; // Tracks origin
  analysisDate?: string; // Added analysis timestamp
}

export interface SearchFormData {
  // Single Mode
  companyNameOrOrg: string;
  specificPerson?: string; 

  // Batch Mode
  geoArea: string;
  financialScope: string;
  leadCount: number;
  batchMode?: 'quick' | 'deep' | 'batch_prospecting' | 'deep_pro'; 
  
  // Common
  triggers: string;
  focusRole1: string;
  focusRole2: string;
  focusRole3: string;
  icebreakerTopic: string;

  // Filters
  excludeCompanies?: string;
  includedKeywords?: string; 
}