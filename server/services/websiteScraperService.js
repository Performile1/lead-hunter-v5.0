/**
 * Website Scraper Service
 * Scrapa företagshemsidor för logistik-relaterad information
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Scrapa webbplats för logistik-information
 * @param {string} url - URL till webbplatsen
 * @returns {Promise<Object>} - Scraping-resultat
 */
export async function scrapeWebsite(url) {
  console.log(`🔍 Scraping website: ${url}`);
  
  const analysis = {
    url,
    scraped_at: new Date().toISOString(),
    has_checkout: false,
    checkout_providers: [],
    shipping_providers: [],
    international_shipping: false,
    technologies: [],
    product_categories: [],
    ecommerce_platform: null,
    financial_metrics: null
  };

  try {
    // 1. Scrapa med Cheerio (snabbt, statiskt innehåll)
    const staticAnalysis = await scrapeStatic(url);
    Object.assign(analysis, staticAnalysis);

    // 2. Scrapa checkout med Puppeteer (dynamiskt innehåll)
    const checkoutAnalysis = await scrapeCheckout(url);
    Object.assign(analysis, checkoutAnalysis);

    // 3. Upptäck teknologier
    analysis.technologies = await detectTechnologies(url);

  } catch (error) {
    console.error('Website scraping failed:', error);
  }

  return analysis;
}

/**
 * Scrapa statiskt innehåll
 */
async function scrapeStatic(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const analysis = {
      shipping_providers: [],
      technologies: [],
      product_categories: []
    };

    // Leta efter transportörer i texten
    const bodyText = $('body').text().toLowerCase();
    const carriers = [
      'dhl', 'postnord', 'bring', 'schenker', 'fedex', 
      'ups', 'budbee', 'instabox', 'best transport'
    ];

    carriers.forEach(carrier => {
      if (bodyText.includes(carrier)) {
        analysis.shipping_providers.push(carrier.toUpperCase());
      }
    });

    // Upptäck e-handelsplattform
    if (bodyText.includes('shopify') || $('script[src*="shopify"]').length > 0) {
      analysis.ecommerce_platform = 'Shopify';
    } else if (bodyText.includes('woocommerce') || $('script[src*="woocommerce"]').length > 0) {
      analysis.ecommerce_platform = 'WooCommerce';
    } else if (bodyText.includes('magento')) {
      analysis.ecommerce_platform = 'Magento';
    }

    // Kolla internationell frakt
    if (bodyText.includes('international shipping') || 
        bodyText.includes('worldwide shipping') ||
        bodyText.includes('global shipping')) {
      analysis.international_shipping = true;
    }

    return analysis;

  } catch (error) {
    console.error('Static scraping failed:', error);
    return {};
  }
}

/**
 * Scrapa checkout med Puppeteer
 * Försöker navigera till checkout och fylla i testuppgifter för att se fraktalternativ
 */
async function scrapeCheckout(url) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigera till startsidan först
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // Försök hitta och navigera till checkout/kassa
    const checkoutAttempted = await attemptCheckoutNavigation(page, url);
    
    if (checkoutAttempted) {
      console.log('✅ Navigated to checkout, attempting to fill form...');
      await fillCheckoutForm(page);
    }

    // Leta efter checkout-element
    const hasCheckout = await page.evaluate(() => {
      const checkoutKeywords = ['checkout', 'kassa', 'varukorg', 'cart'];
      const bodyText = document.body.innerText.toLowerCase();
      return checkoutKeywords.some(keyword => bodyText.includes(keyword));
    });

    // Leta efter betalningsleverantörer (behålls för komplett analys)
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

    console.log('🔍 Söker efter transportörer i checkout...');

    // NYTT: Scrapa transportörer från checkout med ordning
    const shippingProviders = await page.evaluate(() => {
      const carriers = [];
      const carrierNames = [
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

      // Sök i hela dokumentet efter transportörer
      const bodyText = document.body.innerText.toLowerCase();
      const bodyHTML = document.body.innerHTML.toLowerCase();

      // Försök hitta ordning genom att söka i shipping/delivery-sektioner
      const shippingElements = document.querySelectorAll(
        '[class*="shipping"], [class*="delivery"], [class*="frakt"], ' +
        '[id*="shipping"], [id*="delivery"], [id*="frakt"], ' +
        'select[name*="shipping"], select[name*="delivery"]'
      );

      // Om vi hittar shipping-element, extrahera ordning
      if (shippingElements.length > 0) {
        shippingElements.forEach(element => {
          const text = element.innerText || element.textContent || '';
          const html = element.innerHTML || '';
          
          carrierNames.forEach(carrier => {
            carrier.variants.forEach(variant => {
              if (text.toLowerCase().includes(variant) || html.toLowerCase().includes(variant)) {
                if (!carriers.some(c => c.name === carrier.name)) {
                  carriers.push({
                    name: carrier.name,
                    position: carriers.length + 1
                  });
                }
              }
            });
          });
        });
      }

      // Om ingen ordning hittades, sök i hela dokumentet
      if (carriers.length === 0) {
        carrierNames.forEach(carrier => {
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

    await browser.close();

    return {
      has_checkout: hasCheckout,
      checkout_providers: checkoutProviders,
      shipping_providers: shippingProviders.map(s => s.name),
      shipping_providers_with_position: shippingProviders
    };

  } catch (error) {
    console.error('Checkout scraping failed:', error);
    if (browser) await browser.close();
    return { has_checkout: false, shipping_providers: [] };
  }
}

/**
 * Försök navigera till checkout-sidan
 */
async function attemptCheckoutNavigation(page, baseUrl) {
  try {
    // Försök hitta checkout/kassa-länkar
    const checkoutLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const checkoutKeywords = ['checkout', 'kassa', 'varukorg', 'cart', 'kassan', 'till-kassan'];
      
      for (const link of links) {
        const text = link.textContent.toLowerCase();
        const href = link.href.toLowerCase();
        
        if (checkoutKeywords.some(keyword => text.includes(keyword) || href.includes(keyword))) {
          return link.href;
        }
      }
      return null;
    });

    if (checkoutLink) {
      console.log(`🔗 Found checkout link: ${checkoutLink}`);
      await page.goto(checkoutLink, { waitUntil: 'networkidle2', timeout: 10000 });
      await page.waitForTimeout(2000); // Vänta på att sidan laddas
      return true;
    }

    // Försök direkta checkout-URLs
    const checkoutUrls = [
      '/checkout',
      '/kassa',
      '/cart/checkout',
      '/varukorg/kassa',
      '/checkout/information'
    ];

    for (const path of checkoutUrls) {
      try {
        const checkoutUrl = new URL(path, baseUrl).href;
        console.log(`🔗 Trying direct checkout URL: ${checkoutUrl}`);
        const response = await page.goto(checkoutUrl, { waitUntil: 'networkidle2', timeout: 10000 });
        
        if (response && response.status() === 200) {
          await page.waitForTimeout(2000);
          return true;
        }
      } catch (e) {
        // URL doesn't exist, continue
      }
    }

    return false;
  } catch (error) {
    console.warn('Checkout navigation failed:', error.message);
    return false;
  }
}

/**
 * Fyll i checkout-formulär med testuppgifter
 */
async function fillCheckoutForm(page) {
  try {
    // Test user data
    const testUser = {
      email: 'test@dhlleadhunter.com',
      firstName: 'Test',
      lastName: 'Testsson',
      phone: '0701234567',
      address: 'Testgatan 1',
      postalCode: '11122',
      city: 'Stockholm',
      country: 'SE'
    };

    console.log('📝 Filling checkout form with test data...');

    // Försök fylla i vanliga fält
    await page.evaluate((user) => {
      const fillField = (selectors, value) => {
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            if (el && el.offsetParent !== null) { // Check if visible
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
        }
        return false;
      };

      // Email
      fillField([
        'input[type="email"]',
        'input[name*="email"]',
        'input[id*="email"]',
        '#email'
      ], user.email);

      // First name
      fillField([
        'input[name*="firstName"]',
        'input[name*="first_name"]',
        'input[name*="fornamn"]',
        'input[id*="firstName"]',
        'input[placeholder*="Förnamn"]'
      ], user.firstName);

      // Last name
      fillField([
        'input[name*="lastName"]',
        'input[name*="last_name"]',
        'input[name*="efternamn"]',
        'input[id*="lastName"]',
        'input[placeholder*="Efternamn"]'
      ], user.lastName);

      // Phone
      fillField([
        'input[type="tel"]',
        'input[name*="phone"]',
        'input[name*="telefon"]',
        'input[id*="phone"]'
      ], user.phone);

      // Address
      fillField([
        'input[name*="address"]',
        'input[name*="street"]',
        'input[name*="adress"]',
        'input[id*="address"]'
      ], user.address);

      // Postal code
      fillField([
        'input[name*="zip"]',
        'input[name*="postal"]',
        'input[name*="postnummer"]',
        'input[id*="zip"]',
        'input[id*="postal"]'
      ], user.postalCode);

      // City
      fillField([
        'input[name*="city"]',
        'input[name*="stad"]',
        'input[name*="ort"]',
        'input[id*="city"]'
      ], user.city);

    }, testUser);

    // Vänta på att formuläret uppdateras och fraktalternativ laddas
    await page.waitForTimeout(3000);

    console.log('✅ Form filled, waiting for shipping options...');
    return true;

  } catch (error) {
    console.warn('Form filling failed:', error.message);
    return false;
  }
}

/**
 * Upptäck teknologier
 */
async function detectTechnologies(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const technologies = [];

    // Kolla scripts och meta-tags
    if ($('script[src*="react"]').length > 0 || response.data.includes('react')) {
      technologies.push('React');
    }
    if ($('script[src*="vue"]').length > 0 || response.data.includes('vue')) {
      technologies.push('Vue.js');
    }
    if ($('script[src*="angular"]').length > 0) {
      technologies.push('Angular');
    }
    if ($('script[src*="jquery"]').length > 0) {
      technologies.push('jQuery');
    }
    if (response.data.includes('wp-content') || response.data.includes('wordpress')) {
      technologies.push('WordPress');
    }

    return technologies;

  } catch (error) {
    console.error('Technology detection failed:', error);
    return [];
  }
}

export default {
  scrapeWebsite
};
