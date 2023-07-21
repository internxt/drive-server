import { request } from '@internxt/lib';
import { Op } from 'sequelize';
import axios, { AxiosRequestConfig } from 'axios';
import { sign } from 'jsonwebtoken';
import { FileAttributes, FileModel, FileStatus } from '../../src/app/models/file';

type Timer = { start: () => void, end: () => number }

export function signToken(duration: string, secret: string) {
  return sign(
    {},
    Buffer.from(secret, 'base64').toString('utf8'),
    {
      algorithm: 'RS256',
      expiresIn: duration
    }
  );
}

export const createTimer = (): Timer => {
  let timeStart: [number, number];

  return {
    start: () => {
      timeStart = process.hrtime();
    },
    end: () => {
      const NS_PER_SEC = 1e9;
      const NS_TO_MS = 1e6;
      const diff = process.hrtime(timeStart);

      return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
    }
  };
};

export function getFilesToDelete(
  files: FileModel, 
  limit: number, 
  updatedAt: Date,
  lastId: number
): Promise<FileAttributes[]> {
  return files.findAll({
    limit,
    raw: true,
    where: {
      status: FileStatus.DELETED,
      id: {
        [Op.lt]: lastId
      },
      updatedAt: {
        [Op.gte]: updatedAt
      },
    },
    order: [['id', 'DESC']]
  }).then(res => {
    return res as unknown as FileAttributes[];
  });
}

export type DeleteFilesResponse = {
  message: {
    confirmed: string[],
    notConfirmed: string[]
  }
}

export function deleteFiles(endpoint: string, fileIds: string[], jwt: string): Promise<DeleteFilesResponse> {
  const params: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
    data: {
      files: fileIds
    }
  };

  return axios.delete<DeleteFilesResponse>(endpoint, params)
    .then((res) => res.data)
    .catch((err) => {
      throw new Error(request.extractMessageFromError(err));
    });
}
