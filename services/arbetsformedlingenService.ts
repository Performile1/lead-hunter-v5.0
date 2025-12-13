/**
 * Arbetsförmedlingen API Service
 * 
 * GRATIS API för att hämta platsannonser från svenska företag.
 * Expansionssignal: Företag som rekryterar växer!
 * 
 * API Dokumentation: https://jobtechdev.se/docs/apis/jobsearch/
 * 
 * VÄRDE FÖR DHL:
 * - Rekrytering = Tillväxt = Ökad fraktvolym
 * - Nya logistikroller = Behov av transportlösningar
 * - Nya lagerroller = Behov av lagerlösningar
 * - Expansion = Opportunity för DHL
 */

import axios from 'axios';

const ARBETSFORMEDLINGEN_API = 'https://jobsearch.api.jobtechdev.se';

interface JobPosting {
  id: string;
  headline: string;
  employer: {
    name: string;
    organization_number?: string;
    workplace_address?: {
      municipality: string;
      region: string;
      country: string;
    };
  };
  occupation: {
    label: string;
  };
  occupation_field?: {
    label: string;
  };
  publication_date: string;
  application_deadline?: string;
  number_of_vacancies?: number;
  employment_type?: {
    label: string;
  };
  working_hours_type?: {
    label: string;
  };
  description?: {
    text: string;
    text_formatted?: string;
  };
}

interface JobSearchResult {
  total: {
    value: number;
  };
  hits: Array<{
    id: string;
    headline: string;
    employer: any;
    occupation: any;
    occupation_field?: any;
    publication_date: string;
    application_deadline?: string;
    number_of_vacancies?: number;
    employment_type?: any;
    working_hours_type?: any;
    description?: any;
  }>;
}

/**
 * Sök platsannonser för ett specifikt företag
 */
export async function searchJobsByCompany(
  companyName: string,
  orgNumber?: string
): Promise<JobPosting[]> {
  try {
    const params: any = {
      q: companyName,
      limit: 100,
      offset: 0
    };

    // Om vi har org.nummer, använd det för exakt matchning
    if (orgNumber) {
      params['employer-organization-number'] = orgNumber.replace('-', '');
    }

    const response = await axios.get<JobSearchResult>(`${ARBETSFORMEDLINGEN_API}/search`, {
      params,
      headers: {
        'Accept': 'application/json'
      }
    });

    return response.data.hits.map(hit => ({
      id: hit.id,
      headline: hit.headline,
      employer: hit.employer,
      occupation: hit.occupation,
      occupation_field: hit.occupation_field,
      publication_date: hit.publication_date,
      application_deadline: hit.application_deadline,
      number_of_vacancies: hit.number_of_vacancies,
      employment_type: hit.employment_type,
      working_hours_type: hit.working_hours_type,
      description: hit.description
    }));
  } catch (error) {
    console.error('Error fetching jobs from Arbetsförmedlingen:', error);
    return [];
  }
}

/**
 * Sök logistik-relaterade jobb (för att hitta nya företag)
 */
export async function searchLogisticsJobs(
  municipality?: string,
  limit: number = 100
): Promise<JobPosting[]> {
  try {
    const logisticsKeywords = [
      'logistik',
      'lager',
      'transport',
      'distribution',
      'supply chain',
      'inköp',
      'warehouse',
      'e-handel',
      'fulfillment'
    ];

    const allJobs: JobPosting[] = [];

    for (const keyword of logisticsKeywords) {
      const params: any = {
        q: keyword,
        limit: Math.min(limit, 100),
        offset: 0
      };

      if (municipality) {
        params.municipality = municipality;
      }

      const response = await axios.get<JobSearchResult>(`${ARBETSFORMEDLINGEN_API}/search`, {
        params,
        headers: {
          'Accept': 'application/json'
        }
      });

      allJobs.push(...response.data.hits.map(hit => ({
        id: hit.id,
        headline: hit.headline,
        employer: hit.employer,
        occupation: hit.occupation,
        occupation_field: hit.occupation_field,
        publication_date: hit.publication_date,
        application_deadline: hit.application_deadline,
        number_of_vacancies: hit.number_of_vacancies,
        employment_type: hit.employment_type,
        working_hours_type: hit.working_hours_type,
        description: hit.description
      })));
    }

    // Ta bort dubbletter
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => [job.id, job])).values()
    );

    return uniqueJobs.slice(0, limit);
  } catch (error) {
    console.error('Error searching logistics jobs:', error);
    return [];
  }
}

/**
 * Analysera om platsannonser indikerar expansion
 */
export function analyzeExpansionSignals(jobs: JobPosting[]): {
  is_expanding: boolean;
  expansion_score: number;
  signals: string[];
  job_count: number;
  logistics_roles: number;
  management_roles: number;
  recent_jobs: number;
} {
  const signals: string[] = [];
  let expansionScore = 0;

  // Antal jobb
  const jobCount = jobs.length;
  if (jobCount > 0) {
    signals.push(`${jobCount} aktiva platsannonser`);
    expansionScore += Math.min(jobCount * 5, 30); // Max 30 poäng
  }

  // Logistik-relaterade roller
  const logisticsKeywords = ['logistik', 'lager', 'transport', 'distribution', 'supply chain'];
  const logisticsRoles = jobs.filter(job =>
    logisticsKeywords.some(kw => 
      job.headline.toLowerCase().includes(kw) ||
      job.occupation.label.toLowerCase().includes(kw)
    )
  ).length;

  if (logisticsRoles > 0) {
    signals.push(`${logisticsRoles} logistik-roller`);
    expansionScore += logisticsRoles * 10; // 10 poäng per logistik-roll
  }

  // Management-roller (indikerar tillväxt)
  const managementKeywords = ['chef', 'manager', 'ledare', 'director', 'head of'];
  const managementRoles = jobs.filter(job =>
    managementKeywords.some(kw => job.headline.toLowerCase().includes(kw))
  ).length;

  if (managementRoles > 0) {
    signals.push(`${managementRoles} ledande roller`);
    expansionScore += managementRoles * 15; // 15 poäng per management-roll
  }

  // Nyligen publicerade (senaste 30 dagarna)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentJobs = jobs.filter(job => 
    new Date(job.publication_date) > thirtyDaysAgo
  ).length;

  if (recentJobs > 0) {
    signals.push(`${recentJobs} jobb publicerade senaste 30 dagarna`);
    expansionScore += recentJobs * 5;
  }

  // Många vakanser per annons (indikerar snabb expansion)
  const totalVacancies = jobs.reduce((sum, job) => 
    sum + (job.number_of_vacancies || 1), 0
  );

  if (totalVacancies > jobCount * 1.5) {
    signals.push(`${totalVacancies} totala vakanser (flera per annons)`);
    expansionScore += 20;
  }

  return {
    is_expanding: expansionScore >= 30,
    expansion_score: Math.min(expansionScore, 100),
    signals,
    job_count: jobCount,
    logistics_roles: logisticsRoles,
    management_roles: managementRoles,
    recent_jobs: recentJobs
  };
}

/**
 * Hämta och analysera jobb för ett lead
 */
export async function checkJobPostingsForLead(
  companyName: string,
  orgNumber?: string
): Promise<{
  jobs: JobPosting[];
  analysis: ReturnType<typeof analyzeExpansionSignals>;
  trigger_detected: boolean;
}> {
  const jobs = await searchJobsByCompany(companyName, orgNumber);
  const analysis = analyzeExpansionSignals(jobs);

  return {
    jobs,
    analysis,
    trigger_detected: analysis.is_expanding
  };
}

/**
 * Batch-kolla jobb för flera leads
 */
export async function batchCheckJobPostings(
  leads: Array<{ company_name: string; org_number?: string; id: string }>
): Promise<Array<{
  lead_id: string;
  company_name: string;
  job_count: number;
  expansion_score: number;
  trigger_detected: boolean;
}>> {
  const results = [];

  for (const lead of leads) {
    try {
      const { jobs, analysis } = await checkJobPostingsForLead(
        lead.company_name,
        lead.org_number
      );

      results.push({
        lead_id: lead.id,
        company_name: lead.company_name,
        job_count: analysis.job_count,
        expansion_score: analysis.expansion_score,
        trigger_detected: analysis.trigger_detected
      });

      // Rate limiting - vänta 100ms mellan requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error checking jobs for ${lead.company_name}:`, error);
    }
  }

  return results;
}

/**
 * Hitta nya potentiella leads via logistik-jobb
 */
export async function discoverLeadsFromJobs(
  municipality?: string
): Promise<Array<{
  company_name: string;
  org_number?: string;
  job_count: number;
  logistics_roles: number;
  source: string;
}>> {
  const jobs = await searchLogisticsJobs(municipality);

  // Gruppera per företag
  const companiesMap = new Map<string, JobPosting[]>();

  jobs.forEach(job => {
    const companyName = job.employer.name;
    if (!companiesMap.has(companyName)) {
      companiesMap.set(companyName, []);
    }
    companiesMap.get(companyName)!.push(job);
  });

  // Analysera varje företag
  const leads = [];

  for (const [companyName, companyJobs] of companiesMap) {
    const analysis = analyzeExpansionSignals(companyJobs);
    
    // Endast företag med logistik-roller
    if (analysis.logistics_roles > 0) {
      leads.push({
        company_name: companyName,
        org_number: companyJobs[0].employer.organization_number,
        job_count: analysis.job_count,
        logistics_roles: analysis.logistics_roles,
        source: 'arbetsformedlingen_logistics_jobs'
      });
    }
  }

  return leads.sort((a, b) => b.logistics_roles - a.logistics_roles);
}

/**
 * Formatera jobb för visning i UI
 */
export function formatJobForDisplay(job: JobPosting): {
  title: string;
  company: string;
  location: string;
  published: string;
  deadline?: string;
  vacancies: number;
  type: string;
  url: string;
} {
  return {
    title: job.headline,
    company: job.employer.name,
    location: job.employer.workplace_address?.municipality || 'Ej angivet',
    published: new Date(job.publication_date).toLocaleDateString('sv-SE'),
    deadline: job.application_deadline 
      ? new Date(job.application_deadline).toLocaleDateString('sv-SE')
      : undefined,
    vacancies: job.number_of_vacancies || 1,
    type: job.employment_type?.label || 'Ej angivet',
    url: `https://arbetsformedlingen.se/platsbanken/annonser/${job.id}`
  };
}

export default {
  searchJobsByCompany,
  searchLogisticsJobs,
  analyzeExpansionSignals,
  checkJobPostingsForLead,
  batchCheckJobPostings,
  discoverLeadsFromJobs,
  formatJobForDisplay
};
