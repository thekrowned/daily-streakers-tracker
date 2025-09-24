import * as fs from "node:fs/promises";

async function readJson(path: string): Promise<JSON> {
	await fs.access(path, fs.constants.R_OK);
	const file = await fs.readFile(path, { encoding: "utf-8" });
	const parsed = JSON.parse(file);
	return parsed;
}

export { readJson };
