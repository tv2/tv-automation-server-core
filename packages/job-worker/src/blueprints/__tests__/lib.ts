import { BlueprintManifestType, SomeBlueprintManifest } from '@sofie-automation/blueprints-integration'
import { protectString } from '@sofie-automation/corelib/dist/protectedString'
import { literal } from '@sofie-automation/corelib/dist/lib'
import { Blueprint } from '@sofie-automation/corelib/dist/dataModel/Blueprint'

export function generateFakeBlueprint(
	id: string,
	type?: BlueprintManifestType,
	codeFcn?: () => SomeBlueprintManifest
): Blueprint {
	const codeFcnString = codeFcn
		? codeFcn.toString()
		: `\
() => ({
  blueprintType: ${type ? `"${type}"` : 'undefined'},
  blueprintVersion: '0.0.0',
  integrationVersion: '0.0.0',
  TSRVersion: '0.0.0',
  studioConfigManifest: [],
  studioMigrations: [],
  getBaseline: () => {
	return {
      timelineObjects: [],
    }
  },
  getShowStyleId: () => null
})`

	return literal<Blueprint>({
		_id: protectString(id),
		name: 'Fake blueprint',
		organizationId: null,
		code: `({default: (${codeFcnString})()})`,
		created: 0,
		modified: 0,

		blueprintId: protectString(''),
		blueprintType: type,

		studioConfigManifest: [],
		showStyleConfigManifest: [],

		databaseVersion: {
			showStyle: {},
			studio: {},
		},

		blueprintVersion: '',
		integrationVersion: '',
		TSRVersion: '',
	})
}
