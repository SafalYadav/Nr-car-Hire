export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...meta }),
    );
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(
      JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...meta }),
    );
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const errorData =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          }
        : { error };
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        timestamp: new Date().toISOString(),
        ...errorData,
        ...meta,
      }),
    );
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        JSON.stringify({ level: 'debug', message, timestamp: new Date().toISOString(), ...meta }),
      );
    }
  },
};
