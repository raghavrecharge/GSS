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

# Copy the immutable Vite build without touching unrelated hosting paths.
tar -cf - -C "$repository_root/dist" . | tar -xf - -C "$deploy_root"

curl --fail --silent --show-error --max-time 30 --output /dev/null \
    "https://gss.geic.in/"
curl --fail --silent --show-error --max-time 30 --output /dev/null \
    "https://gss.geic.in/programmes/masters-of-business-administration"

echo "GSS deployment completed from $(git rev-parse HEAD)."
