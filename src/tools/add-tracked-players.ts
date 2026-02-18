import { OsuAPI } from "../osu-api.js";
import { ConsolePrefixed } from "../utils/console-prefixed.js";
import { db } from "../database/db.js";
import { eq } from "drizzle-orm";
import { players } from "../database/schema.js";
import { updatePlayerData } from "./update-players.js";

const consolePref = new ConsolePrefixed("[add-tracked-players]");

let processing = false;
const queue: unknown[] = [];

async function addTrackedPlayers() {
	if (queue.length === 0) {
		processing = false;
		return;
	}

	processing = true;

	while (queue.length > 0) {
		try {
			const username = queue[0];
			if (typeof username != "string") {
				continue;
			}

			consolePref.info("Adding " + username);

			const player = await OsuAPI.getUser(username);

			const existingTrackedPlayer = await db
				.select()
				.from(players)
				.where(eq(players.osu_id, player.id));

			if (existingTrackedPlayer.length == 0) {
				await updatePlayerData(player.username);
			}
		} catch (error) {
			consolePref.error(error);
		} finally {
			queue.shift();
		}
	}

	processing = false;
}

async function queueAddTrackedPlayers(usernames: unknown[]) {
	for (let i = 0; i < usernames.length; i++) {
		const newName = usernames[i];
		const existingIndex = queue.findIndex(
			(queuedName) => queuedName === newName,
		);
		if (existingIndex === -1) {
			queue.push(newName);
		}
	}

	if (!processing) {
		await addTrackedPlayers();
	}
}

function getQueueStatus() {
	return {
		queue: [...queue],
		processing: processing ? 1 : 0,
	};
}

export { queueAddTrackedPlayers, getQueueStatus };
