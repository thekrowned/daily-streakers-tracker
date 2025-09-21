import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { trimTrailingSlash } from "hono/trailing-slash";
import { OsuAPI } from "./osu-api.js";

const PORT = parseInt(`${process.env.SERVER_PORT}`);
if (isNaN(PORT)) {
	throw new Error("Please enter server port correctly!");
}

const app = new Hono();

app.use("*", trimTrailingSlash());

app.get(
	"/assets/*",
	serveStatic({
		root: "./",
	})
);

app.get(
	"/*",
	serveStatic({
		root: "./pages/",
	})
);

app.get("/api", (c) => {
	return c.text("* The fire was put down.");
});

app.get("/my-rank", async (c) => {
	const myRank = await OsuAPI.getMyUserRank();
	return c.text(`My osu rank is ${myRank}`);
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
