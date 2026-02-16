import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { trimTrailingSlash } from "hono/trailing-slash";
import {
	deleteCookie,
	getCookie,
	getSignedCookie,
	setCookie,
	setSignedCookie,
	generateCookie,
	generateSignedCookie,
} from "hono/cookie";

import { OsuAPI } from "./osu-api.js";
import { updatePlayersInfo } from "./tools/update-players.js";
import { crawlAndUpdateDailyPlayers } from "./tools/crawl-daily-update.js";
import { UtcAlarmManager } from "./utils/alarm.js";
import { db } from "./database/db.js";
import { players, daily_tracker, tracked_players } from "./database/schema.js";
import { eq, sql, not } from "drizzle-orm";
import { assertString } from "./utils/assert.js";
import { admin_session } from "./database/schema.js";
import { adminSessionCleanup } from "./tools/admin-session-cleanup.js";
import {
	queueAddTrackedPlayers,
	getQueueStatus,
} from "./tools/add-tracked-players.js";

const PORT = parseInt(`${process.env.SERVER_PORT}`);
if (isNaN(PORT)) {
	throw new Error("Please enter server port correctly!");
}

const ADMIN_USERNAME = assertString(process.env.ADMIN_USERNAME);
const ADMIN_PASSWORD = assertString(process.env.ADMIN_PASSWORD);

const app = new Hono();

app.use("*", trimTrailingSlash());

app.get("/login", (c) => {
	return c.redirect("./login/");
});

app.get("/manage", (c) => {
	return c.redirect("./manage/");
});

app.use("/manage/*", async (c, next) => {
	try {
		const cookie = getCookie(c);
		const sessionValidity = await checkUuidValidity(cookie?.uuid);

		if (!sessionValidity) {
			return c.redirect("../login/");
		}

		const maxAge = await extendUuidSession(cookie?.uuid);
		if (maxAge) {
			c.header(
				"Set-Cookie",
				`uuid=${cookie?.uuid}; Max-Age=${maxAge}; path=/; SameSite=Strict; Secure; HttpOnly`,
			);
		}

		await next();
	} catch (error) {
		console.error(error);
		c.status(500);
		return c.text("Internal Server Error");
	}
});

async function extendUuidSession(clientUuid?: unknown): Promise<number> {
	try {
		if (!clientUuid || typeof clientUuid != "string") {
			return 0;
		}

		const existingUuid = await db
			.select()
			.from(admin_session)
			.where(eq(admin_session.id, clientUuid));

		if (existingUuid.length < 1) {
			return 0;
		}

		const currentTime = new Date();
		const maxAge = 30 * 60;
		const expiryTime = new Date(currentTime.getTime() + maxAge * 1000);

		const dbSession = await db
			.update(admin_session)
			.set({ expires: expiryTime })
			.where(eq(admin_session.id, existingUuid[0].id));

		if (dbSession.changes < 1) {
			throw new Error("Failed to update uuid expiry time to database");
		}

		return maxAge;
	} catch (error) {
		console.error(error);
		return 0;
	}
}

async function checkUuidValidity(clientUuid?: unknown): Promise<boolean> {
	if (!clientUuid || typeof clientUuid != "string") {
		return false;
	}

	const existingUuid = await db
		.select()
		.from(admin_session)
		.where(eq(admin_session.id, clientUuid));

	if (existingUuid.length < 1) {
		return false;
	}

	const currentTime = new Date();

	if (currentTime.getTime() >= existingUuid[0].expires.getTime()) {
		return false;
	}

	return true;
}

app.get(
	"/*",
	serveStatic({
		root: "./pages/",
	}),
);

app.get("/api", (c) => {
	return c.text("Nope, not here.");
});

app.post("/api/auth", async (c) => {
	try {
		const data = await c.req.json();

		const signInValidity =
			data?.username == ADMIN_USERNAME && data?.password == ADMIN_PASSWORD;

		if (!signInValidity) {
			c.status(401);
			return c.json({
				error: true,
				message: "Invalid username and/or password",
			});
		}

		const uuid = crypto.randomUUID();
		const currentTime = new Date();
		const maxAge = 30 * 60;
		const expiryTime = new Date(currentTime.getTime() + maxAge * 1000);

		const dbSession = await db.insert(admin_session).values({
			id: uuid,
			expires: expiryTime,
			created: currentTime,
		});

		if (dbSession.changes < 1) {
			throw new Error("Failed to insert uuid to database");
		}

		c.status(200);
		c.header(
			"Set-Cookie",
			`uuid=${uuid}; Max-Age=${maxAge}; path=/; SameSite=Strict; Secure; HttpOnly`,
		);
		return c.json({
			success: true,
			message: "Successful login",
		});
	} catch (error) {
		console.error(error);
		c.status(500);
		return c.json({
			success: false,
			message: "Internal Server Error",
		});
	}
});

app.use("/api/manage/*", async (c, next) => {
	try {
		const cookie = getCookie(c);
		const sessionValidity = await checkUuidValidity(cookie?.uuid);

		if (!sessionValidity) {
			c.status(401);
			return c.json({
				success: false,
				message: "You're not authenticated, please login.",
			});
		}

		const maxAge = await extendUuidSession(cookie?.uuid);
		if (maxAge) {
			c.header(
				"Set-Cookie",
				`uuid=${cookie?.uuid}; Max-Age=${maxAge}; path=/; SameSite=Strict; Secure; HttpOnly`,
			);
		}

		await next();
	} catch (error) {
		console.error(error);
		c.status(500);
		return c.json({
			success: false,
			message: "Internal Server Error",
		});
	}
});

app.post("/api/manage/add-tracked-players", async (c) => {
	try {
		const data = await c.req.json();

		const players = data?.players;

		if (!Array.isArray(players)) {
			c.status(400);
			return c.json({
				success: false,
				message: "Players array not found",
			});
		}

		queueAddTrackedPlayers(players);

		return c.json({
			success: true,
			message: "Adding username(s) to tracked players… this might take a while",
		});
	} catch (error) {
		console.error(error);
		c.status(500);
		return c.json({
			success: false,
			message: "Internal Server Error",
		});
	}
});

app.get("/api/manage/add-tracked-players/queue-status", async (c) => {
	const { queue, processing } = getQueueStatus();
	return c.json({
		success: true,
		message: "-",
		data: {
			queue: queue.join(", "),
			processing: processing,
		},
	});
});

app.post("/api/manage/remove-tracked-players", async (c) => {
	try {
		const data = await c.req.json();

		const playersId = data?.players_id;

		if (!Array.isArray(playersId)) {
			c.status(400);
			return c.json({
				success: false,
				message: "Players ID array not found",
			});
		}

		let removed: number[] = [];
		let errored: number[] = [];

		for (let i = 0; i < playersId.length; i++) {
			const playerId = playersId[i];

			if (typeof playerId != "number") {
				continue;
			}

			try {
				await db
					.delete(tracked_players)
					.where(eq(tracked_players.osu_id, playerId));
			} catch (error) {
				console.error(error);
				errored.push(playerId);
				continue;
			}

			removed.push(playerId);
		}

		if (errored.length > 0) {
			c.status(500);
			return c.json({
				success: false,
				message:
					"There was an error that caused partial removal of specified player(s)",
				data: {
					removed: removed,
					errored: errored,
				},
			});
		}

		return c.json({
			success: true,
			message: "Successfully removed specified player(s)",
			data: {
				removed: removed,
			},
		});
	} catch (error) {
		console.error(error);
		c.status(500);
		return c.json({
			success: false,
			message: "Internal Server Error",
		});
	}
});

app.get("/api/manage/tracked-players", async (c) => {
	const trackedPlayers = await db.select().from(tracked_players);

	return c.json({
		success: true,
		message: "-",
		data: {
			players: trackedPlayers,
		},
	});
});

app.get("/api/my-rank", async (c) => {
	const myRank = await OsuAPI.getMyUserRank();
	return c.text(`My osu rank is ${myRank}`);
});

app.get("/api/daily-streakers", async (c) => {
	const beginningDate = new Date("2024-07-25T00:00:00+00:00");
	const millisecondsSinceBeginning =
		new Date().getTime() - beginningDate.getTime();
	const daysSinceBeginning = Math.floor(millisecondsSinceBeginning / 86400000);

	const data = await db
		.select({
			osu_id: players.osu_id,
			name: players.name,
			rank_standard: players.rank_standard,
			total_participation: players.total_participation,
			tier_change: sql`
				case 
					when ( 
						(${players.current_daily_streak}=0) and 
						(${daysSinceBeginning - 1}=${daily_tracker.previous_daily_streak}) and 
						(${not(daily_tracker.full_streaker)}) 
					) then -3
					when (
						(${players.current_daily_streak}=0) and 
						(${daily_tracker.previous_daily_streak}>=30) 
					) then -2
					when (
						(${players.current_daily_streak}=0) and 
						(${daily_tracker.previous_daily_streak}>=2) 
					) then -1
					when (
						(${daily_tracker.previous_daily_streak}<2) and
						(${daily_tracker.is_streaking}) 
					) then 1
					else 0
				end`,
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
	},
);

const updatePlayersTimes: [number, number][] = [];
updatePlayersTimes.push([0, 10]);
updatePlayersTimes.push([0, 40]);
for (let i = 1; i <= 23; i++) {
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
		[23, 15],
		[23, 45],
	],
});

const adminSessionCleaningTimes: [number, number][] = [];
for (let i = 1; i <= 23; i++) {
	adminSessionCleaningTimes.push([i, 0]);
	adminSessionCleaningTimes.push([i, 30]);
}

UtcAlarmManager.add({
	name: "Auth Cleanup",
	callback: adminSessionCleanup,
	time: adminSessionCleaningTimes,
});
