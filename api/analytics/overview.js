import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's tenant_id and role
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch analytics data
    const [
      { count: totalLeads },
      { count: totalCustomers },
      { count: totalUsers },
      { data: recentLeads }
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tenant_id', userData.tenant_id),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', userData.tenant_id),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('tenant_id', userData.tenant_id),
      supabase.from('leads').select('*').eq('tenant_id', userData.tenant_id).order('created_at', { ascending: false }).limit(10)
    ]);

    const overview = {
      totalLeads: totalLeads || 0,
      totalCustomers: totalCustomers || 0,
      totalUsers: totalUsers || 0,
      recentLeads: recentLeads || [],
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(overview);
  } catch (error) {
    console.error('Analytics overview API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
