import axios from 'axios';
import { FileAttributes } from '../../app/models/file';
import Logger from '../../lib/logger';

type RequestData = {
  event: string;
  payload: Record<string, any>;
  email: string;
  clientId: string;
};

export default class Notifications {
  private static instance: Notifications;

  static getInstance(): Notifications {
    if (Notifications.instance) {
      return Notifications.instance;
    }

    if (!process.env.NOTIFICATIONS_API_KEY || !process.env.NOTIFICATIONS_URL)
      Logger.getInstance().warn('NOTIFICATIONS env variables must be defined');

    Notifications.instance = new Notifications();

    return Notifications.instance;
  }

  fileCreated({
    file,
    email,
    clientId,
  }: { file: FileAttributes } & Pick<RequestData, 'email' | 'clientId'>): Promise<void> {
    return this.post({ event: 'FILE_CREATED', payload: file, email, clientId });
  }

  fileUpdated({
    file,
    email,
    clientId,
  }: { file: FileAttributes } & Pick<RequestData, 'email' | 'clientId'>): Promise<void> {
    return this.post({ event: 'FILE_UPDATED', payload: file, email, clientId });
  }

  private async post(data: RequestData): Promise<void> {
    try {
      const res = await axios.post(process.env.NOTIFICATIONS_URL as string, data, {
        headers: { 'X-API-KEY': process.env.NOTIFICATIONS_API_KEY as string },
      });
      if (res.status !== 201)
        Logger.getInstance().warn(
          `Post to notifications service failed with status ${res.status}. Data: ${JSON.stringify(data, null, 2)}`,
        );
    } catch (err) {
      Logger.getInstance().warn(
        `Post to notifications service failed with error ${(err as Error).message}. Data: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      );
    }
  }
}
