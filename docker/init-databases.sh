#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  SELECT 'CREATE DATABASE planningpal_test OWNER ${POSTGRES_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'planningpal_test')\gexec
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname planningpal -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname planningpal_test -c "CREATE EXTENSION IF NOT EXISTS postgis;"
