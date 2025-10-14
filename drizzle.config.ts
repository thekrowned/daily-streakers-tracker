import { defineConfig } from "drizzle-kit";

const DB_URL = process.env.DB_URL;
if (!DB_URL) {
	throw new Error("Please provide DB_URL");
}

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/database/schema.ts",
	out: "./src/database/migrations",
	dbCredentials: {
		url: DB_URL,
	},
});
