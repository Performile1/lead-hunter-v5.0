/**
 * Contact Person Scraper
 * Hämtar kontaktpersoner från företag via flera källor:
 * 1. Hunter.io API (emails + LinkedIn)
 * 2. Apollo.io API (B2B contacts)
 * 3. Scraping från företagets "Om oss" sida
 * 4. AI-extraktion med Gemini/GPT
 */

import { scrapeWithFirecrawl } from './firecrawlService';
import { queueRequest } from './requestQueue';

export interface ContactPerson {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  source: 'hunter' | 'apollo' | 'scraping' | 'ai-extraction';
  confidence: 'high' | 'medium' | 'low';
}

const HUNTER_API_KEY = process.env.HUNTER_API_KEY || process.env.VITE_HUNTER_API_KEY;
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

/**
 * Hämta kontaktpersoner för ett företag
 */
export async function fetchContactPersons(
  companyName: string,
  websiteUrl: string,
  orgNumber?: string
): Promise<ContactPerson[]> {
  console.log('👥 Fetching contact persons for:', companyName);

  const contacts: ContactPerson[] = [];

  // 1. Försök Hunter.io först (bäst för emails)
  if (HUNTER_API_KEY) {
    try {
      const hunterContacts = await fetchFromHunter(websiteUrl);
      contacts.push(...hunterContacts);
      console.log(`✅ Hunter.io found ${hunterContacts.length} contacts`);
    } catch (error) {
      console.warn('Hunter.io failed:', error);
    }
  }

  // 2. Försök Apollo.io (bäst för B2B)
  if (APOLLO_API_KEY) {
    try {
      const apolloContacts = await fetchFromApollo(companyName);
      contacts.push(...apolloContacts);
      console.log(`✅ Apollo.io found ${apolloContacts.length} contacts`);
    } catch (error) {
      console.warn('Apollo.io failed:', error);
    }
  }

  // 3. Scrapa från företagets "Om oss" sida
  try {
    const scrapedContacts = await scrapeContactsFromWebsite(websiteUrl);
    contacts.push(...scrapedContacts);
    console.log(`✅ Website scraping found ${scrapedContacts.length} contacts`);
  } catch (error) {
    console.warn('Website scraping failed:', error);
  }

  // 4. Om vi fortfarande inte har kontakter, använd AI-extraktion
  if (contacts.length === 0) {
    try {
      const aiContacts = await extractContactsWithAI(websiteUrl, companyName);
      contacts.push(...aiContacts);
      console.log(`✅ AI extraction found ${aiContacts.length} contacts`);
    } catch (error) {
      console.warn('AI extraction failed:', error);
    }
  }

  // Deduplicate och sortera efter confidence
  const uniqueContacts = deduplicateContacts(contacts);
  return uniqueContacts.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });
}

/**
 * Hämta kontakter från Hunter.io
 */
async function fetchFromHunter(websiteUrl: string): Promise<ContactPerson[]> {
  const domain = new URL(websiteUrl).hostname.replace('www.', '');
  
  const response = await fetch(
    `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Hunter.io API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.data?.emails) {
    return [];
  }

  return data.data.emails.map((email: any) => ({
    name: `${email.first_name || ''} ${email.last_name || ''}`.trim(),
    title: email.position || 'Unknown',
    email: email.value,
    linkedinUrl: email.linkedin,
    source: 'hunter' as const,
    confidence: email.confidence > 80 ? 'high' : email.confidence > 50 ? 'medium' : 'low'
  })).filter((c: ContactPerson) => c.name);
}

/**
 * Hämta kontakter från Apollo.io
 */
async function fetchFromApollo(companyName: string): Promise<ContactPerson[]> {
  const response = await fetch('https://api.apollo.io/v1/people/search', {
    method: 'POST',
    headers: {
      'X-Api-Key': APOLLO_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      organization_name: companyName,
      person_titles: ['CEO', 'VD', 'COO', 'Logistikchef', 'CFO', 'CTO', 'Inköpschef'],
      page: 1,
      per_page: 10
    })
  });

  if (!response.ok) {
    throw new Error(`Apollo.io API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.people) {
    return [];
  }

  return data.people.map((person: any) => ({
    name: person.name,
    title: person.title,
    email: person.email,
    phone: person.phone_numbers?.[0],
    linkedinUrl: person.linkedin_url,
    source: 'apollo' as const,
    confidence: 'high' as const
  }));
}

/**
 * Scrapa kontakter från företagets webbplats
 */
async function scrapeContactsFromWebsite(websiteUrl: string): Promise<ContactPerson[]> {
  const aboutUrls = [
    `${websiteUrl}/about`,
    `${websiteUrl}/om-oss`,
    `${websiteUrl}/about-us`,
    `${websiteUrl}/team`,
    `${websiteUrl}/kontakt`,
    `${websiteUrl}/contact`,
    `${websiteUrl}/ledning`,
    `${websiteUrl}/management`
  ];

  const contacts: ContactPerson[] = [];

  for (const url of aboutUrls) {
    try {
      const scrapedContent = await queueRequest(
        () => scrapeWithFirecrawl(url, {
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000
        }),
        'firecrawl',
        5,
        1
      );

      if (!scrapedContent?.markdown) continue;

      // Extrahera kontakter från innehållet
      const extractedContacts = parseContactsFromContent(scrapedContent.markdown);
      contacts.push(...extractedContacts);

      if (contacts.length > 0) {
        console.log(`✅ Found contacts on ${url}`);
        break; // Sluta när vi hittat kontakter
      }
    } catch (error) {
      console.warn(`Failed to scrape ${url}:`, error);
    }
  }

  return contacts;
}

/**
 * Parsa kontakter från scrapeat innehåll
 */
function parseContactsFromContent(content: string): ContactPerson[] {
  const contacts: ContactPerson[] = [];

  // Pattern för namn + titel
  // Exempel: "John Doe - VD" eller "Jane Smith, CEO"
  const namePatterns = [
    /([A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ][a-zåäö]+)\s*[-–,]\s*(VD|CEO|COO|CFO|CTO|Logistikchef|Inköpschef|Verkställande direktör)/gi,
    /(?:VD|CEO|COO|CFO|CTO)[\s:]*([A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ][a-zåäö]+)/gi
  ];

  for (const pattern of namePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1].trim();
      const title = match[2] || 'Unknown';
      
      if (name && name.length > 3) {
        contacts.push({
          name,
          title,
          source: 'scraping',
          confidence: 'medium'
        });
      }
    }
  }

  // Pattern för email
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  let emailMatch;
  while ((emailMatch = emailPattern.exec(content)) !== null) {
    const email = emailMatch[1];
    
    // Försök hitta namn nära emailen
    const contextStart = Math.max(0, emailMatch.index - 100);
    const contextEnd = Math.min(content.length, emailMatch.index + 100);
    const context = content.substring(contextStart, contextEnd);
    
    const nameMatch = context.match(/([A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ][a-zåäö]+)/);
    
    if (nameMatch) {
      contacts.push({
        name: nameMatch[1],
        title: 'Unknown',
        email,
        source: 'scraping',
        confidence: 'medium'
      });
    }
  }

  return contacts;
}

/**
 * Extrahera kontakter med AI (Gemini/GPT)
 */
async function extractContactsWithAI(
  websiteUrl: string,
  companyName: string
): Promise<ContactPerson[]> {
  try {
    // Scrapa hemsidan först
    const scrapedContent = await scrapeWithFirecrawl(websiteUrl, {
      formats: ['markdown'],
      onlyMainContent: true
    });

    if (!scrapedContent?.markdown) {
      return [];
    }

    // Använd Gemini för att extrahera kontakter
    // Detta skulle kräva import av geminiService, men för att undvika cirkulära dependencies
    // returnerar vi tom array här och låter anroparen hantera AI-extraktion
    console.log('⚠️ AI extraction requires Gemini service integration');
    return [];
  } catch (error) {
    console.error('AI extraction error:', error);
    return [];
  }
}

/**
 * Deduplicate kontakter baserat på namn och email
 */
function deduplicateContacts(contacts: ContactPerson[]): ContactPerson[] {
  const seen = new Set<string>();
  const unique: ContactPerson[] = [];

  for (const contact of contacts) {
    const key = `${contact.name.toLowerCase()}-${contact.email?.toLowerCase() || ''}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(contact);
    }
  }

  return unique;
}

/**
 * Validera kontaktperson
 */
export function validateContact(contact: ContactPerson): boolean {
  // Namn måste finnas och vara minst 3 tecken
  if (!contact.name || contact.name.length < 3) {
    return false;
  }

  // Email måste vara giltig om den finns
  if (contact.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      return false;
    }
  }

  return true;
}
