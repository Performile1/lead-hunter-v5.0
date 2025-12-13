# Roller och Behörigheter - DHL Lead Hunter

## Rollöversikt

### 🔴 Super Admin (`admin` + `tenant_id = NULL`)
**Full systemåtkomst över alla tenants**

#### Åtkomst:
- ✅ Ser ALLA leads från ALLA tenants
- ✅ Ser ALLA kunder från ALLA tenants
- ✅ Ser ALLA användare från ALLA tenants
- ✅ Full systemstatistik och analytics

#### Behörigheter:
- ✅ Skapa, redigera och radera tenants
- ✅ Skapa, redigera och radera användare i alla tenants
- ✅ Allokera leads till vilken användare som helst
- ✅ Konfigurera systeminställningar
- ✅ Hantera API-nycklar och integrationer
- ✅ Se alla audit logs

#### Dashboard:
- SuperAdminDashboard med tenant-hantering
- Systemöversikt och hälsa
- Global analytics

---

### 🟡 Tenant Admin (`admin` + `tenant_id != NULL`)
**Full åtkomst inom sin tenant/organisation**

#### Åtkomst:
- ✅ Ser ALLA leads inom sin tenant
- ✅ Ser ALLA kunder inom sin tenant
- ✅ Ser ALLA användare inom sin tenant
- ✅ Tenant-specifik statistik

#### Behörigheter:
- ✅ Skapa, redigera och radera användare inom sin tenant
- ✅ Allokera leads till användare inom sin tenant
- ✅ Konfigurera tenant-inställningar (färger, logo, etc.)
- ✅ Hantera team och områden
- ✅ Se tenant audit logs
- ❌ Kan INTE se andra tenants data
- ❌ Kan INTE hantera system-inställningar

#### Dashboard:
- TenantDashboard med företagsöversikt
- Team performance
- Tenant-specifik analytics

---

### 🟢 Manager (`manager`)
**Team/regional ledare**

#### Åtkomst:
- ✅ Ser leads för sitt team/område
- ✅ Ser kunder för sitt team
- ✅ Ser sina teammedlemmars performance
- ❌ Kan INTE se andra teams data

#### Behörigheter:
- ✅ Allokera leads till sina teammedlemmar
- ✅ Hantera sina teammedlemmar
- ✅ Godkänna/avvisa lead-konverteringar
- ✅ Se team-statistik
- ❌ Kan INTE skapa nya användare
- ❌ Kan INTE se andra managers teams

#### Dashboard:
- ManagerDashboard med team-översikt
- Team pipeline och performance
- Individual performance tracking

---

### 🔵 Terminal Chef (`terminal_manager`)
**Ansvarig för en specifik terminal/geografiskt område**

#### Åtkomst:
- ✅ Ser leads för sin terminal/postnummer
- ✅ Ser kunder inom sitt område
- ✅ Ser säljare på sin terminal
- ❌ Kan INTE se andra terminalers data

#### Behörigheter:
- ✅ Allokera leads till säljare på sin terminal
- ✅ Hantera säljare på sin terminal
- ✅ Se terminal-statistik
- ❌ Kan INTE skapa nya användare
- ❌ Kan INTE se andra terminaler

#### Dashboard:
- TerminalDashboard med terminal-översikt
- Postnummer/område-statistik
- Säljare på terminalen

---

### 🟣 Säljare (`fs`, `ts`, `kam`, `dm`)
**Individuella säljroller**

#### Roller:
- **FS** (Field Sales) - Fältsäljare
- **TS** (Telesales) - Telefonsäljare
- **KAM** (Key Account Manager) - Nyckelkundsansvarig
- **DM** (District Manager) - Distriktsansvarig

#### Åtkomst:
- ✅ Ser ENDAST sina egna tilldelade leads
- ✅ Ser ENDAST sina egna kunder
- ❌ Kan INTE se andra säljares leads
- ❌ Kan INTE se team-statistik

#### Behörigheter:
- ✅ Uppdatera status på sina leads
- ✅ Konvertera leads till kunder
- ✅ Hantera sina kundrelationer
- ✅ Lägga till anteckningar och aktiviteter
- ❌ Kan INTE allokera leads
- ❌ Kan INTE se andra säljares data

#### Dashboard:
- SalesDashboard med personlig översikt
- Egen pipeline
- Egna mål och KPI:er

---

## Lead Allokering

### Vem kan allokera leads?

| Roll | Kan allokera till | Begränsningar |
|------|-------------------|---------------|
| Super Admin | Alla användare | Ingen |
| Tenant Admin | Användare inom sin tenant | Endast egen tenant |
| Manager | Sitt team | Endast teammedlemmar |
| Terminal Chef | Säljare på sin terminal | Endast egen terminal |
| Säljare | - | Kan INTE allokera |

---

## Data Filtrering

### Leads
```javascript
// Super Admin
WHERE 1=1  // Ser allt

// Tenant Admin
WHERE tenant_id = user.tenant_id

// Manager
WHERE assigned_to IN (team_user_ids)

// Terminal Chef
WHERE postal_code_prefix IN (terminal_postal_codes)

// Säljare
WHERE assigned_to = user.id
```

### Kunder
```javascript
// Super Admin
WHERE 1=1  // Ser allt

// Tenant Admin
WHERE tenant_id = user.tenant_id

// Manager
WHERE account_manager_id IN (team_user_ids)

// Terminal Chef
WHERE postal_code_prefix IN (terminal_postal_codes)

// Säljare
WHERE account_manager_id = user.id
```

---

## API Endpoints och Behörigheter

### Tenant Management
- `GET /api/tenants` - Super Admin only
- `POST /api/tenants` - Super Admin only
- `PUT /api/tenants/:id` - Super Admin only
- `DELETE /api/tenants/:id` - Super Admin only

### User Management
- `GET /api/users` - Admin, Manager (filtrerat)
- `POST /api/users` - Super Admin, Tenant Admin
- `PUT /api/users/:id` - Admin, Manager (eget team)
- `DELETE /api/users/:id` - Super Admin, Tenant Admin

### Leads
- `GET /api/leads` - Alla (filtrerat per roll)
- `POST /api/leads` - Alla
- `PUT /api/leads/:id` - Ägare eller högre
- `DELETE /api/leads/:id` - Admin only
- `POST /api/leads/:id/assign` - Admin, Manager, Terminal Chef

### Customers
- `GET /api/customers` - Alla (filtrerat per roll)
- `POST /api/customers` - Alla
- `PUT /api/customers/:id` - Account manager eller högre
- `DELETE /api/customers/:id` - Admin only

---

## Implementering

### Backend Middleware
```javascript
import { 
  requireSuperAdmin,
  requireAdmin,
  requireManagerOrHigher,
  filterLeadsByPermission,
  filterCustomersByPermission,
  canAllocateLead
} from './middleware/permissions.js';

// Exempel användning
router.get('/api/leads', 
  authenticate, 
  filterLeadsByPermission, 
  getLeads
);

router.post('/api/leads/:id/assign',
  authenticate,
  canAllocateLead,
  assignLead
);
```

### Frontend Routing
```typescript
import { DashboardRouter } from './components/DashboardRouter';

// Väljer automatiskt rätt dashboard baserat på roll
<DashboardRouter 
  leads={leads}
  onNavigateToLeads={...}
  onNavigateToCustomers={...}
/>
```

---

## Säkerhet

### Principer
1. **Least Privilege** - Användare får endast åtkomst till vad de behöver
2. **Role-Based Access Control (RBAC)** - Behörigheter baseras på roll
3. **Multi-Tenancy** - Tenant-isolering för datasäkerhet
4. **Audit Logging** - Alla känsliga operationer loggas

### Validering
- Backend validerar ALLTID behörigheter
- Frontend döljer UI-element baserat på roll (men förlitar sig INTE på detta för säkerhet)
- Alla API-anrop kräver autentisering
- JWT tokens innehåller roll och tenant_id

---

## Testning

### Test-användare
```sql
-- Super Admin
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
VALUES ('admin@leadhunter.com', '$2b$10$...', 'Super Admin', 'admin', NULL);

-- Tenant Admin (DHL Sweden)
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
VALUES ('admin@dhl.se', '$2b$10$...', 'DHL Admin', 'admin', '<dhl_tenant_id>');

-- Manager
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
VALUES ('manager@dhl.se', '$2b$10$...', 'Team Manager', 'manager', '<dhl_tenant_id>');

-- Terminal Chef
INSERT INTO users (email, password_hash, full_name, role, tenant_id, terminal_code)
VALUES ('terminal@dhl.se', '$2b$10$...', 'Terminal Chef', 'terminal_manager', '<dhl_tenant_id>', 'STO');

-- Säljare
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
VALUES ('sales@dhl.se', '$2b$10$...', 'Säljare', 'fs', '<dhl_tenant_id>');
```
