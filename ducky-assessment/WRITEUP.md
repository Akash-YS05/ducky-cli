# WRITEUP

## 1) Tracking approach

I designed `ducky` as a passive, local-first session tracker with a detached daemon process. The CLI has two user-facing commands (`ducky start`, `ducky stop`) and one internal daemon command used for background sampling.

### Session lifecycle design

- `ducky start` creates a hidden `.ducky/` state directory in the project root, starts a detached background process, and writes a session state file.
- Session state stores key lifecycle data (`sessionId`, `pid`, `startedAt`, `lastHeartbeatAt`) to prevent duplicate starts and enable stale-session recovery.
- `ducky stop` terminates the daemon, reads tracking data, writes `ducky-report.json`, and clears transient state files.

This design keeps behavior predictable, survives terminal return, and avoids duplicate/orphan watchers.

### Signals currently tracked

The daemon periodically samples three signal families and stores them in `.ducky/tracking.json`:

1. **Process-level AI tooling presence**
   - Cross-platform process listing (`tasklist` on Windows, `ps` elsewhere).
   - Heuristic matching against common AI/editor tool names (e.g., Cursor, Copilot-adjacent names, Claude, ChatGPT, etc.).
   - Captures whether AI-adjacent tooling is present during active coding windows.

2. **Workspace file activity patterns**
   - Bounded recursive scan (with ignored heavy/system directories like `.git`, `node_modules`, `.ducky`, `dist`).
   - Measures files modified since session start and files scanned.
   - Gives lightweight signal for editing intensity without invasive file-content inspection.

3. **Git workspace activity**
   - Detects whether current directory is a git repository.
   - Tracks branch, commit count, and changed-file count (`git status --porcelain`).
   - Adds version-control context around coding behavior and workspace churn.

### Why this specific mix

- **Process presence** helps infer which AI tools were likely in play.
- **File churn** helps infer active implementation behavior over time.
- **Git state** ties coding activity to repository evolution and work-in-progress size.

No single signal is enough alone; together they provide a stronger behavioral picture while staying passive and local.

## 2) Signal value

AI-usage tracking can add important context that traditional coding assessments often miss.

### What it can reveal

- **Workflow quality under AI assistance**: whether a developer appears to iterate, validate, and converge, versus only generating code bursts.
- **Tool leverage profile**: whether the developer can effectively orchestrate editor, AI assistant, and version control during a session.
- **Operational habits**: whether changes accumulate gradually with checkpoints or as large unstructured churn.

### Why this matters for evaluation

Traditional assessments primarily measure final artifact quality and correctness at a single point in time. AI-era development also depends on process skills:

- prompt-to-implementation translation,
- rapid iteration and correction,
- decomposition and integration,
- judgment about when to accept/reject generated suggestions.

Behavioral telemetry can complement code review by surfacing *how* a result was achieved, not only *what* was submitted.

## 3) Limitations & extensions

### Current limitations

- **Heuristic process matching**: process-name matching can produce false positives/negatives.
- **No semantic code analysis**: current file signal measures change timing/volume, not code intent or quality.
- **No direct editor integration**: this version does not read structured IDE events (e.g., explicit AI completion accept/reject actions).
- **Sampling tradeoff**: periodic polling is intentionally light, but can miss very short-lived events.

### High-value extensions with fewer constraints

1. **Editor-level event adapters (VS Code, Cursor, JetBrains)**
   - Capture explicit AI events: suggestion requested, shown, accepted, edited, rejected.
   - Value: much higher attribution confidence than process heuristics.

2. **Git timeline enrichment**
   - Sample diffs between intervals and classify change patterns (e.g., boilerplate growth vs. refactor stabilization).
   - Value: better understanding of session progression quality.

3. **Terminal command telemetry (local-only opt-in)**
   - Observe local command classes (`test`, `lint`, `build`, `git`) at coarse granularity.
   - Value: reveals verification discipline and debugging loops.

4. **Confidence scoring and signal fusion**
   - Build a weighted confidence model combining process/editor/git/file evidence.
   - Value: robust summary with explicit uncertainty instead of binary judgments.

5. **Session anomaly detection**
   - Flag stale daemons, unusual churn spikes, or inconsistent telemetry windows.
   - Value: improves reliability and trustworthiness of reports in real-world use.

### How I would incorporate these

- Keep the existing collector architecture and add modular adapters per signal source.
- Extend report schema to include per-signal confidence and provenance metadata.
- Use opt-in flags for more sensitive telemetry (especially terminal/editor event streams).
- Preserve strict local-only storage by default, with no network transmission.

---

In short: the implementation emphasizes passive local observability and resilient lifecycle handling first, then builds toward richer attribution quality through modular signal extensions.
