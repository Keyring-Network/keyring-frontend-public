module.exports = {
  extends: ["@repo/eslint-config/react-internal"],
  rules: {
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-confusing-void-expression": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unnecessary-condition": "off",
    "import/no-extraneous-dependencies": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "no-console": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
  },
};
