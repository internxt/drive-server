import { Express } from 'express';

export function applicationInitialization(app: Express): Promise<void> {
  const TRIES_UNTIL_DRIVE_SERVER_IS_READY = 10;
  const INTERVAL_FOR_RETRY = 3000;

  return new Promise((resolve, reject) => {
    let tries = 0;
    const interval = setInterval(async () => {
      try {
        app.post('/api/data/t');
        clearInterval(interval);
        resolve();
      } catch (err) {
        tries += 1;

        if (tries > TRIES_UNTIL_DRIVE_SERVER_IS_READY) {
          clearInterval(interval);
          reject(new Error('Too many tries to connect to Drive Server'));
        } else {
          // eslint-disable-next-line no-console
          console.log(`Drive Server not ready yet, waiting: ${INTERVAL_FOR_RETRY / 1000} more seconds`);
        }
      }
    }, INTERVAL_FOR_RETRY);
  });
};
