import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".output/**",
      "public/catalog/**",
      "src/routeTree.gen.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        // page.evaluate callbacks run in Chromium, not in Node
        document: "readonly",
        window: "readonly",
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      // SSR guard legitimo: localStorage/sessionStorage solo existen en el
      // cliente, asi que la lectura inicial vive en un efecto (react 19).
      "react-hooks/set-state-in-effect": "warn",
      // TanStack Table v8 es una libreria valida; la regla del React Compiler
      // la marca por incompatibilidad de compilacion, no por un bug real.
      "react-hooks/incompatible-library": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
