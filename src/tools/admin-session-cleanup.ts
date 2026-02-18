import { db } from "../database/db.js";
import { lte } from "drizzle-orm";
import { admin_session } from "../database/schema.js";

async function adminSessionCleanup() {
	const now = new Date();

	await db.delete(admin_session).where(lte(admin_session.expires, now));
}

export { adminSessionCleanup };
