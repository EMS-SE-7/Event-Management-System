# CI/CD and deployment

## What happens automatically

The workflow is [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

| When | What runs |
|---|---|
| Every push and pull request to `main` | Server unit and integration tests (Jest, in-memory MongoDB) with coverage; client lint, unit and integration tests (Vitest) with coverage, and production build; system tests (Playwright drives the production build in Chromium) |
| Every push to `main` (a merged PR) | Everything above, then a deploy to Render. The deploy starts only if every test passed, and the job waits until the live site reports the new commit |
| "Run workflow" button on the Actions tab (on `main`) | Same as a push to `main` |

The app runs as **one free Render web service**: Express serves the API under `/api` and the built React app for every other path, so there is one URL and no CORS set-up. The database is the free MongoDB Atlas cluster.

```
push / PR ──► server-tests ─┐
              client-tests ─┼──► deploy (main only) ──► Render deploy hook ──► wait for /api/health
              system-tests ─┘
```

The test documents in `docs/` (Unit, Integration and System Test Reports, Code & Branch Coverage Report) are produced by `bash scripts/generate-test-reports.sh`; see [test-reports/README.md](test-reports/README.md).

## One-time set-up (about 20 minutes)

You need: the team's Atlas cluster (already created for development), a GitHub account with admin rights on the repo, and a free Render account. Nothing here needs a credit card.

### 1. Make a production database string in Atlas

1. Sign in at <https://cloud.mongodb.com>, open the **PESU-EMS** project.
2. **Security → Network Access**: check `0.0.0.0/0` (Allow access from anywhere) is listed. Render's free tier has no fixed IP address, so this is required.
3. Take the same connection string you use in `server/.env`, but change the database name after `.net/` to **`pesu_ems_prod`**, so the deployed site does not share the team's dev data:
   ```
   mongodb+srv://ems-app:PASSWORD@ems-cluster.xxxxx.mongodb.net/pesu_ems_prod?retryWrites=true&w=majority&appName=ems-cluster
   ```

### 2. Create the Render service from the Blueprint

1. Go to <https://dashboard.render.com/register> and sign up **with GitHub** (free "Hobby" plan, no card).
2. Click **New + → Blueprint**. If the repo is not listed, click **Configure account** / **Connect GitHub** and give Render access to `EMS-SE-7/Event-Management-System` (an org owner may need to approve it).
3. Pick the repo and branch `main`. Render reads [`render.yaml`](../render.yaml) and shows one web service, **pesu-ems**, on the Free plan.
4. It asks for **MONGO_URI**: paste the `pesu_ems_prod` string from step 1. (`JWT_SECRET` is generated for you.)
5. Click **Apply** / **Deploy Blueprint**. The first build takes 3 to 5 minutes. When it says **Live**, copy the URL at the top, e.g. `https://pesu-ems.onrender.com` (yours may have a suffix).
6. Open `https://<your-url>/api/health`. It should show `{"status":"ok","commit":"..."}`.

### 3. Copy the deploy hook into GitHub

1. In Render, open **pesu-ems → Settings → Deploy Hook**. Copy the URL (it starts with `https://api.render.com/deploy/srv-`). Treat it like a password: anyone with it can trigger deploys.
2. In GitHub, open the repo **Settings → Secrets and variables → Actions**.
3. **Secrets** tab → **New repository secret**: name `RENDER_DEPLOY_HOOK_URL`, value the hook URL.
4. **Variables** tab → **New repository variable**: name `RENDER_APP_URL`, value your Render URL with no slash at the end (e.g. `https://pesu-ems.onrender.com`).

### 4. Create the demo accounts in the production database

Organizer accounts only come from the seed script, so run it once from your laptop against the production string:

```bash
cd server
MONGO_URI="<the pesu_ems_prod string>" npm run seed
MONGO_URI="<the pesu_ems_prod string>" npm run seed:events   # optional demo events
```

(On Windows PowerShell: `$env:MONGO_URI="<string>"; npm run seed`.) The emails and password come from `ORGANIZER_EMAILS`, `STUDENT_EMAILS` and `SEED_PASSWORD` in your `server/.env`.

### 5. Check the pipeline end to end

1. GitHub → **Actions → CI/CD → Run workflow** on `main` (or merge any PR).
2. All four jobs should go green. The **Deploy to Render** job ends with `Live at https://... with commit abc1234`.
3. Open your Render URL and log in with a seeded account.

## Regenerating the test documents

```bash
bash scripts/generate-test-reports.sh
```

This runs every test level and rewrites `docs/Unit_Test_Report.pdf`, `docs/Integration_Test_Report.pdf`, `docs/System_Test_Report.pdf`, `docs/Code_and_Branch_Coverage_Report.pdf` and `docs/test-reports/`. Commit the result.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Deploy job warns "RENDER_DEPLOY_HOOK_URL is not set" | Add the secret (step 3). Secrets are not available to pull requests from forks, which is expected |
| Deploy job times out waiting for the commit | Open the Render dashboard → **Logs**. Usually `MongoDB connection failed`: check `MONGO_URI` and Atlas Network Access |
| Site takes about a minute to open | Free Render services sleep after 15 minutes without traffic. Open the URL a minute before a demo |
| Login fails on the live site | Run step 4 to create the accounts in `pesu_ems_prod` |
