# Test-användare - DHL Lead Hunter

## Inloggningsuppgifter

### 🔴 Super Admin
- **E-post**: admin@leadhunter.com
- **Lösenord**: LeadHunter2024!
- **Roll**: Super Admin (ingen tenant)
- **Åtkomst**: Alla tenants, alla användare, alla leads

---

### 🟡 DHL Sweden Tenant Admin
- **E-post**: admin@dhl.se
- **Lösenord**: TenantAdmin2024!
- **Roll**: Tenant Admin
- **Tenant**: DHL Sweden
- **Åtkomst**: Alla leads och kunder inom DHL Sweden

---

### 🟢 Team Manager
- **E-post**: manager@dhl.se
- **Lösenord**: Manager2024!
- **Roll**: Manager
- **Tenant**: DHL Sweden
- **Åtkomst**: Sitt teams leads och kunder

---

### 🔵 Terminal Chef
- **E-post**: terminal@dhl.se
- **Lösenord**: Terminal2024!
- **Roll**: Terminal Manager
- **Tenant**: DHL Sweden
- **Terminal**: Stockholm (STO)
- **Åtkomst**: Leads och kunder i Stockholm-området (postnummer 100-129)

---

### 🟣 Säljare (Field Sales)
- **E-post**: sales@dhl.se
- **Lösenord**: Sales2024!
- **Roll**: Field Sales (FS)
- **Tenant**: DHL Sweden
- **Manager**: manager@dhl.se
- **Åtkomst**: Endast egna tilldelade leads och kunder

---

## Testa Olika Roller

### 1. Super Admin Test
```
Logga in som: admin@leadhunter.com
Förväntat resultat:
- Se SuperAdminDashboard
- Se alla tenants
- Kan skapa nya tenants
- Kan hantera alla användare
- Ser alla leads från alla tenants
```

### 2. Tenant Admin Test
```
Logga in som: admin@dhl.se
Förväntat resultat:
- Se TenantDashboard
- Se alla DHL Sweden leads
- Kan hantera DHL Sweden användare
- Kan allokera leads till DHL Sweden användare
- Kan INTE se andra tenants
```

### 3. Manager Test
```
Logga in som: manager@dhl.se
Förväntat resultat:
- Se ManagerDashboard
- Se sitt teams leads (sales@dhl.se)
- Kan allokera leads till sitt team
- Kan INTE se andra teams leads
```

### 4. Terminal Chef Test
```
Logga in som: terminal@dhl.se
Förväntat resultat:
- Se TerminalDashboard
- Se leads för Stockholm-området
- Kan allokera leads till säljare på sin terminal
- Kan INTE se andra terminalers leads
```

### 5. Säljare Test
```
Logga in som: sales@dhl.se
Förväntat resultat:
- Se SalesDashboard
- Se ENDAST sina egna tilldelade leads
- Kan uppdatera sina leads
- Kan INTE allokera leads
- Kan INTE se andra säljares leads
```

---

## Databas-struktur

### Tenant
```sql
ID: 11111111-1111-1111-1111-111111111111
Namn: DHL Sweden
Domain: dhl.se
Subdomain: dhl-sweden
```

### Användare
```sql
Super Admin:     admin@leadhunter.com (tenant_id = NULL)
Tenant Admin:    admin@dhl.se (tenant_id = DHL Sweden)
Manager:         manager@dhl.se (tenant_id = DHL Sweden)
Terminal Chef:   terminal@dhl.se (tenant_id = DHL Sweden, terminal_code = STO)
Säljare:         sales@dhl.se (tenant_id = DHL Sweden, manager_id = manager)
```

---

## Nästa Steg

1. **Starta backend och frontend**
   ```powershell
   # Terminal 1 - Backend
   cd server
   npm start

   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Testa varje roll**
   - Logga in med varje användare
   - Verifiera att rätt dashboard visas
   - Testa lead-filtrering
   - Testa lead-allokering

3. **Verifiera åtkomstkontroll**
   - Säljare ska INTE se andra säljares leads
   - Manager ska INTE se andra teams leads
   - Terminal chef ska INTE se andra terminalers leads
   - Tenant admin ska INTE se andra tenants leads
   - Super admin ska se ALLT

---

## Felsökning

### Problem: Fel dashboard visas
**Lösning**: Kontrollera att `tenant_id` är korrekt satt i databasen

### Problem: Ser för många/för få leads
**Lösning**: Kontrollera att permissions middleware är aktiverad i routes

### Problem: Kan inte allokera leads
**Lösning**: Kontrollera användarens roll och att `canAllocateLead` middleware fungerar

### Problem: Login fungerar inte
**Lösning**: Verifiera att lösenord-hashen är korrekt i databasen
