# 🔧 Vercel API Integration - SuperAdmin API Key Management

## Översikt

För att SuperAdmin ska kunna uppdatera API-nycklar direkt i Vercel behöver du:
1. Vercel API Token
2. Project ID
3. Team ID (om du använder team)

---

## 🔑 Steg 1: Skapa Vercel API Token

### 1. Gå till Vercel Settings
```
https://vercel.com/account/tokens
```

### 2. Skapa ny token
- Klicka **"Create Token"**
- Namn: `Lead Hunter API Management`
- Scope: **Full Access** (eller begränsa till specifikt projekt)
- Expiration: **No Expiration** (eller sätt datum)

### 3. Kopiera token
```
VERCEL_TOKEN=vercel_xxx...
```

⚠️ **VIKTIGT:** Spara token säkert - den visas bara en gång!

---

## 📋 Steg 2: Hämta Project ID

### Metod 1: Via Vercel Dashboard
1. Gå till ditt projekt: `https://vercel.com/[team]/[project]`
2. Settings → General
3. Kopiera **Project ID**

### Metod 2: Via CLI
```bash
cd c:\Users\A\Downloads\lead-hunter-v5.0
vercel link

# Visar project info
cat .vercel/project.json
```

Output:
```json
{
  "projectId": "prj_xxx...",
  "orgId": "team_xxx..."
}
```

---

## 🏢 Steg 3: Hämta Team ID (om applicable)

### Om du använder Vercel Team:
```bash
# Lista teams
vercel teams ls

# Output visar team ID
```

### Om du använder personal account:
Team ID = din user ID (börjar med `user_`)

---

## ⚙️ Steg 4: Lägg till i Vercel Environment Variables

### Via Vercel Dashboard:
1. Gå till: `Settings → Environment Variables`
2. Lägg till följande:

```bash
VERCEL_TOKEN = vercel_xxx...
VERCEL_PROJECT_ID = prj_xxx...
VERCEL_TEAM_ID = team_xxx...  # (optional, om du använder team)
```

### Via CLI:
```bash
vercel env add VERCEL_TOKEN
# Klistra in: vercel_xxx...

vercel env add VERCEL_PROJECT_ID
# Klistra in: prj_xxx...

vercel env add VERCEL_TEAM_ID
# Klistra in: team_xxx...
```

---

## 🔄 Steg 5: Testa Integration

### Test API Call (från backend):
```javascript
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

// Hämta alla env vars
const response = await fetch(
  `https://api.vercel.com/v9/projects/${PROJECT_ID}/env`,
  {
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log('Environment variables:', data);
```

### Uppdatera env var:
```javascript
// Uppdatera GEMINI_API_KEY
const response = await fetch(
  `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${ENV_ID}`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      value: 'new_api_key_value',
      target: ['production', 'preview']
    })
  }
);
```

---

## 📝 Steg 6: Backend Implementation

### Uppdatera `server/routes/admin.js`:

```javascript
// Funktion för att uppdatera Vercel env vars
async function updateVercelEnvVars(envVars) {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
  
  if (!VERCEL_TOKEN || !PROJECT_ID) {
    console.warn('Vercel credentials not configured');
    return false;
  }

  try {
    // 1. Hämta alla befintliga env vars
    const listResponse = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env`,
      {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`
        }
      }
    );
    
    const existingVars = await listResponse.json();
    
    // 2. Uppdatera varje env var
    for (const [key, value] of Object.entries(envVars)) {
      // Skippa maskerade värden
      if (value.includes('••••')) continue;
      
      // Hitta befintlig env var
      const existing = existingVars.envs?.find(e => e.key === key);
      
      if (existing) {
        // Uppdatera befintlig
        await fetch(
          `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${existing.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              value: value,
              target: ['production', 'preview', 'development']
            })
          }
        );
      } else {
        // Skapa ny
        await fetch(
          `https://api.vercel.com/v9/projects/${PROJECT_ID}/env`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: key,
              value: value,
              target: ['production', 'preview', 'development'],
              type: 'encrypted'
            })
          }
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update Vercel env vars:', error);
    return false;
  }
}
```

---

## 🔐 Säkerhet

### Best Practices:
1. ✅ **Använd encrypted env vars** i Vercel
2. ✅ **Begränsa token scope** till endast ditt projekt
3. ✅ **Sätt expiration** på tokens
4. ✅ **Logga alla ändringar** (audit log)
5. ✅ **Endast SuperAdmin** kan ändra API-nycklar

### Audit Logging:
```javascript
// Logga alla API key-ändringar
await query(
  `INSERT INTO audit_logs (user_id, action, details, ip_address)
   VALUES ($1, $2, $3, $4)`,
  [
    req.user.id,
    'update_api_keys',
    JSON.stringify({ keys: Object.keys(envVars) }),
    req.ip
  ]
);
```

---

## 🧪 Testing

### Test i Development:
```bash
# Sätt lokala env vars
export VERCEL_TOKEN=vercel_xxx...
export VERCEL_PROJECT_ID=prj_xxx...

# Starta server
npm run dev

# Testa API endpoint
curl -X POST http://localhost:3001/api/admin/env-vars \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"envVars": {"GEMINI_API_KEY": "new_key"}}'
```

### Test i Production:
1. Logga in som SuperAdmin
2. Gå till Settings → API Keys
3. Ändra en API-nyckel
4. Klicka "Spara"
5. Verifiera i Vercel Dashboard att värdet uppdaterades

---

## 📊 Monitoring

### Kolla Vercel API Usage:
```bash
# Via Vercel Dashboard
Settings → Usage → API Requests
```

### Rate Limits:
- **Free:** 100 requests/hour
- **Pro:** 1000 requests/hour
- **Enterprise:** Unlimited

---

## ❌ Troubleshooting

### Error: "Invalid token"
```bash
# Verifiera token
curl https://api.vercel.com/v2/user \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```

### Error: "Project not found"
```bash
# Verifiera project ID
vercel projects ls
```

### Error: "Insufficient permissions"
- Kontrollera att token har **Full Access**
- Eller lägg till specifika permissions för projektet

---

## 🔄 Deployment Workflow

### När API-nycklar ändras:
1. SuperAdmin ändrar nyckel i UI
2. Backend uppdaterar `.env` lokalt
3. Backend uppdaterar Vercel env vars via API
4. Vercel triggar automatisk re-deploy (optional)
5. Nya env vars är aktiva

### Trigger Re-deploy (optional):
```javascript
// Efter env var-uppdatering
await fetch(
  `https://api.vercel.com/v13/deployments`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: PROJECT_ID,
      target: 'production'
    })
  }
);
```

---

## ✅ Checklist

- [ ] Skapa Vercel API Token
- [ ] Hämta Project ID
- [ ] Hämta Team ID (om applicable)
- [ ] Lägg till env vars i Vercel:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_PROJECT_ID`
  - [ ] `VERCEL_TEAM_ID`
- [ ] Testa API integration lokalt
- [ ] Deploy till production
- [ ] Testa i production
- [ ] Sätt upp audit logging
- [ ] Dokumentera för team

---

## 📚 Resources

- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Environment Variables API](https://vercel.com/docs/rest-api/endpoints#environment-variables)
- [Authentication](https://vercel.com/docs/rest-api#authentication)

---

Vill du att jag hjälper dig sätta upp detta? 🚀
