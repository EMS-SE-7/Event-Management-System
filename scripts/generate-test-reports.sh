#!/usr/bin/env bash
# Runs every test level and rebuilds the test documents in docs/:
#   Unit_Test_Report.pdf, Integration_Test_Report.pdf, System_Test_Report.pdf,
#   Code_and_Branch_Coverage_Report.pdf, and docs/test-reports/ (Markdown, HTML coverage, raw results).
# Usage, from the repo root:  bash scripts/generate-test-reports.sh
# Needs Node 20.19+ and npm. No .env or database: the tests start their own in-memory MongoDB.
set -uo pipefail
cd "$(dirname "$0")/.."

status=0
(cd server && npm ci && npm run test:ci) || status=1
(cd client && npm ci && npm run test:ci && npm run build) || status=1
(cd system-tests && npm ci && npx playwright install chromium && npm test) || status=1
node scripts/build-test-reports.mjs || status=1

echo
echo "Reports: docs/*.pdf and docs/test-reports/README.md"
exit $status
