import { drizzle } from "drizzle-orm/better-sqlite3";

const db = drizzle("daily-players.db");

export { db };
