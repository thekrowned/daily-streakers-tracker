import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { trimTrailingSlash } from "hono/trailing-slash";
import { OsuAPI } from "./osu-api.js";
import { updatePlayersInfo } from "./tools/update-players.js";
import { DB } from "./db/query.js";
import { TimerManager } from "./utils/timer-manager.js";

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
	const dbData = await DB.players_streaker.getAll();
	const players = await dbData.getRowObjectsJson();

	return c.json(players);
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

TimerManager.addInterval({
	name: "Player Info",
	callback: updatePlayersInfo,
	time: 1800_000,
	executeImmediately: true,
});
