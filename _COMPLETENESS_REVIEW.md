# Completeness Review: AiDataAnalyst

- **Review date:** 2026-07-18
- **Assessment basis:** Static source and configuration inspection only. Dependencies were not installed, and no build, database migration, external integration, or runtime workflow was executed.

## Classification

**Functional but incomplete**

## Verdict

This is a substantive but unfinished knowledge/retrieval application: 131 project-owned source files and 2 manifest(s) expose a coherent surface, but the source does not demonstrate a production-complete Ai Data Analyst workflow.

## Why it is not complete

- 12 files are explicitly named as gap/backlog surfaces, so page and route counts overstate implemented product capability.
- 28 project-owned files contain direct provider/chat-completion markers; generic model calls are not a substitute for typed domain tools, grounded evidence, deterministic rules, or evaluations.
- 57 files contain mock, sample, placeholder, simulated, or random-data signals, leaving important outcomes disconnected from authoritative systems.
- No explicit schema or migration evidence was found for durable, versioned domain state.
- No recognizable project-owned automated tests were found for the primary workflow.
- No checked-in CI workflow was found to continuously verify builds, tests, migrations, and security checks.
- No environment example/template was found, leaving required configuration and secret boundaries undocumented.

## Needed features

1. Implement the Data Analyst ingestion-to-answer workflow with durable sources, provenance, versioning, citations, permission filtering, and abstention.
2. Connect authoritative repositories and APIs through resumable ingestion, object storage, parsing, chunking, deduplication, deletion propagation, and queued indexing.
3. Evaluate retrieval recall, answer faithfulness, citation resolution, freshness, conflicts, and injection resistance on versioned datasets.
4. Add tenant isolation, document-level permissions, encryption, retention/deletion, rate/cost controls, and human feedback/disposition.
5. Replace the generated “advanced visualization library plotly d3 deck gl on backe” gap surface with durable domain state, real integration behavior, explicit failure handling, and acceptance tests.
6. Add contract, integration, authorization, migration, failure-path, and end-to-end tests in CI, plus a documented nondestructive deployment/run path.

## Risks or launch blockers

- Ungrounded answers can mislead users even when the UI and API appear complete.
- Untrusted documents can leak data or inject instructions without permission filtering and content isolation.
- A weak JWT/session-secret fallback can make authentication forgeable when configuration is absent.
- The root launcher can terminate unrelated processes occupying configured ports.
- The root launcher seeds, creates, migrates, or otherwise mutates database state during startup.
- The root launcher installs dependencies at run time, reducing reproducibility and expanding supply-chain risk.

## Evidence inspected

- `README.md` — inspected project-owned structure or implementation evidence.
- `backend/package.json` — inspected project-owned structure or implementation evidence.
- `backend/src/server.js` — inspected project-owned structure or implementation evidence.
- `backend/src/routes/gap_missing_query_builder_generate_dashboard_analyze_data_predic.js` — inspected project-owned structure or implementation evidence.
- `start.sh` — inspected project-owned structure or implementation evidence.
- `backend/src/config/database.js` — inspected project-owned structure or implementation evidence.

## Recommended next action

Choose one production knowledge/retrieval journey, connect its authoritative systems, define measurable acceptance tests, and close its data, permission, failure, and operational gaps before adding screens.

## Implementation progress (2026-07-18)

The supported runtime is now the fail-closed `/api/governance` ingestion, cited-answer, and visualization service in `backend/src/server.js`; startup schema mutation, public export serving, generic AI/warehouse/spreadsheet routes, and generated gaps are retained only as quarantined provenance and are not mounted. Each numbered requirement is mapped below without claiming unavailable provider or production validation.

1. `backend/src/governance/domain.js`, `routes.js`, and `backend/migrations/001_governed_analyst.sql` implement immutable versioned sources with authority/timestamps/SHA-256/object keys/retention, parser/location-versioned chunks, document user/group permissions, pinned retrieval/model versions, durable model receipts, resolved source/version/chunk/location/digest citations, permission filtering, conflict/low-confidence/stale-evidence abstention, feedback disposition, and append-only answer/audit evidence.
2. Repository connectors now use scoped credential references and resumable cursor/page-digest checkpoints; sources/chunks are deduplicable, object storage and parsing are explicit, injection-like chunks are quarantined, indexing is a durable idempotent leased job with bounded retry/dead-letter, and deletion plans revoke access then delete/tombstone objects, chunks, vectors, derived answers/visualizations, and propagate to the authoritative repository with receipts.
3. `evaluateRetrieval` measures recall, answer faithfulness, citation resolution, freshness, conflict abstention, and injection resistance on versioned dataset/policy fixtures. Deterministic tests cover allowed/denied subjects, stale evidence, unresolved conflicts, low confidence, prompt-injection quarantine, citation digests, row/field/cost limits, and provider failure; representative/adversarial production evaluation remains external.
4. Strong tenant membership, user/group document subjects, issuer/audience-bound JWTs, RLS, verified production database TLS, secret-manager references, append-only evidence, stored legal holds, retention/deletion propagation, rate limits, per-query/render cost limits, durable usage receipts, and immutable human feedback/disposition replace weak/broad access. Document content is treated as untrusted evidence, never executable instruction.
5. `createVisualizationSpec`, visualization routes, and durable spec/approval/outbox tables replace “advanced visualization library plotly d3 deck gl on backe.” Specs pin dataset/schema digests, select Plotly/D3/deck.gl, validate authorized fields/rows/encodings/filters/aggregations/accessibility, require permission and reviewed query-plan/spec digests plus cost limits, then queue a renderer with idempotency, receipt, retry, and explicit failure state. Generic chat output is not a visualization backend.
6. Eighteen dependency-free ingestion, permission, retrieval, answer, abstention, injection, evaluation, visualization, authorization, deletion, provider, migration, CI, and launcher tests pass under `npm test`. `.github/workflows/ci.yml` runs tests/syntax, applies the actual migration to PostgreSQL 16, builds the frontend, and checks shells. `.env.example`, explicit bootstrap/migration, guarded seed, nonmutating `start.sh`, operations runbook, and quarantine record document a reproducible nondestructive deployment.

Validation performed locally: 18/18 tests passed; changed JavaScript, shell, and manifests parsed; migration/RLS/append-only/non-destructive contracts passed; weak-secret, disabled-TLS, public-export, legacy-route, startup-schema, and unsafe-launcher scans were clean; and `git diff --check` passed. No PostgreSQL listener or frontend dependency tree was available, so local migration execution and frontend production build were not performed; CI is configured for both.

Remaining external blockers: provision and certify real repositories/APIs, object storage, parsers, indexes, model and visualization renderer adapters; apply the migration and test RLS/encryption/deletion/holds with production identities; run representative and adversarial evaluations for recall, faithfulness, citation resolution, freshness, conflicts, injection, permission isolation, latency, cost, and visual accessibility; execute browser/load/security/backup/restore/deletion/incident recovery; and obtain privacy, data-governance, security, accessibility, and domain-owner approval. Credentials, authoritative data, licensed content, providers, infrastructure, and professional sign-off are not completed by source changes.

## Runtime verification (2026-07-20)

The isolated runtime campaign used PostgreSQL `55603`, API `6020`, and UI `6021`. The first attempt was retained as `FAILED/no_owned_listener` because issuer, audience, client-origin, and symlink-aware ESM entry-point wiring were incomplete. The repair adds a persisted password credential to the governed analyst identity, test-only provisioning gated by `NODE_ENV=test` plus explicitly supplied strong admin credentials, issuer/audience-bound login tokens, and a database-backed `/api/auth/me` lookup. `start.sh` then completed without error and the validator recorded `API_VERIFIED/startup_login_session_api` at `2026-07-20T19:38:43Z`. All 18 governance tests, shell/JavaScript syntax checks, and the Vite production build passed. The isolated PostgreSQL and application listeners were released after verification.
