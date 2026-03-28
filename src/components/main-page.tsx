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

async function MainPage() {
	const data = await getData();

	const fullStreakersData = data.filter((player) => player.full_streaker);
	const casualStreakersData = data.filter(
		(player) => player.is_streaking && !player.full_streaker,
	);
	const notStreakersData = data.filter(
		(player) => !player.is_streaking && !player.full_streaker,
	);

	const showBest = false;
	const showCurrent = false;

	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Daily Streakers Tracker</title>
				<link rel="stylesheet" href="./assets/global.css?v=20260216-1955" />
				<link rel="stylesheet" href="./assets/daily-streakers.css?v=20260117" />
			</head>
			<body>
				<header class="header">
					<h1 class="header__title">Daily Streakers Tracker</h1>
				</header>
				<main>
					<noscript>Please enable JavaScript</noscript>
					<div class="sorter">
						<label class="sorter__label" for="sorter__select">
							Sort by:
						</label>
						<select name="sorter__select" id="sorter__select">
							<option value="name">Name</option>
							<option value="rank">Rank</option>
							<option value="played">Has played</option>
							<option value="not_played">Has not played</option>
							<option value="streak">Current streak</option>
							<option value="best_daily_streak">Best streak</option>
						</select>
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
									showBest={showBest}
									showCurrent={showCurrent}
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
									showBest={showBest}
									showCurrent={showCurrent}
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
									showBest={showBest}
									showCurrent={showCurrent}
								/>
							))}
						</StreakersList>
					</Card>
					<Card
						descriptions={
							<span id="info">All items are updated every 30 minutes.</span>
						}
					></Card>
					<footer>
						<span>
							This website is open source! Check it on
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
