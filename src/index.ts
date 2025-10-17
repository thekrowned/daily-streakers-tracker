import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { trimTrailingSlash } from "hono/trailing-slash";
import { OsuAPI } from "./osu-api.js";
import { updatePlayersInfo } from "./tools/update-players.js";
// import { DB } from "./db/query.js";
import { TimerManager } from "./utils/timer-manager.js";
import { crawlAndUpdateDailyPlayers } from "./tools/crawl-daily-update.js";
import { UtcAlarmManager } from "./utils/alarm.js";
import { db } from "./database/db.js";
import { players, daily_tracker } from "./database/schema.js";
import { eq, sql } from "drizzle-orm";

const PORT = parseInt(`${process.env.SERVER_PORT}`);
if (isNaN(PORT)) {
	throw new Error("Please enter server port correctly!");
}

const app = new Hono();

app.use("*", trimTrailingSlash());

app.get(
	"/*",
	serveStatic({
		root: "./pages/",
	})
);

app.get("/api", (c) => {
	return c.text("Nope, not here.");
});

app.get("/api/my-rank", async (c) => {
	const myRank = await OsuAPI.getMyUserRank();
	return c.text(`My osu rank is ${myRank}`);
});

app.get("/api/daily-streakers", async (c) => {
	const data = await db
		.select({
			osu_id: players.osu_id,
			name: players.name,
			rank_standard: players.rank_standard,
			total_participation: players.total_participation,
			current_streak: players.current_daily_streak,
			best_daily_streak: players.best_daily_streak,
			previous_daily_streak: daily_tracker.previous_daily_streak,
			has_played_today: daily_tracker.has_played_today,
			full_streaker: daily_tracker.full_streaker,
			is_streaking: daily_tracker.is_streaking,
			last_update: sql`concat(${daily_tracker.last_update},'+00')`,
		})
		.from(players)
		.leftJoin(daily_tracker, eq(daily_tracker.osu_id, players.osu_id));

	return c.json(data);
});

serve(
	{
		fetch: app.fetch,
		port: PORT,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);

// TimerManager.addInterval({
// 	name: "Player Info",
// 	callback: updatePlayersInfo,
// 	time: 1800_000,
// 	executeImmediately: true,
// });

// TimerManager.addInterval({
// 	name: "Crawler",
// 	callback: crawlAndUpdateDailyPlayers,
// 	time: 900_000,
// });

const updatePlayersTimes: [number, number][] = [];
for (let i = 0; i < 23; i++) {
	updatePlayersTimes.push([i, 1]);
	updatePlayersTimes.push([i, 35]);
}

UtcAlarmManager.add({
	name: "Update Player Info (API)",
	callback: updatePlayersInfo,
	time: updatePlayersTimes,
});

UtcAlarmManager.add({
	name: "Crawler",
	callback: crawlAndUpdateDailyPlayers,
	time: [
		[23, 0],
		[23, 15],
		[23, 30],
		[23, 45],
	],
});
