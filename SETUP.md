# Crystal Core - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

The dependencies should already be installing. If not, run:

```bash
npm install firebase firebase-admin googleapis zod class-variance-authority clsx tailwind-merge lucide-react
```

### 2. Setup Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google provider
4. Get your Firebase config:
   - Go to Project Settings → General
   - Under "Your apps", add a Web app
   - Copy the config values

### 3. Setup Firebase Admin (Service Account)

1. In Firebase Console: Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. You'll use values from this file in `.env.local`

### 4. Setup Google Sheets API

You already have the Spreadsheet ID: `1F9w3epWrsACJNGAm2i_bs-1VnIQ0dMIisP8eHWqAJhA`

**Option A: Use same service account as Firebase Admin**
- Use the same credentials from step 3

**Option B: Create separate service account**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sheets API
3. Create Service Account
4. Download JSON key

**IMPORTANT:** Share your Google Sheet with the service account email!
- Open your Sheet
- Click Share
- Add service account email (e.g., `your-service@project.iam.gserviceaccount.com`)
- Give "Editor" access

### 5. Create `.env.local` File

Create a file named `.env.local` in the project root:

```env
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Firebase Admin (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Google Sheets API
GOOGLE_SHEETS_SPREADSHEET_ID=1F9w3epWrsACJNGAm2i_bs-1VnIQ0dMIisP8eHWqAJhA
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**IMPORTANT:** 
- Replace all `your_*` placeholders with actual values
- The private key should be wrapped in quotes and include `\n` for newlines
- Never commit `.env.local` to Git (it's already in `.gitignore`)

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📋 First-Time Setup Checklist

### Before Running the App

- [ ] Firebase project created
- [ ] Google Auth enabled in Firebase
- [ ] Firebase web app created and config copied
- [ ] Service account created and JSON downloaded
- [ ] Google Sheets API enabled
- [ ] Google Sheet shared with service account email
- [ ] `.env.local` file created with all values
- [ ] Dependencies installed (`npm install`)

### After Running the App

- [ ] Navigate to `/login`
- [ ] Click "Sign in with Google"
- [ ] Verify redirect to `/dashboard`
- [ ] Check that user was created in USERS sheet
- [ ] Assign SUPER_ADMIN role to your user in Google Sheets

---

## 🔧 Assigning Your First Admin Role

After logging in for the first time:

1. Open your Google Sheet: `USERS` tab
2. Find your user (by email)
3. Copy your `user_id`

4. Go to `ROLES` tab
5. Find the `SUPER_ADMIN` role
6. Copy the `role_id`

7. Go to `ROLE_ASSIGNMENTS` tab
8. Add a new row:
   ```
   assignment_id: <generate UUID at uuidgenerator.net>
   user_id: <your user_id from step 3>
   role_id: <SUPER_ADMIN role_id from step 6>
   site_code: (leave blank)
   assigned_by: SYSTEM
   assigned_at: 2026-01-20T16:30:00Z
   expires_at: (leave blank)
   is_active: TRUE
   ```

9. Go to `PERMISSIONS` tab
10. Add a new row to give SUPER_ADMIN access to all modules:
    ```
    permission_id: <generate UUID>
    role_id: <SUPER_ADMIN role_id>
    module_code: *
    action: *
    resource: *
    conditions: {}
    is_active: TRUE
    created_at: 2026-01-20T16:30:00Z
    updated_at: 2026-01-20T16:30:00Z
    ```

11. Refresh the dashboard - you should now see all modules!

---

## 🧪 Testing the Platform

### Test Authentication
- [ ] Login with Google works
- [ ] User created in USERS sheet
- [ ] Logout works
- [ ] Redirect to login when not authenticated

### Test RBAC
- [ ] Assign SUPER_ADMIN role
- [ ] Dashboard shows modules
- [ ] API `/api/permissions` returns permissions
- [ ] API `/api/roles` returns roles

### Test Sheets Integration
- [ ] User data syncs to Sheets
- [ ] Role assignments work
- [ ] Modules load from Sheets
- [ ] Permissions resolve correctly

---

## 🚨 Troubleshooting

### "Firebase configuration is incomplete"
- Check `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` variables
- Restart dev server after adding env vars

### "Google Sheets credentials not configured"
- Check `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- Ensure private key includes `\n` characters and is wrapped in quotes

### "Failed to fetch modules" or empty dashboard
- Check that you've assigned a role to your user
- Check that the role has permissions in PERMISSIONS sheet
- Check browser console for errors

### "Circuit breaker is OPEN"
- Sheets API quota exhausted or too many failures
- Wait 1 minute for circuit breaker to reset
- Check Sheets API is enabled in Google Cloud Console

### Login works but no modules show
- Assign SUPER_ADMIN role (see "Assigning Your First Admin Role" above)
- Add wildcard permission (`*` for module_code, action, resource)
- Clear permission cache (restart server)

---

## 📁 Project Structure

```
crystal-core/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── me/           # User profile
│   │   ├── roles/        # User roles
│   │   ├── permissions/  # User permissions
│   │   └── modules/      # Accessible modules
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home (redirects)
├── components/
│   ├── auth/             # Auth components
│   └── dashboard/        # Dashboard components
├── lib/
│   ├── auth/             # Auth abstraction layer
│   │   ├── providers/    # Auth providers (Firebase, custom)
│   │   ├── index.ts      # Auth interface
│   │   ├── types.ts      # Auth types
│   │   └── session.ts    # Session management
│   ├── data/             # Data abstraction layer
│   │   ├── sheets.ts     # Sheets adapter
│   │   ├── index.ts      # Data service
│   │   └── types.ts      # Data types
│   ├── rbac/             # RBAC engine
│   │   ├── permissions.ts # Permission resolver
│   │   ├── roles.ts      # Role management
│   │   └── types.ts      # RBAC types
│   ├── sheets/           # Sheets API client
│   │   ├── client.ts     # API client
│   │   └── config.ts     # Configuration
│   └── utils.ts          # Utilities
├── docs/
│   ├── Rules.mdc         # Engineering rules
│   └── schema-setup.gs   # Sheets schema script
├── .env.example          # Example env vars
├── .env.local            # Your env vars (create this!)
└── package.json
```

---

## 🔄 Next Steps

After the platform is running:

1. **Add More Users**
   - They can login with Google
   - Assign roles in ROLE_ASSIGNMENTS sheet

2. **Create Modules**
   - Add rows to MODULES sheet
   - Create Next.js pages for each module
   - Add permissions for who can access

3. **Build First Module**
   - HR, WMS, or Procurement
   - Follow the modular architecture
   - Use RBAC for access control

4. **Setup Logging**
   - Transaction logs already work
   - Add system logging for errors
   - Monitor TRANSACTION_LOG sheet

5. **Migrate to Database** (when needed)
   - Create PostgreSQL schema
   - Build DB adapter (`/lib/data/db.ts`)
   - Swap in `/lib/data/index.ts`
   - No other code changes needed!

---

## 📞 Need Help?

Check the implementation plan for detailed architecture decisions and migration paths.

**Common Issues:**
- Auth not working → Check Firebase config
- Sheets not loading → Check service account permissions
- No modules showing → Assign roles and permissions
- Circuit breaker open → Wait 60 seconds, check API quota
