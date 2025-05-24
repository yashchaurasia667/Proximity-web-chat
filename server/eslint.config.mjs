import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      js,
      // Add other plugins here if needed
    },
    rules: {
      semi: ["warn"],
      quotes: ["warn", "double"],
      "prefer-arrow-callback": ["warn"],
      "prefer-template": ["warn"],
    },
  },
  tseslint.configs.recommended
]);
