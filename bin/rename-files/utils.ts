require('dotenv').config();
import { Model } from 'sequelize/types';
import { FolderAttributes, FolderModel } from '../../src/app/models/folder';
const { Op } = require('sequelize');

import Server from '../../src/config/initializers/server';
import { FileModel } from '../../src/app/models/file';
import { FileAttributes } from '../../src/app/models/file';
const cryptService = require('../../src/app/services/crypt');
const App = new Server();
const crypt = cryptService(null, App);

type Timer = { start: () => void; end: () => number };

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
    },
  };
};

export function getFoldersToRename(folderModel: FolderModel, limit: number, offset=0) {
  return folderModel
    .findAll({
      limit,
      offset,
      order: [['id', 'ASC']],
      where: {
        [Op.and]: [
          {
            plain_name: {
              [Op.or]: [null, ''],
            },
          },
          {
            parent_id: {
              [Op.not]: null,
            },
          },
        ],
      },
    });
}
export type UpdateFolderResponse = [number, Model<FolderAttributes, FolderAttributes>[]];

export function getFilesToAddPlainName(fileModel: FileModel, limit: number, offset=0) {
  return fileModel
    .findAll({
      limit,
      offset,
      // order: [['id', 'ASC']],
      where: {
        plain_name: null,
        status: {
          [Op.ne]: 'DELETED'
        },
      },
    });
}
export type UpdateFilesResponse = [number, Model<FileAttributes, FileAttributes>[]];

export function renameFolder(
  folderModel: FolderModel,
  folder: FolderAttributes,
): Promise<UpdateFolderResponse> | undefined {
  const decryptedName = crypt.decryptName(folder.name, folder.parentId);

  console.log('Renaming folder', folder.id, 'to', decryptedName||'Untitled folder');

  return folderModel.update(
    {
      plainName: decryptedName ||'Untitled folder',
    },
    {
      where: {
        id: folder.id,
      },
    },
  );
}

export function renameFile(fileModel: FileModel, file: FileAttributes): Promise<UpdateFilesResponse> | undefined {
  // const decryptedName = crypt.decryptName(file.name, file.folder_id);

  // if (decryptedName && String(decryptedName).length > 0) {
  //   return fileModel.update(
  //     {
  //       plain_name: decryptedName,
  //     },
  //     {
  //       where: {
  //         id: file.id,
  //       },
  //     },
  //   );
  // }
  return undefined;
}