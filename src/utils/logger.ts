/**
 * A beautiful, styled console logger for the Gamexeplop project.
 */
export const logger = {
  info(message: string, ...args: any[]) {
    console.log(
      `%c[GAMEXEPLOP INFO] [${new Date().toLocaleTimeString()}] %c${message}`,
      "color: #018bf7; font-weight: bold; background: rgba(1, 139, 247, 0.08); padding: 2px 4px; border-radius: 4px;",
      "color: inherit;",
      ...args
    );
  },

  warn(message: string, ...args: any[]) {
    console.warn(
      `%c[GAMEXEPLOP WARN] [${new Date().toLocaleTimeString()}] %c${message}`,
      "color: #EDB338; font-weight: bold; background: rgba(237, 179, 56, 0.08); padding: 2px 4px; border-radius: 4px;",
      "color: inherit;",
      ...args
    );
  },

  error(message: string, error?: any, ...args: any[]) {
    console.error(
      `%c[GAMEXEPLOP ERROR] [${new Date().toLocaleTimeString()}] %c${message}`,
      "color: #e87432; font-weight: bold; background: rgba(232, 116, 80, 0.08); padding: 2px 4px; border-radius: 4px;",
      "color: inherit;",
      error,
      ...args
    );
  },

  bug(title: string, error: any, context?: Record<string, any>) {
    console.group(
      `%c[GAMEXEPLOP BUG REPORT] %c${title} [${new Date().toLocaleTimeString()}]`,
      "color: #ff3333; font-weight: bold; font-size: 1.1em; background: rgba(255, 51, 51, 0.1); padding: 4px 8px; border-radius: 4px;",
      "color: #ff3333; font-weight: bold;"
    );
    console.error("Error Object:", error);
    if (error && error.stack) {
      console.log("%cStack Trace:", "font-weight: bold; color: #8a7d65;");
      console.log(error.stack);
    }
    if (context) {
      console.log("%cRuntime Context:", "font-weight: bold; color: #8a7d65;");
      console.table(context);
    }
    console.groupEnd();
  }
};
