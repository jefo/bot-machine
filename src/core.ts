import { z, type ZodType } from "zod";
import type { AppContext, BotCommand, BotQuery } from "./types";

/**
 * A factory function for creating a `BotQuery` with proper type inference and built-in logging.
 * @param config The query configuration, including a name, an optional input schema, and the execute function.
 * @returns The query configuration object, strongly typed.
 */
export function createQuery<
  TInput extends ZodType = ZodType<void>,
  TOutput = void,
>(config: {
  name: string;
  input?: TInput;
  output?: ZodType<TOutput>;
  execute: (input: z.infer<TInput>, ctx: AppContext) => Promise<TOutput>;
}): BotQuery<TInput, TOutput> {
  const { name, execute } = config;
  const inputSchema = (config.input ?? z.void()) as TInput;
  const outputSchema = (config.output ?? z.any()) as ZodType<TOutput>;

  const loggedExecute = async (
    input: z.infer<TInput> | undefined,
    ctx: AppContext,
  ): Promise<TOutput> => {
    let inputToParse: any = input;

    // If we received no data, but the schema doesn't accept `undefined`,
    // let's try providing an empty object. This handles the common void -> object case.
    if (inputToParse === undefined && !inputSchema.safeParse(undefined).success) {
      inputToParse = {};
    }

    const parsedInput = inputSchema.parse(inputToParse);

    ctx.logger.info(
      { query: name, input: parsedInput },
      `[Query] Executing: ${name}`,
    );
    try {
      const result = await execute(parsedInput, ctx);
      ctx.logger.info({ query: name, result }, `[Query] Success: ${name}`);
      return result;
    } catch (error) {
      ctx.logger.error({ query: name, error }, `[Query] Failed: ${name}`);
      throw error;
    }
  };

  return {
    _id: "BotQuery",
    name: config.name,
    input: inputSchema,
    output: outputSchema,
    execute: loggedExecute,
  };
}

/**
 * A factory function for creating a `BotCommand` with proper type inference and built-in logging.
 * @param config The command configuration, including a name, an optional input schema, and the execute function.
 * @returns The command configuration object, strongly typed.
 */
export function createCommand<
  TInput extends ZodType = ZodType<void>,
  TOutput = void,
>(config: {
  name: string;
  input?: TInput;
  output?: ZodType<TOutput>;
  execute: (input: z.infer<TInput>, ctx: AppContext) => Promise<TOutput>;
}): BotCommand<TInput, TOutput> {
  const { name, execute } = config;
  const inputSchema = (config.input ?? z.void()) as TInput;
  const outputSchema = (config.output ?? z.any()) as ZodType<TOutput>;

  const loggedExecute = async (
    input: z.infer<TInput> | undefined,
    ctx: AppContext,
  ): Promise<TOutput> => {
    let inputToParse: any = input;

    // If we received no data, but the schema doesn't accept `undefined`,
    // let's try providing an empty object. This handles the common void -> object case.
    if (inputToParse === undefined && !inputSchema.safeParse(undefined).success) {
      inputToParse = {};
    }

    const parsedInput = inputSchema.parse(inputToParse);

    ctx.logger.info(
      { command: name, input: parsedInput },
      `[Command] Executing: ${name}`,
    );
    try {
      const result = await execute(parsedInput, ctx);
      ctx.logger.info({ command: name, result }, `[Command] Success: ${name}`);
      return result;
    } catch (error) {
      ctx.logger.error({ command: name, error }, `[Command] Failed: ${name}`);
      throw error;
    }
  };

  return {
    _id: "BotCommand",
    name: config.name,
    input: inputSchema,
    output: outputSchema,
    execute: loggedExecute,
  };
}