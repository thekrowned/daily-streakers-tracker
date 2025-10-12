import { BOOLEAN, INTEGER, TIMESTAMPTZ, VARCHAR } from "@duckdb/node-api";

// These are DuckDB special types intended for helping SQL insertion
// DO NOT USE OUTSIDE DuckDB'S OWN FUNCTION

const playerDbType = {
	osu_id: INTEGER,
	name: VARCHAR,
	rank_standard: INTEGER,
	current_streak: INTEGER,
	best_daily_streak: INTEGER,
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
