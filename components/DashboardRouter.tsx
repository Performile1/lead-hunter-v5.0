import React from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { SuperAdminDashboard } from '../src/components/admin/SuperAdminDashboard';
import { SuperAdminHeader } from '../src/components/admin/SuperAdminHeader';
import { TenantDashboard } from '../src/components/admin/TenantDashboard';
import { ManagerDashboard } from '../src/components/managers/ManagerDashboard';
import { TerminalDashboard } from '../src/components/terminal/TerminalDashboard';
import { SalesDashboard } from '../src/components/sales/SalesDashboard';
import { Dashboard } from './Dashboard';
import { isSuperAdmin, isTenantAdmin, isManager, isTerminalManager, isSalesRole } from '../utils/roleUtils';
import { LeadData } from '../types';

interface DashboardRouterProps {
  leads: LeadData[];
  onNavigateToLeads: () => void;
  onNavigateToCustomers: () => void;
  onNavigateToCronjobs: () => void;
}

export const DashboardRouter: React.FC<DashboardRouterProps> = (props) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Super Admin - Full system access, tenant management
  if (isSuperAdmin(user)) {
    return <SuperAdminDashboard />;
  }

  // Tenant Admin - Tenant-specific admin dashboard
  if (isTenantAdmin(user)) {
    return <TenantDashboard />;
  }

  // Manager - Regional/team management
  if (isManager(user)) {
    return <ManagerDashboard leads={props.leads} />;
  }

  // Terminal Manager - Terminal-specific dashboard
  if (isTerminalManager(user)) {
    return <TerminalDashboard 
      terminalName={user.terminal_name || 'Unknown'}
      terminalCode={user.terminal_code || ''}
    />;
  }

  // Sales Roles (FS, TS, KAM, DM) - Sales-focused dashboard
  if (isSalesRole(user)) {
    return <SalesDashboard 
      leads={props.leads}
      onNavigateToLeads={props.onNavigateToLeads}
      onNavigateToCustomers={props.onNavigateToCustomers}
    />;
  }

  // Default fallback
  return <Dashboard {...props} />;
};
