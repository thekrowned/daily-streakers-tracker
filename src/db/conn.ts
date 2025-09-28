import { DuckDBInstance } from "@duckdb/node-api";

const instance = await DuckDBInstance.create("storage.db");

const storageConn = await instance.connect();

export { storageConn };
