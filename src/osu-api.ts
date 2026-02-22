import { API, Ruleset, APIError } from "osu-api-v2-js";
import { assertString, assertNumber } from "./utils/assert.js";
import { convertNumber } from "./utils/convert.js";
import { TimerManager } from "./utils/timer-manager.js";
import { ConsolePrefixed } from "./utils/console-prefixed.js";
const consolePref = new ConsolePrefixed("[Osu API]");

// Check whether these variables exist
const OSU_OWN_CLIENT_ID = process.env.OSU_OWN_CLIENT_ID;
const OSU_OWN_CLIENT_SECRET = process.env.OSU_OWN_CLIENT_SECRET;
const OSU_USER_ID = process.env.OSU_USER_ID;
if (!OSU_OWN_CLIENT_ID || !OSU_OWN_CLIENT_SECRET || !OSU_USER_ID) {
	throw new Error(
		"Please configure these variables in the .env file: OSU_OWN_CLIENT_ID, OSU_OWN_CLIENT_SECRET, OSU_USER_ID",
	);
}

// Convert .env variables to their valid types
const ownClientId = convertNumber(OSU_OWN_CLIENT_ID);
const ownClientSecret = assertString(OSU_OWN_CLIENT_SECRET);
const userId = convertNumber(OSU_USER_ID);

async function createOsuAPI() {
	const api = await API.createAsync(ownClientId, ownClientSecret);

	return api;
}

async function regenerateAPI() {
	consolePref.info(`Regenerating API...`);
	internalOsuAPI = await createOsuAPI();
}

let internalOsuAPI = await createOsuAPI();

TimerManager.addInterval({
	name: "API Check",
	callback: checkApiValidity,
	time: 3600_000,
});

async function checkApiValidity() {
	const now = new Date();
	try {
		const expiryDate = internalOsuAPI.expires;
		consolePref.info(`Checking api validity...`);
		consolePref.info(`Expiry date: ${expiryDate}`);
		if (expiryDate.getTime() - now.getTime() <= 4000_000) {
			regenerateAPI();
		}
	} catch (error) {
		consolePref.error(error);
		if ((error as APIError)?.message == "Unauthorized") {
			regenerateAPI();
		}
	}
}

const OsuAPI = class {
	static getUserRank = async function (user: string | number): Promise<number> {
		const userData = await internalOsuAPI.getUser(user, Ruleset.osu);
		const rank = assertNumber(userData.statistics.global_rank);
		return rank;
	};

	static getMyUserRank = async function (): Promise<number> {
		const myRank = await OsuAPI.getUserRank(userId);
		return myRank;
	};

	static getUser = async function (user: string | number) {
		const data = await internalOsuAPI.getUser(user, Ruleset.osu);
		return data;
	};

	static lookupUsers = async function (userIds: number[]) {
		if (userIds.length > 50) {
			throw new Error("Too many users to fetch for!");
		}
		const data = await internalOsuAPI.lookupUsers(userIds);
		return data;
	};
};

export { OsuAPI };
