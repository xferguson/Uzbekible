# Uzbekible

Games that make Uzbek happen. Uzbekible is a phone-first PWA of arcade-style games that use Uzbek as the
medium of play, styled after the blue-and-white tilework of Samarkand, Bukhara and Khiva. It is built to explore one
question: *with intermediate Turkish, what is the fastest path to Uzbek?*

- Product: [docs/PRD.md](docs/PRD.md) · Games: [docs/games/](docs/games/)
- Design: [docs/design/brief.md](docs/design/brief.md)
- Engineering: [docs/technical-design.md](docs/technical-design.md) · [docs/architecture.md](docs/architecture.md)
- Work queue: [docs/tasks/README.md](docs/tasks/README.md)
- Agent conventions: [CLAUDE.md](CLAUDE.md) · [.claude/skills.md](.claude/skills.md)

## Working on it
Open a session and say **"Do <task ID>"** (e.g. "Do D1"). See [docs/tasks/README.md](docs/tasks/README.md).
Agents merge their own PRs once CI is green; approval-gated (🔒) tasks wait for your OK.

## Repository settings required
- **Settings → Pages → Source:** GitHub Actions. `.github/workflows/deploy.yml` builds and deploys `main` on every push
  (and on manual `workflow_dispatch`) to <https://xferguson.github.io/Uzbekible/>.
- The app is built with `base: '/Uzbekible/'`; if the repository is renamed, update `base`, `start_url` and `scope`
  in `vite.config.ts`.
