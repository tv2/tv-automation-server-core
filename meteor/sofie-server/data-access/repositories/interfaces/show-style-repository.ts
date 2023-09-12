import { ShowStyle } from '../../../model/entities/show-style'

export interface ShowStyleRepository {
	getShowStyle(showStyleId: string): Promise<ShowStyle>
}
