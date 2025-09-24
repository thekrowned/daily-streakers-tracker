// Yeah, it's all setTimeout sorry
import path from "path";
import { readJson } from "./utils/read-json.js";
import { OsuAPI } from "./osu-api.js";
import { assertString } from "./utils/assert.js";
import { DB } from "./db.js";

async function getPlayersInfo() {
	const logTime = new Date();
	console.info("[getPlayersInfo]", logTime.toUTCString());
	const playerNames = await readJson(
		path.join(path.resolve(), "src", "tracked-players.json")
	);

	if (!Array.isArray(playerNames)) {
		throw new Error("The JSON file should be in array");
	}

	for (let i = 0; i < playerNames.length; i++) {
		const playerName = assertString(playerNames[i]);
		console.info("[getPlayersInfo]", `Inserting ${playerName}`);
		const user = await OsuAPI.getUser(playerName);

		const playedToday = (() => {
			const lastUpdate = user.daily_challenge_user_stats.last_update;
			const lastDate = lastUpdate?.getUTCDate();
			const lastMonth = lastUpdate?.getUTCMonth();
			const lastYear = lastUpdate?.getUTCFullYear();

			const today = new Date();
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
			has_played_today: playedToday,
			total_participation: user.daily_challenge_user_stats.playcount,
		};

		const existingPlayer = await DB.players.getById(user.id);

		if (existingPlayer) {
			await DB.players.update(playerInsertData);
		} else {
			await DB.players.add(playerInsertData);
		}
	}

	setTimeout(() => getPlayersInfo(), 1800_000);
}

async function runCron() {
	console.log("Running cron");
	getPlayersInfo();
}

export { runCron };
