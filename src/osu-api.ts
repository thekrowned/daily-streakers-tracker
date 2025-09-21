import { User } from "osu-api-v2-js";
import { API, Ruleset } from "osu-api-v2-js";
import { assertString, assertNumber } from "./utils/assert.js";
import { convertNumber } from "./utils/convert.js";

// Check whether these variables exist
const OSU_OWN_CLIENT_ID = process.env.OSU_OWN_CLIENT_ID;
const OSU_OWN_CLIENT_SECRET = process.env.OSU_OWN_CLIENT_SECRET;
const OSU_USER_ID = process.env.OSU_USER_ID;
if (!OSU_OWN_CLIENT_ID || !OSU_OWN_CLIENT_SECRET || !OSU_USER_ID) {
	throw new Error(
		"Please configure these variables in the .env file: OSU_OWN_CLIENT_ID, OSU_OWN_CLIENT_SECRET, OSU_USER_ID"
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

const internalOsuAPI = await createOsuAPI();

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
};

export { OsuAPI };
