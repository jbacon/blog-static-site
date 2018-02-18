#!/bin/bash
set -e
set -o pipefail

docker run \
--rm \
--interactive \
--tty \
--publish=8081:8081 \
--volume ${PWD}/:/static-site/ \
--volume ${PWD}/nginx.conf:/etc/nginx/conf.d/default.conf \
nginx:1.13.8-alpine