# BrandCanvas security cleanup

- Removed a known malicious JavaScript payload disguised as a WOFF2 font.
- Removed a hidden VS Code folder-open task that attempted to run the payload.
- Disabled automatic VS Code tasks in repository settings.
- Removed the previously tracked root `.env` API-key file and added ignore rules.
- Added a standard-library static scanner and CI check before pnpm install.

## Immediate manual actions

1. Revoke or rotate the previously committed `AUTH_API_KEY` **from a trusted device**.
2. Set replacement values in your deployment secret manager and in untracked local environment files.
3. Audit Git history, clones, forks, artifacts, and deployments: deleting from the latest commit does not erase older commits.
4. Scan affected workstations and servers using security software; do not disable antivirus.
5. Review GitHub Actions results and validate the application after cleanup.

The included static scanner checks known indicators and is **not** a guarantee against other malware.
