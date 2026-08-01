import { Client } from "pg";

import env from "../src/env.ts";

const databaseName = new URL(env.DATABASE_URL).pathname.slice(1);

const maintenanceUrl = new URL(env.DATABASE_URL);
maintenanceUrl.pathname = "/postgres";

const client = new Client({ connectionString: maintenanceUrl.toString() });

await client.connect();

const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
	databaseName,
]);

if (rowCount === 0) {
	await client.query(`CREATE DATABASE "${databaseName}"`);
	console.log(`created database "${databaseName}"`);
} else {
	console.log(`database "${databaseName}" already exists`);
}

await client.end();
