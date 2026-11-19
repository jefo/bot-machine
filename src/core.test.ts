import { describe, test, expect, mock } from "bun:test";
import { z } from "zod";
import { createCommand, createQuery } from "./core";
import type { AppContext } from "./types";

// A mock context for tests
const createMockContext = (): AppContext => {
	const mockLogger = {
		info: mock(() => {}),
		error: mock(() => {}),
	} as any;

	return {
		logger: mockLogger,
	} as AppContext;
};

describe("createCommand", () => {
	test("should work with no input schema (defaults to void)", async () => {
		const execute = mock(async (input: void) => {
			expect(input).toBeUndefined();
			return "success";
		});
		const command = createCommand({ name: "test", execute });
		const result = await command.execute(undefined, createMockContext());
		expect(execute).toHaveBeenCalled();
		expect(result).toBe("success");
	});

	test("should handle z.void() input", async () => {
		const execute = mock(async (input: void) => {
			expect(input).toBeUndefined();
		});
		const command = createCommand({ name: "test", input: z.void(), execute });
		await command.execute(undefined, createMockContext());
		expect(execute).toHaveBeenCalled();
	});

	test("should transform undefined to {} for object schema", async () => {
		const execute = mock(async (input: {}) => {
			expect(input).toEqual({});
		});
		const command = createCommand({ name: "test", input: z.object({}), execute });
		await command.execute(undefined, createMockContext());
		expect(execute).toHaveBeenCalled();
	});

	test("should pass through {} for object schema", async () => {
		const execute = mock(async (input: {}) => {
			expect(input).toEqual({});
		});
		const command = createCommand({ name: "test", input: z.object({}), execute });
		await command.execute({}, createMockContext());
		expect(execute).toHaveBeenCalled();
	});

	test("should throw if undefined is passed to a strict object schema", async () => {
		const execute = mock(async (input: any) => {});
		const command = createCommand({
			name: "test",
			input: z.object({ name: z.string() }),
			execute,
		});

		expect(async () => {
			await command.execute(undefined, createMockContext());
		}).toThrow();
		expect(execute).not.toHaveBeenCalled();
	});

	test("should throw if undefined is passed to a string schema", async () => {
		const execute = mock(async (input: any) => {});
		const command = createCommand({ name: "test", input: z.string(), execute });

		expect(async () => {
			await command.execute(undefined, createMockContext());
		}).toThrow();
		expect(execute).not.toHaveBeenCalled();
	});

	test("should correctly pass valid data to a strict schema", async () => {
		const execute = mock(async (input: { name: string }) => {
			expect(input).toEqual({ name: "test" });
		});
		const command = createCommand({
			name: "test",
			input: z.object({ name: z.string() }),
			execute,
		});
		await command.execute({ name: "test" }, createMockContext());
		expect(execute).toHaveBeenCalled();
	});

	test("should propagate errors from execute function", async () => {
		const execute = mock(async (input: void) => {
			throw new Error("Execution failed");
		});
		const command = createCommand({ name: "test", execute });

		expect(async () => {
			await command.execute(undefined, createMockContext());
		}).toThrow("Execution failed");
	});
});

describe("createQuery", () => {
	test("should work with no input schema (defaults to void)", async () => {
		const execute = mock(async (input: void) => {
			expect(input).toBeUndefined();
			return "success";
		});
		const query = createQuery({ name: "test", execute });
		const result = await query.execute(undefined, createMockContext());
		expect(execute).toHaveBeenCalled();
		expect(result).toBe("success");
	});

	test("should transform undefined to {} for object schema", async () => {
		const execute = mock(async (input: {}) => {
			expect(input).toEqual({});
		});
		const query = createQuery({ name: "test", input: z.object({}), execute });
		await query.execute(undefined, createMockContext());
		expect(execute).toHaveBeenCalled();
	});

	test("should throw if undefined is passed to a strict object schema", async () => {
		const execute = mock(async (input: any) => {});
		const query = createQuery({
			name: "test",
			input: z.object({ name: z.string() }),
			execute,
		});

		expect(async () => {
			await query.execute(undefined, createMockContext());
		}).toThrow();
		expect(execute).not.toHaveBeenCalled();
	});
});
