/**
 * Tech Analysis Service
 * Analyserar företags tekniska stack och e-handelsplattformar
 */

const processEnv = {
  BUILTWITH_API_KEY: process.env.BUILTWITH_API_KEY as string,
  WAPPALYZER_API_KEY: process.env.WAPPALYZER_API_KEY as string,
};

export interface TechStack {
  ecommercePlatform?: string;
  paymentProviders: string[];
  shippingIntegrations: string[];
  analytics: string[];
  hosting: string[];
  cdn?: string;
  cms?: string;
  frameworks: string[];
  checkoutPosition?: 'integrated' | 'external' | 'unknown';
}

/**
 * Analysera webbplats med BuiltWith API
 */
export async function analyzeWithBuiltWith(domain: string): Promise<TechStack> {
  if (!processEnv.BUILTWITH_API_KEY) {
    console.warn("BUILTWITH_API_KEY saknas");
    return getEmptyTechStack();
  }

  try {
    const url = `https://api.builtwith.com/v20/api.json?KEY=${processEnv.BUILTWITH_API_KEY}&LOOKUP=${domain}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`BuiltWith API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return parseBuiltWithData(data);
  } catch (error) {
    console.error("BuiltWith Error:", error);
    return getEmptyTechStack();
  }
}

/**
 * Analysera webbplats med Wappalyzer API
 */
export async function analyzeWithWappalyzer(url: string): Promise<TechStack> {
  if (!processEnv.WAPPALYZER_API_KEY) {
    console.warn("WAPPALYZER_API_KEY saknas");
    return getEmptyTechStack();
  }

  try {
    const response = await fetch(`https://api.wappalyzer.com/v2/lookup/?urls=${encodeURIComponent(url)}`, {
      headers: {
        'x-api-key': processEnv.WAPPALYZER_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Wappalyzer API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return parseWappalyzerData(data);
  } catch (error) {
    console.error("Wappalyzer Error:", error);
    return getEmptyTechStack();
  }
}

/**
 * Enkel web scraping för att identifiera e-handelsplattform
 */
export async function detectEcommercePlatform(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Identifiera vanliga plattformar
    const platforms = {
      'Shopify': ['/cdn.shopify.com/', 'Shopify.theme'],
      'WooCommerce': ['woocommerce', 'wp-content/plugins/woocommerce'],
      'Magento': ['Magento', 'mage/cookies'],
      'PrestaShop': ['prestashop', 'ps_version'],
      'OpenCart': ['opencart', 'catalog/view/theme'],
      'Centra': ['centra.com', 'centra-checkout'],
      'Sitoo': ['sitoo.com', 'sitoo-'],
      'Jetshop': ['jetshop.se', 'jetshop-'],
      'Textalk': ['textalk.se', 'textalk-webshop']
    };

    for (const [platform, signatures] of Object.entries(platforms)) {
      if (signatures.some(sig => html.includes(sig))) {
        return platform;
      }
    }

    return 'Unknown';
  } catch (error) {
    console.error("Platform detection error:", error);
    return 'Unknown';
  }
}

/**
 * Identifiera betalningslösningar
 */
export async function detectPaymentProviders(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    const providers: string[] = [];
    const signatures = {
      'Klarna': ['klarna.com', 'klarna-'],
      'Stripe': ['stripe.com', 'stripe.js'],
      'PayPal': ['paypal.com', 'paypal-'],
      'Adyen': ['adyen.com', 'adyen-'],
      'Nets': ['nets.eu', 'dibs.se'],
      'Svea': ['svea.com', 'svea-'],
      'Collector': ['collector.se', 'collector-'],
      'Billmate': ['billmate.se', 'billmate-']
    };

    for (const [provider, sigs] of Object.entries(signatures)) {
      if (sigs.some(sig => html.includes(sig))) {
        providers.push(provider);
      }
    }

    return providers;
  } catch (error) {
    console.error("Payment detection error:", error);
    return [];
  }
}

/**
 * Identifiera fraktleverantörer
 */
export async function detectShippingProviders(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    const providers: string[] = [];
    const signatures = {
      'DHL': ['dhl.com', 'dhl.se'],
      'PostNord': ['postnord.se', 'postnord.com'],
      'Bring': ['bring.se', 'bring.com'],
      'Schenker': ['dbschenker.com', 'schenker.se'],
      'Budbee': ['budbee.com', 'budbee.se'],
      'Instabox': ['instabox.se', 'instabox.com'],
      'Best Transport': ['best.se', 'besttransport.se']
    };

    for (const [provider, sigs] of Object.entries(signatures)) {
      if (sigs.some(sig => html.includes(sig))) {
        providers.push(provider);
      }
    }

    return providers;
  } catch (error) {
    console.error("Shipping detection error:", error);
    return [];
  }
}

/**
 * Komplett tech-analys av webbplats
 */
export async function analyzeWebsiteTech(url: string): Promise<TechStack> {
  try {
    const domain = new URL(url).hostname;
    
    // Parallella anrop
    const [platform, payments, shipping] = await Promise.all([
      detectEcommercePlatform(url),
      detectPaymentProviders(url),
      detectShippingProviders(url)
    ]);

    return {
      ecommercePlatform: platform,
      paymentProviders: payments,
      shippingIntegrations: shipping,
      analytics: [],
      hosting: [],
      frameworks: [],
      checkoutPosition: payments.length > 0 ? 'integrated' : 'unknown'
    };
  } catch (error) {
    console.error("Website tech analysis error:", error);
    return getEmptyTechStack();
  }
}

/**
 * Helper functions
 */
function getEmptyTechStack(): TechStack {
  return {
    paymentProviders: [],
    shippingIntegrations: [],
    analytics: [],
    hosting: [],
    frameworks: [],
    checkoutPosition: 'unknown'
  };
}

function parseBuiltWithData(data: any): TechStack {
  // Parse BuiltWith response
  const techStack: TechStack = getEmptyTechStack();
  
  // Implementera parsing baserat på BuiltWith API structure
  // Detta är en förenklad version
  
  return techStack;
}

function parseWappalyzerData(data: any): TechStack {
  // Parse Wappalyzer response
  const techStack: TechStack = getEmptyTechStack();
  
  // Implementera parsing baserat på Wappalyzer API structure
  
  return techStack;
}

/**
 * Kontrollera om tech analysis är tillgängligt
 */
export function isTechAnalysisAvailable(): boolean {
  return !!processEnv.BUILTWITH_API_KEY || !!processEnv.WAPPALYZER_API_KEY;
}
