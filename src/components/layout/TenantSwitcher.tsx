import React, { useState } from 'react';
import { Building2, ChevronDown, Check, Shield } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { useAuth } from '../../contexts/AuthContext';

export const TenantSwitcher: React.FC = () => {
  const { user } = useAuth();
  const { activeTenant, switchToTenant, switchToSuperAdmin, availableTenants } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for super admins
  if (!user || user.tenant_id) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {activeTenant.isSuperAdminMode ? (
          <Shield className="w-4 h-4 text-purple-600" />
        ) : (
          <Building2 className="w-4 h-4 text-blue-600" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {activeTenant.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            {/* SuperAdmin Mode */}
            <button
              onClick={() => {
                switchToSuperAdmin();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                activeTenant.isSuperAdminMode ? 'bg-purple-50' : ''
              }`}
            >
              <Shield className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">SuperAdmin Mode</div>
                <div className="text-xs text-gray-500">Full system access</div>
              </div>
              {activeTenant.isSuperAdminMode && (
                <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
              )}
            </button>

            {/* Tenant List */}
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                Tenants
              </div>
              {availableTenants.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Inga tenants tillgängliga
                </div>
              ) : (
                availableTenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => {
                      switchToTenant(tenant.id, tenant.name);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                      activeTenant.id === tenant.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    </div>
                    {activeTenant.id === tenant.id && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
