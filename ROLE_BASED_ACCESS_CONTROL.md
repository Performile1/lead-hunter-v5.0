# Roll-Baserad Åtkomstkontroll - DHL Lead Hunter

## Översikt

Systemet implementerar komplett roll- och tenant-baserad åtkomstkontroll där varje användare ser endast den data de har behörighet till.

---

## Roller och Åtkomst

### 🔴 Super Admin (tenant_id = NULL)
**Åtkomst:**
- ✅ Alla tenants
- ✅ Alla användare i alla tenants
- ✅ Alla leads från alla tenants
- ✅ Alla kunder från alla tenants
- ✅ Systemöversikt och analytics
- ✅ Skapa/redigera/radera tenants
- ✅ Skapa/redigera/radera användare i alla tenants

**Dashboard:** `SuperAdminDashboard`
**Endpoints:**
- GET /api/tenants - Alla tenants
- GET /api/users - Alla användare
- GET /api/leads - Alla leads (filtreras av permissions middleware)
- GET /api/analytics/overview - Systemöversikt

---

### 🟡 Tenant Admin (role = 'admin', tenant_id = X)
**Åtkomst:**
- ✅ Sin egen tenant
- ✅ Alla användare i sin tenant
- ✅ Alla leads i sin tenant
- ✅ Alla kunder i sin tenant
- ✅ Kan allokera leads till användare i sin tenant
- ❌ Kan INTE se andra tenants
- ❌ Kan INTE skapa nya tenants

**Dashboard:** `TenantDashboard`
**Endpoints:**
- GET /api/tenants/:id - Endast sin egen tenant
- GET /api/users?tenant_id=X - Användare i sin tenant
- GET /api/leads - Filtreras till sin tenant
- GET /api/customers - Filtreras till sin tenant

---

### 🟢 Manager (role = 'manager', tenant_id = X)
**Åtkomst:**
- ✅ Sitt team (användare med manager_id = sin egen ID)
- ✅ Sitt teams leads
- ✅ Sitt teams kunder
- ✅ Kan allokera leads till sitt team
- ❌ Kan INTE se andra teams data
- ❌ Kan INTE se hela tenantens data

**Dashboard:** `ManagerDashboard`
**Endpoints:**
- GET /api/users?manager_id=X - Sitt team
- GET /api/leads - Filtreras till sitt team
- GET /api/customers - Filtreras till sitt team

---

### 🔵 Terminal Manager (role = 'terminal_manager', tenant_id = X, terminal_code = Y)
**Åtkomst:**
- ✅ Sin terminals leads (baserat på postnummer)
- ✅ Sin terminals kunder
- ✅ Användare på sin terminal
- ✅ Kan allokera leads på sin terminal
- ❌ Kan INTE se andra terminalers data

**Dashboard:** `TerminalDashboard`
**Endpoints:**
- GET /api/leads - Filtreras till sin terminal
- GET /api/customers - Filtreras till sin terminal
- GET /api/users?terminal_code=Y - Användare på sin terminal

---

### 🟣 Säljare (role = 'fs'|'ts'|'kam'|'dm', tenant_id = X, manager_id = Y)
**Åtkomst:**
- ✅ ENDAST sina egna tilldelade leads
- ✅ ENDAST sina egna kunder
- ❌ Kan INTE se andra säljares leads
- ❌ Kan INTE allokera leads
- ❌ Kan INTE se team-översikt

**Dashboard:** `SalesDashboard`
**Endpoints:**
- GET /api/leads - Filtreras till assigned_to = sin egen ID
- GET /api/customers - Filtreras till account_manager = sin egen ID

---

## Backend Middleware

### authenticate (middleware/auth.js)
```javascript
// Sätter req.user, req.userId, req.isSuperAdmin
req.isSuperAdmin = user.role === 'admin' && !user.tenant_id;
```

### filterLeadsByPermission (middleware/permissions.js)
```javascript
// Super Admin: Alla leads
// Tenant Admin: Tenant leads
// Manager: Team leads
// Terminal Manager: Terminal leads
// Säljare: Egna leads
```

### filterCustomersByPermission (middleware/permissions.js)
```javascript
// Super Admin: Alla kunder
// Tenant Admin: Tenant kunder
// Manager: Team kunder
// Terminal Manager: Terminal kunder
// Säljare: Egna kunder
```

### canAllocateLead (middleware/permissions.js)
```javascript
// Super Admin: ✅ Kan allokera till vem som helst
// Tenant Admin: ✅ Kan allokera inom sin tenant
// Manager: ✅ Kan allokera till sitt team
// Terminal Manager: ✅ Kan allokera på sin terminal
// Säljare: ❌ Kan INTE allokera
```

---

## Frontend Komponenter

### DashboardRouter (components/DashboardRouter.tsx)
Väljer rätt dashboard baserat på `user.role` och `user.tenant_id`:

```typescript
if (isSuperAdmin(user)) return <SuperAdminDashboard />;
if (isTenantAdmin(user)) return <TenantDashboard />;
if (isManager(user)) return <ManagerDashboard />;
if (isTerminalManager(user)) return <TerminalDashboard />;
if (isSalesRole(user)) return <SalesDashboard />;
```

### TenantManagement (src/components/admin/TenantManagement.tsx)
- **Super Admin:** Ser alla tenants, kan skapa/redigera/radera
- **Tenant Admin:** Ser endast sin egen tenant, kan redigera vissa fält
- **Andra roller:** Ingen åtkomst

### UserManagement (kommer snart)
- **Super Admin:** Alla användare i alla tenants
- **Tenant Admin:** Användare i sin tenant
- **Manager:** Sitt team
- **Andra roller:** Ingen åtkomst

---

## API Endpoints med Åtkomstkontroll

### /api/tenants
| Endpoint | Super Admin | Tenant Admin | Manager | Terminal | Sales |
|----------|-------------|--------------|---------|----------|-------|
| GET / | ✅ Alla | ✅ Sin egen | ❌ | ❌ | ❌ |
| GET /:id | ✅ Alla | ✅ Sin egen | ❌ | ❌ | ❌ |
| POST / | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT /:id | ✅ Alla fält | ✅ Vissa fält | ❌ | ❌ | ❌ |
| DELETE /:id | ✅ | ❌ | ❌ | ❌ | ❌ |

### /api/leads
| Endpoint | Super Admin | Tenant Admin | Manager | Terminal | Sales |
|----------|-------------|--------------|---------|----------|-------|
| GET / | ✅ Alla | ✅ Tenant | ✅ Team | ✅ Terminal | ✅ Egna |
| POST / | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT /:id | ✅ | ✅ Tenant | ✅ Team | ✅ Terminal | ✅ Egna |
| DELETE /:id | ✅ | ✅ Tenant | ❌ | ❌ | ❌ |

### /api/customers
| Endpoint | Super Admin | Tenant Admin | Manager | Terminal | Sales |
|----------|-------------|--------------|---------|----------|-------|
| GET / | ✅ Alla | ✅ Tenant | ✅ Team | ✅ Terminal | ✅ Egna |
| POST / | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT /:id | ✅ | ✅ Tenant | ✅ Team | ✅ Terminal | ✅ Egna |
| DELETE /:id | ✅ | ✅ Tenant | ❌ | ❌ | ❌ |

### /api/analytics
| Endpoint | Super Admin | Tenant Admin | Manager | Terminal | Sales |
|----------|-------------|--------------|---------|----------|-------|
| GET /overview | ✅ System | ❌ | ❌ | ❌ | ❌ |
| GET /platforms | ✅ Alla | ✅ Tenant | ❌ | ❌ | ❌ |
| GET /carriers | ✅ Alla | ✅ Tenant | ❌ | ❌ | ❌ |

---

## Test-Användare

| Roll | E-post | Lösenord | Tenant | Åtkomst |
|------|--------|----------|--------|---------|
| Super Admin | admin@leadhunter.com | LeadHunter2024! | NULL | ALLT |
| Tenant Admin | admin@dhl.se | TenantAdmin2024! | DHL Sweden | DHL Sweden |
| Manager | manager@dhl.se | Manager2024! | DHL Sweden | Sitt team |
| Terminal Chef | terminal@dhl.se | Terminal2024! | DHL Sweden | Stockholm |
| Säljare | sales@dhl.se | Sales2024! | DHL Sweden | Egna leads |

---

## Implementering

### Backend
1. ✅ `authenticate` middleware sätter `req.isSuperAdmin`
2. ✅ `filterLeadsByPermission` filtrerar leads baserat på roll
3. ✅ `filterCustomersByPermission` filtrerar kunder baserat på roll
4. ✅ `canAllocateLead` validerar lead-allokering
5. ✅ Alla routes använder korrekt middleware

### Frontend
1. ✅ `DashboardRouter` väljer rätt dashboard
2. ✅ `roleUtils.ts` helper-funktioner
3. ✅ `TenantManagement` med roll-baserad åtkomst
4. ✅ Alla dashboards tar emot rätt props
5. ✅ AuthContext sparar komplett användardata

### Databas
1. ✅ `users.tenant_id` - Kopplar användare till tenant
2. ✅ `users.manager_id` - Kopplar säljare till manager
3. ✅ `users.terminal_code` - Kopplar terminal manager till terminal
4. ✅ `leads.tenant_id` - Kopplar leads till tenant
5. ✅ `customers.tenant_id` - Kopplar kunder till tenant

---

## Säkerhet

### Principer
1. **Least Privilege** - Användare ser endast vad de behöver
2. **Defense in Depth** - Kontroller både i frontend och backend
3. **Explicit Deny** - Allt är förbjudet tills det explicit tillåts
4. **Audit Trail** - Alla ändringar loggas med användar-ID

### Validering
- ✅ Backend validerar ALLA requests
- ✅ Frontend visar endast tillåtna actions
- ✅ Middleware filtrerar data före response
- ✅ SQL queries använder parametriserade queries

---

## Nästa Steg

1. ⏳ Skapa UserManagement med roll-baserad filtrering
2. ⏳ Implementera lead-allokering med permissions
3. ⏳ Testa alla roller end-to-end
4. ⏳ Lägg till audit logging för alla CRUD-operationer
5. ⏳ Implementera rate limiting per tenant
