# 🏢 Multi-User System Implementation Guide

## Översikt

Detta dokument beskriver implementeringen av ett komplett multi-user system för DHL Lead Hunter med:
- ✅ Användarautentisering och roller
- ✅ Centraliserad PostgreSQL-databas
- ✅ Admin-panel för inställningar
- ✅ Områdesbegränsningar per användare
- ✅ Aktivitetsloggning
- ✅ Delad exkluderingslista
- ✅ API-kostnadsuppföljning

---

## Arkitektur

```
┌─────────────────────────────────────────────────┐
│           FRONTEND (React + TypeScript)         │
│  - Login/Logout                                 │
│  - Rollbaserad UI                               │
│  - Admin-panel                                  │
│  - Lead-sökning med områdesfilter               │
└─────────────────┬───────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────┐
│           BACKEND (Node.js + Express)           │
│  - JWT Autentisering                            │
│  - Rollbaserad åtkomstkontroll                  │
│  - API Routes                                   │
│  - LLM Orchestration                            │
└─────────────────┬───────────────────────────────┘
                  │ SQL
┌─────────────────▼───────────────────────────────┐
│           DATABASE (PostgreSQL)                 │
│  - Users & Roles                                │
│  - Leads & Decision Makers                      │
│  - Exclusions (delad)                           │
│  - Activity Log                                 │
│  - API Usage & Costs                            │
└─────────────────────────────────────────────────┘
```

---

## Roller & Behörigheter

### 🔴 Admin
- Fullständig åtkomst
- Hantera användare
- Konfigurera LLM:er
- Se all statistik
- Inga områdesbegränsningar

### 🟠 Manager
- Se all data
- Hantera team-medlemmar
- Exportera rapporter
- Konfigurera team-inställningar

### 🟢 FS (Field Sales)
- Söka leads i tilldelade områden
- Ladda ner leads
- Lägga till exkluderingar
- Se egen statistik

### 🔵 TS (Telesales)
- Söka leads i tilldelade områden
- Ladda ner leads
- Lägga till exkluderingar
- Se egen statistik

### 🟣 KAM (Key Account Manager)
- Söka stora konton (>100 MSEK)
- Nationell åtkomst
- Exportera detaljerad data

### ⚪ DM (Direct Mail)
- Söka små konton (<5 MSEK)
- Begränsad export
- Endast grundläggande data

---

## Installation

### 1. Installera PostgreSQL

**Windows:**
```powershell
# Ladda ner från https://www.postgresql.org/download/windows/
# Eller via Chocolatey:
choco install postgresql

# Starta PostgreSQL service
net start postgresql-x64-15
```

**Skapa databas:**
```sql
CREATE DATABASE dhl_lead_hunter;
CREATE USER dhl_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;
```

### 2. Kör Database Schema

```bash
cd server
psql -U postgres -d dhl_lead_hunter -f ../DATABASE_SCHEMA.sql
```

### 3. Installera Backend Dependencies

```bash
cd server
npm install
```

### 4. Konfigurera Environment

```bash
# Kopiera exempel-fil
copy .env.example .env

# Redigera .env med dina värden
```

### 5. Starta Backend

```bash
npm run dev
```

Backend körs nu på `http://localhost:3001`

### 6. Uppdatera Frontend

Frontend behöver uppdateras för att använda backend API istället för localStorage.

---

## API Endpoints

### Autentisering

#### POST /api/auth/login
```json
{
  "email": "user@dhl.se",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@dhl.se",
    "full_name": "John Doe",
    "role": "fs",
    "regions": ["Västra Götaland", "Halland"]
  }
}
```

#### POST /api/auth/register (Admin only)
```json
{
  "email": "newuser@dhl.se",
  "password": "password123",
  "full_name": "Jane Doe",
  "role": "fs",
  "regions": ["Stockholm", "Uppsala"]
}
```

#### POST /api/auth/logout
Headers: `Authorization: Bearer <token>`

---

### Leads

#### GET /api/leads
Hämta alla leads (filtrerat baserat på användarens regioner)

**Query params:**
- `segment`: TS, FS, KAM, DM
- `region`: Filtrera på region
- `limit`: Max antal resultat
- `offset`: För paginering

**Response:**
```json
{
  "leads": [...],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

#### POST /api/leads
Skapa ny lead (manuellt)

#### PUT /api/leads/:id
Uppdatera lead

#### DELETE /api/leads/:id
Radera lead (Admin only)

---

### Sök

#### POST /api/search
Utför lead-sökning

```json
{
  "geoArea": "Göteborg",
  "financialScope": "FS",
  "leadCount": 10,
  "triggers": "expansion",
  "batchMode": "deep"
}
```

**Response:**
```json
{
  "leads": [...],
  "cached": 3,
  "new": 7,
  "cost_usd": 0.15,
  "duration_ms": 5234
}
```

---

### Exkluderingar

#### GET /api/exclusions
Hämta alla exkluderingar (delad lista)

#### POST /api/exclusions
Lägg till exkludering

```json
{
  "company_name": "Företag AB",
  "org_number": "556016-0680",
  "reason": "existing_customer",
  "notes": "Befintlig kund sedan 2020"
}
```

#### DELETE /api/exclusions/:id
Ta bort exkludering (Admin only)

---

### Admin

#### GET /api/admin/users
Lista alla användare

#### PUT /api/admin/users/:id
Uppdatera användare

#### DELETE /api/admin/users/:id
Radera användare

#### GET /api/admin/settings
Hämta systeminställningar

#### PUT /api/admin/settings
Uppdatera inställningar

```json
{
  "max_leads_per_search": 50,
  "cache_ttl_days": 30,
  "enable_auto_backup": true
}
```

#### GET /api/admin/llm-configs
Hämta LLM-konfigurationer

#### PUT /api/admin/llm-configs/:id
Uppdatera LLM-konfiguration

```json
{
  "provider": "groq",
  "model_name": "llama-3.1-70b-versatile",
  "is_enabled": true,
  "priority": 90,
  "api_key": "gsk_...",
  "use_for": "fallback,batch"
}
```

---

### Statistik

#### GET /api/stats/user
Egen statistik

**Response:**
```json
{
  "leads_created": 150,
  "searches_count": 45,
  "downloads_count": 12,
  "total_cost_usd": 5.67,
  "last_7_days": {
    "searches": 8,
    "leads": 35
  }
}
```

#### GET /api/stats/team (Manager/Admin)
Team-statistik

#### GET /api/stats/costs (Admin)
API-kostnader

```json
{
  "total_cost_usd": 234.56,
  "by_provider": {
    "gemini": 123.45,
    "groq": 0.00,
    "openai": 111.11
  },
  "by_user": [...]
}
```

---

## Frontend Integration

### 1. Skapa Auth Context

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  regions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  canAccessRegion: (region: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Ladda token från localStorage
    const savedToken = localStorage.getItem('dhl_auth_token');
    const savedUser = localStorage.getItem('dhl_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    
    localStorage.setItem('dhl_auth_token', data.token);
    localStorage.setItem('dhl_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dhl_auth_token');
    localStorage.removeItem('dhl_user');
  };

  const hasRole = (role: string) => {
    return user?.role === role || user?.role === 'admin';
  };

  const canAccessRegion = (region: string) => {
    if (user?.role === 'admin' || user?.role === 'manager') return true;
    return user?.regions?.includes(region) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      hasRole,
      canAccessRegion
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. Skapa API Client

```typescript
// services/apiClient.ts
const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('dhl_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### 3. Uppdatera App.tsx

```typescript
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    // Din befintliga app
  );
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
```

---

## Admin-Panel Komponenter

### AdminSettings.tsx

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [llmConfigs, setLlmConfigs] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadLLMConfigs();
  }, []);

  const loadSettings = async () => {
    const data = await apiClient.get('/admin/settings');
    setSettings(data);
  };

  const loadLLMConfigs = async () => {
    const data = await apiClient.get('/admin/llm-configs');
    setLlmConfigs(data);
  };

  const updateSetting = async (key: string, value: any) => {
    await apiClient.put('/admin/settings', { [key]: value });
    await loadSettings();
  };

  const toggleLLM = async (id: string, enabled: boolean) => {
    await apiClient.put(`/admin/llm-configs/${id}`, { is_enabled: enabled });
    await loadLLMConfigs();
  };

  return (
    <div className="admin-settings">
      <h2>System-inställningar</h2>
      
      {/* Allmänna inställningar */}
      <section>
        <h3>Allmänt</h3>
        <label>
          Max leads per sökning:
          <input 
            type="number" 
            value={settings.max_leads_per_search || 50}
            onChange={(e) => updateSetting('max_leads_per_search', e.target.value)}
          />
        </label>
        
        <label>
          Cache TTL (dagar):
          <input 
            type="number" 
            value={settings.cache_ttl_days || 30}
            onChange={(e) => updateSetting('cache_ttl_days', e.target.value)}
          />
        </label>
      </section>

      {/* LLM-konfiguration */}
      <section>
        <h3>LLM-providers</h3>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Modell</th>
              <th>Aktiverad</th>
              <th>Prioritet</th>
              <th>Kostnad/1M tokens</th>
              <th>Användning</th>
            </tr>
          </thead>
          <tbody>
            {llmConfigs.map(config => (
              <tr key={config.id}>
                <td>{config.provider}</td>
                <td>{config.model_name}</td>
                <td>
                  <input 
                    type="checkbox" 
                    checked={config.is_enabled}
                    onChange={(e) => toggleLLM(config.id, e.target.checked)}
                  />
                </td>
                <td>{config.priority}</td>
                <td>${config.cost_per_1m_tokens}</td>
                <td>{config.use_for}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
```

---

## Områdesbegränsningar

### Implementering i Sökning

```typescript
// I InputForm.tsx eller SearchComponent.tsx
const { user, canAccessRegion } = useAuth();

const handleSearch = async (formData: SearchFormData) => {
  // Kontrollera om användaren har åtkomst till området
  if (!canAccessRegion(formData.geoArea)) {
    alert(`Du har inte åtkomst till området: ${formData.geoArea}`);
    return;
  }

  // Utför sökning via API
  const results = await apiClient.post('/search', formData);
  setLeads(results.leads);
};

// Visa endast tillåtna områden i dropdown
const availableRegions = user?.role === 'admin' 
  ? ALL_REGIONS 
  : user?.regions || [];
```

---

## Aktivitetsloggning

Backend loggar automatiskt alla aktiviteter:

```typescript
// Exempel från backend
async function logActivity(userId, actionType, entityType, entityId, details) {
  await query(`
    INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [userId, actionType, entityType, entityId, JSON.stringify(details), req.ip]);
}

// Användning
await logActivity(req.user.id, 'search', 'lead', null, { 
  geoArea: 'Göteborg', 
  segment: 'FS',
  results: 10 
});
```

---

## Nästa Steg

### Fas 1: Backend Setup (1-2 dagar)
1. ✅ Installera PostgreSQL
2. ✅ Kör database schema
3. ✅ Installera backend dependencies
4. ✅ Konfigurera .env
5. ✅ Starta backend server

### Fas 2: Frontend Integration (2-3 dagar)
1. Skapa AuthContext
2. Skapa LoginPage
3. Uppdatera App.tsx
4. Skapa API client
5. Migrera localStorage till API-anrop

### Fas 3: Admin-panel (1-2 dagar)
1. Skapa AdminSettings komponent
2. Skapa UserManagement komponent
3. Skapa LLMConfig komponent
4. Skapa Statistics dashboard

### Fas 4: Testing & Deploy (1-2 dagar)
1. Testa alla roller
2. Testa områdesbegränsningar
3. Testa API-endpoints
4. Deploy till produktion

---

## Säkerhet

### JWT Tokens
- Tokens är giltiga i 7 dagar (konfigurerbart)
- Tokens innehåller användar-ID och roll
- Tokens valideras på varje API-anrop

### Lösenord
- Hashade med bcrypt (10 rounds)
- Minst 8 tecken krävs
- Lösenordsåterställning via email (TODO)

### API-nycklar
- Krypterade i databasen
- Endast admin kan se/ändra
- Roteras automatiskt var 90:e dag (TODO)

### Rate Limiting
- 100 requests per 15 minuter per IP
- Högre gränser för autentiserade användare
- Blockering vid misstänkt aktivitet

---

## Kostnadsuppföljning

Systemet loggar automatiskt alla API-anrop och kostnader:

```sql
SELECT 
  u.full_name,
  SUM(a.cost_usd) as total_cost,
  COUNT(*) as request_count,
  a.provider
FROM api_usage a
JOIN users u ON u.id = a.user_id
WHERE a.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.full_name, a.provider
ORDER BY total_cost DESC;
```

---

## Support

**Frågor?** Kontakta systemadministratören eller se:
- `DATABASE_SCHEMA.sql` - Databas-struktur
- `server/` - Backend-kod
- API-dokumentation ovan

🎉 **Lycka till med implementeringen!**
