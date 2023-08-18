import { Identifier } from '../../../model/value-objects/identifier'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'

export interface AdLibPieceRepository {
	getAdLibPieceIdentifiers(rundownId: string): Promise<Identifier[]>
	getAdLibPiece(adLibPieceId: string): Promise<AdLibPiece>
}
