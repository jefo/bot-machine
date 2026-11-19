import type { Logger } from "pino";

// Keep the application on our own alias so the logger implementation can
// be replaced without touching every use case.
export type ILogger = Logger;
