# merlin

Merlin Business Operating System is a Node/TypeScript service for entity management and platform runtime orchestration.

## Platform control plane

The service exposes a first-milestone platform control plane under `/api/v1/platform` for:

- creating workload definitions
- launching isolated runtime instances through a development-safe simulated microVM executor
- listing runtime status, lifecycle history, and runtime logs
- stopping and deleting runtimes without executing tenant software in the API process

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
3. Start Postgres and the app with `npm run docker:up`, or run Postgres separately and start the app locally with `npm run dev`.
4. Build the production bundle with `npm run build`.

The Dockerfile supports both development and production images:

- `development` stage for local containerized work
- `production` stage for deployable runtime images

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
