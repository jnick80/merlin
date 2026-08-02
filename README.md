# merlin

Merlin Tractor Diagnostics is a local-first Node/TypeScript service that helps farmers look up tractor codes, review likely causes, and follow safe maintenance or repair steps without needing a public domain.

## Tractor diagnostics MVP

The service now exposes a tractor diagnostics API under `/api/v1` for:

- listing supported tractor brands and starter-model catalog entries
- looking up model-aware diagnostic codes for common tractor brands
- returning farmer-safe guidance, severity, safety warnings, and escalation advice
- searching likely issues by symptom when a code is missing or unrecognized
- maintaining the local starter catalog through admin endpoints

### Local-first behavior

- No public domain is required.
- The API is intended to run on localhost or a private network first.
- Startup will continue even if PostgreSQL is unavailable so the seeded diagnostics catalog can still be used.
- The current platform control plane remains mounted under `/api/v1/platform`, but it is no longer the primary product surface.

## Configuration areas

### CI/workflows

- GitHub Actions uses `/home/runner/work/merlin/merlin/.github/workflows/node-ci.yml`.
- CI validates install, lint, format, test, and build as separate stages.
- Each stage emits explicit banner output so failures are clearly demarcated in workflow logs.

### Linting and formatting

- Lint: `npm run lint`
- Auto-fix lint issues: `npm run lint:fix`
- Type-check without emitting: `npm run lint:types`
- Format files: `npm run format`
- Check formatting without changes: `npm run format:check`
- Run the local validation pipeline: `npm run validate`

### Tests

- Run unit tests: `npm test`
- CI-oriented test run: `npm run test:ci`
- Coverage run: `npm run test:coverage`

### Build and development environment

1. Copy `/home/runner/work/merlin/merlin/.env.example` to `.env` and update values as needed.
2. Install dependencies with `npm install`.
3. Start the app locally with `npm run dev`. Postgres is optional for the diagnostics MVP starter catalog.
4. Build the production bundle with `npm run build`.

The Dockerfile supports both development and production images:

- `development` stage for local containerized work
- `production` stage for deployable runtime images

## Diagnostic API routes

- `GET /api/v1`
- `GET /api/v1/tractors/brands`
- `GET /api/v1/tractors/models?manufacturerId=john-deere`
- `GET /api/v1/diagnostics/codes/lookup?manufacturerId=john-deere&modelId=jd-6m&code=JD-FUEL-01`
- `POST /api/v1/diagnostics/codes/lookup`
- `GET /api/v1/diagnostics/symptoms/search?manufacturerId=new-holland&symptom=pto%20warning`
- `GET /api/v1/catalog/summary`
- `GET /api/v1/catalog/codes`
- `POST /api/v1/catalog/codes`

## Starter catalog note

- The included catalog is a local MVP starter dataset for John Deere, Case IH, New Holland, Kubota, and Massey Ferguson.
- Guidance should be verified against operator or service documentation before field use on a specific machine.
- Brand-specific and model-specific variations are supported, including codes that require the exact model before guidance can be shown.

### Deployment

- Use the production Docker image built from `/home/runner/work/merlin/merlin/Dockerfile`.
- Keep development-only settings in local `.env` or `docker-compose.yml`.
- Set production values for `NODE_ENV`, `JWT_SECRET`, database settings, and CORS before deployment.
- Use `/health` for container or platform health checks.

### App/runtime settings

The following settings are validated at startup:

- `APP_NAME`
- `NODE_ENV`
- `PORT`
- `API_VERSION`
- `API_BASE_URL`
- `CORS_ORIGIN`
- `LOG_LEVEL`
- `LOG_FORMAT`
- `LOG_TO_FILES`
- `LOG_DIR`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `PLATFORM_EXECUTOR`

## Logging and output demarcation

Application logs are clearly separated by section:

- `STARTUP` for boot and listener lifecycle
- `APP` for framework configuration
- `REQUEST` for HTTP request/response logging
- `DATABASE` for connection and query failures
- `RUNTIME` for workload lifecycle transitions
- `ERROR` for request failures

Each request is tagged with an `x-request-id` value so request logs and error responses can be correlated.

## Useful commands

- `npm run dev`
- `npm run build`
- `npm start`
- `npm test`
- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:logs`
