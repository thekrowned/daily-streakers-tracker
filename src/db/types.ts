type playerType = {
	id: number;
	name: string;
	rank_standard: number;
	total_participation: number;
	current_streak: number;
};

type streakerTrackerType = {
	id: number;
	has_played_today: boolean;
	full_streaker: boolean;
	is_streaking: boolean;
};

export type { playerType, streakerTrackerType };
