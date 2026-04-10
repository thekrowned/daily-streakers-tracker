import { Card } from "./card.js";
import { StreakersList, StreakersItem } from "./streakers-list.js";
import { getDailyStreakers } from "../tools/get-daily-streakers.js";
import { Cache } from "../utils/cache.js";

async function getData() {
	const cacheName = "daily-streakers";
	const existingCache = Cache.get(cacheName);

	if (existingCache) {
		return existingCache as ReturnType<typeof getDailyStreakers>;
	}

	const data = await getDailyStreakers();

	Cache.set(cacheName, data);
	return data;
}

type pageState = {
	sort: string;
	showCurrent?: boolean;
	showBest?: boolean;
};

const sortOptions: {
	name: string;
	uiName: string;
	defaultSort: "ascending" | "descending";
}[] = [
	{ name: "name", uiName: "Name", defaultSort: "ascending" },
	{ name: "rank", uiName: "Rank", defaultSort: "ascending" },
	{ name: "has-played", uiName: "Has Played", defaultSort: "descending" },
	{
		name: "current-streak",
		uiName: "Current Streak",
		defaultSort: "descending",
	},
	{ name: "best-streak", uiName: "Best Streak", defaultSort: "descending" },
];

async function MainPage(pageState: pageState) {
	const { sort, showBest: showBest, showCurrent: showCurrent } = pageState;
	const currentSort =
		sortOptions.find((s) => s.name === sort.split("_")[0]) || sortOptions[0];
	const isDescending = sort.split("_")[1] === "desc";

	const data = await getData();

	// Everything has to be sorted by name first
	data.sort((_a, _b) => {
		const a = String(_a.name);
		const b = String(_b.name);
		if (a.toUpperCase() === b.toUpperCase()) {
			return 0;
		} else {
			return a.toUpperCase() > b.toUpperCase() ? 1 : -1;
		}
	});

	switch (currentSort.name) {
		case "name":
			if (isDescending) {
				data.sort((_a, _b) => {
					const a = String(_a.name);
					const b = String(_b.name);
					if (a.toUpperCase() === b.toUpperCase()) {
						return 0;
					} else {
						return b.toUpperCase() > a.toUpperCase() ? 1 : -1;
					}
				});
			}
			// Everything has been sorted with ascending name by default
			// So we only need descending function here
			break;

		case "rank":
			if (isDescending) {
				data.sort((_a, _b) => {
					const a = Number(_a.rank_standard);
					const b = Number(_b.rank_standard);
					return b - a;
				});
			} else {
				data.sort((_a, _b) => {
					const a = Number(_a.rank_standard);
					const b = Number(_b.rank_standard);
					return a - b;
				});
			}
			break;

		case "current-streak":
			if (isDescending) {
				data.sort((_a, _b) => {
					const a = Number(_a.current_streak);
					const b = Number(_b.current_streak);
					return b - a;
				});
			} else {
				data.sort((_a, _b) => {
					const a = Number(_a.current_streak);
					const b = Number(_b.current_streak);
					return a - b;
				});
			}
			break;

		case "best-streak":
			if (isDescending) {
				data.sort((_a, _b) => {
					const a = Number(_a.best_daily_streak);
					const b = Number(_b.best_daily_streak);
					return b - a;
				});
			} else {
				data.sort((_a, _b) => {
					const a = Number(_a.best_daily_streak);
					const b = Number(_b.best_daily_streak);
					return a - b;
				});
			}
			break;

		case "has-played":
			// Convert the boolean into number
			if (isDescending) {
				data.sort((_a, _b) => {
					const a = Number(_a.has_played_today);
					const b = Number(_b.has_played_today);
					return b - a;
				});
			} else {
				data.sort((_a, _b) => {
					const a = Number(_a.has_played_today);
					const b = Number(_b.has_played_today);
					return a - b;
				});
			}
			break;

		default:
			// Leave everything sorted by ascending name
			break;
	}

	const fullStreakersData = data.filter((player) => player.full_streaker);
	const casualStreakersData = data.filter(
		(player) => player.is_streaking && !player.full_streaker,
	);
	const notStreakersData = data.filter(
		(player) => !player.is_streaking && !player.full_streaker,
	);

	// Force the internal state to show best/current whenever necessary
	const internalShowBest = currentSort.name === "best-streak" || showBest;
	const internalShowCurrent =
		currentSort.name === "current-streak" || showCurrent;

	const lastUpdates = data.map((players) => {
		const dateString = players.last_update;
		const dateObject = new Date(dateString);
		const dateNumber = dateObject.getTime();

		return {
			text: dateString,
			time: dateNumber,
		};
	});

	const _lastUpdate = lastUpdates.toSorted((_a, _b) => {
		const a = Number(_a.time);
		const b = Number(_b.time);
		return b - a;
	})[0];

	const lastUpdate = new Date(_lastUpdate.text).toUTCString();

	const currentParams = {
		sort: sort,
		"show-best": showBest ? "true" : "",
		"show-current": showCurrent ? "true" : "",
	};

	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Daily Streakers Tracker</title>
				<link rel="stylesheet" href="./assets/global.css?v=20260216-1955" />
				<link rel="stylesheet" href="./assets/daily-streakers.css?v=20260329" />
			</head>
			<body>
				<header class="header">
					<h1 class="header__title">Daily Streakers Tracker</h1>
				</header>
				<main>
					<div class="sorter">
						<label class="sorter__label">Sort by:</label>
						<div class="sorter__list">
							{sortOptions.map((s) => {
								const defaultSort =
									s.defaultSort === "descending" ? "_desc" : "_asc";
								const isActive = currentSort.name === s.name;
								const sortPrefix = `${isActive ? (!isDescending ? "_desc" : "_asc") : defaultSort}`;
								const sortParam = `${s.name}${sortPrefix}`;
								const newParams = new URLSearchParams({
									...currentParams,
									sort: sortParam,
								});

								return (
									<a
										class={`sorter__item ${isActive ? "sorter__item--active" : ""}`}
										href={`./?${newParams}`}
									>
										{s.uiName}
										<div class="sorter__indicator">
											<img
												class="sorter__indicator-image"
												src={`./assets/sort${isActive ? (isDescending ? "_desc" : "_asc") : defaultSort}.png`}
												alt=""
											/>
										</div>
									</a>
								);
							})}
							{/* Options for showing best & current streak */}
							{(() => {
								// Try to do the opposite of what's in the request
								const newParams = new URLSearchParams({
									...currentParams,
									"show-current": showCurrent ? "" : "true",
								});

								// The state is determined by internal showBest parameter
								return (
									<a
										class={`sorter__item ${showCurrent ? "sorter__item--active" : ""}`}
										href={`./?${newParams}`}
									>
										Show current streak
										<div
											class={`sorter__indicator ${internalShowCurrent ? "sorter__indicator--force-show" : ""}`}
										>
											<img
												class="sorter__indicator-image"
												src="./assets/sort_check.png"
												alt=""
											/>
										</div>
									</a>
								);
							})()}
							{(() => {
								// show-best state, same as above
								const newParams = new URLSearchParams({
									...currentParams,
									"show-best": showBest ? "" : "true",
								});

								return (
									<a
										class={`sorter__item ${showBest ? "sorter__item--active" : ""}`}
										href={`./?${newParams}`}
									>
										Show best streak
										<div
											class={`sorter__indicator ${internalShowBest ? "sorter__indicator--force-show" : ""}`}
										>
											<img
												class="sorter__indicator-image"
												src="./assets/sort_check.png"
												alt=""
											/>
										</div>
									</a>
								);
							})()}
						</div>
					</div>
					<Card
						title="Full Streakers"
						descriptions="Full streakers are those who never break their streaks since day
							one which is really cool and should be appreciated for their hard
							work."
					>
						<StreakersList>
							{fullStreakersData.map((player) => (
								<StreakersItem
									bestStreak={player.best_daily_streak || 0}
									currentStreak={player.current_streak || 0}
									hasPlayedToday={player.has_played_today || false}
									tierIndex={(player.tier_change as number) || 0}
									osuId={player.osu_id || 0}
									playerName={player.name || ""}
									previousStreak={player.previous_daily_streak || 0}
									showBest={internalShowBest}
									showCurrent={internalShowCurrent}
								/>
							))}
						</StreakersList>
					</Card>
					<Card
						title="Casual Streakers"
						descriptions="Casual streakers are equally cool players whose streak value is
							less than the total days of daily challenge, which also needs to
							be appreciated for their dedication."
					>
						<StreakersList>
							{casualStreakersData.map((player) => (
								<StreakersItem
									bestStreak={player.best_daily_streak || 0}
									currentStreak={player.current_streak || 0}
									hasPlayedToday={player.has_played_today || false}
									tierIndex={(player.tier_change as number) || 0}
									osuId={player.osu_id || 0}
									playerName={player.name || ""}
									previousStreak={player.previous_daily_streak || 0}
									showBest={internalShowBest}
									showCurrent={internalShowCurrent}
								/>
							))}
						</StreakersList>
					</Card>
					<Card
						title="Not Streaking"
						descriptions="These players are former full streakers or casual streakers who
							don't really play daily challenge anymore but still deserve
							appreciations for the work that they've done."
					>
						<StreakersList>
							{notStreakersData.map((player) => (
								<StreakersItem
									bestStreak={player.best_daily_streak || 0}
									currentStreak={player.current_streak || 0}
									hasPlayedToday={player.has_played_today || false}
									tierIndex={(player.tier_change as number) || 0}
									osuId={player.osu_id || 0}
									playerName={player.name || ""}
									previousStreak={player.previous_daily_streak || 0}
									showBest={internalShowBest}
									showCurrent={internalShowCurrent}
								/>
							))}
						</StreakersList>
					</Card>
					<Card
						descriptions={
							<span id="info">
								All items are updated every 30 minutes. (last update:&nbsp;
								{lastUpdate})
							</span>
						}
					></Card>
					<footer>
						<span>
							This website is open source! Check it on&nbsp;
							<a
								href="https://github.com/thekrowned/daily-streakers-tracker"
								target="_blank"
								rel="noopener noreferrer"
							>
								GitHub
							</a>
							.
						</span>
					</footer>
				</main>
				{/* <script
					type="text/javascript"
					src="./assets/storage-check.js?v=20250929"
				></script>
				<script
					type="text/javascript"
					src="./assets/daily-streakers.js?v=20260326"
				></script> */}
			</body>
		</html>
	);
}

export { MainPage };
