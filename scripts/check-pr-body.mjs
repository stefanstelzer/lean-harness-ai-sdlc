#!/usr/bin/env node
// CI gate for GEN-006 (PR-body half): a pull request body MUST carry a
// top-level "## Manual Test Plan" section with at least one filled, non-
// placeholder "- [ ] <step>" checklist item. This is the CI backstop the
// /pr skill's local check and the PULL_REQUEST_TEMPLATE seed — it catches a
// body that was stripped or never written.
//
// The body is read from the GitHub Actions event payload
// (GITHUB_EVENT_PATH → pull_request.body), so no token or network call is
// needed. On non-pull_request events (push, workflow_dispatch) and when run
// locally it is a no-op, so `npm run check:pr-body` is always safe to call.

import { readFileSync } from "node:fs";

const eventPath = process.env.GITHUB_EVENT_PATH;
const eventName = process.env.GITHUB_EVENT_NAME;

if (!eventPath || (eventName && !eventName.startsWith("pull_request"))) {
  console.log(
    `check-pr-body: not a pull_request event (${eventName ?? "no event context"}); skipping.`,
  );
  process.exit(0);
}

let body;
try {
  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  body = event?.pull_request?.body ?? "";
} catch (err) {
  console.error(`check-pr-body: could not read the event payload: ${err.message}`);
  process.exit(1);
}

const fail = (msg) => {
  console.error(`❌ PR body fails GEN-006: ${msg}`);
  process.stdout.write(`::error title=GEN-006::${msg.replace(/\n/g, "%0A")}\n`);
  process.exit(1);
};

// 1. The exact H2 heading must be present (case-sensitive, per GEN-006).
const headingRe = /^## Manual Test Plan\s*$/m;
if (!headingRe.test(body)) {
  fail('the PR body is missing the "## Manual Test Plan" H2 section.');
}

// 2. At least one filled, non-placeholder checklist item must follow it, scoped
//    to the section (up to the next H2). Mirrors the placeholder prohibition of
//    the gen006/plans-have-manual-test-plan rule; accepts checked or unchecked.
const placeholder = /<test or verification step>|<step>|<TODO>/;
const afterHeading = body.split(headingRe)[1] ?? "";
const section = afterHeading.split(/^## /m)[0] ?? "";
const filled = section
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => /^- \[[ xX]\]\s+\S/.test(line))
  .filter((line) => !placeholder.test(line));

if (filled.length === 0) {
  fail(
    'the "## Manual Test Plan" section needs at least one filled "- [ ] <step>" bullet (no placeholders).',
  );
}

console.log(
  `✓ PR body GEN-006 OK — "## Manual Test Plan" with ${filled.length} filled step(s).`,
);
