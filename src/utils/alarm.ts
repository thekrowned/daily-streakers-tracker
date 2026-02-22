import { ConsolePrefixed } from "./console-prefixed.js";
const consolePref = new ConsolePrefixed("[Alarm Manager]");

type alarmCallback = {
	name: string;
	callback: () => Promise<void>;
	time: [number, number][];
};

async function handleCallback(callback: () => Promise<void>) {
	try {
		await callback();
	} catch (error) {
		consolePref.error(
			`There was an unhandled error while executing ${callback.name}`,
		);
		consolePref.error(error);
	}
}

const alarmTimer = setInterval(() => {
	const currTime = new Date();
	const currHours = currTime.getUTCHours();
	const currMins = currTime.getUTCMinutes();

	UtcAlarmManager.list.forEach((alarmCallback) => {
		alarmCallback.time.forEach(([hour, minute]) => {
			if (hour == currHours && minute == currMins) {
				consolePref.info(
					`Running ${alarmCallback.name} (${
						alarmCallback.callback.name
					}) ${currTime.toUTCString()}`,
				);
				handleCallback(alarmCallback.callback);
			}
		});
	});
}, 60_000);

const UtcAlarmManager = class {
	static list: alarmCallback[] = [];

	/**
	 * @description Run a function at a specified time everyday (in UTC)
	 * @example UtcAlarmManager.add({
	 *    "name": "Good morning",
	 *    "callback": sayGoodMorning,
	 *    "time": [[7, 30], [8, 0]]
	 * })
	 */
	static add = function ({ name, callback, time }: alarmCallback) {
		const existing = UtcAlarmManager.list.find((alarm) => alarm.name == name);
		if (existing) {
			consolePref.error("Please choose another name.");
			return false;
		}

		if (time.length == 0) {
			consolePref.error(`Please set the time!`);
			return false;
		}

		time.forEach(([hour, minute]) => {
			if (hour > 23 || hour < 0 || minute > 59 || minute < 0) {
				consolePref.error(`Can't set alarm on that time! [${hour},${minute}]`);
				return false;
			}
		});

		UtcAlarmManager.list.push({ name: name, callback: callback, time: time });
		return true;
	};

	static remove = function (name: string) {
		const existingIndex = UtcAlarmManager.list.findIndex(
			(alarm) => alarm.name == name,
		);
		if (existingIndex >= 0) {
			UtcAlarmManager.list.splice(existingIndex, 1);
			return true;
		} else {
			consolePref.error("Can't find alarm with that name!");
			return false;
		}
	};
};

export { UtcAlarmManager };
