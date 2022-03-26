module.exports = {
	"env": {
		"es2021": true,
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		"@typescript-eslint/no-unused-vars": ["warn", { "varsIgnorePattern": "^_" }],
		"@typescript-eslint/no-explicit-any": ["off"],
		"prefer-const": "off",
		"no-empty": "warn",
		"@typescript-eslint/no-inferrable-types": "warn",
		"no-constant-condition": ["warn", {"checkLoops": false}]
	}
}
