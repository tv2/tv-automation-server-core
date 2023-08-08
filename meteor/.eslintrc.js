const {
	commonPlugins,
	tsPlugins,
	commonExtends,
	tsExtends,
	commonRules,
	tsRules,
	tsParser,
} = require('./node_modules/@sofie-automation/code-standard-preset/eslint/fragments') // eslint-disable-line node/no-unpublished-require

const tmpRules = {
	// Temporary rules to be removed over time
	'@typescript-eslint/ban-types': 'off',
	'@typescript-eslint/explicit-module-boundary-types': 'off',
	'@typescript-eslint/no-namespace': 'off',
	'@typescript-eslint/no-var-requires': 'off',
	'@typescript-eslint/no-inferrable-types': 'off',
	'no-useless-escape': 'off',
	'@typescript-eslint/no-non-null-assertion': 'off',
	'@typescript-eslint/unbound-method': 'off',
	'@typescript-eslint/no-misused-promises': 'off',
	'@typescript-eslint/no-unnecessary-type-assertion': 'off',
}

const tsBase = {
	extends: [...tsExtends, 'plugin:custom-rules/all'],
	plugins: tsPlugins,
	...tsParser,
	settings: {
		node: {
			tryExtensions: ['.js', '.json', '.node', '.ts', '.tsx', '.d.ts'],
		},
	},
	env: {
		'jest/globals': false, // Block jest from this
	},
	rules: {
		...commonRules,
		...tsRules,

		// custom
		'no-inner-declarations': 'off', // some functions are unexported and placed inside a namespace next to related ones
		'node/no-missing-import': [
			'error',
			{
				allowModules: ['meteor', 'mongodb'],
				tryExtensions: ['.js', '.json', '.node', '.ts', '.tsx', '.d.ts'],
			},
		],
		'node/no-extraneous-import': [
			'error',
			{
				allowModules: ['meteor', 'mongodb'],
			},
		],
		'jest/no-standalone-expect': 'off', // testInFiber confuses the rule
		'node/no-unpublished-import': [
			'error',
			{
				allowModules: ['ts-mockito'],
			},
		],
		...tmpRules,
	},
}

module.exports = {
	extends: [...commonExtends, 'plugin:react/recommended'],
	plugins: [...commonPlugins, 'react'],
	rules: {
		'prettier/prettier': [
			'error',
			{
				endOfLine: 'auto',
			},
		],
	},
	env: { es2017: true },
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2018,
		tsconfigRootDir: __dirname,
	},
	settings: {
		react: {
			version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
		},
	},
	overrides: [
		// Note: these replace the values defined above, so make sure to extend them if they are needed
		{
			files: ['*.ts'],
			...tsBase,
		},
		{
			files: ['*.tsx'],
			...tsBase,
			extends: [...tsBase.extends, 'plugin:react/recommended'],
			parserOptions: {
				...tsBase.parserOptions,
				ecmaFeatures: {
					jsx: true, // Allows for the parsing of JSX
				},
			},
			rules: {
				...tsBase.rules,
				'node/no-extraneous-import': 'off', // because there are a lot of them as dev-dependencies
				'node/no-missing-import': 'off', // erroring on every single import
				'react/prop-types': 'off', // we don't use this
				'@typescript-eslint/no-empty-interface': 'off', // many prop/state types are {}
				'@typescript-eslint/promise-function-async': 'off', // event handlers can't be async
			},
		},
		{
			files: ['*.js'],
			env: {
				'jest/globals': false, // Block jest from this
			},
			settings: {
				node: {
					tryExtensions: ['.js', '.json', '.node', '.ts', '.tsx'],
				},
			},
			rules: {
				...commonRules,
				...tmpRules,
			},
		},
		{
			files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.js', '**/__mocks__/**/*.ts'],
			...tsBase,
			env: {
				'jest/globals': true,
				jest: true,
			},
			rules: {
				...tsBase.rules,
				'@typescript-eslint/ban-ts-ignore': 'off',
				'@typescript-eslint/ban-ts-comment': 'off',

				// custom
				'node/no-unpublished-import': 'off',
				'node/no-unpublished-require': 'off',
				'@typescript-eslint/no-non-null-assertion': 'off',
				...tmpRules,
			},
		},
	],
}
