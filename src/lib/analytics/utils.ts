import geoip from 'geoip-lite';
const logger = require('../../lib/logger').default;
const Logger = logger.getInstance();

export function logError(err: unknown) {
  if (err instanceof Error) {
    Logger.error(`[Analytics] Track Error: ${err.message}`);
  }
}

export function location(address: string) {
  const location = geoip.lookup(address);
  return location;
}