const promisify = require('util').promisify
const rimraf = promisify(require('rimraf'))

log('Removing all artifacts...')

async function rimrafLog(command) {
	log('  ' + command)
	return rimraf(command)
}

;(async () => {
	log(`resetting...`);
	await Promise.allSettled(
		[
			'./meteor/.meteor/local',
			'./meteor/node_modules',
			'./meteor/coverage',

			'./packages/node_modules',
			'./packages/*/node_modules',
			'./packages/*/dist',
		].map(rimrafLog)
	).catch(log)
	log(`...done!`)
	log(`To install everything again, run "yarn start"`)
})().catch(log)

function log(...args) {
	// eslint-disable-next-line no-console
	console.log(...args)
}
