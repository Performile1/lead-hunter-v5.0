/**
 * Quota Tracking Service
 * Tracks API usage and quotas per tenant and globally
 */

const pool = require('../db');

// In-memory cache for quota tracking (resets on server restart)
const quotaCache = {
  gemini: { hourly: new Map(), daily: new Map() },
  groq: { hourly: new Map(), daily: new Map() },
  firecrawl: { monthly: new Map() },
  deepseek: { monthly: new Map() },
  newsapi: { daily: new Map() }
};

// Quota limits (per tenant)
const QUOTA_LIMITS = {
  gemini: {
    hourly: 20,
    daily: 100,
    resetHourly: 60 * 60 * 1000, // 1 hour
    resetDaily: 24 * 60 * 60 * 1000 // 24 hours
  },
  groq: {
    hourly: 14400,
    daily: 14400,
    resetHourly: 60 * 60 * 1000,
    resetDaily: 24 * 60 * 60 * 1000
  },
  firecrawl: {
    monthly: 500,
    resetMonthly: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  deepseek: {
    monthly: 1000000,
    resetMonthly: 30 * 24 * 60 * 60 * 1000
  },
  newsapi: {
    daily: 100,
    resetDaily: 24 * 60 * 60 * 1000
  }
};

/**
 * Track API usage
 */
async function trackUsage(service, tenantId, userId = null) {
  const now = Date.now();
  const key = tenantId || 'global';
  
  try {
    // Update in-memory cache
    switch (service.toLowerCase()) {
      case 'gemini':
        updateCache(quotaCache.gemini.hourly, key, now, QUOTA_LIMITS.gemini.resetHourly);
        updateCache(quotaCache.gemini.daily, key, now, QUOTA_LIMITS.gemini.resetDaily);
        break;
      case 'groq':
        updateCache(quotaCache.groq.hourly, key, now, QUOTA_LIMITS.groq.resetHourly);
        updateCache(quotaCache.groq.daily, key, now, QUOTA_LIMITS.groq.resetDaily);
        break;
      case 'firecrawl':
        updateCache(quotaCache.firecrawl.monthly, key, now, QUOTA_LIMITS.firecrawl.resetMonthly);
        break;
      case 'deepseek':
        updateCache(quotaCache.deepseek.monthly, key, now, QUOTA_LIMITS.deepseek.resetMonthly);
        break;
      case 'newsapi':
        updateCache(quotaCache.newsapi.daily, key, now, QUOTA_LIMITS.newsapi.resetDaily);
        break;
    }
    
    // Log to database for historical tracking
    await pool.query(
      `INSERT INTO api_usage_tracking (
        service, tenant_id, user_id, timestamp
      ) VALUES ($1, $2, $3, NOW())`,
      [service.toLowerCase(), tenantId, userId]
    );
    
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}

/**
 * Update cache with timestamp cleanup
 */
function updateCache(cache, key, now, resetWindow) {
  if (!cache.has(key)) {
    cache.set(key, []);
  }
  
  const timestamps = cache.get(key);
  
  // Remove old timestamps outside the reset window
  const validTimestamps = timestamps.filter(ts => now - ts < resetWindow);
  validTimestamps.push(now);
  
  cache.set(key, validTimestamps);
}

/**
 * Get current usage for a service and tenant
 */
function getUsage(service, tenantId = null) {
  const key = tenantId || 'global';
  const now = Date.now();
  
  switch (service.toLowerCase()) {
    case 'gemini':
      const geminiHourly = cleanAndCount(quotaCache.gemini.hourly, key, now, QUOTA_LIMITS.gemini.resetHourly);
      const geminiDaily = cleanAndCount(quotaCache.gemini.daily, key, now, QUOTA_LIMITS.gemini.resetDaily);
      return {
        hourly: { used: geminiHourly, limit: QUOTA_LIMITS.gemini.hourly },
        daily: { used: geminiDaily, limit: QUOTA_LIMITS.gemini.daily }
      };
      
    case 'groq':
      const groqHourly = cleanAndCount(quotaCache.groq.hourly, key, now, QUOTA_LIMITS.groq.resetHourly);
      const groqDaily = cleanAndCount(quotaCache.groq.daily, key, now, QUOTA_LIMITS.groq.resetDaily);
      return {
        hourly: { used: groqHourly, limit: QUOTA_LIMITS.groq.hourly },
        daily: { used: groqDaily, limit: QUOTA_LIMITS.groq.daily }
      };
      
    case 'firecrawl':
      const firecrawlMonthly = cleanAndCount(quotaCache.firecrawl.monthly, key, now, QUOTA_LIMITS.firecrawl.resetMonthly);
      return {
        monthly: { used: firecrawlMonthly, limit: QUOTA_LIMITS.firecrawl.monthly }
      };
      
    case 'deepseek':
      const deepseekMonthly = cleanAndCount(quotaCache.deepseek.monthly, key, now, QUOTA_LIMITS.deepseek.resetMonthly);
      return {
        monthly: { used: deepseekMonthly, limit: QUOTA_LIMITS.deepseek.monthly }
      };
      
    case 'newsapi':
      const newsapiDaily = cleanAndCount(quotaCache.newsapi.daily, key, now, QUOTA_LIMITS.newsapi.resetDaily);
      return {
        daily: { used: newsapiDaily, limit: QUOTA_LIMITS.newsapi.daily }
      };
      
    default:
      return null;
  }
}

/**
 * Clean old timestamps and count valid ones
 */
function cleanAndCount(cache, key, now, resetWindow) {
  if (!cache.has(key)) {
    return 0;
  }
  
  const timestamps = cache.get(key);
  const validTimestamps = timestamps.filter(ts => now - ts < resetWindow);
  
  // Update cache with cleaned timestamps
  cache.set(key, validTimestamps);
  
  return validTimestamps.length;
}

/**
 * Get all quotas for a tenant
 */
function getAllQuotas(tenantId = null) {
  const services = ['gemini', 'groq', 'firecrawl', 'deepseek', 'newsapi'];
  const quotas = {};
  
  services.forEach(service => {
    quotas[service] = getUsage(service, tenantId);
  });
  
  return quotas;
}

/**
 * Check if quota is available
 */
function hasQuotaAvailable(service, tenantId = null, period = 'hourly') {
  const usage = getUsage(service, tenantId);
  
  if (!usage || !usage[period]) {
    return true; // If no tracking, allow
  }
  
  return usage[period].used < usage[period].limit;
}

/**
 * Get time until reset
 */
function getTimeUntilReset(service, period = 'hourly') {
  const key = 'global';
  const now = Date.now();
  
  let cache, resetWindow;
  
  switch (service.toLowerCase()) {
    case 'gemini':
      cache = period === 'hourly' ? quotaCache.gemini.hourly : quotaCache.gemini.daily;
      resetWindow = period === 'hourly' ? QUOTA_LIMITS.gemini.resetHourly : QUOTA_LIMITS.gemini.resetDaily;
      break;
    case 'groq':
      cache = period === 'hourly' ? quotaCache.groq.hourly : quotaCache.groq.daily;
      resetWindow = period === 'hourly' ? QUOTA_LIMITS.groq.resetHourly : QUOTA_LIMITS.groq.resetDaily;
      break;
    case 'firecrawl':
      cache = quotaCache.firecrawl.monthly;
      resetWindow = QUOTA_LIMITS.firecrawl.resetMonthly;
      break;
    case 'deepseek':
      cache = quotaCache.deepseek.monthly;
      resetWindow = QUOTA_LIMITS.deepseek.resetMonthly;
      break;
    case 'newsapi':
      cache = quotaCache.newsapi.daily;
      resetWindow = QUOTA_LIMITS.newsapi.resetDaily;
      break;
    default:
      return 0;
  }
  
  if (!cache.has(key) || cache.get(key).length === 0) {
    return 0;
  }
  
  const oldestTimestamp = Math.min(...cache.get(key));
  const resetTime = oldestTimestamp + resetWindow;
  const timeUntilReset = Math.max(0, resetTime - now);
  
  return timeUntilReset;
}

/**
 * Reset quota for a service (admin function)
 */
function resetQuota(service, tenantId = null) {
  const key = tenantId || 'global';
  
  switch (service.toLowerCase()) {
    case 'gemini':
      quotaCache.gemini.hourly.delete(key);
      quotaCache.gemini.daily.delete(key);
      break;
    case 'groq':
      quotaCache.groq.hourly.delete(key);
      quotaCache.groq.daily.delete(key);
      break;
    case 'firecrawl':
      quotaCache.firecrawl.monthly.delete(key);
      break;
    case 'deepseek':
      quotaCache.deepseek.monthly.delete(key);
      break;
    case 'newsapi':
      quotaCache.newsapi.daily.delete(key);
      break;
    case 'all':
      quotaCache.gemini.hourly.delete(key);
      quotaCache.gemini.daily.delete(key);
      quotaCache.groq.hourly.delete(key);
      quotaCache.groq.daily.delete(key);
      quotaCache.firecrawl.monthly.delete(key);
      quotaCache.deepseek.monthly.delete(key);
      quotaCache.newsapi.daily.delete(key);
      break;
  }
}

/**
 * Get quota statistics for dashboard
 */
async function getQuotaStats(tenantId = null) {
  const quotas = getAllQuotas(tenantId);
  const now = Date.now();
  
  const stats = [];
  
  // Gemini
  const geminiUsage = quotas.gemini.hourly;
  const geminiPercentage = Math.round((geminiUsage.used / geminiUsage.limit) * 100);
  stats.push({
    name: 'Gemini',
    service: 'AI Analysis',
    used: geminiUsage.used,
    limit: geminiUsage.limit,
    percentage: geminiPercentage,
    resetTime: new Date(now + getTimeUntilReset('gemini', 'hourly')).toISOString(),
    status: geminiPercentage >= 90 ? 'critical' : geminiPercentage >= 70 ? 'warning' : 'healthy',
    trend: geminiPercentage >= 80 ? 'increasing' : 'stable',
    lastHour: geminiUsage.used,
    priority: 'critical'
  });
  
  // Groq
  const groqUsage = quotas.groq.daily;
  const groqPercentage = Math.round((groqUsage.used / groqUsage.limit) * 100);
  stats.push({
    name: 'Groq',
    service: 'AI Fallback',
    used: groqUsage.used,
    limit: groqUsage.limit,
    percentage: groqPercentage,
    resetTime: new Date(now + getTimeUntilReset('groq', 'daily')).toISOString(),
    status: groqPercentage >= 90 ? 'critical' : groqPercentage >= 70 ? 'warning' : 'healthy',
    trend: 'stable',
    lastHour: Math.min(groqUsage.used, 120),
    priority: 'critical'
  });
  
  // Firecrawl
  const firecrawlUsage = quotas.firecrawl.monthly;
  const firecrawlPercentage = Math.round((firecrawlUsage.used / firecrawlUsage.limit) * 100);
  stats.push({
    name: 'Firecrawl',
    service: 'Web Scraping',
    used: firecrawlUsage.used,
    limit: firecrawlUsage.limit,
    percentage: firecrawlPercentage,
    resetTime: new Date(now + getTimeUntilReset('firecrawl', 'monthly')).toISOString(),
    status: firecrawlPercentage >= 90 ? 'critical' : firecrawlPercentage >= 70 ? 'warning' : 'healthy',
    trend: firecrawlPercentage >= 70 ? 'increasing' : 'stable',
    lastHour: Math.min(firecrawlUsage.used, 15),
    priority: 'recommended'
  });
  
  // DeepSeek
  const deepseekUsage = quotas.deepseek.monthly;
  const deepseekPercentage = Math.round((deepseekUsage.used / deepseekUsage.limit) * 100);
  stats.push({
    name: 'DeepSeek',
    service: 'AI Backup',
    used: deepseekUsage.used,
    limit: deepseekUsage.limit,
    percentage: deepseekPercentage,
    resetTime: new Date(now + getTimeUntilReset('deepseek', 'monthly')).toISOString(),
    status: deepseekPercentage >= 90 ? 'critical' : deepseekPercentage >= 70 ? 'warning' : 'healthy',
    trend: 'stable',
    lastHour: 0,
    priority: 'recommended'
  });
  
  // NewsAPI
  const newsapiUsage = quotas.newsapi.daily;
  const newsapiPercentage = Math.round((newsapiUsage.used / newsapiUsage.limit) * 100);
  stats.push({
    name: 'NewsAPI',
    service: 'News',
    used: newsapiUsage.used,
    limit: newsapiUsage.limit,
    percentage: newsapiPercentage,
    resetTime: new Date(now + getTimeUntilReset('newsapi', 'daily')).toISOString(),
    status: newsapiPercentage >= 90 ? 'critical' : newsapiPercentage >= 70 ? 'warning' : 'healthy',
    trend: 'stable',
    lastHour: newsapiUsage.used,
    priority: 'optional'
  });
  
  return stats;
}

module.exports = {
  trackUsage,
  getUsage,
  getAllQuotas,
  hasQuotaAvailable,
  getTimeUntilReset,
  resetQuota,
  getQuotaStats,
  QUOTA_LIMITS
};
