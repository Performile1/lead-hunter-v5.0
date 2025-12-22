/**
 * TRUSTPILOT SERVICE
 * Hämtar företagsomdömen från Trustpilot med fokus på leverans/frakt
 */

import { analyzeWithGroq, isGroqAvailable } from './groqService';
import { extractJSON } from './geminiService';

export interface TrustpilotReview {
  rating: number; // 1-5
  title: string;
  text: string;
  date: string;
  author?: string;
  isAboutDelivery: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface TrustpilotData {
  companyName: string;
  overallRating: number; // 1-5
  totalReviews: number;
  trustScore: number; // 0-100
  reviews: TrustpilotReview[];
  deliveryReviews: TrustpilotReview[];
  deliverySentiment: 'positive' | 'negative' | 'mixed' | 'unknown';
  url: string;
}

/**
 * Sök efter företag på Trustpilot och hämta omdömen
 */
export async function searchTrustpilot(companyName: string): Promise<TrustpilotData | null> {
  try {
    console.log(`🔍 Searching Trustpilot for: ${companyName}`);
    
    // Använd Groq för att söka och analysera Trustpilot
    if (!isGroqAvailable()) {
      console.warn('⚠️ Groq not available, skipping Trustpilot search');
      return null;
    }
    
    const searchPrompt = `
    Sök efter företaget "${companyName}" på Trustpilot (se.trustpilot.com).
    
    Hitta och analysera deras omdömen, speciellt de som nämner:
    - Leverans
    - Frakt
    - Shipping
    - Delivery
    - Transport
    
    Returnera JSON med följande struktur:
    {
      "companyName": "${companyName}",
      "overallRating": 4.2,
      "totalReviews": 150,
      "trustScore": 85,
      "url": "https://se.trustpilot.com/review/example.com",
      "reviews": [
        {
          "rating": 5,
          "title": "Snabb leverans!",
          "text": "Fick paketet redan nästa dag. Mycket nöjd med frakten.",
          "date": "2024-01-15",
          "author": "Anna S.",
          "isAboutDelivery": true,
          "sentiment": "positive"
        }
      ]
    }
    
    VIKTIGT:
    - Fokusera på de 5-10 senaste omdömena
    - Markera vilka som handlar om leverans (isAboutDelivery: true)
    - Analysera sentiment (positive/negative/neutral)
    - Om du inte hittar företaget, returnera null
    `;
    
    const systemPrompt = `
    Du är en Trustpilot-analysator som söker efter företagsomdömen.
    Du har tillgång till Trustpilot Sverige (se.trustpilot.com).
    Fokusera på omdömen om leverans och frakt.
    Returnera alltid valid JSON.
    `;
    
    const response = await analyzeWithGroq(systemPrompt, searchPrompt, 0.3);
    const data = extractJSON(response);
    
    if (!data || data.length === 0) {
      console.log(`ℹ️ No Trustpilot data found for ${companyName}`);
      return null;
    }
    
    const trustpilotData = data[0];
    
    // Filtrera ut leveransomdömen
    const deliveryReviews = (trustpilotData.reviews || []).filter(
      (r: TrustpilotReview) => r.isAboutDelivery
    );
    
    // Beräkna leverans-sentiment
    let deliverySentiment: 'positive' | 'negative' | 'mixed' | 'unknown' = 'unknown';
    if (deliveryReviews.length > 0) {
      const positiveCount = deliveryReviews.filter((r: TrustpilotReview) => r.sentiment === 'positive').length;
      const negativeCount = deliveryReviews.filter((r: TrustpilotReview) => r.sentiment === 'negative').length;
      
      if (positiveCount > negativeCount * 2) {
        deliverySentiment = 'positive';
      } else if (negativeCount > positiveCount * 2) {
        deliverySentiment = 'negative';
      } else if (positiveCount > 0 || negativeCount > 0) {
        deliverySentiment = 'mixed';
      }
    }
    
    const result: TrustpilotData = {
      companyName: trustpilotData.companyName || companyName,
      overallRating: trustpilotData.overallRating || 0,
      totalReviews: trustpilotData.totalReviews || 0,
      trustScore: trustpilotData.trustScore || 0,
      reviews: trustpilotData.reviews || [],
      deliveryReviews,
      deliverySentiment,
      url: trustpilotData.url || `https://se.trustpilot.com/search?query=${encodeURIComponent(companyName)}`
    };
    
    console.log(`✅ Trustpilot: ${result.totalReviews} reviews, ${deliveryReviews.length} about delivery`);
    console.log(`   Delivery sentiment: ${deliverySentiment}`);
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Trustpilot search failed:', error.message);
    return null;
  }
}

/**
 * Formatera Trustpilot-data till läsbar text
 */
export function formatTrustpilotSummary(data: TrustpilotData): string {
  const stars = '⭐'.repeat(Math.round(data.overallRating));
  
  let summary = `${stars} ${data.overallRating}/5 (${data.totalReviews} omdömen)\n`;
  
  if (data.deliveryReviews.length > 0) {
    summary += `\n📦 Leveransomdömen: ${data.deliveryReviews.length}\n`;
    summary += `Sentiment: ${getSentimentEmoji(data.deliverySentiment)} ${data.deliverySentiment}\n`;
    
    // Visa senaste leveransomdömet
    const latestDelivery = data.deliveryReviews[0];
    if (latestDelivery) {
      summary += `\nSenaste: "${latestDelivery.title}" - ${latestDelivery.rating}/5`;
    }
  } else {
    summary += '\nℹ️ Inga specifika leveransomdömen hittade';
  }
  
  return summary;
}

function getSentimentEmoji(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return '😊';
    case 'negative': return '😞';
    case 'mixed': return '😐';
    default: return '❓';
  }
}

/**
 * Hämta Trustpilot URL för företag
 */
export function getTrustpilotUrl(companyName: string, websiteUrl?: string): string {
  if (websiteUrl) {
    try {
      const domain = new URL(websiteUrl).hostname.replace('www.', '');
      return `https://se.trustpilot.com/review/${domain}`;
    } catch (e) {
      // Invalid URL, fall through to search
    }
  }
  
  return `https://se.trustpilot.com/search?query=${encodeURIComponent(companyName)}`;
}
