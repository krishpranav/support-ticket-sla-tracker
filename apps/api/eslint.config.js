import tseslint from "typescript-eslint";
export default tseslint.config({ ignores: ["generated/**"] }, ...tseslint.configs.recommendedTypeChecked, { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } }, rules: { "@typescript-eslint/no-explicit-any": "error", "@typescript-eslint/no-floating-promises": "error" } });
