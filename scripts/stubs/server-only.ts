// Stand-in for the `server-only` package outside Next.js bundles (Vitest, esbuild bundles for the
// preload and the worker). The real package throws unless resolved under React's server condition.
export {};
