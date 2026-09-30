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
      ".vercel/**",
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
      // TanStack Router exige `export const Route` en cada fichero de ruta:
      // no se puede mover a otro módulo sin romper el enrutado por ficheros.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true, allowExportNames: ["Route"] },
      ],
    },
  },
  {
    // Las rutas de TanStack colocan `Route` junto al componente de página
    // (`Route.useSearch()` / `useParams()` atan la página a su `Route`):
    // extraer el componente obligaría a imports circulares o a taladrar
    // props en ~16 ficheros sin cambio de comportamiento. Se desactiva la
    // regla solo aquí; los componentes compartidos sí se movieron a módulos
    // aparte (compare-context, compat-search, tool-search, *-variants).
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
