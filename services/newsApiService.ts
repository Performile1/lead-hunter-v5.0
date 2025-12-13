/**
 * News API Service
 * Hämtar nyheter om företag från olika källor
 */

const processEnv = {
  NEWS_API_KEY: process.env.NEWS_API_KEY as string,
  NEWSAPI_ORG_KEY: process.env.NEWSAPI_ORG_KEY as string,
};

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * Sök nyheter om företag via NewsAPI.org
 */
export async function searchCompanyNews(
  companyName: string,
  daysBack: number = 30
): Promise<NewsArticle[]> {
  if (!processEnv.NEWSAPI_ORG_KEY) {
    console.warn("NEWSAPI_ORG_KEY saknas - skippar nyhetssökning");
    return [];
  }

  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    
    const query = encodeURIComponent(companyName);
    const from = fromDate.toISOString().split('T')[0];
    
    const url = `https://newsapi.org/v2/everything?q=${query}&from=${from}&sortBy=publishedAt&language=sv&apiKey=${processEnv.NEWSAPI_ORG_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return (data.articles || []).slice(0, 5).map((article: any) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt
    }));
  } catch (error) {
    console.error("NewsAPI Error:", error);
    return [];
  }
}

/**
 * Sök svenska företagsnyheter via Breakit, DI, etc.
 */
export async function searchSwedishBusinessNews(
  companyName: string
): Promise<NewsArticle[]> {
  const sources = [
    'breakit.se',
    'di.se',
    'affarsv arlden.se',
    'realtid.se'
  ];

  try {
    const query = encodeURIComponent(`${companyName} site:${sources.join(' OR site:')}`);
    
    // Använd Google Custom Search API eller liknande
    // För nu, returnera placeholder
    console.log(`Söker svenska nyheter för: ${companyName}`);
    
    return [];
  } catch (error) {
    console.error("Swedish news search error:", error);
    return [];
  }
}

/**
 * Analysera sentiment i nyheter med LLM
 */
export async function analyzeNewsSentiment(
  articles: NewsArticle[],
  llmAnalyzer: (prompt: string) => Promise<string>
): Promise<NewsArticle[]> {
  if (articles.length === 0) return [];

  try {
    const articlesText = articles.map((a, i) => 
      `${i + 1}. ${a.title}\n${a.description}`
    ).join('\n\n');

    const prompt = `Analysera sentiment för dessa nyhetsartiklar. Returnera JSON med format:
{
  "articles": [
    {"index": 1, "sentiment": "positive|negative|neutral", "reason": "kort förklaring"}
  ]
}

Artiklar:
${articlesText}`;

    const result = await llmAnalyzer(prompt);
    const parsed = JSON.parse(result);

    // Lägg till sentiment till artiklar
    return articles.map((article, i) => {
      const analysis = parsed.articles?.find((a: any) => a.index === i + 1);
      return {
        ...article,
        sentiment: analysis?.sentiment || 'neutral'
      };
    });
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return articles;
  }
}

/**
 * Hämta senaste nyhet om företag
 */
export async function getLatestCompanyNews(
  companyName: string
): Promise<NewsArticle | null> {
  const articles = await searchCompanyNews(companyName, 90);
  return articles.length > 0 ? articles[0] : null;
}

/**
 * Kontrollera om NewsAPI är tillgängligt
 */
export function isNewsAPIAvailable(): boolean {
  return !!processEnv.NEWSAPI_ORG_KEY;
}
