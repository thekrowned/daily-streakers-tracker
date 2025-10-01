let streakersData = null;

const LOCAL_STORAGE_AVAILABLE = storageAvailable("localStorage");

const fullStreakersList = document.getElementById("streakers-list-full");
const casualStreakersList = document.getElementById("streakers-list-casual");
const notStreakersList = document.getElementById("streakers-list-not");
const sorterSelect = /** @type {HTMLSelectElement} */ (
	document.getElementById("sorter__select")
);
const spanInfo = document.getElementById("info");

function createStreakersItem(playerName, osuId, hasPlayedToday) {
	const li = document.createElement("li");
	li.classList.add("streakers-list__item");

	const link = document.createElement("a");
	link.classList.add("streakers-list__link");
	link.textContent = playerName;
	link.setAttribute("target", "_blank");
	link.href = `https://osu.ppy.sh/users/${osuId}`;

	li.appendChild(link);

	if (hasPlayedToday) {
		li.classList.add("streakers-list__item--played");
		link.setAttribute("aria-description", "Played today");
	}

	return li;
}

async function fetchStreakers() {
	const res = await fetch("./api/daily-streakers");

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
			player.osu_id,
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

	const nameSortValue = (a, b) => {
		if (typeof a != "string" || typeof b != "string") {
			throw new Error("Both values have to be string");
		}
		if (a.toUpperCase() === b.toUpperCase()) {
			return 0;
		} else {
			return a.toUpperCase() > b.toUpperCase() ? 1 : -1;
		}
	};

	switch (mode) {
		case "name":
			streakersSorted = streakers.toSorted((a, b) =>
				nameSortValue(a.name, b.name)
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
			streakersSorted = streakers.toSorted((a, b) =>
				nameSortValue(a.name, b.name)
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
	if (LOCAL_STORAGE_AVAILABLE) {
		localStorage.setItem("sort-by", value);
	}
});

async function main() {
	const streakers = await fetchStreakers();
	let sortBy = "name";
	if (LOCAL_STORAGE_AVAILABLE) {
		const sortByInStorage = localStorage.getItem("sort-by");
		if (sortByInStorage) {
			sortBy = sortByInStorage;
		} else {
			localStorage.setItem("sort-by", sortBy);
		}
	}
	sorterSelect.value = sortBy;
	streakersData = await sortStreakers(streakers, sortBy);
	renderStreakersItem(streakersData);
	// Generate last update information based on the last-est last update
	const lastUpdates = streakersData.map((players) => {
		const dateString = players.last_update;
		const dateObject = new Date(dateString);
		const dateNumber = dateObject.getTime();

		return {
			text: dateString,
			time: dateNumber,
		};
	});

	const lastUpdate = lastUpdates.reduce((accumulator, currentValue) => {
		if (currentValue.time > (accumulator?.time ?? 0)) {
			return {
				text: currentValue.text,
				time: currentValue.time,
			};
		} else {
			return {
				text: accumulator.text,
				time: accumulator.time,
			};
		}
	});

	const lastUpdateDate = new Date(lastUpdate.text);

	spanInfo.textContent = `All items are updated every 30 minutes. (last update: ${lastUpdateDate.toUTCString()})`;
}

main();
