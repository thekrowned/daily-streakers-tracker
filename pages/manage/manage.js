// @ts-check
"use strict";
const formAddPlayer = document.getElementById("form-add-player");

formAddPlayer.addEventListener("submit", async (e) => {
	e.preventDefault();

	const playerNames = [];

	const data = new FormData(formAddPlayer);
	const playerNameData = data.get("player-name");

	if (typeof playerNameData == "string") {
		const players = playerNameData.split(";");

		for (let i = 0; i < players.length; i++) {
			const player = players[i].trim();

			if (player.length > 0) {
				playerNames.push(player);
			}
		}
	}

	try {
		if (playerNames.length <= 0) {
			throw new Error("Empty or undetected usernames!");
		}

		const addPlayersResponse = await fetch(
			"../api/manage/add-tracked-players",
			{
				method: "POST",
				body: JSON.stringify({
					players: playerNames,
				}),
				headers: { "Content-Type": "application/json" },
			},
		);

		const addPlayersResData = await addPlayersResponse.json();

		if (addPlayersResData?.success === true) {
			alert(
				`${playerNames.length} players detected. ${addPlayersResData?.message}`,
			);
			formAddPlayer.reset();
		} else {
			throw new Error(addPlayersResData?.message ?? "");
		}
	} catch (error) {
		console.error(error);
		alert(`${error?.message || "Something unexpected happened."}`);
	}
});

// ===== Generate players-item =====
const playerItemTemplate = document.importNode(
	document.getElementById("template-players-item").content,
	true,
);

function createPlayersItem({ id, name }) {
	const newPlayerItem = playerItemTemplate.cloneNode(true);
	const input = newPlayerItem.querySelector("input");
	input.setAttribute("name", `player-${id}`);
	input.setAttribute("id", `player-${id}`);
	input.setAttribute("data-id", id);
	input.setAttribute("data-name", name);
	const label = newPlayerItem.querySelector("label");
	label.setAttribute("for", `player-${id}`);
	label.textContent = name;

	return newPlayerItem;
}

async function generatePlayersItem() {
	try {
		const res = await fetch("../api/manage/tracked-players");

		if (!res.ok || res.status != 200) {
			throw new Error("Error fetching data");
		}

		const data = await res.json();
		const players = await data.data.players;

		if (!Array.isArray(players)) {
			throw new Error("Data is not of array type");
		}

		const playersList = document.querySelector("ul.players-list");

		playersList.innerHTML = "";

		players.forEach((player) => {
			const playerItem = createPlayersItem({
				id: player.osu_id,
				name: player.name,
			});

			playersList.appendChild(playerItem);
		});
	} catch (error) {
		console.error(error);
		alert(`${error?.message || "Something unexpected happened."}`);
	}
}

// ===== Remove players =====

const buttonPlayersRemove = document.getElementById("players-remove");

buttonPlayersRemove.addEventListener("click", async () => {
	const players = [];

	const playerItems = document.querySelectorAll(
		".players-list > .players-item > input",
	);

	for (let i = 0; i < playerItems.length; i++) {
		const playerItem = playerItems[i];
		const playerId = parseInt(playerItem.getAttribute("data-id"));
		const playerName = playerItem.getAttribute("data-name");
		const checked = playerItem.checked;

		if (!isNaN(playerId) && playerId >= 0 && checked) {
			players.push({
				id: playerId,
				name: playerName || playerId,
			});
		}
	}

	try {
		console.log(players);
		console.log(playerItems);
		if (players.length <= 0) {
			throw new Error("No player(s) selected!");
		}

		const confirmRemove = prompt(
			`Do you want to remove ${players.length} tracked player(s)? If so, type "${players.length}".\nAffected username(s): ${players.map((p) => p.name).join(", ")}`,
		);

		if (parseInt(confirmRemove) !== players.length) {
			return;
		}

		const removePlayersResponse = await fetch(
			"../api/manage/remove-tracked-players",
			{
				method: "POST",
				body: JSON.stringify({
					players_id: players.map((p) => p.id),
				}),
				headers: { "Content-Type": "application/json" },
			},
		);

		const removePlayersResData = await removePlayersResponse.json();

		const removed = removePlayersResData?.data?.removed;
		const errored = removePlayersResData?.data?.errored;

		if (removePlayersResData?.success === true) {
			alert(`Removed ${removed.length} players`);
		} else {
			if (Array.isArray(errored)) {
				// Log errored players
				const erroredNames = [];
				errored.forEach((e) => {
					const name = players.find((p) => p.id === e)?.name || e;
					erroredNames.push(name);
				});
				console.error("Errored", erroredNames);

				throw new Error(`Failed to remove ${errored.length} players.`);
			} else {
				throw new Error(removePlayersResData?.message ?? "");
			}
		}

		generatePlayersItem();
	} catch (error) {
		console.error(error);
		alert(`${error?.message || "Something unexpected happened."}`);
	}
});

// ===== Main =====
async function main() {
	await generatePlayersItem();
}

main();
