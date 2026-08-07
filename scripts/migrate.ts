import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db, pool } from "../src/db/index.ts";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("migrations applied");

await pool.end();
