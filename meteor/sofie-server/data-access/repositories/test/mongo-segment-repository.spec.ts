// import {MongoSegmentRepository} from "../mongo/mongo-segment-repository";
// import {MongoDatabase} from "../mongo/mongo-database";
// import {MongoEntityConverter} from "../mongo/mongo-entity-converter";
// import {Db} from "mongodb";
// import {instance, mock, when} from "ts-mockito";
// import {PartRepository} from "../interfaces/part-repository";
// import {SegmentRepository} from "../interfaces/segment-repository";
//
// describe(`${MongoSegmentRepository.name}`, () => {
// 	describe(`${MongoSegmentRepository.prototype.deleteSegments.name}`, () => {
//
// 	})
//
// 	interface TesteeBuilderParams {
// 		partRepository?: PartRepository
// 		mongoDb?: MongoDatabase
// 		mongoConverter?: MongoEntityConverter
// 	}
//
// 	async function createTestee(db: Db, params: TesteeBuilderParams): Promise<SegmentRepository> {
// 		const partRepository: PartRepository = params.partRepository ?? mock<PartRepository>()
// 		const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
// 		const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)
//
// 		when(mongoDb.getCollection('segments')).thenReturn(db.collection('segments'))
//
// 		return new MongoSegmentRepository(instance(mongoDb), instance(mongoConverter), instance(partRepository))
// 	}
// })
