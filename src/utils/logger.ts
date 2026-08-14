/** Minimal bug reporter — groups error with stack and optional context. */
export const logger = {
  bug(title: string, error: unknown, context?: Record<string, unknown>) {
    console.group(`[BUG] ${title}`);
    console.error(error);
    if (context) console.table(context);
    console.groupEnd();
  },
};
