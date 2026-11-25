#!/bin/sh
set -e

node scripts/apply-migrations.mjs

exec node .output/server/index.mjs
