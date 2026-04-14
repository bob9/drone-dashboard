# Deployment: Hosting Multiple Drone Dashboards

Each drone-dashboard instance (hub) runs on its own TCP port with its own
`--pits-id` and auth token. A single `aufpv-platform` process fronts all of
them and routes requests by `Host` header; nginx only needs one generic vhost
per domain that proxies everything to `aufpv-platform`.

## Routing chain

```
WSS client (browser / pits)
  └─▶ nginx :443
        └─▶ aufpv-platform :9891
              └─▶ TenantResolver maps Host → club
                    └─▶ DashboardWSProxy looks up the club's drone-dashboard port
                          └─▶ drone-dashboard hub (:4000, :4001, ...)
```

Relevant code:

- Tenant lookup: `aufpv-platform/internal/club/tenant.go` (`Resolve`)
- Port lookup: `aufpv-platform/internal/platform/handlers/dashboard_handlers.go` (`dashboardPort`)
- WS tunnel: `DashboardWSProxy` in the same file.

`TenantResolver` matches a `Host` against three sources, in order:

1. `clubs.hostname`
2. `clubs.custom_domain`
3. `club_domains.domain` (alias table)

If no club matches, the request is treated as **AUFPV national** and routed to
the dashboard row with `club_id IS NULL`.

## Provisioning a new dashboard

1. Insert a row in `drone_dashboards` with a unique `port`, `auth_token`, and
   `pits_id` (or use the admin UI at `/admin/dashboards`).
2. Map the public host to the club in the DB:
   - set `clubs.hostname` / `clubs.custom_domain`, or
   - insert a row into `club_domains (club_id, domain)`.
   The tenant cache refreshes every 5 min.
3. Provision the systemd unit via the admin UI (or manually, mirroring
   `drone-dashboard-rebels.service`). The `drone-dashboard` process is hub
   mode — no `--cloud-url` flag.
4. Ensure the domain's nginx vhost proxies `/` to `:9891` with
   WebSocket upgrade headers (template below). **No per-dashboard nginx
   config is required.**

## nginx vhost template

Every domain that should serve a drone-dashboard (and its pits `/control`
tunnel) needs this pattern. The `Upgrade`/`Connection` pass-through is what
lets WebSockets work; long timeouts keep the tunnel alive.

```nginx
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name example.com;
  ssl_certificate     /etc/nginx/ssl-certificates/example.com.crt;
  ssl_certificate_key /etc/nginx/ssl-certificates/example.com.key;

  client_max_body_size 50M;

  location / {
    proxy_pass http://127.0.0.1:9891;
    proxy_http_version 1.1;

    proxy_set_header Host               $http_host;
    proxy_set_header X-Forwarded-Host   $http_host;
    proxy_set_header X-Real-IP          $remote_addr;
    proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto  https;

    # WebSocket support (required for /control pits tunnel and /api/realtime).
    proxy_set_header Upgrade            $http_upgrade;
    proxy_set_header Connection         $http_connection;

    proxy_redirect   off;
    proxy_buffering  off;

    # Long timeouts so idle WS tunnels aren't reaped by nginx.
    proxy_connect_timeout 3600;
    proxy_send_timeout    3600;
    proxy_read_timeout    3600;
  }
}
```

Live reference configs:

- `fpv.fpvrebels.com.conf` — AUFPV national
- `www.fpvrebels.com.conf` — FPV Rebels club (matches `custom_domain`)

## Reference: per-instance systemd unit

```
ExecStart=/usr/local/bin/drone-dashboard \
  --port 4001 \
  --auth-token <token> \
  --pits-id rebels \
  --db-dir /home/azureuser/aufpv-platform/data/dashboards/rebels \
  --ui-title "FPV Rebels Live" \
  --ingest-enabled
```

The pits client on each club's local machine dials
`wss://<club-host>/control` with `Authorization: Bearer <token>`. Two pits
clients sharing the same `pits_id` will kick each other via `Hub.Register`
(`backend/control/hub.go`) — each must be unique.
