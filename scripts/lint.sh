#!/bin/bash
set -e
set -o pipefail

docker run \
--rm \
--interactive \
--tty \
--volume ${PWD}/:/home/node/app/ \
--workdir /home/node/app/ \
node:9.7.1-alpine \
npm run lint