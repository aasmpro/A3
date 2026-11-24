# A3

Standalone matrix arcade game at https://a3.amiri.cc/.

Use Node 26 and pnpm 10.34.7. Install with `pnpm install --frozen-lockfile`; develop with `pnpm serve`; export with `pnpm build`. Preview `out/` with `pnpm start`.

Vercel builds this Next.js repository through Git integration, production branch `master`, domain `a3.amiri.cc`. No portfolio publishing workflow is required.

Delta components are installed from https://amiri.cc/r/{name}.json. Review registry updates before adoption. Theme controllers, canvas helpers and cursor behavior are consumer-owned. Hosted JetBrains Mono is loaded from Delta. Original equilateral triangle artwork is preserved.

Game tests: `pnpm test`; lint: `pnpm lint`. Local checks run only when requested. Browser storage is origin-local; previous portfolio scores do not migrate.
