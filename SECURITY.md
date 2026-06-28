# Security Policy

## Supported versions

This project is in early development. Security fixes are applied to the latest
`main` and the most recent tagged release.

| Version       | Supported |
| ------------- | --------- |
| latest `main` | ✅        |
| older tags    | ❌        |

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Instead, report privately via GitHub's
[security advisory form](https://github.com/stefanstelzer/lean-harness-ai-sdlc/security/advisories/new),
or email **stefanstelzer1983@googlemail.com**.

Please include:

- a description of the vulnerability and its impact,
- steps to reproduce (a proof of concept if possible),
- affected version / commit.

We aim to acknowledge reports within **5 business days** and to provide a
remediation timeline after triage. We'll credit reporters in the release notes
unless you prefer to remain anonymous.

## Automated checks

Every push and pull request runs a [Trivy](https://aquasecurity.github.io/trivy/)
scan (vulnerabilities, secrets, misconfigurations) and Dependabot keeps
dependencies current. These reduce, but do not replace, responsible disclosure.
