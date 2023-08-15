import { Piece } from '../../../model/entities/piece'

export interface PieceRepository {
	getPieces(partId: string): Promise<Piece[]>
	deletePieces(partId: string): Promise<void>;
}
