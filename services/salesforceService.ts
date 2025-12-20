/**
 * Salesforce Service
 * Integration med Salesforce CRM
 * 
 * OBS: Kräver Salesforce Connected App och OAuth
 */

interface SalesforceAccount {
  Id: string;
  Name: string;
  Website?: string;
  Phone?: string;
  BillingStreet?: string;
  BillingCity?: string;
  BillingPostalCode?: string;
  Industry?: string;
  AnnualRevenue?: number;
  NumberOfEmployees?: number;
}

interface SalesforceContact {
  Id: string;
  FirstName: string;
  LastName: string;
  Title?: string;
  Email?: string;
  Phone?: string;
  AccountId: string;
}

interface SalesforceOpportunity {
  Id: string;
  Name: string;
  AccountId: string;
  Amount?: number;
  StageName: string;
  CloseDate: string;
  Probability?: number;
}

/**
 * Autentisera med Salesforce
 * @returns Access token
 */
async function authenticate(): Promise<string | null> {
  const clientId = import.meta.env.VITE_SALESFORCE_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SALESFORCE_CLIENT_SECRET;
  const username = import.meta.env.VITE_SALESFORCE_USERNAME;
  const password = import.meta.env.VITE_SALESFORCE_PASSWORD;
  const securityToken = import.meta.env.VITE_SALESFORCE_SECURITY_TOKEN;

  if (!clientId || !clientSecret || !username || !password) {
    console.warn('⚠️ Salesforce credentials not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: password + (securityToken || '')
    });

    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Salesforce auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;

  } catch (error) {
    console.error('Salesforce authentication failed:', error);
    return null;
  }
}

/**
 * Skapa Account i Salesforce
 * @param lead - Lead-data
 * @returns Salesforce Account ID
 */
export async function createAccount(lead: any): Promise<string | null> {
  const accessToken = await authenticate();
  if (!accessToken) return null;

  try {
    const instanceUrl = import.meta.env.VITE_SALESFORCE_INSTANCE_URL || 'https://yourinstance.salesforce.com';

    const accountData = {
      Name: lead.companyName || lead.company_name,
      Website: lead.websiteUrl || lead.website_url,
      Phone: lead.phoneNumber || lead.phone_number,
      BillingStreet: lead.address,
      BillingCity: lead.city,
      BillingPostalCode: lead.postalCode || lead.postal_code,
      Industry: 'Logistics',
      Description: `Lead från DHL Lead Hunter. Segment: ${lead.segment}`
    };

    const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accountData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create account: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Created Salesforce Account: ${data.id}`);
    return data.id;

  } catch (error) {
    console.error('Failed to create Salesforce account:', error);
    return null;
  }
}

/**
 * Skapa Contact i Salesforce
 * @param decisionMaker - Beslutsfattare
 * @param accountId - Salesforce Account ID
 * @returns Salesforce Contact ID
 */
export async function createContact(
  decisionMaker: any,
  accountId: string
): Promise<string | null> {
  const accessToken = await authenticate();
  if (!accessToken) return null;

  try {
    const instanceUrl = import.meta.env.VITE_SALESFORCE_INSTANCE_URL || 'https://yourinstance.salesforce.com';

    const nameParts = decisionMaker.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const contactData = {
      FirstName: firstName,
      LastName: lastName,
      Title: decisionMaker.title,
      Email: decisionMaker.email,
      Phone: decisionMaker.directPhone || decisionMaker.direct_phone,
      AccountId: accountId,
      Description: `Beslutsfattare från DHL Lead Hunter`
    };

    const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create contact: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Created Salesforce Contact: ${data.id}`);
    return data.id;

  } catch (error) {
    console.error('Failed to create Salesforce contact:', error);
    return null;
  }
}

/**
 * Skapa Opportunity i Salesforce
 * @param lead - Lead-data
 * @param accountId - Salesforce Account ID
 * @returns Salesforce Opportunity ID
 */
export async function createOpportunity(
  lead: any,
  accountId: string
): Promise<string | null> {
  const accessToken = await authenticate();
  if (!accessToken) return null;

  try {
    const instanceUrl = import.meta.env.VITE_SALESFORCE_INSTANCE_URL || 'https://yourinstance.salesforce.com';

    const opportunityData = {
      Name: `${lead.companyName || lead.company_name} - DHL Logistics`,
      AccountId: accountId,
      StageName: 'Prospecting',
      CloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 dagar
      Amount: lead.freightBudgetTkr ? lead.freightBudgetTkr * 1000 : null,
      Description: `Lead från DHL Lead Hunter. Segment: ${lead.segment}. Omsättning: ${lead.revenueTkr} TKR`
    };

    const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Opportunity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(opportunityData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create opportunity: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Created Salesforce Opportunity: ${data.id}`);
    return data.id;

  } catch (error) {
    console.error('Failed to create Salesforce opportunity:', error);
    return null;
  }
}

/**
 * Synka lead till Salesforce
 * @param lead - Lead-data med decision makers
 * @returns Salesforce IDs
 */
export async function syncLeadToSalesforce(lead: any): Promise<{
  accountId?: string;
  contactIds?: string[];
  opportunityId?: string;
} | null> {
  console.log(`🔄 Syncing lead to Salesforce: ${lead.companyName || lead.company_name}`);

  // 1. Skapa Account
  const accountId = await createAccount(lead);
  if (!accountId) {
    console.error('Failed to create account, aborting sync');
    return null;
  }

  const result: any = { accountId, contactIds: [] };

  // 2. Skapa Contacts för decision makers
  if (lead.decisionMakers && Array.isArray(lead.decisionMakers)) {
    for (const dm of lead.decisionMakers) {
      const contactId = await createContact(dm, accountId);
      if (contactId) {
        result.contactIds.push(contactId);
      }
    }
  }

  // 3. Skapa Opportunity
  const opportunityId = await createOpportunity(lead, accountId);
  if (opportunityId) {
    result.opportunityId = opportunityId;
  }

  console.log(`✅ Salesforce sync complete:`, result);
  return result;
}

/**
 * Sök Account i Salesforce
 * @param companyName - Företagsnamn
 * @returns Salesforce Account
 */
export async function searchAccount(companyName: string): Promise<SalesforceAccount | null> {
  const accessToken = await authenticate();
  if (!accessToken) return null;

  try {
    const instanceUrl = import.meta.env.VITE_SALESFORCE_INSTANCE_URL || 'https://yourinstance.salesforce.com';
    const query = `SELECT Id, Name, Website, Phone, BillingCity FROM Account WHERE Name LIKE '%${companyName}%' LIMIT 1`;
    
    const response = await fetch(
      `${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(query)}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search account: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records && data.records.length > 0 ? data.records[0] : null;

  } catch (error) {
    console.error('Failed to search Salesforce account:', error);
    return null;
  }
}

/**
 * Uppdatera Account i Salesforce
 * @param accountId - Salesforce Account ID
 * @param updates - Uppdateringar
 * @returns Success
 */
export async function updateAccount(accountId: string, updates: Partial<SalesforceAccount>): Promise<boolean> {
  const accessToken = await authenticate();
  if (!accessToken) return false;

  try {
    const instanceUrl = import.meta.env.VITE_SALESFORCE_INSTANCE_URL || 'https://yourinstance.salesforce.com';

    const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Account/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update account: ${response.statusText}`);
    }

    console.log(`✅ Updated Salesforce Account: ${accountId}`);
    return true;

  } catch (error) {
    console.error('Failed to update Salesforce account:', error);
    return false;
  }
}

export default {
  authenticate,
  createAccount,
  createContact,
  createOpportunity,
  syncLeadToSalesforce,
  searchAccount,
  updateAccount
};
