#!/bin/bash
set -e
set -o pipefail

aws s3 sync --delete --exclude '.git/*' --exclude 'node_modules/*' ${PWD}/ s3://portfolio.joshbacon.name

# DISTRIBUTION_ID=$(
# aws cloudfront list-distributions \
# | jq -r '.DistributionList.Items[] | select(.DefaultCacheBehavior.TargetOriginId=="S3-portfolio.joshbacon.name") | .Id')

aws cloudfront create-invalidation --distribution-id='E2DH15J9LGHZU1' --paths='/*'