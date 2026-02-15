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
