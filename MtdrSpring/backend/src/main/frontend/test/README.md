# Synkra end-to-end tests

Playwright test suite covering the manager analytics flow:
sign in (with mocked OTP) → KPI dashboard → filter by a specific
developer → download that developer's analytics API responses as JSON
artifacts.

The `/api/auth/login` and `/api/auth/verify-otp` endpoints are
intercepted with `page.route()` so no email is sent and any 6-digit
code is accepted. The rest of the flow (KPI dashboard rendering,
`/api/developers`, `/api/tasks`, `/api/dashboard/developer/{id}`) hits
the real backend.

## One-time setup

From `MtdrSpring/backend/src/main/frontend/`:

```powershell
npm install
npm run test:e2e:install
```

Create the local env file (it is gitignored):

```powershell
Copy-Item test\.env.example test\.env
```

Adjust `MANAGER_EMAIL`, `MANAGER_PASSWORD`, and `TARGET_DEVELOPER_NAME`
in `test/.env` if you want to exercise different values. Defaults match
the seed data.

## Running

Start the backend (which also serves the built frontend):

```powershell
cd ..\..\..\..
mvn clean package spring-boot:repackage
mvn spring-boot:run
```

In a second terminal, from the frontend folder:

```powershell
npm run test:e2e
npm run test:e2e:report   # open the HTML report
```

## Artifacts

- `test/downloads/` — JSON files captured for the selected developer
  only:
  - `developer.json` — the single matching entry from `/api/developers`
  - `tasks.json` — only the tasks where `developerID` matches
  - `dashboard-developer-{id}.json` — the response from
    `/api/dashboard/developer/{id}`
- `test/test-results/` — Playwright traces, screenshots, videos.
- `test/playwright-report/` — HTML report.

All three folders are gitignored.
