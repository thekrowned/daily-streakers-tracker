import {
	BOOLEAN,
	DuckDBInstance,
	DuckDBTimestampValue,
	DuckDBTimestampTZValue,
	INTEGER,
	TIMESTAMPTZ,
	VARCHAR,
} from "@duckdb/node-api";

const instance = await DuckDBInstance.create("storage.db");

const storageConn = await instance.connect();

// Table that contains a column that
// references column from another table
// should be dropped first
await storageConn.run("DROP TABLE IF EXISTS streaker_tracker");
// Then you can safely drop the referenced table
await storageConn.run("DROP TABLE IF EXISTS players");

// ============ Player table ============
type playerType = {
	id: number;
	name: string;
	rank_standard: number;
	total_participation: number;
	current_streak: number;
};
const playerDbType = {
	osu_id: INTEGER,
	name: VARCHAR,
	rank_standard: INTEGER,
	current_streak: INTEGER,
	total_participation: INTEGER,
	last_update: TIMESTAMPTZ,
};
await storageConn.run(`
	CREATE TABLE players (
	osu_id              INTEGER PRIMARY KEY,
	name                VARCHAR,
	rank_standard       INTEGER,
	total_participation INTEGER,
	current_streak      INTEGER,
	last_update         TIMESTAMPTZ
	)`);

// ============ Streaker tracker ============
type streakerTrackerType = {
	id: number;
	has_played_today: boolean;
	full_streaker: boolean;
	is_streaking: boolean;
};
const streakerTrackerDbType = {
	player_id: INTEGER,
	has_played_today: BOOLEAN,
	full_streaker: BOOLEAN,
	is_streaking: BOOLEAN,
	last_update: TIMESTAMPTZ,
};
await storageConn.run(`
	CREATE TABLE streaker_tracker (
	player_id           INTEGER REFERENCES players(osu_id),
	has_played_today    BOOLEAN,
	full_streaker       BOOLEAN,
	is_streaking        BOOLEAN,
	last_update         TIMESTAMPTZ
	)`);

// ============ Start of DB class ============
const DB = class {
	// === Players ===
	static players = {
		async getById(id: number) {
			const res = await storageConn.run(
				"SELECT * FROM players WHERE osu_id=$osu_id",
				{
					osu_id: id,
				}
			);
			return res;
		},
		async getAll() {
			const res = await storageConn.run("SELECT * FROM players");
			return res;
		},
		async add(player: playerType) {
			const timestamp = await DB.getTimestampTZ();
			await storageConn.run(
				`
				INSERT INTO players 
				(osu_id, name, rank_standard, current_streak, total_participation, last_update)
				VALUES ($osu_id, $name, $rank_standard, $current_streak, $total_participation, $last_update)`,
				{
					osu_id: player.id,
					name: player.name,
					rank_standard: player.rank_standard,
					current_streak: player.current_streak,
					total_participation: player.total_participation,
					last_update: timestamp,
				},
				playerDbType
			);
		},
		async update(player: playerType) {
			const timestamp = await DB.getTimestampTZ();
			await storageConn.run(
				`
				UPDATE players 
				SET name=$name, rank_standard=$rank_standard, current_streak=$current_streak, total_participation=$total_participation, last_update=$last_update
				WHERE osu_id=$osu_id`,
				{
					osu_id: player.id,
					name: player.name,
					rank_standard: player.rank_standard,
					current_streak: player.current_streak,
					total_participation: player.total_participation,
					last_update: timestamp,
				},
				playerDbType
			);
		},
	};

	// === Streaker specific data ===
	static streaker_tracker = {
		async getById(id: number) {
			const res = await storageConn.run(
				"SELECT * FROM streaker_tracker WHERE player_id=$player_id",
				{
					player_id: id,
				}
			);
			return res;
		},
		async getAll() {
			const res = await storageConn.run("SELECT * FROM streaker_tracker");
			return res;
		},
		async add(streaker: streakerTrackerType) {
			const timestamp = await DB.getTimestampTZ();
			await storageConn.run(
				`
				INSERT INTO streaker_tracker 
				(player_id, has_played_today, full_streaker, is_streaking, last_update)
				VALUES ($player_id, $has_played_today, $full_streaker, $is_streaking, $last_update)`,
				{
					player_id: streaker.id,
					has_played_today: streaker.has_played_today,
					full_streaker: streaker.full_streaker,
					is_streaking: streaker.is_streaking,
					last_update: timestamp,
				},
				streakerTrackerDbType
			);
		},
		async update(streaker: streakerTrackerType) {
			const timestamp = await DB.getTimestampTZ();
			await storageConn.run(
				`
				UPDATE streaker_tracker 
				SET has_played_today=$has_played_today, full_streaker=$full_streaker, is_streaking=$is_streaking, last_update=$last_update
				WHERE player_id=$player_id`,
				{
					player_id: streaker.id,
					has_played_today: streaker.has_played_today,
					full_streaker: streaker.full_streaker,
					is_streaking: streaker.is_streaking,
					last_update: timestamp,
				},
				streakerTrackerDbType
			);
		},
	};

	// === Timestamp functions ===
	static getLocalTimestamp = async function (): Promise<DuckDBTimestampValue> {
		const res = await storageConn.run("select current_localtimestamp()");
		const timestampValue = (
			await res.getColumns()
		)[0][0] as DuckDBTimestampValue;
		return timestampValue;
	};
	static getTimestampTZ = async function (): Promise<DuckDBTimestampTZValue> {
		const res = await storageConn.run(
			"select current_localtimestamp()::TIMESTAMPTZ"
		);
		const timestampTzValue = (
			await res.getColumns()
		)[0][0] as DuckDBTimestampTZValue;
		return timestampTzValue;
	};
};

export { DB };
