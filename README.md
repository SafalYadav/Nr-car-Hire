# NR Car Hire

Premium Australian car-hire platform.

## Project Documents

Always read these six files before significant project work:

1. `PRD.md`
2. `architecture.md`
3. `README.md`
4. `phase.md`
5. `design.md`
6. `memory.md`

`memory.md` is the living implementation-state document.

## Development Rules

- Inspect existing code before changing it.
- Do not rebuild existing functionality.
- Do not invent requirements that conflict with project documents.
- Keep business logic server-side.
- Validate all external input.
- Never hardcode secrets.
- Never commit real credentials.
- Never expose internal errors to customers.
- Do not claim unverified work is complete.
- Keep dependencies purposeful.
- Prefer simple, maintainable solutions over unnecessary abstraction.

## Security

Security is a priority.

Required principles:

- Secure authentication
- Server-side authorization
- Input validation
- Rate limiting strategy
- Secure cookies/sessions
- Security headers
- Secret management
- Safe error handling
- File-upload security
- Dependency auditing
- Least privilege
- Payment webhook verification
- Idempotency

## AI Limitations / Rules

AI must not:

- Assume documentation means implementation.
- Assume an integration is connected without verification.
- Fake test results.
- Fake AWS configuration.
- Fake payment configuration.
- Rewrite working code unnecessarily.
- Add unnecessary dependencies.
- Mark features VERIFIED without testing.

AI must read `memory.md` before work and update it after every project run.

## Design

Follow `design.md` for all visual decisions.

## Quality

Before considering work complete:

- TypeScript/build passes
- Lint passes
- Relevant tests pass
- No secrets are committed
- Existing functionality is not broken
- Documentation reflects actual state
