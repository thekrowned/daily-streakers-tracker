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

// ===== Main =====
async function main() {
	await generatePlayersItem();
}

main();
