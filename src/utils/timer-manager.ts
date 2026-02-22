import { ConsolePrefixed } from "./console-prefixed.js";
const consolePref = new ConsolePrefixed("[Timer Manager]");

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
			(timer) => timer.name == name,
		);
		return timerIndex;
	};

	static handleExecution = async function (
		name: string,
		callback: () => Promise<void>,
	) {
		const logTime = new Date();
		consolePref.info(
			`Running ${name} (${callback.name}) ${logTime.toUTCString()}`,
		);
		try {
			await callback();
		} catch (error) {
			consolePref.error(
				`There was an unhandled error while executing ${name} (${callback.name})`,
			);
			consolePref.error(error);
		}
	};

	static addInterval = function ({
		name,
		callback,
		time,
		executeImmediately = false,
	}: {
		name: string;
		callback: () => Promise<void>;
		time: number;
		executeImmediately?: boolean;
	}) {
		const timerIndex = TimerManager.findIndexExistingTimer(name);
		if (timerIndex >= 0) {
			consolePref.error("Name already used!");
			return false;
		}

		if (executeImmediately) {
			TimerManager.handleExecution(name, callback);
		}

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
		callback: () => Promise<void>;
		time: number;
	}) {
		const timerIndex = TimerManager.findIndexExistingTimer(name);
		if (timerIndex >= 0) {
			consolePref.error("Name already used!");
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
			consolePref.error("That timer doesn't exist!");
			return false;
		}
	};
};

export { TimerManager };
