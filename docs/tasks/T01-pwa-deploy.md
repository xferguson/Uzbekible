# T01: PWA manifest, service worker, GitHub Pages deploy

| | |
|---|---|
| Status | todo |
| Lane | A Foundation |
| Depends on | [T00](T00-app-scaffold.md) |
| Precondition | [P0](README.md#p0-precondition) skills/docs PR merged to `main` |
| Skills | `tdd-task`, `pr-flow`, `e2e-visual-check` |
| Branch | `task/T01-pwa-deploy` |

## Goal
Make the app installable and offline-capable, and deploy `main` to GitHub Pages automatically.

## Acceptance criteria
- [ ] `vite-plugin-pwa` with manifest (name/short_name “Uzbekible”, theme cobalt, background glaze white per `docs/design/brief.md`), placeholder icons until D3
- [ ] Precache app shell, fonts, `public/content/*.json`; `autoUpdate` with a “new version” toast
- [ ] `base: '/Uzbekible/'` for Pages
- [ ] `.github/workflows/deploy.yml` triggered by `push` to `main` + `workflow_dispatch`; uses `actions/deploy-pages`
- [ ] e2e: after first load, offline reload still renders the home screen
- [ ] README section documents required repo settings (Pages source = GitHub Actions)

## Test-first plan
- Red: e2e offline test fails before SW exists

## Files likely touched
- `vite.config.ts`
- `.github/workflows/deploy.yml`
- `public/icons/*`
- `e2e/offline.e2e.ts`

## Session prompt (copy-paste)
```
Work on Uzbekible task T01 (PWA manifest, service worker, GitHub Pages deploy). Read CLAUDE.md and docs/tasks/T01-pwa-deploy.md first, and follow the skills it lists (tdd-task, pr-flow, e2e-visual-check). Confirm that its dependencies (T00) are merged to main before you start; if one isn't, stop and tell me. Use red-green TDD, keep to this task's scope, open a draft PR using the template, mark it ready when the fast gate passes, and set the Status row in the task file.
```
