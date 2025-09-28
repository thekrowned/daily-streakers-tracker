enum RepetitionType {
	INTERVAL,
	TIMEOUT,
}

type timer = {
	name: string;
	timer_object: NodeJS.Timeout;
	repetition_type: RepetitionType;
};

const TimerManager = class {
	static timers: timer[] = [];

	static findIndexExistingTimer = function (name: string) {
		const timerIndex = TimerManager.timers.findIndex(
			(timer) => timer.name == name
		);
		return timerIndex;
	};

	static handleExecution = function (name: string, callback: () => void) {
		const logTime = new Date();
		console.info(
			`[TimerManager] Running ${name} (${callback.name})`,
			logTime.toUTCString()
		);
		try {
			callback();
		} catch (error) {
			console.error(
				`There was an unhandled error while executing ${name} (${callback.name})`
			);
			console.error(error);
		}
	};

	static addInterval = function ({
		name,
		callback,
		time,
	}: {
		name: string;
		callback: () => void;
		time: number;
	}) {
		const timerIndex = TimerManager.findIndexExistingTimer(name);
		if (timerIndex >= 0) {
			console.error("Name already used!");
			return false;
		}

		TimerManager.handleExecution(name, callback);
		const timer = setInterval(() => {
			TimerManager.handleExecution(name, callback);
		}, time);

		TimerManager.timers.push({
			timer_object: timer,
			repetition_type: RepetitionType.INTERVAL,
			name: name,
		});
	};

	static addTimeout = function ({
		name,
		callback,
		time,
	}: {
		name: string;
		callback: () => void;
		time: number;
	}) {
		const timerIndex = TimerManager.findIndexExistingTimer(name);
		if (timerIndex >= 0) {
			console.error("Name already used!");
			return false;
		}

		const timer = setTimeout(() => {
			TimerManager.clearTimer(name);
			TimerManager.handleExecution(name, callback);
		}, time);

		TimerManager.timers.push({
			timer_object: timer,
			repetition_type: RepetitionType.TIMEOUT,
			name: name,
		});
	};

	static clearTimer = function (name: string): boolean {
		const timerIndex = TimerManager.findIndexExistingTimer(name);
		if (timerIndex >= 0) {
			const existingTimer = TimerManager.timers[timerIndex];
			if (existingTimer.repetition_type == RepetitionType.INTERVAL) {
				clearInterval(existingTimer.timer_object);
			} else {
				clearTimeout(existingTimer.timer_object);
			}
			TimerManager.timers.splice(timerIndex, 1);
			return true;
		} else {
			console.error("That timer doesn't exist!");
			return false;
		}
	};
};

export { TimerManager };
