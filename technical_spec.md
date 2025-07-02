\<specification\_planning>

**Objective:** Produce a rigorously detailed technical specification for the *LLM-Powered Home Assistant Config Optimizer* add-on. The spec must be sufficiently explicit for downstream AI-based code generation.

---

### 1. Core System Architecture & Key Workflows

1. **Add-on container** (Docker) managed by Home Assistant Supervisor

   * Python backend service (`app/`)
   * Static SPA frontend served by backend (`ui/ build`)
2. **Backend subsystems**

   * YAML Ingest Service (ruamel.yaml for round-trip parsing)
   * Recorder Reader (SQLAlchemy + user-selected DSN)
   * LLM Gateway (pluggable drivers: `OpenAI`, `Anthropic`, `Groq`, `Ollama`, `vLLM`)
   * Suggestion Engine (rule-based pre-filter + LLM prompt orchestration)
   * Diff/Staging Store (SQLite)
   * Scheduler (APScheduler)
3. **Frontend subsystems**

   * HA Web Panel (LitElement + HA auth)
   * Tabs: *Optimizations*, *Automations*, *Diffs*, *Logs*, *Settings*
   * Staging area UI → PATCH endpoint to apply accepted diffs
4. **Key workflows**

   * **Scan** → Gather selected YAML + metadata → Chunk → LLM → Parse suggestions → Persist
   * **Diff Review** → Render unified diff → Accept/Reject → Write-back with ruamel.yaml
   * **Automation Generation** → LLM prompt with entity catalogue + recorder stats → YAML blueprint candidate → Stage

---

### 2. Project Structure & Organization

```
addon-root/
│
├── Dockerfile
├── config.json            # HA add-on manifest
├── app/                   # Python backend
│   ├── main.py            # FastAPI entry
│   ├── api/               # REST endpoints
│   ├── llm_providers/
│   ├── services/
│   └── models/            # Pydantic schemas
├── ui/                    # LitElement SPA
│   ├── src/
│   └── build/
├── tests/
│   ├── unit/
│   └── e2e/
└── docs/
```

---

### 3. Detailed Feature Specifications

Break every checkbox item into API endpoints, state management and UI actions.

Potential **challenges / clarifications**:

* Large YAML token count → need sliding-window chunker with entity-level context caching.
* Recorder DB variety (SQLite file path vs TCP MariaDB) and potential locking.
* Secret redaction needs regex for common patterns.
* Diff merge conflicts if user edits files between scan & apply.
* Local LLM unreachable / long inference → front-end timeout handling.

Proposed **solutions**:

* Adaptive chunk size based on selected LLM’s context length metadata.
* Connection pool w/ pragma `journal_mode=WAL` for SQLite concurrency.
* Staging diffs stored with SHA-256 of original file to detect drift; prompt user to rescan if mismatch.

---

### 4-12. (Planning notes per section)

* **DB schema**: `scans`, `suggestions`, `diffs`, `settings`, `llm_profiles`, `logs`
* **Server actions**: CRUD for `suggestions`; streaming SSE for scan progress.
* **Design system**: Use HA core variables for color; typography `Roboto, sans-serif`.
* **Auth**: Leverage HA’s ingress token via header `X-HASS-USER-ID`; no extra login.
* **State management**: Front-end `@lit-labs/context` + reactive controllers; backend SQLAlchemy.
* **Analytics**: Local only (no external telemetry) → store in `logs` and expose CSV export.
* **Testing**: Pytest + `pytest-homeassistant-custom-component`; Playwright in HA devcontainer.

\</specification\_planning>

````markdown
# LLM-Powered Home Assistant Config Optimizer Technical Specification

## 1. System Overview
- **Purpose:** Provide AI-driven insights that clean up, optimise, and extend Home Assistant YAML configs while guaranteeing user control.
- **Key workflows**
  1. **Scan:** User triggers or schedule fires → backend collects YAML + metadata → LLM → suggestions persisted.
  2. **Review:** User inspects suggestions/diffs in staging area; may tweak YAML inline.
  3. **Apply:** Accepted diffs are written back atomically; backups created.
- **Architecture:** Single-container add-on  
  - **Backend:** FastAPI (Python 3.12).  
  - **Frontend:** LitElement SPA served under HA Ingress.  
  - **DB:** SQLite (`/data/optimizer.db`).  
  - **LLM gateway:** Provider drivers implementing a common `LLMClient` interface.

## 2. Project Structure
| Path                                | Responsibility                                                 |
| ----------------------------------- | -------------------------------------------------------------- |
| `app/main.py`                       | FastAPI app factory, wiring services                           |
| `app/api/scan.py`                   | `/scan` REST & SSE endpoints                                   |
| `app/services/yaml_ingest.py`       | Safe round-trip YAML loader                                    |
| `app/services/suggestion_engine.py` | LLM prompt orchestration & post-processing                     |
| `app/services/diff_manager.py`      | Generate/validate/apply diffs                                  |
| `app/llm_providers/`                | `openai.py`, `anthropic.py`, `ollama.py`, etc.                 |
| `ui/src/`                           | LitElement components (`tabs`, `diff-viewer`, `settings-form`) |
| `tests/`                            | Unit & e2e suites                                              |
| `docs/`                             | ADRs, prompt templates                                         |

## 3. Feature Specification

### 3.1 YAML Ingest & Filtering
- **Story:** As a user, I pick which YAML files are analysed.
- **Steps**
  1. `GET /files` returns YAML tree.  
  2. User toggles checkboxes → `POST /scan` body `{files:[...], scan_type:"manual"}`.  
  3. Service validates existence & readability; skips `secrets.yaml` unless explicitly included.
- **Errors & Edge Cases**
  - Missing file → 404 in response list but overall scan continues.
  - Non-YAML file selected → 422 with message.

### 3.2 Scheduled Scans
- CRON-like UI; backend uses APScheduler; metadata stored in `settings.cron_expr`.
- Conflict detection: skip if scan already running.

### 3.3 Recorder DB Analysis
- **Initialization flow:** User selects DB type and DSN in Settings.  
- Backend tests connection, creates view `entity_stats`.
- On scan, last 30 days of stats summarised (unless config overrides).

### 3.4 LLM Backend Support
- `LLMProfile` schema:
  | field            | type | notes                                             |
  | ---------------- | ---- | ------------------------------------------------- |
  | `id`             | PK   |                                                   |
  | `name`           | TEXT |                                                   |
  | `provider`       | ENUM | `openai`, `anthropic`, `groq`, `ollama`, `custom` |
  | `endpoint`       | TEXT | URL or unix socket                                |
  | `api_key`        | TEXT | encrypted at rest                                 |
  | `context_tokens` | INT  |                                                   |
  | `role`           | ENUM | `summary`, `optimize`, `automation`               |
- UI allows mapping each role to a profile.

### 3.5 Suggestion Generation
- Pipeline:
  1. Pre-rules prune superfluous YAML sections.  
  2. Build `PromptTemplate` (`Jinja2`) with context chunks (`<= context_tokens`).  
  3. LLM call streamed.  
  4. Post-processor converts markdown list into `Suggestion` objects.

### 3.6 Staging Area & Diff Application
- `Suggestion` ➜ `Diff` via `diff_manager.build()`  
- UI lists diffs with tri-state: *accept*, *modify*, *reject*.  
- Clicking *apply* triggers `POST /apply` with accepted diff IDs.  
- Backend writes to temporary file, verifies YAML syntax, backs up original to `*.bak`, then replaces.

### 3.7 Web UI
- Tabs implemented as LitElement routes (`<ha-panel-optimizer>`).  
- Diff viewer uses [`prismjs`](https://prismjs.com/) + `jsdiff` to render colorised hunks.  
- For large result sets, virtual scrolling list.

## 4. Database Schema

### 4.1 Tables

| Table          | Fields                                                                                                                                        | Relationships                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `scans`        | `id` PK, `started_at` DATETIME, `ended_at`, `status`, `file_count`, `llm_profile_id` FK                                                       | 1-N ↔ `suggestions`          |
| `suggestions`  | `id` PK, `scan_id` FK, `type` ENUM(`optimization`,`automation`), `title`, `body_md`, `impact`, `status` ENUM(`pending`,`accepted`,`rejected`) | N-1 ↔ `scans`, 1-1 ↔ `diffs` |
| `diffs`        | `id` PK, `suggestion_id` FK, `file_path`, `patch` TEXT, `original_sha` CHAR(64)                                                               |                              |
| `settings`     | `id` PK=1, `yaml_includes` JSON, `cron_expr`, `db_dsn`, `db_type`                                                                             |                              |
| `llm_profiles` | as 3.4                                                                                                                                        |                              |
| `logs`         | `id` PK, `ts` DATETIME, `level`, `message`                                                                                                    |                              |

Indexes: `suggestions.scan_id`, `diffs.suggestion_id`, `logs.level`.

## 5. Server Actions

### 5.1 Database Actions
| Action                       | Input                   | Output          | Query                 |
| ---------------------------- | ----------------------- | --------------- | --------------------- |
| `create_scan()`              | `files[]`, `scan_type`  | `scan_id`       | `INSERT INTO scans …` |
| `add_suggestion()`           | `scan_id`, `suggestion` | `suggestion_id` | ORM flush             |
| `update_suggestion_status()` | `id`, `status`          | rows affected   | `UPDATE`              |

### 5.2 Other Actions
- **LLM Invocation**  
  - *Endpoint:* provider-specific; bearer auth header for hosted models; local HTTP for Ollama (`/api/generate`).  
  - *Format:* JSON stream `{role, content}`.
- **File Backup & Write**  
  - Pre-write SHA check.  
  - Backup to `config/YYYYMMDDHHMM/<file>.bak`.
- **Recorder Stats Aggregation**  
  ```sql
  SELECT entity_id,
         COUNT(*) AS triggers,
         SUM(CASE WHEN last_changed = last_updated THEN 1 ELSE 0 END) AS state_changes
    FROM states
   WHERE last_updated > :since
GROUP BY entity_id;
````

## 6. Design System

### 6.1 Visual Style

| Token      | Value                          |
| ---------- | ------------------------------ |
| Primary    | `var(--primary-color)`         |
| Background | `var(--card-background-color)` |
| Success    | `#00c875`                      |
| Warning    | `#f57f17`                      |
| Error      | `#d32f2f`                      |

* **Typography:** Inherit HA Roboto, 14 px base.
* **Spacing:** 8-pt grid (`4px` unit), `16px` card padding.

### 6.2 Core Components

* `<optimizer-tab-bar>` props: `activeTab`.
* `<suggestion-list>` props: `suggestions[]`.
* `<diff-viewer>` props: `patch`, `filePath`.
* Interactive states follow HA style guide (`:hover{opacity:.8}`).

## 7. Component Architecture

### 7.1 Server Components (FastAPI)

```python
class Suggestion(BaseModel):
    id: int
    title: str
    body_md: str
    impact: str
    status: Literal["pending", "accepted", "rejected"]
```

* **Data fetching:** Pagination via `?page=`.
* **Error Handling:** `HTTP 409` for SHA mismatch.

### 7.2 Client Components

* **State:** Context provider `OptimizerStore` (MobX-style reactive).
* **Events:** `scan-start`, `scan-progress`, `scan-complete`.
* **Props:** TypeScript interfaces in `types.ts`.

## 8. Authentication & Authorization

* Leverage HA ingress & session token (`hassConnection.auth`).
* Backend verifies `X-HASS-USER-ID`; maps to admin privileges for file writes.
* No external auth required.

## 9. Data Flow

```
UI action → /scan POST → ScanService → SuggestionEngine → DB
DB change → SSE → UI store → Render lists
User accepts diff → /apply PATCH → DiffManager → FileSystem
```

State management in UI: reactive store; backend pushes via Server-Sent Events.

## 11. Analytics

* **Strategy:** Local analytics only.

  * Events: `scan_started`, `scan_finished`, `suggestion_accepted`, `diff_applied`.
* **Implementation:** Insert rows into `logs`; CSV export button.

## 12. Testing

* **Unit (pytest):**

  * `test_yaml_loader_roundtrip()`
  * `test_llm_prompt_build()`
  * `test_diff_apply_backup()`
* **e2e (Playwright):**

  * Scenario: Full scan → accept optimization → apply diff → check YAML updated.
  * Use HA devcontainer + Playwright `@playwright/test`.

```
```
