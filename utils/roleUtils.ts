interface User {
  role: 'admin' | 'manager' | 'terminal_manager' | 'fs' | 'ts' | 'kam' | 'dm';
  tenant_id: string | null;
  isSuperAdmin?: boolean;
}

export const isSuperAdmin = (user: User | null): boolean => {
  // Check explicit isSuperAdmin flag first, then fallback to role + tenant_id check
  if (user?.isSuperAdmin === true) return true;
  return user?.role === 'admin' && user?.tenant_id === null;
};

export const isTenantAdmin = (user: User | null): boolean => {
  return user?.role === 'admin' && user?.tenant_id !== null;
};

export const isManager = (user: User | null): boolean => {
  return user?.role === 'manager';
};

export const isTerminalManager = (user: User | null): boolean => {
  return user?.role === 'terminal_manager';
};

export const isSalesRole = (user: User | null): boolean => {
  return user?.role === 'fs' || user?.role === 'ts' || user?.role === 'kam' || user?.role === 'dm';
};

export const getDashboardComponent = (user: User | null): string => {
  if (!user) return 'login';
  
  if (isSuperAdmin(user)) return 'super-admin';
  if (isTenantAdmin(user)) return 'tenant-admin';
  if (isManager(user)) return 'manager';
  if (isTerminalManager(user)) return 'terminal-manager';
  if (isSalesRole(user)) return 'sales';
  
  return 'default';
};

export const canAccessTenantManagement = (user: User | null): boolean => {
  return isSuperAdmin(user);
};

export const canAccessSystemSettings = (user: User | null): boolean => {
  return isSuperAdmin(user) || isTenantAdmin(user);
};

export const canManageUsers = (user: User | null): boolean => {
  return isSuperAdmin(user) || isTenantAdmin(user) || isManager(user);
};

export const canAccessAllLeads = (user: User | null): boolean => {
  return isSuperAdmin(user) || isTenantAdmin(user) || isManager(user);
};
