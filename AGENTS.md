# ZuckerBot Public Repository — Agent Instructions

This is the generated public distribution repository for the ZuckerBot MCP
client, CLI, agent skill and installation metadata. The private production
platform is the source of truth.

## Boundaries

- Do not add the ZuckerBot website, API implementation, Supabase migrations,
  private plans, customer data or credentials to this repository.
- Do not implement package logic only here. Maintainer package changes originate
  in the private repository and arrive through a generated sync pull request.
- Public contributions should stay within MCP/CLI code, documentation, examples,
  tests and public metadata.
- Never commit `.env` files, API keys, Meta tokens or service-role credentials.
- Never weaken campaign approval or budget confirmation safeguards.

## Verification

Run these checks before proposing a change:

```bash
npm ci
npm run check:smoke
npm run check:public
npm pack --dry-run
```

Package, lockfile, Claude plugin, `.mcp.json` and MCP Registry manifest versions
must always match.
