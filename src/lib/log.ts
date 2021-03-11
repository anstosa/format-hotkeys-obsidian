/**
 * Send tagged log message
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const log = (message: string, ...args: any[]): void => {
  console.log(`[FormatHotkeys] ${message}`, ...args);
};
