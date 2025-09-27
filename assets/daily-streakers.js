let streakersData = null;

const fullStreakersList = document.getElementById("streakers-list-full");
const casualStreakersList = document.getElementById("streakers-list-casual");
const notStreakersList = document.getElementById("streakers-list-not");
const sorterSelect = /** @type {HTMLSelectElement} */ (
	document.getElementById("sorter__select")
);

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

async function renderStreakersItem(streakers) {
	if (!Array.isArray(streakers)) {
		throw new Error("Data is not of array type");
	}

	fullStreakersList.innerHTML = "";
	casualStreakersList.innerHTML = "";
	notStreakersList.innerHTML = "";

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

async function sortStreakers(streakers, mode) {
	if (!Array.isArray(streakers)) {
		throw new Error("Data is not of array type");
	}
	let streakersSorted = null;
	switch (mode) {
		case "name":
			streakersSorted = streakers.toSorted(
				(a, b) => a.name.toUpperCase() > b.name.toUpperCase()
			);
			break;
		case "rank":
			streakersSorted = streakers.toSorted(
				(a, b) => a.rank_standard - b.rank_standard
			);
			break;
		case "streak":
			// Sorted by name first and then by total streak
			// There's probably a better way of doing this
			streakersSorted = streakers.toSorted(
				(a, b) => a.name.toUpperCase() > b.name.toUpperCase()
			);
			streakersSorted = streakersSorted.toSorted(
				(a, b) => b.current_streak - a.current_streak
			);
			break;
		default:
			break;
	}
	if (!Array.isArray(streakersSorted)) {
		throw new Error("Failed to sort the streakers");
	}
	return streakersSorted;
}

sorterSelect.addEventListener("input", async (e) => {
	const value = e.target.value;
	streakersData = await sortStreakers(streakersData, value);
	renderStreakersItem(streakersData);
});

async function main() {
	const streakers = await fetchStreakers();
	streakersData = await sortStreakers(streakers, "name");
	renderStreakersItem(streakersData);
}

main();
