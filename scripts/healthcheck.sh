#!/bin/bash
# Nexus health check — checks all services
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

check() {
    local name=$1 url=$2
    if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}[OK]${NC} $name"
    else
        echo -e "${RED}[FAIL]${NC} $name ($url)"
    fi
}

echo "=== Nexus Health Check ==="
echo "$(date)"
echo ""

check "Nexus Backend"   "http://localhost:8100/health"
check "Nexus Frontend"  "http://localhost:3100"
check "ZimMemory"       "http://localhost:5001/health"
check "Hub"             "http://localhost:5003/health"

echo ""
echo "=== Docker Containers ==="
cd ~/services/nexus && docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
