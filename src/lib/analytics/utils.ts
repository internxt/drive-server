import geoip from 'geoip-lite';
import DeviceDetector from 'node-device-detector';
const logger = require('../../lib/logger').default;
const Logger = logger.getInstance();
import { Location, User } from './types';
// PROVISIONAL until express server typescript
import express from 'express';

const deviceDetector = new DeviceDetector();

export function logError(err: unknown) {
  if (err instanceof Error) {
    Logger.error(`[Analytics] Error: ${err.message}`);
  }
}

export function logWarn(err: unknown) {
  if (err instanceof Error) {
    Logger.warn(`[Analytics] Error: ${err.message}`);
  }
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  } else {
    return 'No message';
  }
}

function getDeviceContext(req: express.Request) {
  const userAgent = req.headers['user-agent'];
  let deviceContext = {};
  try {
    if (userAgent) {
      const deviceDetected = deviceDetector.detect(userAgent);
      const os = {
        version: deviceDetected.os.version,
        name: deviceDetected.os.name,
        short_name: deviceDetected.os.short_name,
        family: deviceDetected.os.family,
      };
      const device = {
        type: deviceDetected.device.type,
        manufacturer: deviceDetected.device.brand,
        model: deviceDetected.device.model,
        brand: deviceDetected.device.brand,
        brand_id: deviceDetected.device.id,
      };
      const client = deviceDetected.client;

      deviceContext = {
        os,
        device,
        client,
      };
    }
  } catch (err) {
    logError(err);
  }

  return deviceContext;
}

export async function getContext(req: express.Request) {
  const ipaddress = req.header('x-forwarded-for') || req.socket.remoteAddress || '';
  const location = await getLocation(ipaddress).catch((err) => logWarn(err));

  const campaign = getCampaign(req);

  const app = {
    name: req.headers['internxt-client'],
    version: req.headers['internxt-version'],
  };

  const deviceContext = getDeviceContext(req);

  const context = {
    app,
    campaign,
    ip: ipaddress,
    location,
    userAgent: req.headers['user-agent'],
    locale: { language: req.headers['accept-language'] },
    ...deviceContext,
  };

  return context;
}

function getUTM(referrer: any) {
  const campaign = Object.create({});
  if (typeof referrer === 'string') {
    const { searchParams } = new URL(referrer);
    const UTMS = ['utm_name', 'utm_source', 'utm_medium', 'utm_content', 'utm_id'];
    UTMS.map((utm) => {
      if (searchParams.has(utm)) {
        campaign[utm] = searchParams.get(utm);
      }
    });
  }
  return campaign;
}

export function getAppsumoAffiliate(user: User) {
  const { appsumoDetails } = user;
  if (appsumoDetails) {
    return {
      affiliate_name: 'appsumo',
    };
  }
  return false;
}

export function getAffiliate(referrer: any) {
  const affiliate = Object.create({});
  if (typeof referrer === 'string') {
    const { searchParams } = new URL(referrer);
    if (searchParams.has('irclickid')) {
      affiliate.affiliate_id = searchParams.get('irclickid');
      affiliate.affiliate_name = 'impact';
    }
  }

  return affiliate;
}

export function getCampaign(req: express.Request) {
  const campaign = getUTM(req.headers.referrer);
  return campaign;
}

export async function getLocation(ipaddress: string): Promise<Location> {
  let location = null;
  try {
    location = await geoip.lookup(ipaddress);
    if (!location) {
      throw Error('No location available');
    }
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
  return {
    country: location.country,
    region: location.region,
    city: location.city,
    timezone: location.timezone,
  };
}
