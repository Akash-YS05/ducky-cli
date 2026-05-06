# Ducky

## Explanation

`ducky` is a local-first TypeScript CLI that passively tracks AI-usage-adjacent development signals during a coding session.

It runs as a detached background daemon and provides two primary commands:

- `ducky start`: starts tracking in the current project directory.
- `ducky stop`: stops tracking and writes `ducky-report.json` in the project root.

### Signals currently tracked

- Process-level AI tool presence heuristics.
- Workspace file activity (including extension touch counts and extension sequence).
- Git workspace context (repo detection, branch, changed file count, commit count).

State is kept in `.ducky/` while active, and tracking/reporting is local-only.

## Setup

```bash
npm install
npm run build
npm link
```

After linking, you can run `ducky` globally.

## Usage

Start tracking from a project directory:

```bash
ducky start
```

Stop tracking and generate report:

```bash
ducky stop
```

## Development

- `npm run build` - compile TypeScript to `dist/`.
- `npm start` - run compiled CLI entry.
- `npm run dev` - run TypeScript entry directly.
