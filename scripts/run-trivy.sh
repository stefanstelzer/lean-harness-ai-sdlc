#!/usr/bin/env bash
#
# Trivy filesystem + secret scan, used by the pre-push hook and the PR pipeline.
#
# Locally this is "soft-fail": if Trivy is not installed it prints a hint and
# exits 0 so contributors are not blocked. In CI the dedicated Trivy action runs
# in hard-fail mode (see .github/workflows/pr-pipeline.yml).
set -euo pipefail

if ! command -v trivy >/dev/null 2>&1; then
  echo "ℹ️  Trivy not found locally — skipping local scan."
  echo "   Install it for full pre-push security checks: https://aquasecurity.github.io/trivy/"
  echo "   (CI enforces this scan regardless.)"
  exit 0
fi

echo "🔎 Running Trivy filesystem & secret scan…"
trivy fs \
  --scanners vuln,secret,misconfig \
  --severity HIGH,CRITICAL \
  --exit-code 1 \
  --no-progress \
  .

echo "✅ Trivy scan passed."
