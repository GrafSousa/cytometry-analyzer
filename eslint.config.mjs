import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next turns on only a few jsx-a11y rules; the WCAG 2.2 AA target needs them all.
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Code quality limits. The rules lint cannot check are in .claude/skills/code-quality.
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts}"],
    plugins: { sonarjs },
    rules: {
      complexity: ["error", 8],
      "sonarjs/cognitive-complexity": ["error", 10],
      "max-depth": ["error", 3],
      "max-params": ["error", 3],
      "max-nested-callbacks": ["error", 3],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],
      "max-lines": ["error", { max: 250, skipBlankLines: true, skipComments: true }],
      "no-nested-ternary": "error",
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-identical-conditions": "error",
      "sonarjs/no-nested-conditional": "error",
      "sonarjs/no-nested-functions": ["error", { threshold: 3 }],
    },
  },
  // Component conventions (.claude/skills/react-components).
  {
    files: ["**/*.{ts,tsx,mts}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      // Destructuring to drop fields (`{ id, ...rest }`) is how an object loses its identity here.
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            "React.FC": "Type the props parameter instead.",
            FC: "Type the props parameter instead.",
            "React.FunctionComponent": "Type the props parameter instead.",
            FunctionComponent: "Type the props parameter instead.",
          },
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/app/**/{page,layout,template,default,not-found,error,global-error,loading}.tsx"],
    rules: { "import/no-default-export": "error" },
  },
  // The business rules stay pure: no UI, no framework, no I/O.
  {
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom", "next", "next/*"], message: "src/core is pure." },
            { group: ["xlsx"], message: "Only src/adapters/sheetjs.ts imports SheetJS." },
            {
              group: ["@/adapters/*", "@/services/*", "@/components/*", "@/hooks/*", "@/app/*"],
              message: "src/core does not depend on the outer layers.",
            },
          ],
        },
      ],
    },
  },
  // Only the adapter talks to SheetJS.
  {
    files: ["src/**/*.{ts,tsx}"],
    // src/core has its own, stricter list above; a second entry would replace it.
    ignores: ["src/core/**", "src/adapters/sheetjs.ts", "src/adapters/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "xlsx", message: "Only src/adapters/sheetjs.ts imports SheetJS." }] },
      ],
    },
  },
  // A describe block holds many tests, so its length says nothing about complexity.
  {
    files: ["**/*.spec.{ts,tsx}"],
    rules: { "max-lines-per-function": "off", "max-nested-callbacks": ["error", 4] },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);

export default eslintConfig;
