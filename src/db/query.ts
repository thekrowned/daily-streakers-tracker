import { DuckDBTimestampValue, DuckDBTimestampTZValue } from "@duckdb/node-api";
import { storageConn } from "./conn.js";
import type { playerType, streakerTrackerType } from "./insert-types.js";
import { playerDbType, streakerTrackerDbType } from "./duckdb-types.js";

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
				(osu_id, name, rank_standard, current_streak, best_daily_streak, total_participation, last_update)
				VALUES ($osu_id, $name, $rank_standard, $current_streak, $best_daily_streak, $total_participation, $last_update)`,
				{
					osu_id: player.id,
					name: player.name,
					rank_standard: player.rank_standard,
					current_streak: player.current_streak,
					total_participation: player.total_participation,
					best_daily_streak: player.best_daily_streak,
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
				SET name=$name, rank_standard=$rank_standard, current_streak=$current_streak, best_daily_streak=$best_daily_streak, total_participation=$total_participation, last_update=$last_update
				WHERE osu_id=$osu_id`,
				{
					osu_id: player.id,
					name: player.name,
					rank_standard: player.rank_standard,
					current_streak: player.current_streak,
					total_participation: player.total_participation,
					best_daily_streak: player.best_daily_streak,
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

	// === Players & streaker data combined ===
	static players_streaker = {
		async getAll() {
			const res = await storageConn.run(`
				SELECT
					pl.osu_id,
					pl.name,
					pl.rank_standard,
					pl.total_participation,
					pl.current_streak,
					pl.best_daily_streak,
					st.has_played_today,
					st.full_streaker,
					st.is_streaking,
					st.last_update
				FROM players pl
				LEFT JOIN streaker_tracker st ON st.player_id=pl.osu_id
			`);
			return res;
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
