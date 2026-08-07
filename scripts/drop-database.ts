import { Client } from "pg";

import env from "../src/env.ts";

const databaseName = new URL(env.DATABASE_URL).pathname.slice(1);

const maintenanceUrl = new URL(env.DATABASE_URL);
maintenanceUrl.pathname = "/postgres";

const client = new Client({ connectionString: maintenanceUrl.toString() });

await client.connect();

await client.query(
	"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
	[databaseName],
);
await client.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
console.log(`dropped database "${databaseName}"`);

await client.end();
