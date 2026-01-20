# Crystal Core

Internal Operations Platform with RBAC, modular architecture, and Google Sheets integration.

## Features

- 🔐 **Firebase Auth** with Google OAuth (migration-ready to custom auth)
- 🛡️ **RBAC Engine** with permission caching and fail-closed security
- 📊 **Google Sheets Integration** with circuit breaker and retry logic
- 🧩 **Modular Architecture** - add modules without code changes
- 🔄 **Data Abstraction** - migrate from Sheets → DB seamlessly
- 📝 **Transaction Logging** - audit trail from day one

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Firebase & Google Sheets:**
   - See [SETUP.md](./SETUP.md) for detailed instructions

3. **Create `.env.local`:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run the app:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[implementation_plan.md](./.gemini/antigravity/brain/.../implementation_plan.md)** - Architecture decisions
- **[docs/Rules.mdc](./docs/Rules.mdc)** - Engineering principles

## Architecture

### Auth Abstraction
```typescript
// App code uses generic interface
import { signIn, signOut } from '@/lib/auth'

// Provider can be swapped (Firebase → Custom)
// No code changes needed in components/pages
```

### Data Abstraction
```typescript
// App code uses generic interface
import { dataService } from '@/lib/data'

// Adapter can be swapped (Sheets → PostgreSQL)
// No code changes needed in API routes
```

### RBAC
```typescript
// Permission checking
const canCreate = await hasPermission(userId, 'HR', 'create', 'candidate')

// Module access
const modules = await getUserModules(userId)
```

## Project Structure

```
crystal-core/
├── app/              # Next.js app (pages, API routes)
├── components/       # React components
├── lib/
│   ├── auth/        # Auth abstraction (Firebase provider)
│   ├── data/        # Data abstraction (Sheets adapter)
│   ├── rbac/        # Permission engine
│   └── sheets/      # Sheets API client
├── docs/            # Documentation
├── .env.example     # Environment template
└── SETUP.md         # Setup guide
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** Firebase Auth (abstracted, migration-ready)
- **Data:** Google Sheets (abstracted, DB-ready)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Migration Paths

### Auth: Firebase → Custom
1. Create `/lib/auth/providers/custom.ts`
2. Change one line in `/lib/auth/index.ts`
3. Done - no other changes needed

### Data: Sheets → PostgreSQL
1. Create `/lib/data/db.ts`
2. Change one line in `/lib/data/index.ts`
3. Done - no other changes needed

## License

Private - Internal Use Only
