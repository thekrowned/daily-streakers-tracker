import path from "path";
import { readJson } from "../utils/read-json.js";
import { OsuAPI } from "../osu-api.js";
import { assertString } from "../utils/assert.js";
// import { DB } from "../db/query.js";
import { ConsolePrefixed } from "../utils/console-prefixed.js";
import { db } from "../database/db.js";
import { players, daily_tracker } from "../database/schema.js";
import { eq } from "drizzle-orm";

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

			const user = await OsuAPI.getUser(playerName);

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
				.where(eq(players.osu_id, user.id));

			if (existingPlayer.length != 0) {
				await db
					.update(players)
					.set(playerInsertData)
					.where(eq(players.osu_id, user.id));
			} else {
				await db.insert(players).values(playerInsertData);
			}

			const millisecondsSinceBeginning =
				today.getTime() - beginningDate.getTime();
			const daysSinceBeginning = Math.floor(
				millisecondsSinceBeginning / 86400000
			);

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
				.where(eq(daily_tracker.osu_id, user.id));

			if (existingStreak.length != 0) {
				await db
					.update(daily_tracker)
					.set(streakerInsertData)
					.where(eq(daily_tracker.osu_id, user.id));
			} else {
				await db.insert(daily_tracker).values(streakerInsertData);
			}
		}
	} catch (error) {
		consolePref.error(error);
	}
}

export { updatePlayersInfo };
