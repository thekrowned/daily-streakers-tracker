import { storageConn } from "./conn.js";

await storageConn.run(`ALTER TABLE players ADD best_daily_streak integer;`);
