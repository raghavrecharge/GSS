#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(git rev-parse --show-toplevel)"
deploy_root="/home2/geicic3c/gss.geic.in"
expected_deploy_root="/home2/geicic3c/gss.geic.in"

if [[ "$deploy_root" != "$expected_deploy_root" ]]; then
    echo "Refusing unsafe deployment root: $deploy_root" >&2
    exit 64
fi

if [[ ! -f "$repository_root/dist/index.html" || ! -f "$repository_root/dist/.htaccess" ]]; then
    echo "The committed production build is incomplete." >&2
    exit 66
fi

mkdir -p "$deploy_root"
chmod 0755 "$deploy_root"

# The SQLite catalogue is deliberately stored outside the public document root.
# Existing databases are retained across deployments; the API seeds a new one
# from the committed catalogue on its first request.
data_root="/home2/geicic3c/gss-data"
if [[ "$data_root" != "/home2/geicic3c/gss-data" ]]; then
    echo "Refusing unsafe data root: $data_root" >&2
    exit 64
fi
mkdir -p "$data_root"
chmod 0750 "$data_root"

# Copy the immutable Vite build without touching unrelated hosting paths.
tar -cf - -C "$repository_root/dist" . | tar -xf - -C "$deploy_root"

curl --fail --silent --show-error --max-time 30 --output /dev/null \
    "https://gss.geic.in/"
curl --fail --silent --show-error --max-time 30 --output /dev/null \
    "https://gss.geic.in/programmes/masters-of-business-administration"
curl --fail --silent --show-error --max-time 30 \
    "https://gss.geic.in/api/health" | grep --quiet '"database":"connected"'

echo "GSS deployment completed from $(git rev-parse HEAD)."
