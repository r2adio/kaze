import { db, pool } from "../src/db/index.ts";
import { usersTable } from "../src/db/schema.ts";

const users = [
	{ name: "Ada Lovelace", age: 36, email: "ada@example.com" },
	{ name: "Alan Turing", age: 41, email: "alan@example.com" },
];

await db.insert(usersTable).values(users).onConflictDoNothing();
console.log(`seeded ${users.length} users`);

await pool.end();
