import { Piece } from '../../../model/entities/piece'

export interface PieceRepository {
	getPieces(partId: string): Promise<Piece[]>
	deletePartPieces(partId: string): Promise<void>
}
