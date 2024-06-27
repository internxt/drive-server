import { NextFunction, Request, Response } from 'express';

export const convertSizeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const client = req.headers['internxt-client'] as string;
  const clientVersion = req.headers['internxt-version'] as string;
  const userAgent = req.headers['user-agent'] ?? '';
  // early exit meant to only apply this middleware for macOs client with older versions
  if (
    client !== 'drive-desktop' ||
    !userAgent.toLowerCase().includes('mac') ||
    compareVersion(clientVersion, '2.2.0.50') > 0
  ) {
    return next();
  }
  const oldSend = res.send;
  res.send = function (data) {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    let newData = data;
    if (typeof parsedData === 'object') {
      newData = { ...parsedData };
      if ('size' in newData && typeof newData.size !== 'string') {
        newData.size = newData.size.toString();
      }
    }

    return oldSend.call(this, JSON.stringify(newData));
  };

  next();
};

const cleanAndSplitVersion = (version: string): number[] => {
  return version
    .replace(/[^0-9.]/g, '')
    .split('.')
    .map(Number);
};

export const compareVersion = (v1: string, v2: string): number => {
  let v1Parts = cleanAndSplitVersion(v1);
  let v2Parts = cleanAndSplitVersion(v2);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  v1Parts = [...v1Parts, ...new Array(maxLength - v1Parts.length).fill(0)];
  v2Parts = [...v2Parts, ...new Array(maxLength - v2Parts.length).fill(0)];

  for (let i = 0; i < v1Parts.length; i++) {
    if (v1Parts[i] > v2Parts[i]) {
      return 1;
    } else if (v1Parts[i] < v2Parts[i]) {
      return -1;
    }
  }

  return 0;
};
