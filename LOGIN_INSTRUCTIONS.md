# 🔐 Login Instructions - Multi-Tenant System

## ✅ System Status
- **Backend:** Running on http://localhost:3001
- **Frontend:** Running on http://localhost:5173
- **Database:** lead_hunter_mt (PostgreSQL)

---

## 👥 User Accounts

### 🔴 Super Admin (Leadhunter)
**Access:** http://localhost:5173
- **Email:** `admin@leadhunter.com`
- **Password:** `LeadHunter2024!`
- **Capabilities:**
  - See all tenants
  - Manage all tenants
  - Create/edit/delete tenants
  - System-wide administration
  - No tenant restrictions

---

### 🚚 DHL Freight Sweden Admin
**Access:** http://localhost:5173 (or dhl-sweden.leadhunter.com when deployed)
- **Email:** `admin@dhl.se`
- **Password:** `DHL2024!`
- **Tenant:** DHL Freight Sweden
- **Subdomain:** dhl-sweden
- **Capabilities:**
  - Manage DHL Freight users
  - Add sellers (FS, TS, KAM, DM)
  - Add managers (Manager TS, Manager FS-Norr/Mitt/Syd/Väst, Manager KAM-B2C/B2B)
  - Add terminal managers
  - Manage leads and customers for DHL Freight
  - Cannot see other tenants

---

### 📦 DHL Express Sweden Admin
**Access:** http://localhost:5173 (or dhl-express.leadhunter.com when deployed)
- **Email:** `admin@dhlexpress.se`
- **Password:** `DHLExpress2024!`
- **Tenant:** DHL Express Sweden
- **Subdomain:** dhl-express
- **Capabilities:**
  - Manage DHL Express users
  - Add sellers and managers
  - Manage leads and customers for DHL Express
  - Completely separate from DHL Freight

---

## 🏢 Available Tenants

1. **DHL Freight Sweden** - dhl-sweden.leadhunter.com
2. **DHL Express Sweden** - dhl-express.leadhunter.com
3. PostNord AB - postnord.leadhunter.com
4. Bring Parcels AB - bring.leadhunter.com
5. DB Schenker - schenker.leadhunter.com
6. Instabox AB - instabox.leadhunter.com
7. Budbee AB - budbee.leadhunter.com

---

## 🎨 Tenant-Specific Login

### How It Works:
- **localhost:5173** → Shows Super Admin login (Lead Hunter branding)
- **dhl-sweden.leadhunter.com** → Shows DHL Freight branding (red/yellow)
- **dhl-express.leadhunter.com** → Shows DHL Express branding (yellow/red)
- Each tenant gets their own colors, logo, and company name

### Login Page Features:
- ✅ Automatic tenant detection from subdomain
- ✅ Tenant-specific colors (primary/secondary)
- ✅ Tenant-specific logo (if uploaded)
- ✅ Tenant-specific company name
- ✅ Dynamic placeholder emails
- ✅ Branded buttons and accents

---

## 👤 User Roles & Capabilities

### Roles Available:
- **admin** - Tenant administrator (can manage users)
- **manager** - Manager for specific segments/areas
- **terminal_manager** - Terminal manager
- **fs** - Field Sales (FS-Norr, FS-Mitt, FS-Syd, FS-Väst)
- **ts** - Telesales
- **kam** - Key Account Manager (KAM-B2C, KAM-B2B-Norr, KAM-B2B-Syd)
- **dm** - District Manager

### User Management:
- ✅ Multiple admins per tenant (yes, supported)
- ✅ Assign regions and areas
- ✅ Assign postal codes
- ✅ Link to terminals
- ✅ Set different segments

---

## 🔧 Testing Steps

### 1. Test Super Admin Login
```
URL: http://localhost:5173
Email: admin@leadhunter.com
Password: LeadHunter2024!
```
**Expected:** Access to Tenant Management, see all 7 tenants

### 2. Test DHL Freight Admin Login
```
URL: http://localhost:5173
Email: admin@dhl.se
Password: DHL2024!
```
**Expected:** Access to DHL Freight dashboard, user management, can add sellers/managers

### 3. Test DHL Express Admin Login
```
URL: http://localhost:5173
Email: admin@dhlexpress.se
Password: DHLExpress2024!
```
**Expected:** Access to DHL Express dashboard, separate from DHL Freight

---

## 🚀 Next Steps

### To Add Users (as Tenant Admin):
1. Login as tenant admin (e.g., admin@dhl.se)
2. Go to User Management
3. Click "Add User"
4. Fill in:
   - Email
   - Password
   - Full Name
   - Role (fs, ts, kam, manager, terminal_manager, dm)
   - Regions (optional)
   - Postal Codes (optional)
   - Terminal (optional)

### Example Users to Create:
- **Manager TS:** manager-ts@dhl.se (role: manager)
- **Manager FS-Norr:** manager-fs-norr@dhl.se (role: manager, region: Norr)
- **Manager FS-Mitt:** manager-fs-mitt@dhl.se (role: manager, region: Mitt)
- **Manager FS-Syd:** manager-fs-syd@dhl.se (role: manager, region: Syd)
- **Manager FS-Väst:** manager-fs-vast@dhl.se (role: manager, region: Väst)
- **Manager KAM-B2C:** manager-kam-b2c@dhl.se (role: manager)
- **Manager KAM-B2B-Norr:** manager-kam-b2b-norr@dhl.se (role: manager, region: Norr)
- **Manager KAM-B2B-Syd:** manager-kam-b2b-syd@dhl.se (role: manager, region: Syd)
- **Säljare FS:** saljare-fs@dhl.se (role: fs)
- **Säljare TS:** saljare-ts@dhl.se (role: ts)
- **Säljare KAM:** saljare-kam@dhl.se (role: kam)
- **Terminalchef Stockholm:** terminalchef-sto@dhl.se (role: terminal_manager, terminal: STO)

---

## 🐛 Troubleshooting

### "Felaktiga inloggningsuppgifter"
- Check that you're using the correct email and password
- Verify the user exists in the database
- Check that user status is 'active'

### Backend Not Running
```bash
cd server
npm run dev
```

### Frontend Not Running
```bash
npm run dev
```

### Database Connection Issues
- Check .env file has correct DB_PASSWORD
- Verify PostgreSQL is running
- Confirm database 'lead_hunter_mt' exists

---

## 📝 Notes

- **Super Admin** has NO tenant_id (null) and is_super_admin = true
- **Tenant Admins** have tenant_id set and is_super_admin = false
- Each tenant is completely isolated from others
- Tenant-specific branding works via subdomain detection
- On localhost, always shows Super Admin login by default
