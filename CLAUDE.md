# CLAUDE.md - Repository Guidelines

## Build & Test Commands
- Build: `npm run build`
- Run application: `npm run start`
- Run development: `npm run start:dev`
- Run tests: `npm run test`
- Run single test: `npm run test -- -t "test name"`
- Run e2e tests: `npm run test:e2e`
- Lint: `npm run lint`
- Format code: `npm run format`
- Docker build: `docker compose build`
- Docker run: `docker compose up -d`
- Docker logs: `docker compose logs app`

## Code Style Guidelines
- **Framework**: NestJS (Node.js) backend with TypeScript
- **Naming**: PascalCase for classes, camelCase for variables/functions
- **Typing**: Implement proper TypeScript typing with strict mode
- **Error Handling**: Use try/catch with proper error classifications
- **Imports**: Group imports (external → internal), sort alphabetically
- **Code Quality**: Follow DRY, YAGNI, KISS, and single responsibility
- **Entity Properties**: Add exclamation marks to required properties
- **Optional Properties**: Use ? for optional properties

## Architecture Overview
- Multi-tenant SaaS platform with complete tenant isolation
- Core modules: Tenant Management, Auth, DB Abstraction Layer, API Gateway
- Stack: NestJS, PostgreSQL, TypeORM, Redis, Passport.js with JWT

## Repository Structure
- Documentation in `/docs` follows standardized structure
- Application code in `/multi-saas-platform` directory
- Module-based architecture with tenant, user, and auth modules
- PostgreSQL database with schema separation for tenant isolation