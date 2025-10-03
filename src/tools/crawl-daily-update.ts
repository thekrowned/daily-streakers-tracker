import puppeteer from "puppeteer";
import { DB } from "../db/query.js";

async function crawlAndUpdateDailyPlayers() {
	const BASE_URL = "https://osu.ppy.sh";
	const TODAY = new Date();
	const DATE_URL = `${TODAY.getFullYear()}-${
		TODAY.getUTCMonth() + 1
	}-${TODAY.getUTCDate()}`;
	const ENTRY_URL = `${BASE_URL}/rankings/daily-challenge/${DATE_URL}`;

	// Setup Puppeteer browser instance
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.setViewport({ width: 1080, height: 1024 });

	const allDailyPlayers: { id: number; name: string }[] = [];

	let browsingUrl: string | null = ENTRY_URL;
	while (browsingUrl) {
		const currentBrowsingUrl: string = browsingUrl;
		let nextBrowsingUrl = null;
		console.info(`[crawlAndUpdateDailyPlayers] Navigating ${browsingUrl}`);
		try {
			// Navigate to the specified url
			await page.goto(currentBrowsingUrl);
			// Check out interactivity before doing anything
			await page.locator(".ranking-page-table > tbody").hover();

			const playerListContainer = await page
				.locator(".ranking-page-table > tbody")
				.waitHandle();

			const playersPerPage: typeof allDailyPlayers =
				await playerListContainer.evaluate((elem) => {
					// Get data from within browser context (players)
					// then pass it onto playersPerPage
					const playerRows = elem.querySelectorAll("tr");
					const players: typeof allDailyPlayers = [];

					playerRows.forEach((row) => {
						// Try to get player id & name
						const retrievedId = parseInt(
							row
								.querySelector(".ranking-page-table-main__link.js-usercard")
								?.getAttribute("data-user-id") ?? ""
						);
						const retrievedName = row.querySelector(
							".ranking-page-table-main__link.js-usercard > span"
						)?.textContent;

						// Push values with their correct types
						players.push({
							id: isNaN(retrievedId) ? 0 : retrievedId,
							name: retrievedName ?? "",
						});
					});
					// Pass retrieved values
					return players;
				});

			playersPerPage.forEach((player) => {
				if (player.id || player.name) {
					allDailyPlayers.push({
						id: player.id,
						name: player.name.trim(),
					});
				}
			});

			const navContainer = await page.locator("nav.pagination-v2").waitHandle();

			const detectedNextPageurl: string | null = await navContainer.evaluate(
				(elem) => {
					const nextPageLink = elem.querySelector("div:last-child > a");
					if (nextPageLink?.tagName == "A") {
						return nextPageLink.getAttribute("href") ?? null;
					} else {
						return null;
					}
				}
			);

			if (typeof detectedNextPageurl == "string") {
				nextBrowsingUrl = detectedNextPageurl;
			}
		} catch (error) {
			console.error("[crawlAndUpdateDailyPlayers] ", error);
			nextBrowsingUrl = null;
		} finally {
			if (typeof nextBrowsingUrl == "string") {
				if (currentBrowsingUrl == nextBrowsingUrl) {
					console.error("[crawlAndUpdateDailyPlayers] Looping detected");
					browsingUrl = null;
				} else {
					browsingUrl = nextBrowsingUrl;
				}
			} else {
				console.info("[crawlAndUpdateDailyPlayers] End of navigation");
				browsingUrl = null;
			}
		}
	}

	console.info("[crawlAndUpdateDailyPlayers] Closing browser session");
	await browser.close();

	for (let i = 0; i < allDailyPlayers.length; i++) {
		const player = allDailyPlayers[i];
		const dbExisting = await DB.streaker_tracker.getById(player.id);
		const existing = await dbExisting.getRowObjectsJson();

		if (existing.length == 1) {
			const existingPlayer = existing[0];
			await DB.streaker_tracker.update({
				id: player.id,
				full_streaker: existingPlayer.full_streaker ? true : false,
				has_played_today: true,
				is_streaking: existingPlayer.is_streaking ? true : false,
			});
		}
	}
}

export { crawlAndUpdateDailyPlayers };
