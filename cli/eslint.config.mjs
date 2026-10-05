import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
    ignores: ['.delivery/**', 'node_modules/**', 'eslint.config.mjs', 'tests/coverage/**']
}, eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked, {
    languageOptions: {
        parserOptions: {
            project: true,
            tsconfigRootDir: import.meta.dirname
        }
    },
    rules: {
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                args: 'all',
                argsIgnorePattern: '^_',
                caughtErrors: 'all',
                caughtErrorsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                ignoreRestSiblings: true
            }
        ],
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn'
    }
});
