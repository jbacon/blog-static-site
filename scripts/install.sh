#!/bin/bash
set -e

docker run \
--rm \
--interactive \
--tty \
--volume ${PWD}/:/home/node/app/ \
--workdir /home/node/app/ \
node:9.7.1-alpine \
npm install