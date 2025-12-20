/**
 * Checkout Detection Service
 * Ny strategi: Firecrawl (primär) → Puppeteer (backup) → Gemini (fallback)
 */

import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || process.env.VITE_FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v0';

/**
 * Huvudfunktion för checkout detection
 * Försöker i ordning: Firecrawl → Puppeteer → Gemini
 */
export async function detectCheckoutCarriers(url, companyName) {
  logger.info(`🔍 Starting checkout detection for ${url}`);
  
  let result = {
    shipping_providers: [],
    shipping_providers_with_position: [],
    checkout_providers: [],
    has_checkout: false,
    detection_method: null,
    confidence: 'low'
  };

  // 1. Försök med Firecrawl (primär metod)
  if (FIRECRAWL_API_KEY) {
    logger.info('📡 Trying Firecrawl (primary method)...');
    const firecrawlResult = await tryFirecrawl(url);
    
    if (firecrawlResult.success && firecrawlResult.carriers.length > 0) {
      logger.info(`✅ Firecrawl success: Found ${firecrawlResult.carriers.length} carriers`);
      result = {
        ...result,
        ...firecrawlResult,
        detection_method: 'firecrawl',
        confidence: 'high'
      };
      return result;
    }
    logger.warn('⚠️ Firecrawl failed or found no carriers, trying Puppeteer...');
  } else {
    logger.warn('⚠️ Firecrawl API key not configured, skipping to Puppeteer');
  }

  // 2. Försök med Puppeteer (backup metod)
  logger.info('🤖 Trying Puppeteer (backup method)...');
  const puppeteerResult = await tryPuppeteer(url);
  
  if (puppeteerResult.success && puppeteerResult.carriers.length > 0) {
    logger.info(`✅ Puppeteer success: Found ${puppeteerResult.carriers.length} carriers`);
    result = {
      ...result,
      ...puppeteerResult,
      detection_method: 'puppeteer',
      confidence: 'medium'
    };
    return result;
  }
  logger.warn('⚠️ Puppeteer failed or found no carriers, will use Gemini as fallback');

  // 3. Gemini används som fallback i geminiService.ts
  result.detection_method = 'none';
  result.confidence = 'low';
  
  return result;
}

/**
 * Försök scrapa checkout med Firecrawl
 */
async function tryFirecrawl(url) {
  try {
    // Försök hitta checkout-URL - utökad lista
    const checkoutUrls = [
      url,
      `${url}/checkout`,
      `${url}/kassa`,
      `${url}/cart`,
      `${url}/varukorg`,
      `${url}/cart/checkout`,
      `${url}/varukorg/kassa`,
      `${url}/checkout/shipping`,
      `${url}/kassa/frakt`,
      `${url}/checkout/delivery`,
      // Produktsidor som fallback (visar ofta fraktalternativ)
      `${url}/products`,
      `${url}/produkter`,
      `${url}/shop`
    ];

    for (const checkoutUrl of checkoutUrls) {
      try {
        // Scrapa sidan med Firecrawl
        const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: checkoutUrl,
            formats: ['markdown', 'html'],
            onlyMainContent: false,
            waitFor: 5000, // Ökat till 5 sekunder för dynamiskt innehåll
            timeout: 30000 // 30 sekunder timeout istället för 15
          })
        });

        if (!response.ok) continue;

        const data = await response.json();
        if (!data.success || !data.data) continue;

        const content = data.data.markdown || data.data.html || '';
        const contentLower = content.toLowerCase();

        // Extrahera transportörer med strukturerad analys
        const carriers = extractCarriersFromContent(content, contentLower);
        
        if (carriers.length > 0) {
          logger.info(`✅ Firecrawl found carriers on ${checkoutUrl}`);
          
          return {
            success: true,
            carriers: carriers.map(c => c.name),
            shipping_providers: carriers.map(c => c.name),
            shipping_providers_with_position: carriers,
            has_checkout: true,
            checkout_providers: extractPaymentProviders(contentLower)
          };
        }
      } catch (error) {
        logger.warn(`Firecrawl failed for ${checkoutUrl}:`, error.message);
        continue;
      }
    }

    return { success: false, carriers: [] };

  } catch (error) {
    logger.error('Firecrawl error:', error);
    return { success: false, carriers: [] };
  }
}

/**
 * Försök scrapa checkout med Puppeteer (förbättrad version)
 */
async function tryPuppeteer(url) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Blockera onödiga resurser för snabbare laddning
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Försök olika checkout-URLs
    const checkoutUrls = [
      url,
      `${url}/checkout`,
      `${url}/kassa`,
      `${url}/cart/checkout`,
      `${url}/varukorg/kassa`,
      `${url}/checkout/information`
    ];

    for (const checkoutUrl of checkoutUrls) {
      try {
        logger.info(`🔗 Trying Puppeteer on: ${checkoutUrl}`);
        
        await page.goto(checkoutUrl, {
          waitUntil: 'networkidle2',
          timeout: 15000
        });

        // Vänta lite för dynamiskt innehåll
        await page.waitForTimeout(2000);

        // Försök fylla i checkout-formulär om det finns
        await tryFillCheckoutForm(page);

        // Vänta på att shipping options laddas
        await page.waitForTimeout(3000);

        // Extrahera transportörer
        const carriers = await extractCarriersFromPage(page);
        
        if (carriers.length > 0) {
          logger.info(`✅ Puppeteer found ${carriers.length} carriers on ${checkoutUrl}`);
          
          const checkoutProviders = await page.evaluate(() => {
            const providers = [];
            const bodyText = document.body.innerText.toLowerCase();
            
            if (bodyText.includes('klarna')) providers.push('Klarna');
            if (bodyText.includes('stripe')) providers.push('Stripe');
            if (bodyText.includes('adyen')) providers.push('Adyen');
            if (bodyText.includes('paypal')) providers.push('PayPal');
            if (bodyText.includes('swish')) providers.push('Swish');
            
            return providers;
          });

          await browser.close();
          
          return {
            success: true,
            carriers: carriers.map(c => c.name),
            shipping_providers: carriers.map(c => c.name),
            shipping_providers_with_position: carriers,
            has_checkout: true,
            checkout_providers: checkoutProviders
          };
        }
      } catch (error) {
        logger.warn(`Puppeteer failed for ${checkoutUrl}:`, error.message);
        continue;
      }
    }

    await browser.close();
    return { success: false, carriers: [] };

  } catch (error) {
    logger.error('Puppeteer error:', error);
    if (browser) await browser.close();
    return { success: false, carriers: [] };
  }
}

/**
 * Extrahera transportörer från Firecrawl content
 */
function extractCarriersFromContent(content, contentLower) {
  const carriers = [];
  const carrierDefinitions = [
    { name: 'DHL', variants: ['dhl', 'dhl express', 'dhl freight'], priority: 1 },
    { name: 'PostNord', variants: ['postnord', 'post nord'], priority: 2 },
    { name: 'Bring', variants: ['bring', 'posten bring'], priority: 3 },
    { name: 'Schenker', variants: ['schenker', 'db schenker'], priority: 4 },
    { name: 'Budbee', variants: ['budbee'], priority: 5 },
    { name: 'Instabox', variants: ['instabox'], priority: 6 },
    { name: 'Best Transport', variants: ['best transport', 'best'], priority: 7 },
    { name: 'FedEx', variants: ['fedex'], priority: 8 },
    { name: 'UPS', variants: ['ups'], priority: 9 }
  ];

  // Försök hitta ordning genom att söka efter shipping/delivery-sektioner
  const shippingSection = extractShippingSection(content);
  
  if (shippingSection) {
    const sectionLower = shippingSection.toLowerCase();
    
    carrierDefinitions.forEach(carrier => {
      carrier.variants.forEach(variant => {
        if (sectionLower.includes(variant)) {
          if (!carriers.some(c => c.name === carrier.name)) {
            // Försök hitta position baserat på ordning i texten
            const index = sectionLower.indexOf(variant);
            carriers.push({
              name: carrier.name,
              position: carriers.length + 1,
              index: index
            });
          }
        }
      });
    });

    // Sortera baserat på index i texten
    carriers.sort((a, b) => a.index - b.index);
    carriers.forEach((c, i) => c.position = i + 1);
  }

  // Om ingen shipping-sektion hittades, sök i hela dokumentet
  if (carriers.length === 0) {
    carrierDefinitions.forEach(carrier => {
      carrier.variants.forEach(variant => {
        if (contentLower.includes(variant)) {
          if (!carriers.some(c => c.name === carrier.name)) {
            carriers.push({
              name: carrier.name,
              position: carriers.length + 1
            });
          }
        }
      });
    });
  }

  return carriers;
}

/**
 * Extrahera shipping-sektion från content
 */
function extractShippingSection(content) {
  const shippingKeywords = [
    'shipping', 'delivery', 'frakt', 'leverans',
    'shipping method', 'delivery method', 'fraktmetod', 'leveransmetod',
    'shipping options', 'delivery options', 'fraktalternativ', 'leveransalternativ'
  ];

  const lines = content.split('\n');
  let shippingStartIndex = -1;
  let shippingEndIndex = -1;

  // Hitta start av shipping-sektion
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (shippingKeywords.some(keyword => lineLower.includes(keyword))) {
      shippingStartIndex = i;
      break;
    }
  }

  if (shippingStartIndex === -1) return null;

  // Hitta slut av shipping-sektion (nästa sektion eller 20 rader)
  shippingEndIndex = Math.min(shippingStartIndex + 20, lines.length);

  return lines.slice(shippingStartIndex, shippingEndIndex).join('\n');
}

/**
 * Extrahera betalningsleverantörer från content
 */
function extractPaymentProviders(contentLower) {
  const providers = [];
  
  if (contentLower.includes('klarna')) providers.push('Klarna');
  if (contentLower.includes('stripe')) providers.push('Stripe');
  if (contentLower.includes('adyen')) providers.push('Adyen');
  if (contentLower.includes('paypal')) providers.push('PayPal');
  if (contentLower.includes('swish')) providers.push('Swish');
  
  return providers;
}

/**
 * Extrahera transportörer från Puppeteer page (förbättrad)
 */
async function extractCarriersFromPage(page) {
  return await page.evaluate(() => {
    const carriers = [];
    const carrierDefinitions = [
      { name: 'DHL', variants: ['dhl', 'dhl express', 'dhl freight'] },
      { name: 'PostNord', variants: ['postnord', 'post nord'] },
      { name: 'Bring', variants: ['bring', 'posten bring'] },
      { name: 'Schenker', variants: ['schenker', 'db schenker'] },
      { name: 'Budbee', variants: ['budbee'] },
      { name: 'Instabox', variants: ['instabox'] },
      { name: 'Best Transport', variants: ['best transport', 'best'] },
      { name: 'FedEx', variants: ['fedex'] },
      { name: 'UPS', variants: ['ups'] }
    ];

    // Försök hitta shipping-element med olika selektorer
    const shippingSelectors = [
      '[class*="shipping"]',
      '[class*="delivery"]',
      '[class*="frakt"]',
      '[id*="shipping"]',
      '[id*="delivery"]',
      '[id*="frakt"]',
      'select[name*="shipping"]',
      'select[name*="delivery"]',
      'input[type="radio"][name*="shipping"]',
      'input[type="radio"][name*="delivery"]',
      '.shipping-method',
      '.delivery-method',
      '.shipping-options',
      '.delivery-options'
    ];

    const shippingElements = document.querySelectorAll(shippingSelectors.join(', '));

    if (shippingElements.length > 0) {
      // Extrahera från shipping-element
      shippingElements.forEach(element => {
        const text = (element.innerText || element.textContent || '').toLowerCase();
        const html = (element.innerHTML || '').toLowerCase();
        const label = element.labels?.[0]?.textContent?.toLowerCase() || '';
        const value = element.value?.toLowerCase() || '';
        
        const combinedText = `${text} ${html} ${label} ${value}`;
        
        carrierDefinitions.forEach(carrier => {
          carrier.variants.forEach(variant => {
            if (combinedText.includes(variant)) {
              if (!carriers.some(c => c.name === carrier.name)) {
                carriers.push({
                  name: carrier.name,
                  position: carriers.length + 1,
                  element: element.tagName
                });
              }
            }
          });
        });
      });
    }

    // Om inga element hittades, sök i hela dokumentet
    if (carriers.length === 0) {
      const bodyText = document.body.innerText.toLowerCase();
      const bodyHTML = document.body.innerHTML.toLowerCase();
      
      carrierDefinitions.forEach(carrier => {
        carrier.variants.forEach(variant => {
          if (bodyText.includes(variant) || bodyHTML.includes(variant)) {
            if (!carriers.some(c => c.name === carrier.name)) {
              carriers.push({
                name: carrier.name,
                position: carriers.length + 1
              });
            }
          }
        });
      });
    }

    return carriers;
  });
}

/**
 * Försök fylla i checkout-formulär
 */
async function tryFillCheckoutForm(page) {
  try {
    const testData = {
      email: 'test@leadhunter.se',
      firstName: 'Test',
      lastName: 'Testsson',
      phone: '0701234567',
      address: 'Testgatan 1',
      postalCode: '11122',
      city: 'Stockholm'
    };

    await page.evaluate((data) => {
      const fillField = (selectors, value) => {
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            if (el && el.offsetParent !== null) {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
              return true;
            }
          }
        }
        return false;
      };

      // Email
      fillField(['input[type="email"]', 'input[name*="email"]', '#email'], data.email);
      
      // Name
      fillField(['input[name*="firstName"]', 'input[name*="first"]', 'input[placeholder*="förnamn"]'], data.firstName);
      fillField(['input[name*="lastName"]', 'input[name*="last"]', 'input[placeholder*="efternamn"]'], data.lastName);
      
      // Phone
      fillField(['input[type="tel"]', 'input[name*="phone"]', 'input[name*="telefon"]'], data.phone);
      
      // Address
      fillField(['input[name*="address"]', 'input[name*="street"]', 'input[name*="adress"]'], data.address);
      
      // Postal code
      fillField(['input[name*="zip"]', 'input[name*="postal"]', 'input[name*="postnummer"]'], data.postalCode);
      
      // City
      fillField(['input[name*="city"]', 'input[name*="stad"]', 'input[name*="ort"]'], data.city);
    }, testData);

    // Vänta på att formuläret uppdateras
    await page.waitForTimeout(1000);
    
    return true;
  } catch (error) {
    logger.warn('Failed to fill checkout form:', error.message);
    return false;
  }
}

export default {
  detectCheckoutCarriers
};
