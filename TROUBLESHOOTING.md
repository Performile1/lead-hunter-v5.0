# Troubleshooting Guide

## White Screen Issue During Search

### Problem
Sidan blir helt vit när man söker, trots att quota inte borde vara slut.

### Möjliga Orsaker

1. **JavaScript-fel som inte fångas upp**
   - Kontrollera browser console (F12) för fel
   - Leta efter `Uncaught Error` eller `TypeError`

2. **React rendering-fel**
   - Komponenten kraschar men Error Boundary saknas
   - State blir korrupt och orskar render-loop

3. **API-fel som inte hanteras korrekt**
   - Fel från Gemini/Groq returnerar oväntad data
   - JSON parsing misslyckas

### Felsökning

#### Steg 1: Kontrollera Browser Console
Öppna Developer Tools (F12) och leta efter:
```
Uncaught Error
TypeError: Cannot read property
SyntaxError: Unexpected token
```

#### Steg 2: Kontrollera Network Tab
- Finns det misslyckade API-anrop?
- Returnerar API:erna 500/503/429?
- Är response-formatet korrekt JSON?

#### Steg 3: Kontrollera LocalStorage
```javascript
// Kör i console
localStorage.getItem('dhl_active_leads')
localStorage.getItem('dhl_api_call_count')
```

Om data är korrupt, rensa:
```javascript
localStorage.clear()
location.reload()
```

### Lösningar

#### Lägg till Error Boundary
Skapa `components/ErrorBoundary.tsx`:
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Något gick fel
            </h1>
            <p className="text-gray-700 mb-4">
              {this.state.error?.message || 'Ett oväntat fel uppstod'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Ladda om sidan
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Wrappa sedan App i ErrorBoundary i `main.tsx`:
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

#### Förbättra Felhantering i App.tsx

Lägg till try-catch runt render:
```typescript
try {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Existing JSX */}
    </div>
  );
} catch (error) {
  console.error('Render error:', error);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Fel vid rendering</h1>
        <button onClick={() => window.location.reload()}>
          Ladda om
        </button>
      </div>
    </div>
  );
}
```

#### Säkrare API-anrop

I `geminiService.ts`, lägg till bättre felhantering:
```typescript
try {
  const response = await generateWithRetry(...);
  
  // Validera response
  if (!response || !response.text) {
    throw new Error('Tomt svar från API');
  }
  
  // Validera JSON
  const json = extractJSON(response.text);
  if (!json || json.length === 0) {
    throw new Error('Kunde inte tolka JSON från API');
  }
  
  return json;
} catch (error) {
  // Logga detaljerat
  console.error('API Error Details:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Kasta vidare med tydligt meddelande
  throw new Error(`API-fel: ${error.message}`);
}
```

### Quota-hantering

Kontrollera att quota-meddelanden visas korrekt:

1. **QuotaTimer-komponenten** ska visas när `quotaError` är true
2. **RateLimitOverlay** ska visas när `rateLimitError` är true
3. **Error-meddelande** ska alltid visas i röd box

Om dessa inte visas, kontrollera att state sätts korrekt:
```typescript
catch (err: any) {
  console.error('Search error:', err);
  
  // Sätt error state
  setError(err.message || 'Ett fel uppstod');
  
  // Sätt quota state om relevant
  if (err.message.includes('QUOTA_EXHAUSTED')) {
    setQuotaError(true);
  }
  
  // Visa alltid något för användaren
  if (!err.message) {
    setError('Ett okänt fel uppstod. Försök igen.');
  }
}
```

### Preventiva Åtgärder

1. **Lägg till logging**
```typescript
// I början av handleSearch
console.log('🔍 Starting search:', formData);

// Vid varje viktigt steg
console.log('✅ Step 1 complete');
console.log('✅ Step 2 complete');

// Vid fel
console.error('❌ Error at step X:', error);
```

2. **Validera input**
```typescript
const handleSearch = async (formData: SearchFormData) => {
  // Validera input
  if (!formData.companyNameOrOrg) {
    setError('Företagsnamn krävs');
    return;
  }
  
  // Fortsätt med sökning...
};
```

3. **Timeout för API-anrop**
```typescript
const timeout = (ms: number) => 
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  );

try {
  const result = await Promise.race([
    generateLeads(formData),
    timeout(60000) // 60 sekunder
  ]);
} catch (error) {
  if (error.message === 'Timeout') {
    setError('Sökningen tog för lång tid. Försök igen.');
  }
}
```

## Andra Vanliga Problem

### Problem: "API_BASE_URL is not defined"
**Lösning**: Kontrollera att import finns:
```typescript
import { API_BASE_URL } from '../../utils/api';
```

### Problem: Groq model deprecated
**Lösning**: Uppdatera till `llama-3.3-70b-versatile` i `groqService.ts`

### Problem: Algolia not indexing
**Lösning**: Kontrollera API-nycklar i `.env`:
```
VITE_ALGOLIA_APP_ID=your_app_id
VITE_ALGOLIA_API_KEY=your_api_key
```

### Problem: Slow performance
**Lösningar**:
- Aktivera Algolia för snabbare sökning
- Använd Groq istället för Gemini (snabbare)
- Aktivera caching i browser
- Minska antal parallella API-anrop

## Support

Om problemet kvarstår:
1. Exportera browser console logs
2. Kontrollera Network tab för API-fel
3. Kolla LocalStorage för korrupt data
4. Testa i inkognito-läge (rensar cache/storage)
