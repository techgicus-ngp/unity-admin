# Unity Realities Admin (React)

React + Vite port of the `unityrealitiesadmin` Flutter app. Same Firestore data and collections, so both apps can run side by side.

## Quick start

```bash
npm install
cp .env.example .env        # then fill in the values (see below)
npm run dev                 # http://localhost:5173
npm run build               # production build -> dist/
npm run deploy              # build + firebase deploy --only hosting
```

### Environment (`.env`)

All configuration is in `.env` (git-ignored); `.env.example` documents every variable.
`src/config/env.js` is the only file that reads `import.meta.env`; if a required Firebase value is missing the app shows a setup screen instead of crashing.

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_*` | Firebase web-app config (API key, project, app id, bucket…) |
| `VITE_APP_NAME`, `VITE_COMPANY_NAME`, `VITE_COMPANY_TAGLINE` | Branding; company name/tagline are printed on the quotation PDF |
| `VITE_DEFAULT_MAP_ID` | Map opened first on the Layout Dashboard |
| `VITE_ALLOWED_MAP_IDS` | Maps listed in "Select Map" (empty = all maps) |
| `VITE_EMPLOYEE_GROUPS` | Group names on the registration form |
| `VITE_SEED_*` | Optional first-run creation of admin / guest users (off by default) |

Restart the dev server after editing `.env`.

## Folder structure

```
src/
├─ config/        env.js · firebase.js · constants.js (collections, statuses, colours, defaults)
├─ context/       AuthContext · ToastContext
├─ routes/        AppRoutes (lazy-loaded pages) · guards (RequireAuth / PublicOnly)
├─ services/      authService · quotationService · mapService · galleryService   (all Firestore/Storage access)
├─ models/        user · plot · quotation  (normalise / serialise Firestore docs)
├─ utils/         format · plot (filter, sort, pricing) · quotationCalc (pure maths)
├─ hooks/         useSubscription · useDebouncedValue · useMediaQuery
├─ components/    ui/ (Modal, Field, Spinner…) · layout/ (AppShell, PageHeader)
├─ features/
│  ├─ auth/        LoginPage · RegisterPage
│  ├─ overview/    OverviewPage
│  ├─ employees/   EmployeeListPage
│  ├─ quotations/  List · Form · Detail · components/ (PlotPicker, QuotationPrint…)
│  ├─ plots/       DashboardPage · hooks/useMapDashboard · components/ (grid, filters, bulk bar, dialogs)
│  └─ gallery/     GalleryPage
└─ styles/        global.css · plots.css · quotations.css
```

## Screen mapping

| Flutter | React route |
|---|---|
| `login_screen` | `/login` |
| `register_employee_screen` | `/register` (not linked from login, same as the Flutter app) |
| `admin_home` (Overview / Employees / Quotations tabs) | `/overview`, `/employees`, `/quotations` |
| `employee_home` | `/quotations` (employees and guests see only their own) |
| `create_quotation_screen` | `/quotations/new`, `/quotations/:id/edit` (edit is admin-only) |
| `quotation_detail_screen` + `quotation_pdf` | `/quotations/:id` (Print / Save as PDF uses the browser print dialog) |
| `d.dart` (Layout Dashboard) | `/layouts?map=<id>` |
| `map_gallery_screen` | `/layouts/:mapId/gallery` |

## What was optimised

- **Reads:** plot search scans each map document once (cached 5 min) instead of one sub-collection read per map per search; employee/guest quotation list no longer needs a composite Firestore index; overview uses a count query instead of loading every quotation; admin/guest seeding no longer runs two queries on every start.
- **Writes:** plot edits (single and bulk) go through one Firestore transaction and merge into the stored plot, so concurrent edits and extra fields are not lost.
- **Bundle:** every page is code-split; Firebase Storage loads only on the gallery page; vendor chunks cached separately; no PDF library (print layout is plain HTML/CSS, so Marathi/Hindi text renders correctly).
- **Rendering:** plot cells are memoised, filtering/sorting/stats are memoised, search is debounced.
- **Code:** one pure `calcQuotation()` replaces the controller-listener recalculation; duplicated colour/status tables are centralised; ~15k lines of Dart became ~3k lines of JSX/JS.
- **Session:** only the user id is stored in `localStorage` (the Flutter app stored the whole user, including the password, in SharedPreferences) and it is re-validated on every load.

## Behaviour differences to be aware of

- A plot number that exists in several projects now asks which project to use (Flutter silently took the first match).
- Editing a quotation keeps its original creator and any fields written by other clients.
- Skipped because they were unreachable in the Flutter app: `b.dart` (StatusUpdateScreen, its menu entry was commented out), `cad_layout_service.dart` (nothing called it; `lib/layout.json` was not in the zip), the empty `map_list_screen.dart`.
- The PDF header said "Saraswati" in Flutter; it now uses `VITE_COMPANY_NAME` and the Unity Realities logo.

## Security notes (unchanged from the Flutter app)

Users are rows in the `unity_user` collection with **plain-text passwords**, checked by the client. Anyone who can read that collection can read every password, and these `VITE_*` values are public in the browser bundle. Moving to Firebase Authentication plus Firestore security rules is the proper fix; it needs a data migration, so it was not done here.
