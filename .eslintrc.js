module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  globals: {
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    ecmaFeatures: {
      modules: true,
      jsx: true
    }
  },
  plugins: [
    "sort-imports-es6-autofix",
    "@typescript-eslint",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "camelcase": [
      "error",
      { properties: "never", ignoreDestructuring: true }
    ],
    "prettier/prettier": "error",
    "sort-imports-es6-autofix/sort-imports-es6": [
      "error",
      {
        ignoreCase: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ["none", "all", "multiple", "single"]
      }
    ],
    "no-template-curly-in-string": "error",
    "require-atomic-updates": "error",
    curly: ["error", "all"],
    "dot-notation": "error",
    eqeqeq: "error",
    "no-alert": "warn",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-empty-function": "off",
    "no-empty-pattern": "warn",
    "no-eq-null": "error",
    "no-eval": "error",
    "no-extend-native": "error",
    "no-extra-bind": "error",
    "no-floating-decimal": "error",
    "no-implicit-coercion": "error",
    "no-implicit-globals": "error",
    "no-implied-eval": "error",
    "no-iterator": "error",
    "no-lone-blocks": "warn",
    "no-loop-func": "error",
    "no-multi-str": "error",
    "no-new-wrappers": "error",
    "no-proto": "error",
    "no-restricted-properties": "warn",
    "no-return-assign": "error",
    "no-return-await": "off",
    "no-script-url": "error",
    "no-self-compare": "warn",
    "no-sequences": "error",
    "no-throw-literal": "error",
    "no-unused-expressions": "warn",
    "no-unused-vars": "off",
    "no-useless-call": "error",
    "no-useless-catch": "error",
    "no-useless-concat": "error",
    "no-useless-return": "error",
    "no-void": "error",
    "no-warning-comments": ["off", { location: "anywhere" }],
    "no-with": "error",
    radix: ["error", "as-needed"],
    "require-await": "warn",
    yoda: "error",
    "consistent-this": "error",
    "func-name-matching": "error",
    "lines-between-class-members": [
      "error",
      "always",
      { exceptAfterSingleLine: true }
    ],
    "max-len": [
      "error",
      {
        code: 80,
        ignoreComments: true,
        ignorePattern: "^import\\s.+\\sfrom\\s.+;$",
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      },
    ],
    "new-cap": "error",
    "no-lonely-if": "error",
    "no-multi-assign": "error",
    "no-negated-condition": "error",
    "no-nested-ternary": "error",
    "no-trailing-spaces": "error",
    "no-unneeded-ternary": "error",
    "no-whitespace-before-property": "error",
    "one-var": ["error", "never"],
    "operator-assignment": "error",
    "arrow-spacing": "error",
    "no-duplicate-imports": "error",
    "no-useless-computed-key": "error",
    "no-useless-constructor": "error",
    "no-useless-rename": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-arrow-callback": "error",
    "prefer-const": "error",
    "prefer-const": "error",
    "prefer-destructuring": ["error", { array: false, object: true }],
    "prefer-numeric-literals": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "prefer-template": "error"
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        // CARGO This works because some rando GitHubber said it might.
        // https://github.com/typescript-eslint/typescript-eslint/issues/46#issuecomment-470486034
        "@typescript-eslint/no-unused-vars": "warn"
      }
    }
  ]
};
