# Inventario baseline

## Rutas (src/routes)

src/routes/archivo.tsx
src/routes/blog/$slug.tsx (redirige a /archivo)
src/routes/blog/index.tsx (redirige a /archivo)
src/routes/buscar.tsx
src/routes/comparar.tsx
src/routes/compatibilidad.tsx
src/routes/componentes/$slug.tsx
src/routes/componentes/index.tsx
src/routes/dispositivos/$slug.tsx
src/routes/dispositivos/index.tsx
src/routes/herramientas.tsx
src/routes/index.tsx
src/routes/liquidos/$slug.tsx
src/routes/liquidos/index.tsx
src/routes/modelo.tsx
src/routes/resistencias/$slug.tsx
src/routes/resistencias/index.tsx
src/routes/__root.tsx

## Scripts package.json

dev: vite dev
build: node scripts/write-build-manifest.mjs && vite build
start: node .output/server/index.mjs
preview: vite preview
format:check: prettier --check .
format: prettier --write .
lint: eslint .
typecheck: tsc --noEmit
test: node --test "src/data/_.test.ts" "scripts/_.test.mjs"
test:coverage: node --experimental-test-coverage --test "src/data/_.test.ts" "scripts/_.test.mjs"
smoke: bash scripts/smoke.sh
visual-smoke: node scripts/visual-smoke.mjs
aceptacion:capturas: node scripts/aceptacion-v2-capturas.mjs
smoke-bench: node scripts/smoke-bench.mjs
check:env: node scripts/check-env.mjs
check:manifest: node scripts/check-manifest.mjs
check:supply-chain: node scripts/supply-chain-audit.mjs
icons: node scripts/build-icons.mjs
logo: node scripts/build-logo.mjs
sitemap: node scripts/build-sitemap.mjs
images: node scripts/build-images.mjs
completeness: node --experimental-strip-types scripts/completeness.mjs
a11y: node scripts/a11y-pass.mjs
e2e: bash scripts/e2e.sh
test:e2e: bash scripts/test-e2e.sh
prepare: husky

## Jobs CI (tras PR-A)

.github/workflows/security.yml:4: schedule:
.github/workflows/security.yml:14: supply-chain:
.github/workflows/ci.yml:4: push:
.github/workflows/ci.yml:17: quality:
.github/workflows/ci.yml:48: test:
.github/workflows/ci.yml:81: build:
.github/workflows/ci.yml:118: smoke:
.github/workflows/ci.yml:148: browser:
.github/workflows/ci.yml:206: fx-e2e:
.github/workflows/ci.yml:264: smoke-bench:
.github/workflows/ci.yml:324: supply-chain:
.github/workflows/ci.yml:368: release-ready:
.github/workflows/ci.yml:386: release:

## Despliegue

- Vercel despliega automáticamente cada push a main (docs/runbooks/deploy.md).
- Identidad SHA pública del deploy: NO VERIFICADO en baseline (sin manifiesto).
