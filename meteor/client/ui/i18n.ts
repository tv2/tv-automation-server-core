import moment from 'moment'
import i18n, { TFunction } from 'i18next'
import Backend from 'i18next-xhr-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { WithManagedTracker } from '../lib/reactiveData/reactiveDataHelper'
import { PubSub } from '../../lib/api/pubsub'
import {
	Translation,
	TranslationsBundle,
	TranslationsBundleId,
	TranslationsBundles,
} from '../../lib/collections/TranslationsBundles'
import { I18NextData } from '@sofie-automation/blueprints-integration'
import { MeteorCall } from '../../lib/api/methods'
import { ClientAPI } from '../../lib/api/client'

const i18nOptions = {
	fallbackLng: {
		nn: ['nb', 'en'],
		default: ['en'],
	},

	// have a common namespace used around the full app
	ns: ['translations'],
	defaultNS: 'translations',

	debug: false,
	joinArrays: '\n',

	whitelist: ['en', 'nb', 'nn', 'sv'],

	keySeparator: '→',
	nsSeparator: '⇒',
	pluralSeparator: '⥤',
	contextSeparator: '⥤',

	interpolation: {
		escapeValue: false, // not needed for react!!
	},

	react: {
		wait: true,
		useSuspense: false,
	},
}

function toI18NextData(translations: Translation[]): I18NextData {
	const data = {}
	for (const { original, translation } of translations) {
		data[original] = translation
	}

	return data
}

function getAndCacheTranslationBundle(bundleId: TranslationsBundleId) {
	return new Promise<TranslationsBundle>((resolve, reject) =>
		MeteorCall.userAction.getTranslationBundle(bundleId).then(
			(response) => {
				if (ClientAPI.isClientResponseSuccess(response) && response.result) {
					localStorage.setItem(`i18n.translationBundles.${bundleId}`, JSON.stringify(response.result))
					resolve(response.result)
				} else {
					reject(response)
				}
			},
			(reason) => {
				reject(reason)
			}
		)
	)
}

class I18nContainer extends WithManagedTracker {
	i18nInstance: typeof i18n

	constructor() {
		super()

		this.i18nInstance = i18n
			.use(Backend)
			.use(LanguageDetector)
			.use(initReactI18next)

		this.i18nInstance.init(i18nOptions, (err: Error, t: TFunction) => {
			if (err) {
				console.error('Error initializing i18Next:', err)
			} else {
				this.i18nTranslator = t
				moment.locale(i18n.language)
				document.documentElement.lang = i18n.language
			}
		})

		this.subscribe(PubSub.translationsBundles, {})
		this.autorun(() => {
			console.debug('ManagedTracker autorun...')
			const bundlesInfo = TranslationsBundles.find().fetch() as Omit<TranslationsBundle, 'data'>[]
			console.debug(`Got ${bundlesInfo.length} bundles from database`)
			Promise.allSettled(
				bundlesInfo.map((bundle) =>
					new Promise<TranslationsBundle>((resolve, reject) => {
						const bundleString = localStorage.getItem(`i18n.translationBundles.${bundle._id}`)
						if (bundleString) {
							// check hash
							try {
								const bundleObj = JSON.parse(bundleString) as TranslationsBundle
								if (bundleObj.hash === bundle.hash) {
									resolve(bundleObj) // the cached bundle is up-to-date
									return
								}
							} finally {
								// the cache seems to be corrupt, we re-fetch from backend
								resolve(getAndCacheTranslationBundle(bundle._id))
							}
						} else {
							resolve(getAndCacheTranslationBundle(bundle._id))
						}
					})
						.then((bundle) => {
							const i18NextData = toI18NextData(bundle.data)

							this.i18nInstance.addResourceBundle(
								bundle.language,
								bundle.namespace || i18nOptions.defaultNS,
								i18NextData,
								true,
								true
							)
							console.debug('i18instance updated', {
								bundle: { lang: bundle.language, ns: bundle.namespace },
							})
						})
						.catch((reason) => {
							console.error(`Failed to fetch translations bundle "${bundle._id}": `, reason)
						})
				)
			).then(() => console.debug(`Finished updating ${bundlesInfo.length} translation bundles`))
		})
	}
	// return key until real translator comes online
	i18nTranslator(key, ...args) {
		console.debug('i18nTranslator placeholder called', { key, args })

		if (!args[0]) {
			return key
		}

		if (typeof args[0] === 'string') {
			return key || args[0]
		}

		if (args[0].defaultValue) {
			return args[0].defaultValue
		}

		if (typeof key !== 'string') {
			return key
		}

		const options = args[0]
		if (options?.replace) {
			Object.assign(options, { ...options.replace })
		}

		let interpolated = String(key)
		for (const placeholder of key.match(/[^{\}]+(?=})/g) || []) {
			const value = options[placeholder] || placeholder
			interpolated = interpolated.replace(`{{${placeholder}}}`, value)
		}

		return interpolated
	}
}

const container = new I18nContainer()
const i18nTranslator: TFunction = (key, options) => {
	return container.i18nTranslator(key, options)
}

export { i18nTranslator }

/*
 Notes:
 * How to use i18n in React:
	export const MyReactClass = withTranslation()(class MyReactClass extends React.Component<IProps & WithTranslation, IState> {
		render () {
			const {t} = this.props
			t('My name is {{name}}', {name: 'foobar'})
		}
	})

 * How to use in script:
	import { i18nTranslator } from '../i18n'
	const t = i18nTranslator
	return t('My name is {{name}}', {name: 'foobar'})
 */
