import * as React from 'react'
import { Translated, translateWithTracker } from '../../lib/ReactMeteorData/react-meteor-data'
import { doModalDialog } from '../../lib/ModalDialog'
import { MeteorReactComponent } from '../../lib/MeteorReactComponent'
import * as FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { faBinoculars, faDatabase, faCoffee } from '@fortawesome/fontawesome-free-solid'
import { Meteor } from 'meteor/meteor'
import { logger } from '../../../lib/logging'
import {
	MigrationMethods,
	GetMigrationStatusResultMigrationNeeded,
	GetMigrationStatusResult,
	MigrationStepInput,
	MigrationStepInputResult,
	RunMigrationResult
} from '../../../lib/api/migration'
import * as _ from 'underscore'
import { EditAttribute, EditAttributeBase } from '../../lib/EditAttribute'

interface IProps {
}
interface IState {
	errorMessage?: string
	systemVersion: string
	databaseVersion: string
	migrationNeeded: boolean
	databasePreviousVersion: string | null

	migration?: {
		canDoAutomaticMigration: boolean
		manualInputs: Array<MigrationStepInput>
		hash: string
		baseVersion: string
		targetVersion: string
		automaticStepCount: number
		ignoredStepCount: number
		manualStepCount: number
		partialMigration: boolean
	},
	warnings: Array<string>,
	migrationCompleted: boolean,
	partialMigration: boolean,

	haveRunMigration: boolean,

	inputValues: {
		[stepId: string]: {
			[attribute: string]: any
		}
	}
}
interface ITrackedProps {
}
export const MigrationView = translateWithTracker<IProps, IState, ITrackedProps>((props: IProps) => {
	return {
	}
})( class MigrationView extends MeteorReactComponent<Translated<IProps & ITrackedProps>, IState> {
	private
	constructor (props: Translated<IProps & ITrackedProps>) {
		super(props)
		this.state = {
			systemVersion: '',
			databaseVersion: '',
			databasePreviousVersion: null,
			migrationNeeded: false,
			warnings: [],
			migrationCompleted: false,
			partialMigration: false,
			haveRunMigration: false,

			inputValues: {}
		}
	}
	componentDidMount () {
		this.updateVersions()
	}
	clickRefresh () {
		this.setState({
			warnings: [],
			migrationCompleted: false,
			haveRunMigration: false,
		})

		this.updateVersions()
	}
	setErrorMessage (err) {
		this.setState({
			errorMessage: _.isString(err) ? err : err.reason || err.toString() || (err + '')
		})
	}
	updateVersions () {
		this.setState({
			errorMessage: '',
			systemVersion: '',
			databaseVersion: '',
			databasePreviousVersion: '',
			migrationNeeded: false
		})
		Meteor.call(MigrationMethods.getMigrationStatus, (err, r: GetMigrationStatusResult) => {
			if (err) {
				logger.error(err)
				// todo: notify user
				this.setErrorMessage(err)
			} else {
				this.setState({
					systemVersion: r.systemVersion,
					databaseVersion: r.databaseVersion,
					databasePreviousVersion: r.databasePreviousVersion,
					migrationNeeded: r.migrationNeeded
				})
				if (r.migrationNeeded) {
					let result = r as GetMigrationStatusResultMigrationNeeded
					this.setState({
						migration: result.migration
					})

				}
			}
		})
	}
	runMigration () {

		let inputResults: Array<MigrationStepInputResult> = []

		// _.each(this.state.inputValues, (iv, stepId: string) => {
		// 	_.each(iv, (value: any, attribute: string) => {
		// 		inputResults.push({
		// 			stepId: stepId,
		// 			attribute: attribute,
		// 			value: value
		// 		})
		// 	})
		// })
		if (this.state.migration) {
			_.each(this.state.migration.manualInputs, (manualInput ) => {
				if (manualInput.stepId && manualInput.attribute) {
					let value: any
					let step = this.state.inputValues[manualInput.stepId]
					if (step) {
						value = step[manualInput.attribute]
					}
					inputResults.push({
						stepId: manualInput.stepId,
						attribute: manualInput.attribute,
						value: value
					})
				}
			})
			this.setErrorMessage('')
			Meteor.call(MigrationMethods.runMigration,
				this.state.migration.baseVersion, // baseVersionStr
				this.state.migration.targetVersion, // targetVersionStr
				this.state.migration.hash, // hash
				inputResults, // inputResults
			(err, r: RunMigrationResult) => {
				if (err) {
					logger.error(err)
					// todo: notify user
					this.setErrorMessage(err)
				} else {
					this.setState({
						warnings: r.warnings,
						migrationCompleted: r.migrationCompleted,
						haveRunMigration: true
					})

					this.updateVersions()
				}
			})
		}
	}
	forceMigration () {
		this.setErrorMessage('')
		if (this.state.migration) {
			Meteor.call(MigrationMethods.forceMigration,
				this.state.migration.targetVersion, // targetVersionStr
			(err) => {
				if (err) {
					logger.error(err)
					// todo: notify user
					this.setErrorMessage(err)
				} else {
					this.setState({
						migrationCompleted: true,
						haveRunMigration: true
					})

					this.updateVersions()
				}
			})
		}

	}
	setDatabaseVersion (version: string) {
		const { t } = this.props
		this.setErrorMessage('')
		doModalDialog({
			title: t('Set database version'),
			message: t('Are you sure you want to set the database version to') + ` ${version}?`,
			onAccept: () => {
				Meteor.call(MigrationMethods.forceMigration,
					version, // targetVersionStr
				(err) => {
					if (err) {
						logger.error(err)
						// todo: notify user
						this.setErrorMessage(err)
					} else {
						this.updateVersions()
					}
				})
			}
		})
	}
	renderManualSteps () {
		if (this.state.migration) {
			let rank = 0
			return _.map(this.state.migration.manualInputs, (manualInput: MigrationStepInput) => {

				if (manualInput.stepId) {
					let stepId = manualInput.stepId
					let value
					if (manualInput.attribute) {
						value = (this.state.inputValues[stepId] || {})[manualInput.attribute]
						if (_.isUndefined(value)) {
							value = manualInput.defaultValue
						}
					}
					return (<div key={rank++}>
						<h3>{manualInput.label}</h3>
						<div>{manualInput.description}</div>
						<div>{
							manualInput.inputType && manualInput.attribute ?
							<EditAttribute
								type={manualInput.inputType}
								overrideDisplayValue={value}
								updateFunction={(edit: EditAttributeBase, newValue: any ) => {
									if (manualInput.attribute) {
										let inputValues = this.state.inputValues
										if (!inputValues[stepId]) inputValues[stepId] = {}
										inputValues[stepId][manualInput.attribute] = newValue

										this.setState({
											inputValues: inputValues
										})
									}

								}}
							/>
							: null
						}
						</div>
					</div>)
				} else {
					return null
				}
			})
		}
	}
	render () {
		const { t } = this.props

		return (
			<div className='studio-edit mod mhl mvs'>
				<div>

					<div>
						<div>
							{t('System version')}: {this.state.systemVersion || '-'}
						</div>
						<div>
							{t('Database version')}: {this.state.databaseVersion || '-'}
						</div>
						<div>
							{this.state.errorMessage}
						</div>
						<div>
							<button className='btn mod mhm' onClick={() => { this.clickRefresh() }}>
								<FontAwesomeIcon icon={faBinoculars} />
								{t('Refresh')}
							</button>

							{
								this.state.databaseVersion &&
								this.state.databasePreviousVersion &&
								this.state.databasePreviousVersion !== '0.0.0' &&
								this.state.databaseVersion !== this.state.databasePreviousVersion ?
									<button className='btn mod mhm' onClick={() => {
										if (this.state.databasePreviousVersion) {
											this.setDatabaseVersion(this.state.databasePreviousVersion)
										}
									}}>
										<FontAwesomeIcon icon={faDatabase} />
										{t('Reset version to') + ` ${this.state.databasePreviousVersion}`}
									</button>
								: null
							}
							{
								this.state.databaseVersion && this.state.databaseVersion !== '0.0.0' ?
								<button className='btn mod mhm' onClick={() => { this.setDatabaseVersion('0.0.0') }}>
									<FontAwesomeIcon icon={faDatabase} />
									{t('Reset version to') + ` 0.0.0`}
								</button>
								: null
							}
						</div>
					</div>
					{this.state.migrationNeeded && this.state.migration ?
						<div>
							<h2>Migrate database, from {this.state.migration.baseVersion} to {this.state.migration.targetVersion}</h2>

							<div>
								{t(`This migration consists of ${this.state.migration.automaticStepCount} automatic steps and  ${this.state.migration.manualStepCount} manual steps (${this.state.migration.ignoredStepCount} steps are ignored).`)}
							</div>

							{this.state.migration.partialMigration ?
								<div>
									{t('The migration consists of several phases.')}
								</div> : null
							}
							{this.state.migration.canDoAutomaticMigration ?
								<div>
									<div>
										{t('The migration can be completed automatically.')}
									</div>
									<button className='btn-primary' onClick={() => { this.runMigration() }}>
										<FontAwesomeIcon icon={faDatabase} />
										{t('Run automatic migration procedure')}
									</button>
								</div>
							:
							<div>
								<div>
									{t('The migration procedure needs some help from you in order to complete, see below:')}
								</div>
								<div>
									{this.renderManualSteps()}
								</div>
								<button className='btn-primary' onClick={() => {
									doModalDialog({
										title: t('Double-check Values'),
										message: t('Are you sure the values you have entered are correct?'),
										onAccept: () => {
											this.runMigration()
										}
									})
								}}>
									<FontAwesomeIcon icon={faBinoculars} />
									{t('Run Migration Procedure')}
								</button>
							</div>
							}

							{this.state.warnings.length ?
								<div>
									<h3>{t('Warnings during migration')}</h3>
									<ul>
										{_.map(this.state.warnings, (warning, key) => {
											return (<li key={key}>
												{warning}
											</li>)
										})}
									</ul>
								</div>
							: null}

							{this.state.haveRunMigration && !this.state.migrationCompleted ?
								<div>
									<div>
										<div>
											{t('Please check the database related to the warnings above. If neccessary, you can')}
										</div>
										<button className='btn-secondary' onClick={() => {
											doModalDialog({
												title: t('Force migration'),
												message: t('Are you sure you want to force the migration? This will bypass the migration checks, so be sure to verify that the values in the settings are correct!'),
												onAccept: () => {
													this.forceMigration()
												}
											})
										}}>
											<FontAwesomeIcon icon={faDatabase} />
											{t('Force migration (unsafe)')}
										</button>
									</div>
								</div>
							: null}

						</div>
					: null}

					{this.state.migrationCompleted ?
						<div>
							{t('The migration has completed successfully!')}
						</div>
					: null}

					{!this.state.migrationNeeded ?
						<div>
							{t('All is well, go get a')}&nbsp;<FontAwesomeIcon icon={faCoffee} />
						</div>
					: null}
				</div>
			</div>
		)
	}
})
