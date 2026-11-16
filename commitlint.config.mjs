const config = {
  extends: ["@commitlint/config-conventional"],
  // Dependabot writes long release notes in the body, which would break body-max-line-length.
  ignores: [(message) => message.includes("Signed-off-by: dependabot[bot]")],
};

export default config;
