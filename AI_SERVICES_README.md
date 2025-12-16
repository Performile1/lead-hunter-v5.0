# AI Services Integration Guide

## Overview
Lead Hunter v5.0 integrates multiple AI services and scraping tools for comprehensive lead analysis.

## Available Services

### 1. **Gemini (Google)** - Primary AI
- **Status**: ✅ Active
- **Purpose**: Main analysis engine with web grounding
- **Cost**: Free tier (20 requests/day per model)
- **Setup**: Add `VITE_GEMINI_API_KEY` to `.env`

### 2. **Groq** - Fast Fallback
- **Status**: ✅ Active
- **Model**: llama-3.3-70b-versatile
- **Purpose**: Fast analysis when Gemini is overloaded
- **Speed**: 500+ tokens/second
- **Cost**: Free (14,400 requests/day)
- **Setup**: Add `VITE_GROQ_API_KEY` to `.env`

### 3. **DeepSeek** - Additional AI Capacity
- **Status**: 🆕 New
- **Purpose**: Chinese AI model for additional capacity
- **Features**: 
  - Company analysis
  - Competitive intelligence
  - Batch processing
- **Setup**: Add `VITE_DEEPSEEK_API_KEY` to `.env`

### 4. **Tandem.ai** - Multi-Agent Analysis
- **Status**: 🆕 New
- **Purpose**: Collaborative AI with multiple specialized agents
- **Features**:
  - Financial analyst agent
  - Market researcher agent
  - Tech analyst agent
  - Sales strategist agent
- **Setup**: Add `VITE_TANDEM_AI_API_KEY` to `.env`

### 5. **Algolia** - Fast Search
- **Status**: 🆕 New
- **Purpose**: Lightning-fast search indexing and retrieval
- **Features**:
  - Real-time indexing
  - Typo tolerance
  - Faceted search
  - 50ms search response time
- **Setup**: 
  - Add `VITE_ALGOLIA_APP_ID` to `.env`
  - Add `VITE_ALGOLIA_API_KEY` to `.env`
  - Add `VITE_ALGOLIA_INDEX_NAME` to `.env` (default: "leads")

### 6. **Firecrawl** - Intelligent Web Scraping
- **Status**: 🆕 New
- **Purpose**: AI-powered web scraping and crawling
- **Features**:
  - Markdown conversion
  - Main content extraction
  - Link extraction
  - Structured data extraction
  - Full website crawling
- **Setup**: Add `VITE_FIRECRAWL_API_KEY` to `.env`

### 7. **Browse.ai** - Automated Scraping Robots
- **Status**: 🆕 New
- **Purpose**: Pre-built scraping robots for common tasks
- **Features**:
  - No-code robot creation
  - Scheduled scraping
  - Data extraction templates
- **Setup**: Add `VITE_BROWSE_AI_API_KEY` to `.env`

### 8. **Crawl4AI** - AI-Powered Crawling
- **Status**: ✅ Active (Enhanced)
- **Purpose**: LLM-integrated web crawling
- **Features**:
  - AI-powered content extraction
  - Schema-based extraction
  - Smart crawling strategies
- **Setup**: Set `VITE_CRAWL4AI_ENABLED=true` in `.env`

## Service Selection Strategy

The AI Orchestrator automatically selects the best service for each task:

### For Analysis:
1. **Groq** (fastest, free)
2. **DeepSeek** (fallback)
3. **Gemini** (if quota available)
4. **Tandem.ai** (for complex multi-agent tasks)

### For Web Scraping:
1. **Firecrawl** (best quality, AI-powered)
2. **Browse.ai** (pre-built robots)
3. **Crawl4AI** (LLM integration)

### For Search:
1. **Algolia** (instant results)
2. **Database** (fallback)

## Usage Examples

### Basic Analysis
```typescript
import { selectBestAIForAnalysis } from './services/aiOrchestrator';

const result = await selectBestAIForAnalysis(
  systemPrompt,
  userPrompt,
  { preferredService: 'groq' }
);
```

### Web Scraping
```typescript
import { selectBestScraperForURL } from './services/aiOrchestrator';

const data = await selectBestScraperForURL('https://example.com');
```

### Enhanced Lead Analysis
```typescript
import { enhancedLeadAnalysis } from './services/aiOrchestrator';

const analysis = await enhancedLeadAnalysis(
  'Company Name',
  'https://company.com'
);
```

### Search with Algolia
```typescript
import { searchLeads } from './services/algoliaService';

const results = await searchLeads('DHL', {
  segment: 'KAM',
  platform: 'Shopify'
});
```

### Index Lead in Algolia
```typescript
import { indexLead } from './services/algoliaService';

await indexLead(leadData);
```

## Service Health Check

```typescript
import { healthCheckAllServices } from './services/aiOrchestrator';

const health = await healthCheckAllServices();
console.log(health);
```

## Cost Optimization

1. **Use Groq first** - It's free and fast
2. **Enable Algolia** - Reduces database load
3. **Use Firecrawl** - Better than traditional scraping
4. **Batch operations** - When possible, batch API calls

## Recommended Setup Priority

### Critical (Must Have):
- ✅ Gemini API
- ✅ Groq API

### Recommended (High Value):
- 🆕 Firecrawl API
- 🆕 Algolia
- 🆕 DeepSeek API

### Optional (Nice to Have):
- 🆕 Tandem.ai
- 🆕 Browse.ai
- ✅ Crawl4AI

## Environment Variables Template

```env
# Critical
VITE_GEMINI_API_KEY=your_key_here
VITE_GROQ_API_KEY=your_key_here

# Recommended
VITE_FIRECRAWL_API_KEY=your_key_here
VITE_ALGOLIA_APP_ID=your_app_id_here
VITE_ALGOLIA_API_KEY=your_key_here
VITE_ALGOLIA_INDEX_NAME=leads
VITE_DEEPSEEK_API_KEY=your_key_here

# Optional
VITE_TANDEM_AI_API_KEY=your_key_here
VITE_BROWSE_AI_API_KEY=your_key_here
VITE_CRAWL4AI_ENABLED=true
```

## Troubleshooting

### Service Not Available
Check if API key is set in `.env` file and restart dev server.

### Quota Exceeded
The orchestrator will automatically fallback to alternative services.

### Slow Performance
- Enable Algolia for faster search
- Use Groq instead of Gemini for speed
- Enable caching in browser

## Support

For issues or questions about specific services:
- Gemini: https://ai.google.dev/gemini-api/docs
- Groq: https://console.groq.com/docs
- DeepSeek: https://platform.deepseek.com/docs
- Tandem.ai: https://tandem.ai/docs
- Algolia: https://www.algolia.com/doc/
- Firecrawl: https://docs.firecrawl.dev/
- Browse.ai: https://www.browse.ai/docs
- Octoparse: https://www.octoparse.com/docs
- Crawl4AI: https://github.com/unclecode/crawl4ai
