# Testplan - DHL Lead Hunter
## Roll-Baserad Åtkomstkontroll

---

## 🌐 Subdomäner och Tenants

### Lokal Utveckling (localhost)
**URL:** `http://localhost:5173/`
- **Syfte:** Super Admin login
- **Färger:** Lila (#8B5CF6) / Gul (#FBBF24)
- **Branding:** "LSA" (Lead Sales Admin)
- **Användare:** Super Admin

### DHL Sweden Tenant
**URL:** `http://dhl-sweden.leadhunter.com:5173/` (kräver hosts-fil konfiguration)
- **Syfte:** DHL Sweden tenant login
- **Färger:** Röd (#D40511) / Gul (#FFCC00)
- **Branding:** "DHL"
- **Användare:** Tenant Admin, Manager, Terminal Chef, Säljare

---

## 👥 Test-Användare

### 1. 🔴 Super Admin
```
E-post: admin@leadhunter.com
Lösenord: LeadHunter2024!
Roll: Super Admin
Tenant: NULL (ingen tenant)
```

### 2. 🟡 Tenant Admin (DHL Sweden)
```
E-post: admin@dhl.se
Lösenord: TenantAdmin2024!
Roll: Tenant Admin
Tenant: DHL Sweden
```

### 3. 🟢 Manager (DHL Sweden)
```
E-post: manager@dhl.se
Lösenord: Manager2024!
Roll: Manager
Tenant: DHL Sweden
Team: sales@dhl.se, telesales@dhl.se
```

### 4. 🔵 Terminal Chef (Stockholm)
```
E-post: terminal@dhl.se
Lösenord: Terminal2024!
Roll: Terminal Manager
Tenant: DHL Sweden
Terminal: Stockholm (STO)
Postnummer: 100-129
```

### 5. 🟣 Säljare (Field Sales)
```
E-post: sales@dhl.se
Lösenord: Sales2024!
Roll: Field Sales (FS)
Tenant: DHL Sweden
Manager: manager@dhl.se
```

### 6. 🟣 Säljare (Telesales)
```
E-post: telesales@dhl.se
Lösenord: Sales2024!
Roll: Telesales (TS)
Tenant: DHL Sweden
Manager: manager@dhl.se
```

---

## 📊 Vad Ska Visas i Varje Vy

### 🔴 Super Admin Dashboard

**URL:** `localhost:5173` → Logga in → SuperAdminDashboard

**Vad ska visas:**
- ✅ Header: "Super Admin Dashboard"
- ✅ 3 stora snabblänkar:
  - 🟣 Hantera Tenants (lila)
  - 🔵 Hantera Användare (blå)
  - ⚫ System Inställningar (grå)
- ✅ 4 KPI-kort:
  - Aktiva Tenants (antal tenants med is_active=true)
  - Aktiva Användare (antal users med status='active')
  - Totalt Leads (antal leads i hela systemet)
  - Totalt Kunder (antal customers i hela systemet)
- ✅ Systemöversikt (kan vara tom om ingen data finns)

**Funktioner:**
- ✅ Klicka "Hantera Tenants" → TenantManagement
  - Se alla tenants
  - Skapa ny tenant
  - Redigera tenant
  - Ta bort tenant
- ✅ Klicka "Tillbaka till Dashboard" → Tillbaka till SuperAdminDashboard

**Vad ska INTE visas:**
- ❌ Tenant-specifik data
- ❌ Team-data
- ❌ Personliga leads

---

### 🟡 Tenant Admin Dashboard

**URL:** `localhost:5173` → Logga in som `admin@dhl.se` → TenantDashboard

**Vad ska visas:**
- ✅ Header: "DHL Sweden Dashboard" (eller tenant namn)
- ✅ KPI-kort för DHL Sweden:
  - Antal användare i DHL Sweden
  - Antal leads i DHL Sweden
  - Antal kunder i DHL Sweden
  - Konverteringsgrad för DHL Sweden
- ✅ Lead-lista filtrerad till DHL Sweden
- ✅ Kund-lista filtrerad till DHL Sweden
- ✅ Kan allokera leads till användare i DHL Sweden
- ✅ Kan hantera användare i DHL Sweden

**Funktioner:**
- ✅ Se alla leads i sin tenant
- ✅ Se alla kunder i sin tenant
- ✅ Allokera leads till användare i sin tenant
- ✅ Redigera sin egen tenant-info (vissa fält)

**Vad ska INTE visas:**
- ❌ Andra tenants data
- ❌ Super admin funktioner
- ❌ Systemöversikt

---

### 🟢 Manager Dashboard

**URL:** `localhost:5173` → Logga in som `manager@dhl.se` → ManagerDashboard

**Vad ska visas:**
- ✅ Header: "Team Manager Dashboard"
- ✅ Team-översikt:
  - Antal teammedlemmar (sales@dhl.se, telesales@dhl.se)
  - Totalt leads för teamet
  - Totalt kunder för teamet
  - Team-konverteringsgrad
- ✅ Lead-lista filtrerad till sitt team
- ✅ Kund-lista filtrerad till sitt team
- ✅ Team-prestanda
- ✅ Pipeline-status för teamet

**Funktioner:**
- ✅ Se sitt teams leads
- ✅ Se sitt teams kunder
- ✅ Allokera leads till sitt team
- ✅ Se team-statistik

**Vad ska INTE visas:**
- ❌ Andra teams data
- ❌ Hela tenantens data
- ❌ Andra managers teams

---

### 🔵 Terminal Chef Dashboard

**URL:** `localhost:5173` → Logga in som `terminal@dhl.se` → TerminalDashboard

**Vad ska visas:**
- ✅ Header: "Stockholm Terminal Dashboard"
- ✅ Terminal-översikt:
  - Terminal namn och kod (Stockholm - STO)
  - Antal leads på terminalen
  - Antal kunder på terminalen
  - Postnummer-områden (100-129)
- ✅ Lead-lista filtrerad till Stockholm-området
- ✅ Kund-lista filtrerad till Stockholm-området
- ✅ Säljare på terminalen

**Funktioner:**
- ✅ Se leads i sitt postnummer-område
- ✅ Se kunder i sitt postnummer-område
- ✅ Allokera leads till säljare på sin terminal
- ✅ Se terminal-statistik

**Vad ska INTE visas:**
- ❌ Andra terminalers data
- ❌ Leads utanför sitt postnummer-område
- ❌ Hela tenantens data

---

### 🟣 Säljare Dashboard

**URL:** `localhost:5173` → Logga in som `sales@dhl.se` → SalesDashboard

**Vad ska visas:**
- ✅ Header: "Min Dashboard" eller "Sales Dashboard"
- ✅ Personlig översikt:
  - Mina tilldelade leads
  - Mina kunder
  - Min konverteringsgrad
  - Min pipeline
- ✅ Lead-lista filtrerad till assigned_to = sales@dhl.se
- ✅ Kund-lista filtrerad till account_manager = sales@dhl.se
- ✅ Personliga mål och prestanda

**Funktioner:**
- ✅ Se ENDAST sina egna leads
- ✅ Se ENDAST sina egna kunder
- ✅ Uppdatera sina leads
- ✅ Uppdatera sina kunder

**Vad ska INTE visas:**
- ❌ Andra säljares leads
- ❌ Andra säljares kunder
- ❌ Team-översikt
- ❌ Allokerings-funktioner

---

## 🧪 Testscenarier

### Scenario 1: Super Admin - Skapa Tenant
1. Logga in på `localhost:5173` med `admin@leadhunter.com`
2. Klicka "Hantera Tenants"
3. Klicka "Skapa Tenant"
4. Fyll i:
   - Företagsnamn: "Schenker Sweden"
   - Domän: "schenker.se"
   - Subdomän: "schenker-sweden"
   - Sökterm: "Schenker"
   - Primär färg: #FF6B00 (orange)
   - Sekundär färg: #000000 (svart)
5. Klicka "Skapa"
6. **Förväntat resultat:** Ny tenant skapas och visas i listan

### Scenario 2: Tenant Admin - Se Endast Sin Data
1. Logga in på `localhost:5173` med `admin@dhl.se`
2. **Förväntat resultat:** 
   - Se TenantDashboard
   - Se endast DHL Sweden data
   - INTE se andra tenants
   - INTE se "Hantera Tenants" knapp

### Scenario 3: Manager - Se Endast Sitt Team
1. Logga in på `localhost:5173` med `manager@dhl.se`
2. Gå till Lead-lista
3. **Förväntat resultat:**
   - Se endast leads tilldelade till sales@dhl.se eller telesales@dhl.se
   - INTE se leads tilldelade till andra säljare
   - Kan allokera leads till sitt team

### Scenario 4: Terminal Chef - Se Endast Sin Terminal
1. Logga in på `localhost:5173` med `terminal@dhl.se`
2. Gå till Lead-lista
3. **Förväntat resultat:**
   - Se endast leads med postnummer 100-129 (Stockholm)
   - INTE se leads från andra postnummer
   - Kan allokera leads på sin terminal

### Scenario 5: Säljare - Se Endast Sina Leads
1. Logga in på `localhost:5173` med `sales@dhl.se`
2. Gå till Lead-lista
3. **Förväntat resultat:**
   - Se endast leads där assigned_to = sales@dhl.se
   - INTE se andra säljares leads
   - INTE se allokerings-knappar
   - Kan uppdatera sina egna leads

### Scenario 6: Säljare Försöker Komma Åt Annan Data
1. Logga in på `localhost:5173` med `sales@dhl.se`
2. Försök navigera till `/api/leads` direkt
3. **Förväntat resultat:**
   - Backend filtrerar automatiskt till endast egna leads
   - Kan INTE se andra säljares data även med direkta API-anrop

---

## 🔐 Säkerhetstester

### Test 1: Tenant Isolation
1. Logga in som `admin@dhl.se`
2. Försök hämta data från annan tenant via API
3. **Förväntat:** 403 Forbidden eller filtrerad data

### Test 2: Role Escalation
1. Logga in som `sales@dhl.se`
2. Försök allokera leads via API
3. **Förväntat:** 403 Forbidden

### Test 3: Cross-Team Access
1. Logga in som `manager@dhl.se`
2. Försök se leads från annat team
3. **Förväntat:** Filtrerad data, endast sitt team

---

## 📝 Checklista för Testning

### Super Admin
- [ ] Kan logga in på localhost
- [ ] Ser SuperAdminDashboard
- [ ] Kan klicka "Hantera Tenants"
- [ ] Kan skapa ny tenant
- [ ] Kan redigera tenant
- [ ] Kan ta bort tenant
- [ ] Ser alla tenants i listan
- [ ] KPI-kort visar korrekt data

### Tenant Admin
- [ ] Kan logga in
- [ ] Ser TenantDashboard
- [ ] Ser endast sin tenant-data
- [ ] Kan se alla användare i sin tenant
- [ ] Kan se alla leads i sin tenant
- [ ] Kan allokera leads i sin tenant
- [ ] Kan INTE se andra tenants

### Manager
- [ ] Kan logga in
- [ ] Ser ManagerDashboard
- [ ] Ser endast sitt teams data
- [ ] Ser teammedlemmar
- [ ] Kan allokera leads till sitt team
- [ ] Kan INTE se andra teams data

### Terminal Chef
- [ ] Kan logga in
- [ ] Ser TerminalDashboard
- [ ] Ser endast sin terminals data
- [ ] Ser postnummer-filtrerade leads
- [ ] Kan allokera leads på sin terminal
- [ ] Kan INTE se andra terminalers data

### Säljare
- [ ] Kan logga in
- [ ] Ser SalesDashboard
- [ ] Ser endast sina egna leads
- [ ] Ser endast sina egna kunder
- [ ] Kan uppdatera sina leads
- [ ] Kan INTE se andra säljares data
- [ ] Kan INTE allokera leads

---

## 🐛 Kända Problem att Testa

1. **WebSocket Warning** - Vite HMR kan visa varning, men påverkar inte funktionalitet
2. **Tom Databas** - Om inga leads finns, ska tomma listor visas (inte fel)
3. **Notifications** - Returnerar tom lista om tabellen är tom (normalt)
4. **Analytics** - Visar 0 om ingen data finns (normalt)

---

## 🚀 Snabbstart för Testning

1. **Starta servrar:**
   ```powershell
   # Terminal 1 - Backend
   cd server
   npm start

   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Öppna webbläsare:**
   - `http://localhost:5173/`

3. **Testa i ordning:**
   1. Super Admin → Skapa tenant
   2. Tenant Admin → Se tenant-data
   3. Manager → Se team-data
   4. Terminal Chef → Se terminal-data
   5. Säljare → Se personlig data

---

## 📞 Support

Om något inte fungerar:
1. Kontrollera att båda servrar körs
2. Kontrollera browser console för fel
3. Kontrollera backend logs
4. Verifiera att användare finns i databasen
5. Testa att rensa localStorage och logga in igen

---

**Lycka till med testningen! 🎉**
