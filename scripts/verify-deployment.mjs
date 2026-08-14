import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file) => readFileSync(`${root}/${file}`, 'utf8')

const dockerfile = read('Dockerfile.migration')
const compose = read('docker-compose.migration.yml')

const dockerRequirements = [
  ['Node frontend build stage', /FROM node:[^\s]+ AS frontend/],
  ['Go 1.25 backend build stage', /FROM golang:1\.25-[^\s]+ AS backend/],
  ['Alpine runtime stage', /FROM alpine:[^\s]+ AS runtime/],
  ['non-root runtime user', /USER app/],
  ['live healthcheck', /HEALTHCHECK[\s\S]*\/health\/live/],
  ['static frontend copied to runtime', /COPY --from=frontend[\s\S]*\/app\/dist/],
  ['MySQL backup client in runtime', /apk add --no-cache[^\n]*mysql-client/],
  ['private backup directory', /BACKUP_DIR=\/var\/lib\/geopresensi\/backups/],
]

const composeRequirements = [
  ['MySQL 8.4 service', /image:\s*mysql:8\.4/],
  ['MySQL healthcheck', /healthcheck:\s*[\s\S]*mysqladmin ping/],
  ['application waits for healthy MySQL', /condition:\s*service_healthy/],
  ['database password is externally supplied', /MYSQL_PASSWORD:\s*\$\{DB_PASS:\?/,],
  ['JWT secret is externally supplied', /JWT_SECRET:\s*\$\{JWT_SECRET:\?/,],
  ['database connection timeouts are configurable', /DB_CONNECT_TIMEOUT:[\s\S]*DB_READ_TIMEOUT:[\s\S]*DB_WRITE_TIMEOUT:/],
  ['persistent private backup volume', /- migration_backup_data:\/var\/lib\/geopresensi\/backups/],
]

for (const [label, pattern] of dockerRequirements) {
  if (!pattern.test(dockerfile)) throw new Error(`Deployment requirement missing: ${label}`)
}

for (const [label, pattern] of composeRequirements) {
  const source = compose
  if (!pattern.test(source)) throw new Error(`Deployment requirement missing: ${label}`)
}

console.log('Deployment configuration check passed: multi-stage image, non-root runtime, healthcheck, and MySQL readiness gate are present.')
