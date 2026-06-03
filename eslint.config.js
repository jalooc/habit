import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { includeIgnoreFile } from '@eslint/compat'
import eslint from '@eslint/js'
import stylisticPlugin from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import fpPlugin from 'eslint-plugin-fp'
import arrowFunctionsPlugin from 'eslint-plugin-prefer-arrow-functions'
import hooksPlugin from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
  globalIgnores(['src/domains/convex/convex/_generated']),
  ...defineConfig(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    includeIgnoreFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')),
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      plugins: {
        '@stylistic': stylisticPlugin,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        fp: fpPlugin,
        'prefer-arrow-functions': arrowFunctionsPlugin,
        'react-hooks': hooksPlugin,
        'react-refresh': reactRefresh,
      },
      languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: [
              'babel.config.js',
              'setupTests.js',
              'metro.config.js',
            ],
          },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        indent: ['error', 2, {
          flatTernaryExpressions: true,
          SwitchCase: 1,
        }],
        '@stylistic/quotes': ['error', 'single'],
        '@stylistic/comma-dangle': ['error', {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'only-multiline',
        }],
        '@stylistic/jsx-quotes': ['error', 'prefer-double'],
        '@stylistic/eol-last': ['error', 'always'],
        '@stylistic/object-curly-spacing': ['error', 'always', {
          arraysInObjects: true,
          objectsInObjects: false,
        }],
        '@stylistic/operator-linebreak': ['error', 'after'],
        '@stylistic/quote-props': ['error', 'as-needed'],
        '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
        '@stylistic/no-multi-spaces': ['error'],
        '@stylistic/space-infix-ops': ['error'],
        '@stylistic/jsx-max-props-per-line': ['error', { maximum: 1, when: 'multiline' }],
        '@stylistic/max-len': ['error', {
          code: 120,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        }],
        '@stylistic/no-trailing-spaces': 'error',
        '@stylistic/member-delimiter-style': ['error', {
          multiline: { delimiter: 'comma', requireLast: true },
          singleline: { delimiter: 'comma', requireLast: false },
          multilineDetection: 'brackets',
        }],
        '@stylistic/object-curly-newline': ['error', { consistent: true, multiline: true }],
        '@stylistic/arrow-parens': ['error', 'as-needed'],
        '@stylistic/dot-location': ['error', 'property'],
        '@stylistic/function-call-argument-newline': ['error', 'consistent'],
        '@stylistic/indent-binary-ops': ['error', 2],
        '@stylistic/jsx-closing-bracket-location': ['error', 'line-aligned'],
        '@stylistic/jsx-curly-brace-presence': ['error', {
          props: 'never',
          children: 'never',
          propElementValues: 'always',
        }],
        '@stylistic/jsx-indent-props': ['error', 2],
        '@stylistic/jsx-one-expression-per-line': ['error', { allow: 'single-line' }],
        '@stylistic/jsx-pascal-case': ['error', {
          allowNamespace: true,
          ignore: [
            '$[[:upper:]]*', // for the Legend State components
          ],
        }],
        '@stylistic/jsx-tag-spacing': ['error', {
          closingSlash: 'never',
          beforeSelfClosing: 'always',
          afterOpening: 'never',
          beforeClosing: 'proportional-always',

        }],
        '@stylistic/jsx-wrap-multilines': ['error', {
          declaration: 'parens-new-line',
          assignment: 'parens-new-line',
          return: 'parens-new-line',
          arrow: 'parens-new-line',
          condition: 'parens-new-line',
          logical: 'parens-new-line',
          prop: false,
          propertyValue: 'parens-new-line',
        }],
        '@stylistic/no-confusing-arrow': 'off',
        '@stylistic/no-tabs': 'error',
        '@stylistic/no-whitespace-before-property': 'error',
        '@stylistic/nonblock-statement-body-position': ['error', 'beside'],
        '@stylistic/space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
        '@stylistic/wrap-iife': ['error', 'inside'],
        '@stylistic/wrap-regex': 'off',
        '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'strict' }],
        'space-in-parens': ['error', 'never'],
        '@stylistic/semi': ['error', 'never'],
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreVoidOperator: true }],
        '@typescript-eslint/no-meaningless-void-operator': 'off',
        'object-shorthand': [2, 'always'],
        'no-restricted-imports': ['error', {
          paths: [
            {
              name: 'react',
              importNames: ['default'],
              message: 'Default import of React is not allowed. Use named imports instead.',
            },
            {
              name: 'expo-notifications',
              message: 'Import from `src/notifications` instead for additional type-safety layer.',
            },
          ],
          patterns: [{
            regex: 'src/(?!(domains/.*/(components|utils|assets|screens|stores)[/.*]?))',
            message: 'Organize modules in predefined groups under domains.',
          }, {
            /*
                Modules are often divided into sub-modules for readability and maintainability, where those
                sub-modules are internal to the "root" modules. This rule prevents importing those sub-modules
                (which happens often by laziness or an overlook) in order to keep the modules SOLID.
              */
            group: ['src/domains/*/*/*/**'],
            message: 'Direct importing of sub-modules is not allowed. Turn the sub-module into a root module' +
              ' or reexport it from the "owning" module if you really need to use it directly.',
          }, {
            /*
              This rule promotes abstracting module's internal details away from the consumers. For instance,
              a consumer should not care if a module is a simple, single-file module "src/module.ts" or
              a complex directory with "src/module/index.ts" file: in both cases, the import should say:
              "import from 'src/module'".
            */
            group: ['**/index.*', '**/index'],
            message: 'Take advantage of the fact that "index" files are implicit - import the directory instead.',
          }],
        }],
        '@typescript-eslint/ban-ts-comment': ['error', {
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        }],
        'prefer-const': 'error',
        'prefer-arrow-functions/prefer-arrow-functions': 'error',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-misused-promises': ['error', {
          checksVoidReturn: false,
        }],
        'no-restricted-syntax': [
          'error',
          {
            selector: 'BinaryExpression[operator=\'instanceof\']',
            message:
              'The `instanceof` operator might produce false negatives if the value and the instance' +
              ' originate in different realms, which is especially likely in browser extensions. Use with' +
              ' caution at own risk.',
          },
        ],
        'react-refresh/only-export-components': [
          'warn',
          { allowConstantExport: true },
        ],
      },
    }
  ),
]
