#!/usr/bin/env bash
set -euo pipefail

CONTAINER="dashb-demo"
NETWORK="dashb-proxy"
DOMAIN=""
PROXY_STACK=""
RESET_AT=""
TZ_NAME=""
DB_PATH="/app/data/dashb.db"
BUILD=1
APPLY=0
MARKER_BEGIN="# >>> dashb-demo (managed by scripts/deploy-demo.sh)"
MARKER_END="# <<< dashb-demo"

usage() {
    cat <<'EOF'
Deploy the DashB demo site next to an existing Caddy stack on the same host.

Usage:
  scripts/deploy-demo.sh --domain demo.example.com [options]

Required:
  --domain <host>        Public hostname the demo is served on.

Options:
  --proxy-stack <dir>    Directory of the compose stack whose Caddy owns
                         :80/:443. The script writes a compose override and a
                         Caddy site block there, then reloads that stack.
                         Omit it to configure only the demo itself.
  --network <name>       Shared docker network (default: dashb-proxy).
  --reset-at <HH:MM>     Nightly demo reset. Omit to keep whatever .env says.
  --tz <zone>            Timezone the reset time is read in, e.g.
                         Europe/Zurich. Containers are UTC without it.
  --no-build             Start without rebuilding the image.
  --apply                Make changes. Without it the script only reports what
                         it would do.
  -h, --help             This text.

The script is safe to re-run: it never replaces an existing BETTER_AUTH_SECRET,
backs up every file it edits, validates the Caddy config before reloading, and
restores the backup if validation fails.
EOF
}

log() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }
info() { printf '    %s\n' "$1"; }
warn() { printf '    \033[33mwarning:\033[0m %s\n' "$1"; }
die() {
    printf '\n\033[31merror:\033[0m %s\n' "$1" >&2
    exit 1
}

plan() {
    if [ "$APPLY" -eq 1 ]; then
        info "$1"
    else
        info "would $1"
    fi
}

while [ $# -gt 0 ]; do
    case "$1" in
        --domain)
            DOMAIN="${2:-}"
            shift 2
            ;;
        --proxy-stack)
            PROXY_STACK="${2:-}"
            shift 2
            ;;
        --network)
            NETWORK="${2:-}"
            shift 2
            ;;
        --reset-at)
            RESET_AT="${2:-}"
            shift 2
            ;;
        --tz)
            TZ_NAME="${2:-}"
            shift 2
            ;;
        --no-build)
            BUILD=0
            shift
            ;;
        --apply)
            APPLY=1
            shift
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *) die "unknown argument: $1 (try --help)" ;;
    esac
done

[ -n "$DOMAIN" ] || {
    usage >&2
    die "--domain is required"
}

case "$DOMAIN" in
    *.*) ;;
    *) die "--domain must be a hostname, got '$DOMAIN'" ;;
esac

if [ -n "$RESET_AT" ]; then
    printf '%s' "$RESET_AT" | grep -Eq '^([01][0-9]|2[0-3]):[0-5][0-9]$' ||
        die "--reset-at must be HH:MM, got '$RESET_AT'"
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

[ -f Dockerfile ] && [ -f docker-compose.yml ] ||
    die "run this from the dashb checkout (no Dockerfile here: $ROOT)"

command -v docker > /dev/null || die "docker is not installed"
docker compose version > /dev/null 2>&1 ||
    die "this needs docker compose v2 (the 'docker compose' subcommand)"
docker info > /dev/null 2>&1 ||
    die "cannot talk to the docker daemon - is your user in the docker group?"

if [ "$APPLY" -eq 0 ]; then
    log "Dry run - nothing will be changed. Re-run with --apply to proceed."
fi

log "Checking DNS for $DOMAIN"

resolved="$(getent hosts "$DOMAIN" 2> /dev/null | awk '{print $1}' | head -1 || true)"
local_ips="$(hostname -I 2> /dev/null || true)"

if [ -z "$resolved" ]; then
    warn "$DOMAIN does not resolve yet - Caddy cannot get a certificate until it does"
elif [ -n "$local_ips" ] && ! printf '%s' " $local_ips " | grep -q " $resolved "; then
    warn "$DOMAIN resolves to $resolved, which is not an address on this host"
    warn "($local_ips) - fine behind NAT, otherwise the certificate will fail"
else
    info "$DOMAIN -> $resolved"
fi

log "Checking build resources"

total_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo 2> /dev/null || true)"
swap_kb="$(awk '/SwapTotal/ {print $2}' /proc/meminfo 2> /dev/null || true)"
total_kb="${total_kb:-0}"
swap_kb="${swap_kb:-0}"

if [ "$BUILD" -eq 1 ] && [ "$total_kb" -gt 0 ] &&
    [ "$((total_kb + swap_kb))" -lt 3000000 ]; then
    warn "$((total_kb / 1024)) MB RAM and $((swap_kb / 1024)) MB swap; this build may be OOM-killed."
    warn "Add swap first:  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile &&"
    warn "                 sudo mkswap /swapfile && sudo swapon /swapfile"
else
    info "$((total_kb / 1024)) MB RAM, $((swap_kb / 1024)) MB swap"
fi

log "Shared network: $NETWORK"

if docker network inspect "$NETWORK" > /dev/null 2>&1; then
    info "already exists"
else
    plan "create it"
    [ "$APPLY" -eq 1 ] && docker network create "$NETWORK" > /dev/null
fi

log "Demo configuration: .env"

set_env_key() {
    local key="$1" value="$2" file="$3"

    if [ "$APPLY" -eq 0 ]; then
        plan "set $key"
        return
    fi

    local tmp
    tmp="$(mktemp)"

    awk -v key="$key" -v value="$value" '
        BEGIN { done = 0 }
        $0 ~ "^" key "=" { print key "=\"" value "\""; done = 1; next }
        { print }
        END { if (!done) print key "=\"" value "\"" }
    ' "$file" > "$tmp"

    mv "$tmp" "$file"
    info "set $key"
}

env_value() {
    sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}$/\1/p" "$2" | tail -1
}

ENV_FILE=".env"

if [ -f .env ]; then
    info ".env exists - keeping it and updating the keys below"
else
    plan "create .env from .env.example"

    if [ "$APPLY" -eq 1 ]; then
        cp .env.example .env
    else
        ENV_FILE=".env.example"
    fi
fi

set_env_key DATABASE_URL "file:$DB_PATH" "$ENV_FILE"
set_env_key BETTER_AUTH_URL "https://$DOMAIN" "$ENV_FILE"
set_env_key BETTER_AUTH_TRUSTED_ORIGINS "https://$DOMAIN" "$ENV_FILE"

if [ -n "$RESET_AT" ]; then
    set_env_key DEMO_RESET_AT "$RESET_AT" "$ENV_FILE"
fi

secret="$(env_value BETTER_AUTH_SECRET "$ENV_FILE")"

if [ -n "$secret" ]; then
    info "BETTER_AUTH_SECRET already set - left untouched"
else
    plan "generate BETTER_AUTH_SECRET"

    if [ "$APPLY" -eq 1 ]; then
        command -v openssl > /dev/null || die "openssl is needed to generate a secret"
        set_env_key BETTER_AUTH_SECRET "$(openssl rand -base64 32)" "$ENV_FILE"
    fi
fi

if [ -n "$TZ_NAME" ]; then
    set_env_key TZ "$TZ_NAME" "$ENV_FILE"
fi

reset="$(env_value DEMO_RESET_AT "$ENV_FILE")"
zone="$(env_value TZ "$ENV_FILE")"

if [ -n "$reset" ]; then
    info "nightly reset at $reset ${zone:-UTC} - every account is deleted daily"

    if [ -z "$zone" ]; then
        warn "no TZ set, so $reset means $reset UTC - pass --tz to change that"
    fi
else
    info "no nightly reset (DEMO_RESET_AT is empty)"
fi

if [ -n "$PROXY_STACK" ]; then
    [ -d "$PROXY_STACK" ] || die "--proxy-stack is not a directory: $PROXY_STACK"

    PROXY_STACK="$(cd "$PROXY_STACK" && pwd)"
    CADDYFILE="$PROXY_STACK/Caddyfile"
    OVERRIDE="$PROXY_STACK/docker-compose.override.yml"

    [ -f "$CADDYFILE" ] || die "no Caddyfile in $PROXY_STACK"

    log "Proxy stack: $PROXY_STACK"

    if [ -f "$OVERRIDE" ]; then
        if grep -q "$NETWORK" "$OVERRIDE"; then
            info "docker-compose.override.yml already joins $NETWORK"
        else
            die "$OVERRIDE exists and does not mention $NETWORK - merge it by hand"
        fi
    else
        plan "write docker-compose.override.yml joining caddy to $NETWORK"

        if [ "$APPLY" -eq 1 ]; then
            cat > "$OVERRIDE" <<EOF
services:
    caddy:
        networks:
            - default
            - $NETWORK

networks:
    $NETWORK:
        name: $NETWORK
        external: true
EOF
        fi
    fi

    if grep -qF "$MARKER_BEGIN" "$CADDYFILE"; then
        info "Caddyfile already has a managed block - replacing it"
    else
        plan "append a site block for $DOMAIN to Caddyfile"
    fi

    if [ "$APPLY" -eq 1 ]; then
        backup="$CADDYFILE.bak.$(date +%Y%m%d%H%M%S)"
        cp "$CADDYFILE" "$backup"
        info "backed up Caddyfile to $(basename "$backup")"

        tmp="$(mktemp)"

        awk -v begin="$MARKER_BEGIN" -v end="$MARKER_END" '
            index($0, begin) == 1 { skip = 1 }
            skip && index($0, end) == 1 { skip = 0; next }
            !skip { print }
        ' "$CADDYFILE" > "$tmp"

        {
            printf '\n%s\n' "$MARKER_BEGIN"
            printf '%s {\n' "$DOMAIN"
            printf '\trequest_body {\n\t\tmax_size 10MB\n\t}\n'
            printf '\treverse_proxy %s:3000\n' "$CONTAINER"
            printf '}\n%s\n' "$MARKER_END"
        } >> "$tmp"

        mv "$tmp" "$CADDYFILE"

        if docker run --rm -v "$CADDYFILE:/etc/caddy/Caddyfile:ro" caddy:2-alpine \
            caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile \
            > /dev/null 2>&1; then
            info "Caddy config validates"
        else
            cp "$backup" "$CADDYFILE"
            die "the new Caddyfile does not validate - restored $(basename "$backup")"
        fi
    fi
fi

log "Starting the demo"

if [ "$APPLY" -eq 0 ]; then
    plan "run docker compose up -d$([ "$BUILD" -eq 1 ] && echo ' --build')"
    [ -n "$PROXY_STACK" ] && plan "reload the proxy stack"
    log "Dry run finished. Re-run with --apply to make these changes."
    exit 0
fi

if [ "$BUILD" -eq 1 ]; then
    docker compose up -d --build
else
    docker compose up -d
fi

for _ in $(seq 1 30); do
    status="$(docker inspect -f '{{.State.Status}}' "$CONTAINER" 2> /dev/null || echo missing)"
    [ "$status" = "running" ] && break
    sleep 2
done

[ "$status" = "running" ] ||
    die "$CONTAINER is '$status' - check: docker compose logs app"

docker compose logs app 2>&1 | grep -E 'apply-migrations' | tail -2 |
    sed 's/^/    /' || warn "no migration line in the log yet"

if [ -n "$PROXY_STACK" ]; then
    log "Reloading the proxy stack"
    (cd "$PROXY_STACK" && docker compose up -d)

    log "Checking that Caddy can reach $CONTAINER"

    if (cd "$PROXY_STACK" &&
        docker compose exec -T caddy wget -q -O /dev/null \
            "http://$CONTAINER:3000/login") 2> /dev/null; then
        info "reachable on $NETWORK"
    else
        warn "Caddy could not reach $CONTAINER:3000 - is its caddy service on $NETWORK?"
    fi
fi

log "Checking https://$DOMAIN"

code=""

for _ in $(seq 1 20); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "https://$DOMAIN/login" || true)"
    [ "$code" = "200" ] && break
    sleep 3
done

if [ "$code" = "200" ]; then
    info "the login page is live over HTTPS"
    log "Done. Open https://$DOMAIN and register an account."
else
    warn "https://$DOMAIN/login answered '$code'"
    warn "Certificate issuance can take a moment; if it persists, check:"
    warn "  cd $PROXY_STACK && docker compose logs caddy | tail -40"
    exit 1
fi
