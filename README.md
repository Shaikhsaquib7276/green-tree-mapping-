# GreenMap — MERN tree mapping and green-cover documentation

GreenMap is a responsive web application for the digital tree inventory and green-cover documentation at Theem College of Engineering, Betegaon, Chilhar Road.

## Technology

- **Frontend:** React 19, Vite, Leaflet
- **Backend:** Node.js, Express, Passport Local
- **Database:** MongoDB Atlas and Mongoose
- **Admin sessions:** express-session with MongoDB-backed connect-mongo store
- **Images:** Cloudinary SDK v2 with Multer memory uploads
- **Map tiles:** OpenStreetMap with Leaflet

This branch replaces the former Supabase implementation with a MERN application. The browser never receives MongoDB or Cloudinary secrets.

## Survey data integrity

The field survey on **20 September 2026** recorded an aggregate total of **38 trees**:

| Zone | Survey count |
|---|---:|
| Main Ground | 10 |
| Volleyball Ground | 21 |
| Parking | 7 |
| Flower Garden | 0 |
| **Total** | **38** |

Condition counts: **25 Healthy**, **10 Needs Attention**, **3 Uncertain**. The recorded species/common-name category counts are stored in the aggregate summary. Common names reflect field notes; scientific names require independent verification.

The survey summary is separate from individual tree documents. This project does not create 38 fake trees, invented GPS coordinates, or placeholder field photographs. A public tree marker is displayed only for an individually entered record that is verified and has a saved location explicitly checked by an administrator.

## Requirements

- Node.js 20+ recommended (Node 22 is supported by current Vite releases)
- npm
- MongoDB Atlas connection string
- Cloudinary account (required for actual uploads; the rest of the app can be configured without it)

## Local setup — Windows PowerShell

1. Download/clone this branch and open a terminal in the repository root.
2. Install dependencies from the root:

   ```powershell
   npm install
   ```

3. Copy the server environment template:

   ```powershell
   Copy-Item server/.env.example server/.env
   notepad server/.env
   ```

4. Replace placeholders in `server/.env` with your real MongoDB Atlas URI and a unique session secret (32+ characters). Set a username and a new, unique admin password of at least six characters. Add Cloudinary credentials for image upload.
5. Create the initial admin account:

   ```powershell
   npm run admin:create
   ```

   For Render deployments where Shell is unavailable, set `ADMIN_USERNAME`, `ADMIN_DISPLAY_NAME`, and `ADMIN_PASSWORD` in the service's private Environment settings and redeploy. On startup, GreenMap creates that initial admin only if the username does not already exist; it never changes an existing account's password. After confirming that login works, remove `ADMIN_PASSWORD` from Render Environment and redeploy. Locally, you can also run `npm run admin:create`; to change an existing account password, use `npm run admin:reset`. These scripts require a live Atlas connection. Never commit real passwords or `.env` files.

6. Import the aggregate summary and the four known zones:

   ```powershell
   npm run data:import-summary
   ```

   This is idempotent. It updates the aggregate survey summary and upserts the named zones. It deliberately does **not** populate individual tree documents or GPS coordinates.

7. Start the frontend and API together:

   ```powershell
   npm run dev
   ```

   Frontend: http://localhost:5173  
   API health check: http://localhost:5000/api/health

To run individually, use `npm run dev:web` and `npm run dev:api` in separate terminals. The Vite development server proxies `/api` to Express on port 5000.

## Environment

The backend reads `server/.env`:

- `MONGO_URL` — your MongoDB Atlas connection string (URL-encode reserved characters in the password)
- `SESSION_SECRET` — unique random string of at least 32 characters
- `CLIENT_URL` — browser origin, usually `http://localhost:5173` locally
- `ADMIN_USERNAME`, `ADMIN_DISPLAY_NAME`, `ADMIN_PASSWORD` — for the setup/reset scripts only
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — server-side image credentials
- `PORT` — optional Express port; defaults to 5000

Never commit a real `.env`, never expose the MongoDB URI, session secret or Cloudinary API secret in frontend code, and never use secret values in `VITE_*` variables.

For a separate static frontend deployment, set `VITE_API_BASE_URL` to the deployed API URL ending in `/api/v1`, and set the backend `CLIENT_URL` to the actual frontend origin. Configure HTTPS and production cookie behavior on both services.

## Public and admin functionality

Public visitors can browse published trees, view the survey summary and charts, explore green spaces/gallery, and submit environmental survey feedback without an account. Survey submissions are not publicly readable.

The admin must be provisioned by the server-side script. There is no public registration endpoint. All write APIs require an active admin session and a CSRF token. The admin interface includes tree CRUD, verification, coordinate selection and explicit coordinate confirmation, Cloudinary photo uploads, green-space management, zones, gallery images, survey response review, and audit logs.

## API overview

Prefix: `/api/v1`

- `GET /auth/csrf`, `GET /auth/me`, `POST /auth/login`, `POST /auth/logout`
- `GET /trees`, `GET /trees/:id`, admin-only tree create/edit/delete/verification/photo routes
- `GET /zones`, admin-only zone management
- `GET /green-spaces`, admin-only create/edit/delete/photo routes
- `GET /gallery`, admin-only image management
- `GET /statistics/overview`, `/statistics/by-zone`, `/statistics/by-condition`, `/statistics/by-species`
- `GET /survey/summary`, `POST /survey/responses`
- Admin-only `/admin/survey-responses`, `/admin/audit-logs`, and `/admin/dashboard`

## Tests\n\nRun the backend validation and authorization unit tests with:\n\n```powershell\nnpm test\n```\n\nThe tests cover validation rules, unknown coordinates, supported survey zones and the admin access middleware. They do not replace an end-to-end test against a configured Atlas/Cloudinary account.\n\n## Security notes

- Admin auth uses Passport Local and passport-local-mongoose password hashing.
- Express sessions are stored in MongoDB, use HTTP-only cookies, and are rotated by Passport on login.
- Mutating requests require a session CSRF token and a compatible origin.
- Login and survey submission are rate-limited; JSON/request sizes are bounded.
- Uploaded images are restricted to JPG/PNG/WEBP and 5 MB; credentials are server-only.
- Do not use a six-character password in production if a longer passphrase is practical. The six-character minimum is retained only because it was explicitly requested.
- Database validation and unique IDs prevent duplicate tree IDs. Public reads expose only verified tree records; coordinates are separately marked verified.

## Known deployment shape

For the existing single-service Render setup, use the repository root as the service root, `npm install` as the Build Command, and `npm start` as the Start Command. `npm start` builds the Vite frontend and then launches Express; Vite and its React plugin are included in `dependencies` so Render's production install does not omit the build tool. Express serves the built `dist/` directory and API endpoints under `/api/v1` from the same origin. Leave `VITE_API_BASE_URL` unset (the frontend defaults to `/api/v1`). Set `MONGO_URL`, a unique `SESSION_SECRET` (32+ characters), `NODE_ENV=production`, and `CLIENT_URL` equal to the exact public Render URL in the Render environment. Cloudinary credentials are only needed for image uploads. If a separate build phase is preferred, use Build Command `npm install --include=dev && npm run build` and Start Command `node server/index.js` instead.

## License / project

Academic campus documentation project. Field counts are based on the stated field survey; no claim is made that all trees have individually verified taxonomic names or coordinates.
