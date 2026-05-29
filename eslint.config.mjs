import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Fotos de cliente sao blob/object URLs (URL.createObjectURL) —
      // next/image nao otimiza URLs de runtime, entao <img> e o correto aqui.
      "@next/next/no-img-element": "off",
      // Padrao intencional: cada lib/*.ts e uma store em localStorage; as paginas
      // sincronizam via useEffect(() => carregar()) + listener de evento custom.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
