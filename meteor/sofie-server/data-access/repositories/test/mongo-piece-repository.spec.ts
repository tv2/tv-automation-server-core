// import { MongoPieceRepository } from '../mongo/mongo-piece-repository'
// import { MongoTestDatabase } from './mongo-test-database'
// import { Piece, PieceInterface } from '../../../model/entities/piece'
//
// describe(`${MongoPieceRepository.name}`, () => {
// 	const testDatabase: MongoTestDatabase = new MongoTestDatabase()
// 	beforeAll(async () => await testDatabase.beforeAll())
// 	afterAll(async () => testDatabase.afterAll())
//
// 	describe(`${MongoPieceRepository.prototype.deletePieces.name}`, () => {})
//
// 	interface PieceBuilderParams {
// 		id?: string
// 		name?: string
// 		rank?: number
// 		partId?: string
// 	}
//
// 	// TODO: Extract to Helper Class in Model layer
// 	function createPiece(params: PieceBuilderParams): Piece {
// 		return new Piece({
// 			id: params.id ?? 'id' + Math.random(),
// 			name: params.name ?? 'name' + Math.random(),
// 			partId: params.partId ?? 'segmentId' + Math.random(),
// 		} as PieceInterface)
// 	}
// })
