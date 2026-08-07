import assert from "node:assert/strict";
import { test } from "node:test";

test("env exits with code 1 when a required variable is invalid", async (t) => {
	const original = process.env.DATABASE_URL;

	t.mock.method(console, "error", () => {});
	t.mock.method(process, "exit", (code?: number) => {
		throw new Error(`process.exit(${code})`);
	});

	process.env.DATABASE_URL = "";

	await assert.rejects(() => import("../src/env.ts"), /process.exit\(1\)/);

	if (original === undefined) {
		delete process.env.DATABASE_URL;
	} else {
		process.env.DATABASE_URL = original;
	}
});
