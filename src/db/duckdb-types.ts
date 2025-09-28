import { BOOLEAN, INTEGER, TIMESTAMPTZ, VARCHAR } from "@duckdb/node-api";

const playerDbType = {
	osu_id: INTEGER,
	name: VARCHAR,
	rank_standard: INTEGER,
	current_streak: INTEGER,
	total_participation: INTEGER,
	last_update: TIMESTAMPTZ,
};

const streakerTrackerDbType = {
	player_id: INTEGER,
	has_played_today: BOOLEAN,
	full_streaker: BOOLEAN,
	is_streaking: BOOLEAN,
	last_update: TIMESTAMPTZ,
};

export { playerDbType, streakerTrackerDbType };
