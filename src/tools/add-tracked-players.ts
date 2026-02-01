import { OsuAPI } from "../osu-api.js";
import { ConsolePrefixed } from "../utils/console-prefixed.js";
import { db } from "../database/db.js";
import { eq } from "drizzle-orm";
import { tracked_players } from "../database/schema.js";

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
				.from(tracked_players)
				.where(eq(tracked_players.osu_id, player.id));

			if (existingTrackedPlayer.length != 0) {
				await db
					.update(tracked_players)
					.set({
						name: player.username,
					})
					.where(eq(tracked_players.osu_id, player.id));
			} else {
				await db.insert(tracked_players).values({
					osu_id: player.id,
					name: player.username,
				});
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
