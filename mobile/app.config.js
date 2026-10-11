/* Adds which code the app is running to its config: the branch and commit the dev server or build was started from,
   and whether it has changes not yet committed. The app shows it while testing (src/components/BuildTag.tsx).
   Everything else stays in app.json. */

const { execSync } = require('node:child_process');

const git = (args) => {
  try {
    return execSync(`git ${args}`, { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
  } catch {
    return null;
  }
};

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    build: {
      branch: git('rev-parse --abbrev-ref HEAD'),
      // EAS builds may not include the repository's history, but they say which commit they built.
      commit: git('rev-parse --short HEAD') ?? process.env.EAS_BUILD_GIT_COMMIT_HASH?.slice(0, 7) ?? null,
      committedAt: git('log -1 --format=%cI'),
      changed: !!git('status --porcelain'),
    },
  },
});
