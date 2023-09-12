export enum Tv2CasparCgLayer {
	CasparCGDVELoop = 'casparcg_dve_loop',
	CasparCGLYD = 'casparcg_audio_lyd',
	CasparPlayerClipPending = 'casparcg_player_clip_pending',
	CasparPlayerJingle = 'casparcg_player_jingle',
}

export enum Tv2SisyfosLayer {
	SisyfosConfig = 'sisyfos_config',
	SisyfosSourceClipPending = 'sisyfos_source_clip_pending',
	SisyfosSourceJingle = 'sisyfos_source_jingle',
	SisyfosSourceTLF = 'sisyfos_source_tlf_hybrid',
	SisyfosSourceHost_1_ST_A = 'sisyfos_source_Host_1_st_a',
	SisyfosSourceHost_2_ST_A = 'sisyfos_source_Host_2_st_a',
	SisyfosSourceGuest_1_ST_A = 'sisyfos_source_Guest_1_st_a',
	SisyfosSourceGuest_2_ST_A = 'sisyfos_source_Guest_2_st_a',
	SisyfosSourceGuest_3_ST_A = 'sisyfos_source_Guest_3_st_a',
	SisyfosSourceGuest_4_ST_A = 'sisyfos_source_Guest_4_st_a',
	SisyfosSourceHost_1_ST_B = 'sisyfos_source_Host_1_st_b',
	SisyfosSourceHost_2_ST_B = 'sisyfos_source_Host_2_st_b',
	SisyfosSourceGuest_1_ST_B = 'sisyfos_source_Guest_1_st_b',
	SisyfosSourceGuest_2_ST_B = 'sisyfos_source_Guest_2_st_b',
	SisyfosSourceGuest_3_ST_B = 'sisyfos_source_Guest_3_st_b',
	SisyfosSourceGuest_4_ST_B = 'sisyfos_source_Guest_4_st_b',
	SisyfosSourceLive_1 = 'sisyfos_source_live_1',
	SisyfosSourceLive_2 = 'sisyfos_source_live_2',
	SisyfosSourceLive_3 = 'sisyfos_source_live_3',
	SisyfosSourceLive_4 = 'sisyfos_source_live_4',
	SisyfosSourceLive_5 = 'sisyfos_source_live_5',
	SisyfosSourceLive_6 = 'sisyfos_source_live_6',
	SisyfosSourceLive_7 = 'sisyfos_source_live_7',
	SisyfosSourceLive_8 = 'sisyfos_source_live_8',
	SisyfosSourceLive_9 = 'sisyfos_source_live_9',
	SisyfosSourceLive_10 = 'sisyfos_source_live_10',
	SisyfosSourceServerA = 'sisyfos_source_server_a',
	SisyfosSourceServerB = 'sisyfos_source_server_b',
	// SisyfosSourceServerC = 'sisyfos_source_server_c',
	SisyfosSourceEVS_1 = 'sisyfos_source_evs_1',
	SisyfosSourceEVS_2 = 'sisyfos_source_evs_2',
	SisyfosSourceEpsio = 'sisyfos_source_epsio',

	// "Shared" layers according to Blueprints
	SisyfosSourceAudiobed = 'sisyfos_source_audiobed',
	SisyfosResync = 'sisyfos_resync',
	SisyfosGroupStudioMics = 'sisyfos_group_studio_mics',
	SisyfosPersistedLevels = 'sisyfos_persisted_levels',
}

export enum Tv2AbstractLayer {
	SERVER_ENABLE_PENDING = 'server_enable_pending',
}
