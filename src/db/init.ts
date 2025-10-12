import { storageConn } from "./conn.js";

// Table that contains a column that
// references column from another table
// should be dropped first
await storageConn.run("DROP TABLE IF EXISTS streaker_tracker");
// Then you can safely drop the referenced table
await storageConn.run("DROP TABLE IF EXISTS players");

await storageConn.run(`
	CREATE TABLE players (
	osu_id              INTEGER PRIMARY KEY,
	name                VARCHAR,
	rank_standard       INTEGER,
	total_participation INTEGER,
	current_streak      INTEGER,
	best_daily_streak		INTEGER,
	last_update         TIMESTAMPTZ
	)`);

await storageConn.run(`
	CREATE TABLE streaker_tracker (
	player_id           INTEGER REFERENCES players(osu_id),
	has_played_today    BOOLEAN,
	full_streaker       BOOLEAN,
	is_streaking        BOOLEAN,
	last_update         TIMESTAMPTZ
	)`);
