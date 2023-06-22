import { Rundown } from '../../../model/rundown'
import { Segment } from '../../../model/segment'

export interface MongoRundown {
	_id: string
	externalId: string,
	name: string,
	timing: {
		type: string
		expectedStart: number
		expectedDuration: number
		expectedEnd: number
	}
	playlistExternalId: string,
	metaData: {
		rank: number
	}
	notes: any[]
	organizationId: string
	studioId: string
	showStyleVariantId: string
	showStyleBaseId: string
}

export interface MongoSegment {
	_id: string
	name: string
	rundownId: string,
	externalId: string
}

export class MongoEntityConverter {

	convertRundown(mongoRundown: MongoRundown): Rundown {
		return {
			id: mongoRundown._id,
			name: mongoRundown.name,
			isActive: false,
			segments: []
		}
	}

	convertRundowns(mongoRundowns: MongoRundown[]): Rundown[] {
		return mongoRundowns.map(this.convertRundown)
	}

	convertSegment(mongoSegment: MongoSegment): Segment {
		return {
			id: mongoSegment._id,
			name: mongoSegment.name,
			isOnAir: false,
			parts: []
		}
	}

	convertSegments(mongoSegments: MongoSegment[]): Segment[] {
		return mongoSegments.map(this.convertSegment)
	}
}
