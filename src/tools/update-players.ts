import path from "path";
import { readJson } from "../utils/read-json.js";
import { OsuAPI } from "../osu-api.js";
import { User } from "osu-api-v2-js";
import { assertString } from "../utils/assert.js";
// import { DB } from "../db/query.js";
import { ConsolePrefixed } from "../utils/console-prefixed.js";
import { db } from "../database/db.js";
import { players, daily_tracker } from "../database/schema.js";
import { eq, sql } from "drizzle-orm";

const consolePref = new ConsolePrefixed("[updatePlayersInfo]");

const beginningDate = new Date("2024-07-25T00:00:00+00:00");

async function updatePlayersInfo() {
	try {
		const playerNames = await readJson(
			path.join(path.resolve(), "tracked-players.json")
		);

		if (!Array.isArray(playerNames)) {
			throw new Error("The JSON file should be in array");
		}
		for (let i = 0; i < playerNames.length; i++) {
			const playerName = playerNames[i];
			if (typeof playerName != "string" && typeof playerName != "number") {
				throw new Error("Player must be string or number");
			}
			consolePref.info(`Inserting ${playerName}`);

			let user: null | User.Extended = null;

			try {
				user = await OsuAPI.getUser(playerName);
			} catch (error) {
				consolePref.error(error);
				continue;
			}

			const lastUpdate = user.daily_challenge_user_stats.last_update;
			const today = new Date();

			const playedToday = (() => {
				const lastDate = lastUpdate?.getUTCDate();
				const lastMonth = lastUpdate?.getUTCMonth();
				const lastYear = lastUpdate?.getUTCFullYear();

				const todayDate = today?.getUTCDate();
				const todayMonth = today?.getUTCMonth();
				const todayYear = today?.getUTCFullYear();

				if (
					todayDate == lastDate &&
					todayMonth == lastMonth &&
					todayYear == lastYear
				) {
					return true;
				} else {
					return false;
				}
			})();

			const playerInsertData = {
				id: user.id,
				name: user.username,
				rank_standard: user.statistics.global_rank ?? 0,
				current_streak: user.daily_challenge_user_stats.daily_streak_current,
				total_participation: user.daily_challenge_user_stats.playcount,
				best_daily_streak: user.daily_challenge_user_stats.daily_streak_best,
			};

			const existingPlayer = await db
				.select()
				.from(players)
				.where(eq(players.osu_id, playerInsertData.id));

			if (existingPlayer.length != 0) {
				await db
					.update(players)
					.set({
						name: playerInsertData.name,
						rank_standard: playerInsertData.rank_standard,
						best_daily_streak: playerInsertData.best_daily_streak,
						current_daily_streak: playerInsertData.current_streak,
						total_participation: playerInsertData.total_participation,
						last_update: sql`(current_timestamp)`,
					})
					.where(eq(players.osu_id, playerInsertData.id));
			} else {
				await db.insert(players).values({
					osu_id: playerInsertData.id,
					name: playerInsertData.name,
					rank_standard: playerInsertData.rank_standard,
					best_daily_streak: playerInsertData.best_daily_streak,
					current_daily_streak: playerInsertData.current_streak,
					total_participation: playerInsertData.total_participation,
					last_update: sql`(current_timestamp)`,
				});
			}

			const millisecondsSinceBeginning =
				today.getTime() - beginningDate.getTime();
			const daysSinceBeginning = Math.floor(
				millisecondsSinceBeginning / 86400000
			);

			const incomingCurrentDailyStreak = playerInsertData.current_streak;
			const storedCurrentDailyStreak =
				existingPlayer.length != 0
					? existingPlayer[0].current_daily_streak
					: null;

			const streakerInsertData = {
				id: user.id,
				has_played_today: playedToday,
				full_streaker:
					user.daily_challenge_user_stats.daily_streak_current >=
					daysSinceBeginning
						? true
						: false,
				is_streaking:
					user.daily_challenge_user_stats.daily_streak_current >= 2
						? true
						: false,
			};

			const existingStreak = await db
				.select()
				.from(daily_tracker)
				.where(eq(daily_tracker.osu_id, streakerInsertData.id));

			if (existingStreak.length != 0) {
				// Compare two daily_streak_current values
				// one from the api, another one from db (players table)
				// If it's the same, don't change anything
				// Otherwise, set previous_daily_streak to the value of
				// 		daily_streak_current from players table
				const storedPreviousDailyStreak =
					existingStreak[0].previous_daily_streak;
				let previousDailyStreak = null;

				if (incomingCurrentDailyStreak === storedCurrentDailyStreak) {
					previousDailyStreak = storedPreviousDailyStreak;
				} else {
					consolePref.info("Setting new value");
					previousDailyStreak = storedCurrentDailyStreak;
				}

				// If it's still null set to newest value from api
				if (previousDailyStreak == null) {
					previousDailyStreak = incomingCurrentDailyStreak;
				}

				consolePref.info(
					`Curr (${storedCurrentDailyStreak} > ${incomingCurrentDailyStreak}) | Prev (${storedPreviousDailyStreak} > ${previousDailyStreak})`
				);

				await db
					.update(daily_tracker)
					.set({
						full_streaker: streakerInsertData.full_streaker,
						has_played_today: streakerInsertData.has_played_today,
						is_streaking: streakerInsertData.is_streaking,
						previous_daily_streak: previousDailyStreak,
						last_update: sql`(current_timestamp)`,
					})
					.where(eq(daily_tracker.osu_id, streakerInsertData.id));
			} else {
				await db.insert(daily_tracker).values({
					full_streaker: streakerInsertData.full_streaker,
					has_played_today: streakerInsertData.has_played_today,
					is_streaking: streakerInsertData.is_streaking,
					osu_id: streakerInsertData.id,
					previous_daily_streak: incomingCurrentDailyStreak,
					last_update: sql`(current_timestamp)`,
				});
			}
		}
	} catch (error) {
		consolePref.error(error);
	}
}

export { updatePlayersInfo };
