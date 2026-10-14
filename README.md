# IdeaServer — Development

**DEV:** [linuxofpower/IdeaServer-Dev](https://github.com/linuxofpower/IdeaServer-Dev), branch `main`.

**Source / current production-side repository:** [yaMorozYaroslav/IdeaServDev-relocate-](https://github.com/yaMorozYaroslav/IdeaServDev-relocate-), branch `master`. This older repository name remains unchanged; any later production rename needs a separate approved action.

This is the **same application** in two stages. Implement and verify changes in DEV; the production owner (`yaMorozYaroslav`) alone accepts/rejects pull requests and merges to production. No direct production pushes or automated production deployment from DEV. These repositories have independent Git histories.

**Migration:** the original source snapshot `361a163b1165a035d7ff932b917e67f4f726d40f` has exactly the same Git tree SHA as the DEV baseline: `6de560b70228877e9ee9972db2e3488753152ff9` (20 tracked files). The DEV history remains intact.

**DEV CI:** [workflow](.github/workflows/ci.yml), installs locked dependencies and performs syntax validation without starting the database-connected server. CI must not deploy production.

## Local usage

```bash
npm ci
npm start
```

Configure runtime variables separately; never commit real `.env` files, tokens, or database credentials.
