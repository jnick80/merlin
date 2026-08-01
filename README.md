# merlin
Merlin Business Operating System - Enterprise entity management platform

## Automated updates

This repository uses Dependabot to propose dependency updates through pull requests instead of modifying runtime dependencies in place.

- npm dependency updates are opened automatically as pull requests
- GitHub Actions updates are opened automatically as pull requests
- Node CI must pass before dependency update pull requests are merged
- Secrets such as `DB_PASSWORD` must stay in environment or secret management and are not generated or stored in repository automation

## Compliance guardrails

- Dependency changes are reviewed through pull requests
- Pull requests run dependency review for new vulnerable packages
- The repository tracks `package-lock.json` so automated updates and CI use a reproducible dependency graph

## CypherLink release download

- Tagged releases automatically publish a production-ready asset named `CypherLink.zip`
- Latest direct download: `https://github.com/jnick80/merlin/releases/latest/download/CypherLink.zip`
- Versioned direct download: `https://github.com/jnick80/merlin/releases/download/<tag>/CypherLink.zip`
