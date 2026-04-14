
- After changes, run `deno task -c e2e/deno.json preflight` to verify frontend, backend, and e2e in parallel. Do not check things individually, just run that.
- Do not leave legacy/back-compat shims; remove them in the same PR.
- When given an ambiguous command like "go" or "work on the issue", assume its to work on the issue returned from get_current_issue in its entirety, keep working until its done.
- Production hosting: nginx fronts a single `aufpv-platform` on :9891 which routes by `Host` to per-club drone-dashboard hubs. See `docs/deployment-nginx.md` for the vhost template and routing chain — no per-dashboard nginx config is required.
