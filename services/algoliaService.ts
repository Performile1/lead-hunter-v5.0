/**
 * Algolia Search Service
 * Fast search indexing and retrieval for leads and customers
 */

import algoliasearch from 'algoliasearch';
import { LeadData } from '../types';

const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID || '';
const ALGOLIA_API_KEY = import.meta.env.VITE_ALGOLIA_API_KEY || '';
const ALGOLIA_INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'leads';

let algoliaClient: ReturnType<typeof algoliasearch> | null = null;
let algoliaIndex: any = null;

/**
 * Initialize Algolia client
 */
function getAlgoliaClient() {
  if (!algoliaClient && ALGOLIA_APP_ID && ALGOLIA_API_KEY) {
    algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
    algoliaIndex = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);
  }
  return { client: algoliaClient, index: algoliaIndex };
}

/**
 * Check if Algolia is available
 */
export function isAlgoliaAvailable(): boolean {
  return !!(ALGOLIA_APP_ID && ALGOLIA_API_KEY);
}

/**
 * Index a lead in Algolia for fast searching
 */
export async function indexLead(lead: LeadData): Promise<void> {
  if (!isAlgoliaAvailable()) {
    console.warn('Algolia not configured, skipping indexing');
    return;
  }

  try {
    const { index } = getAlgoliaClient();
    if (!index) return;

    await index.saveObject({
      objectID: lead.id,
      companyName: lead.companyName,
      orgNumber: lead.orgNumber,
      segment: lead.segment,
      revenue: lead.revenue,
      ecommercePlatform: lead.ecommercePlatform,
      carriers: lead.carriers,
      websiteUrl: lead.websiteUrl,
      decisionMakers: lead.decisionMakers.map(dm => ({
        name: dm.name,
        title: dm.title,
        email: dm.email
      })),
      analysisDate: lead.analysisDate,
      _tags: [lead.segment, lead.ecommercePlatform].filter(Boolean)
    });

    console.log(`✅ Indexed lead in Algolia: ${lead.companyName}`);
  } catch (error) {
    console.error('Algolia indexing error:', error);
  }
}

/**
 * Search leads in Algolia
 */
export async function searchLeads(query: string, filters?: {
  segment?: string;
  platform?: string;
}): Promise<any[]> {
  if (!isAlgoliaAvailable()) {
    console.warn('Algolia not configured');
    return [];
  }

  try {
    const { index } = getAlgoliaClient();
    if (!index) return [];

    let filterString = '';
    if (filters?.segment) filterString += `segment:${filters.segment}`;
    if (filters?.platform) {
      if (filterString) filterString += ' AND ';
      filterString += `ecommercePlatform:${filters.platform}`;
    }

    const result = await index.search(query, {
      filters: filterString,
      hitsPerPage: 50
    });

    return result.hits;
  } catch (error) {
    console.error('Algolia search error:', error);
    return [];
  }
}

/**
 * Batch index multiple leads
 */
export async function batchIndexLeads(leads: LeadData[]): Promise<void> {
  if (!isAlgoliaAvailable()) return;

  try {
    const { index } = getAlgoliaClient();
    if (!index) return;

    const objects = leads.map(lead => ({
      objectID: lead.id,
      companyName: lead.companyName,
      orgNumber: lead.orgNumber,
      segment: lead.segment,
      revenue: lead.revenue,
      ecommercePlatform: lead.ecommercePlatform,
      carriers: lead.carriers,
      websiteUrl: lead.websiteUrl,
      analysisDate: lead.analysisDate,
      _tags: [lead.segment, lead.ecommercePlatform].filter(Boolean)
    }));

    await index.saveObjects(objects);
    console.log(`✅ Batch indexed ${leads.length} leads in Algolia`);
  } catch (error) {
    console.error('Algolia batch indexing error:', error);
  }
}

/**
 * Delete a lead from Algolia index
 */
export async function deleteLeadFromIndex(leadId: string): Promise<void> {
  if (!isAlgoliaAvailable()) return;

  try {
    const { index } = getAlgoliaClient();
    if (!index) return;

    await index.deleteObject(leadId);
    console.log(`✅ Deleted lead from Algolia: ${leadId}`);
  } catch (error) {
    console.error('Algolia delete error:', error);
  }
}
