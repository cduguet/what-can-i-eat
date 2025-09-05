# Agents instructions
The main user and developer documentation lives in the `docs/` directory.

Cross-links
- Working rules live here in `AGENTS.md`.
- Current product truth and coordination log live in `CONTEXT.md`.
- Design tokens, theming, and UI guidance live in `docs/design-system.md`.

# Coordination
All progress from agents, for coordination with other agents should be written in `CONTEXT.md`.

Update `CONTEXT.md` when any of the following occur:
- Behavior changes (screens, navigation, defaults, feature flags).
- Configuration changes (env vars, API endpoints, keys required).
- Architecture changes (new services/components of record).
- Theming or design token changes impacting UI.

Keep CONTEXT short; link to code and docs. When facts conflict, verify and prefer what the code currently does.

Template for a `CONTEXT.md` coordination entry:
- YYYY-MM-DD: Short description of change; Files: `path/one`, `path/two`. Notes: one line if needed.

# Environments
When creating an environment and packages, document how to use and update them in `CONTEXT.md` (Environment & Scripts section). Do not install packages globally; prefer local installs and `npx`.

# Tests
For every component, perform as many tests as you can. Prefer focused/unit tests near the changed code, then broaden.

Test prompts:
- Does this change affect user flow or parsing? Add/adjust unit tests accordingly.
- Touches theme/UI? Include snapshot or RTL assertions wrapped with ThemeProvider.

# Autonomy
Automate tests and terminal executions where possible. Use non-interactive flags (e.g., `-y`) and timeouts to avoid blocking.

# Stack
This application targets Mobile and Web using Expo. Keep dependencies and patterns aligned with Expo/React Native.

# Per module git committing
Whenever you finish a change, stage and commit modified files with a clear message. Keep changes scoped. If the change alters behavior/config, update `CONTEXT.md` in the same commit.

Commit checklist:
- [ ] Code/docs updated and formatted.
- [ ] Tests added/updated (if applicable) and pass locally.
- [ ] `CONTEXT.md` updated with a dated coordination entry (if applicable).
- [ ] No global installs; environment notes updated in `CONTEXT.md` if needed.

Pull Request checklist (if using PRs):
- [ ] Link to files changed that substantiate the CONTEXT update.
- [ ] Screenshots or short notes for UI changes.
- [ ] Security/keys not committed; env instructions updated.

See `CONTEXT.md` → “How To Update This Document” for the concise rules and the coordination entry template.
