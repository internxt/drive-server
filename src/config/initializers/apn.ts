import * as http2 from 'http2';
import jwt, { JwtHeader } from 'jsonwebtoken';
import Logger from '../../lib/logger';

export default class Apn {
  private static instance: Apn;
  private client: http2.ClientHttp2Session;
  private readonly maxReconnectAttempts = 3;
  private reconnectAttempts = 0;
  private reconnectDelay = 1000;
  private readonly bundleId = process.env.APN_BUNDLE_ID;

  private readonly apnUrl = process.env.APN_URL as string;

  private jwt: string | null = null;
  private jwtGeneratedAt = 0;

  constructor() {
    this.client = this.connectToAPN();
  }

  static getInstance(): Apn {
    if (!Apn.instance) {
      Apn.instance = new Apn();
    }
    return Apn.instance;
  }

  private connectToAPN(): http2.ClientHttp2Session {
    const apnSecret = process.env.APN_SECRET;
    const apnKeyId = process.env.APN_KEY_ID;
    const apnTeamId = process.env.APN_TEAM_ID;

    if (!apnSecret || !apnKeyId || !apnTeamId || !this.apnUrl) {
      Logger.getInstance().warn('APN env variables are not defined');
    }

    const client = http2.connect(this.apnUrl);

    client.on('error', (err) => {
      Logger.getInstance().error('APN connection error', err);
    });
    client.on('close', () => {
      Logger.getInstance().warn('APN connection was closed');
      this.handleReconnect();
    });
    client.on('connect', () => {
      Logger.getInstance().info('Connected to APN');
    });

    return client;
  }

  private generateJwt(): string {
    if (!process.env.APN_SECRET || !process.env.APN_KEY_ID || !process.env.APN_TEAM_ID) {
      throw new Error('Undefined APN env variables, necessary for JWT generation');
    }
    if (this.jwt && Date.now() - this.jwtGeneratedAt < 3600) {
      return this.jwt;
    }

    this.jwt = jwt.sign(
      {
        iss: process.env.APN_TEAM_ID,
        iat: Math.floor(Date.now() / 1000),
      },
      Buffer.from(process.env.APN_SECRET, 'base64').toString('utf8'),
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: process.env.APN_KEY_ID,
        } as JwtHeader,
      },
    );

    this.jwtGeneratedAt = Date.now();

    return this.jwt;
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        Logger.getInstance().info(`Attempting to reconnect to APN (#${this.reconnectAttempts + 1})`);
        this.connectToAPN();
        this.reconnectAttempts++;
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    } else {
      Logger.getInstance().error('Maximum APN reconnection attempts reached');
    }
  }

  public sendStorageNotification(deviceToken: string, userUuid: string): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      if (!this.client || this.client.closed) {
        this.connectToAPN();
      }

      const headers: http2.OutgoingHttpHeaders = {
        [http2.constants.HTTP2_HEADER_METHOD]: 'POST',
        [http2.constants.HTTP2_HEADER_PATH]: `/3/device/${deviceToken}`,
        [http2.constants.HTTP2_HEADER_SCHEME]: 'https',
        [http2.constants.HTTP2_HEADER_AUTHORITY]: 'api.push.apple.com',
        [http2.constants.HTTP2_HEADER_CONTENT_TYPE]: 'application/json',
        [http2.constants.HTTP2_HEADER_AUTHORIZATION]: `bearer ${this.generateJwt()}`,
        'apns-topic': `${this.bundleId}.pushkit.fileprovider`,
      };

      const req = this.client.request({ ...headers });

      req.setEncoding('utf8');
      req.write(
        JSON.stringify({
          'container-identifier': 'NSFileProviderWorkingSetContainerItemIdentifier',
          domain: userUuid,
        }),
      );

      req.end();

      let statusCode = 0;
      let data = '';

      req.on('response', (_, status) => {
        statusCode = status || 0;
      });

      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        resolve({ statusCode, body: data });
      });

      req.on('error', (err) => {
        Logger.getInstance().error('APN request error', err);
        reject(new Error(err));
      });
    });
  }
}
