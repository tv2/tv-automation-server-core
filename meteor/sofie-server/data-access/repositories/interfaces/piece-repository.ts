import { Piece } from '../../../model/entities/piece'

export interface PieceRepository {
	getPieces(partId: string): Promise<Piece[]>
	deletePiecesForPart(partId: string): Promise<void>
}
