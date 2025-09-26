const fullStreakersList = document.getElementById("streakers-list-full");
const casualStreakersList = document.getElementById("streakers-list-casual");
const notStreakersList = document.getElementById("streakers-list-not");

function createStreakersItem(playerName, hasPlayedToday) {
	const li = document.createElement("li");
	li.classList.add("streakers-list__item");
	li.textContent = playerName;
	if (hasPlayedToday) {
		li.classList.add("streakers-list__item--played");
		li.setAttribute("aria-description", "Played today");
	}
	return li;
}

async function fetchStreakers() {
	const res = await fetch("/api/daily-streakers");

	if (!res.ok || res.status != 200) {
		throw new Error("Error fetching data");
	}

	const streakers = await res.json();

	if (!Array.isArray(streakers)) {
		throw new Error("Data is not of array type");
	}

	return streakers;
}

async function main() {
	const streakers = await fetchStreakers();
	streakers.forEach((player) => {
		const playerElement = createStreakersItem(
			player.name,
			player.has_played_today
		);
		if (player.full_streaker) {
			fullStreakersList.appendChild(playerElement);
		} else {
			if (player.is_streaking) {
				casualStreakersList.appendChild(playerElement);
			} else {
				notStreakersList.appendChild(playerElement);
			}
		}
	});
}

main();
