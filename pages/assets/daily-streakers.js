let streakersData = null;

const LOCAL_STORAGE_AVAILABLE = storageAvailable("localStorage");

const fullStreakersList = document.getElementById("streakers-list-full");
const casualStreakersList = document.getElementById("streakers-list-casual");
const notStreakersList = document.getElementById("streakers-list-not");
const sorterSelect = /** @type {HTMLSelectElement} */ (
	document.getElementById("sorter__select")
);
const spanInfo = document.getElementById("info");

const streakersItemTemplate = document.importNode(
	document.getElementById("template-streakers-list__item").content,
	true,
);

function createStreakersItem({
	playerName,
	osuId,
	hasPlayedToday,
	tierIndex,
	currentStreak,
	bestStreak,
	previousStreak,
	options: { showCurrent, showBest },
}) {
	const newStreakersItem = streakersItemTemplate.cloneNode(true);

	const li = newStreakersItem.querySelector(".streakers-list__item");

	const link = newStreakersItem.querySelector(".streakers-list__link");
	link.textContent = playerName;
	link.setAttribute("target", "_blank");
	link.setAttribute("href", `https://osu.ppy.sh/users/${osuId}`);

	const tierDiv = newStreakersItem.querySelector(".streakers-list__tier");
	const tierImage = newStreakersItem.querySelector(
		".streakers-list__tier-image",
	);
	let arrowTierSrc = null;
	let altTier = null;
	let outlineTierClassname = null;

	let showPrevious = false;

	if (typeof tierIndex == "number") {
		switch (tierIndex) {
			case -3:
				arrowTierSrc = "./assets/arrow-down-double.png";
				altTier = "This player is no longer a full streaker.";
				outlineTierClassname = "streakers-list__item--fallen";
				showPrevious = true;
				break;
			case -2:
				arrowTierSrc = "./assets/arrow-down-double.png";
				altTier = "This player has just lost their streak significantly.";
				outlineTierClassname = "streakers-list__item--downgraded";
				showPrevious = true;
				break;
			case -1:
				arrowTierSrc = "./assets/arrow-down.png";
				altTier = "This player is no longer a casual streaker.";
				showPrevious = true;
				break;
			case 1:
				arrowTierSrc = "./assets/arrow-up.png";
				altTier = "This player has just became a casual streaker.";
				outlineTierClassname = "streakers-list__item--upgraded";
			default:
				break;
		}
	}

	const countElement = newStreakersItem.querySelector(".streakers-list__count");
	const helperElement = newStreakersItem.querySelector(
		".streakers-list__insert-helper",
	);

	if (showCurrent && Number(currentStreak) > 0) {
		const currElement = countElement.cloneNode(true);
		const currentText =
			showPrevious || showBest ? `Curr: ${currentStreak}` : currentStreak;
		currElement.setAttribute("aria-description", "Current streak");
		currElement.textContent = currentText;
		li.insertBefore(currElement, helperElement);
	}

	if (showBest && Number(bestStreak) > 0) {
		const bestElement = countElement.cloneNode(true);
		const bestText =
			showPrevious || showCurrent ? `Best: ${bestStreak}` : bestStreak;
		bestElement.setAttribute("aria-description", "Best streak");
		bestElement.textContent = bestText;
		li.insertBefore(bestElement, helperElement);
	}

	if (showPrevious) {
		const prevElement = countElement.cloneNode(true);
		prevElement.setAttribute("aria-description", "Previous streak");
		prevElement.textContent = `Prev: ${previousStreak}`;
		li.insertBefore(prevElement, helperElement);
	}

	countElement.remove();
	helperElement.remove();

	if (arrowTierSrc) {
		tierImage.setAttribute("alt", altTier);
		tierImage.setAttribute("src", arrowTierSrc);
	} else {
		tierDiv.remove();
	}

	if (hasPlayedToday) {
		li.classList.add("streakers-list__item--played");
		link.setAttribute("aria-description", "Played today");
	} else {
		if (outlineTierClassname) {
			li.classList.add(outlineTierClassname);
		}
	}

	return newStreakersItem;
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

async function renderStreakersItem(streakers, { showCurrent, showBest }) {
	if (!Array.isArray(streakers)) {
		throw new Error("Data is not of array type");
	}

	fullStreakersList.innerHTML = "";
	casualStreakersList.innerHTML = "";
	notStreakersList.innerHTML = "";

	streakers.forEach((player) => {
		const isFullStreaker = player.full_streaker;
		const playerElement = createStreakersItem({
			playerName: player.name,
			osuId: player.osu_id,
			hasPlayedToday: player.has_played_today,
			tierIndex: player.tier_change,
			bestStreak: player.best_daily_streak,
			currentStreak: player.current_streak,
			previousStreak: player.previous_daily_streak,
			options: {
				showBest: showBest ?? false,
				showCurrent: showCurrent ?? false,
			},
		});
		if (isFullStreaker) {
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
				nameSortValue(a.name, b.name),
			);
			break;
		case "rank":
			streakersSorted = streakers.toSorted(
				(a, b) => a.rank_standard - b.rank_standard,
			);
			break;
		case "streak":
			// Sorted by name first and then by total streak
			// There's probably a better way of doing this
			streakersSorted = streakers.toSorted((a, b) =>
				nameSortValue(a.name, b.name),
			);
			streakersSorted = streakersSorted.toSorted(
				(a, b) => b.current_streak - a.current_streak,
			);
			break;
		case "best_daily_streak":
			streakersSorted = streakers.toSorted((a, b) =>
				nameSortValue(a.name, b.name),
			);
			streakersSorted = streakersSorted.toSorted(
				(a, b) => b.best_daily_streak - a.best_daily_streak,
			);
			break;
		case "not_played":
			streakersSorted = streakers.toSorted((a, b) =>
				nameSortValue(a.name, b.name),
			);
			streakersSorted = streakersSorted.toSorted(
				(a, b) => a.has_played_today - b.has_played_today,
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
	renderStreakersItem(streakersData, {
		showBest: value === "best_daily_streak",
		showCurrent: value === "streak",
	});
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
	try {
		streakersData = await sortStreakers(streakers, sortBy);
		renderStreakersItem(streakersData, {
			showBest: sortBy === "best_daily_streak",
			showCurrent: sortBy === "streak",
		});
	} catch (error) {
		// Fallback to unsorted items if sorting fails
		streakersData = streakers;
		renderStreakersItem(streakersData);
	}
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
