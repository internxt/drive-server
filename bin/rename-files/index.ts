import { Command } from 'commander';
import { items } from '@internxt/lib';
import Database from '../../src/config/initializers/database';
import initFolderModel, { FolderAttributes } from '../../src/app/models/folder';
import initFileModel, { FileAttributes } from '../../src/app/models/file';
import {
  createTimer,
  getFilesToAddPlainName,
  getFoldersToRename,
  renameFile,
  renameFolder,
  UpdateFilesResponse,
  UpdateFolderResponse,
} from './utils';
import Server from '../../src/config/initializers/server';
const App = new Server();
const crypt = require('../../src/app/services/crypt')(null, App);
import Config from '../../src/config/config';

type CommandOptions = {
  dbHostname: string;
  dbPort: string;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
  limit?: string;
};

const commands: { flags: string; description: string; required: boolean }[] = [
  {
    flags: '--db-hostname <database_hostname>',
    description: 'The hostname of the database where folders are stored',
    required: true,
  },
  {
    flags: '--db-port <database_port>',
    description: 'The database port',
    required: true,
  },
  {
    flags: '--db-name <database_name>',
    description: 'The name of the database where folders are stored',
    required: true,
  },
  {
    flags: '--db-username <database_username>',
    description: 'The username authorized to read and delete from the folders table',
    required: true,
  },
  {
    flags: '--db-password <database_password>',
    description: 'The database username password',
    required: true,
  },
  {
    flags: '-l, --limit <limit>',
    description: 'The files limit to handle each time',
    required: false,
  },
];

const command = new Command('decrypt-folders-name').version('0.0.1');

commands.forEach((c) => {
  if (c.required) {
    command.requiredOption(c.flags, c.description);
  } else {
    command.option(c.flags, c.description);
  }
});

command.parse();

const opts: CommandOptions = command.opts();

const db = Database.getInstance(Config.getInstance().get('database'));

const timer = createTimer();
timer.start();

let totalFoldersRenamed = 0;
let totalRequests = 0;
let failedRequests = 0;

let totalFilesRenamed = 0;
let totalFileRequests = 0;
let failedFileRequests = 0;

const logIntervalId = setInterval(() => {
  console.log(
    // eslint-disable-next-line max-len
    `DECRYPTED FOLDERS NAME RATE: ${totalFoldersRenamed} ${totalFoldersRenamed / (timer.end() / 1000)}/s | FAILURE RATE ${(failedRequests / totalRequests) * 100}%`,
  );

  console.log(
    ' DECRYPTED FILES NAME RATE: %s/s | FAILURE RATE %s%',
    totalFilesRenamed / (timer.end() / 1000),
    (failedFileRequests / totalFileRequests) * 100,
  );
}, 10000);

function finishProgram() {
  clearInterval(logIntervalId);

  console.log('TOTAL DECRYPTED FOLDERS NAME %s | DURATION %ss', totalFoldersRenamed, (timer.end() / 1000).toFixed(2));
  console.log('TOTAL DECRYPTED FILES NAME %s | DURATION %ss', totalFilesRenamed, (timer.end() / 1000).toFixed(2));
  db.close()
    .then(() => {
      console.log('DISCONNECTED FROM DB');
    })
    .catch((err) => {
      console.log('Error closing connection %s. %s', err.message.err.stack || 'NO STACK.');
    });
}

process.on('SIGINT', () => finishProgram());

const addFoldersPlainName = async (limit: number) => {
  let offset = 0;
  let hasMore = true;

  const folderModel = initFolderModel(db);
  do {
    const folders = await getFoldersToRename(folderModel, limit, offset);

    const promises: Promise<any>[] = [];

    console.time('rename-folders');

    for (const folder of folders) {
      const name = folder.getDataValue('name');
      const parentId = folder.getDataValue('parentId');
      const decryptedName = crypt.decryptName(name, parentId) ||'Untitled folder';

      console.log('Renaming folder', folder.getDataValue('id'), 'to', decryptedName);

      promises.push(folder.update({
        plain_name: decryptedName,
      } as unknown as FolderAttributes));
    }
    const results = await Promise.allSettled(promises);

    console.timeEnd('rename-folders');

    totalRequests += results.length;
    failedRequests += results.filter((r) => r.status === 'rejected').length;
    totalFoldersRenamed += results.length - failedRequests;

    offset += failedRequests;
    hasMore = folders.length === limit;

    console.log('offset', offset);
  } while (hasMore);
};

async function tryRename(file: any, folderId: number, name: string, type: string) {
  let rename = true;
  let list = [{ name, type }]; 

  while (rename) {
    try {
      const [,,renamed] = items.renameIfNeeded(
        list, 
        name,
        type
      );

      // for the next iteration
      list.push({ name: renamed, type });

      console.log('Trying to rename', name, 'to', renamed, 'items are', list);

      await file.update({
        plain_name: renamed,
        name: crypt.encryptName(renamed, folderId)
      } as unknown as FileAttributes)

      rename = false;
    } catch (err) {
      if ((err as any).parent.code !== '23505') {
        throw err;
      }
    }
  }
}

const addFilesPlainName = async (limit: number) => {
  let offset = 0;
  const fileModel = initFileModel(db);
  let hasMore = true;

  do {
    const files = await getFilesToAddPlainName(fileModel, limit, offset);

    const promises: Promise<any>[] = [];

    console.time('rename-files');

    for (const file of files) {
      const name = file.getDataValue('name');
      const folderId = file.getDataValue('folder_id' as keyof FileAttributes);

      const decryptedName = crypt.decryptName(name, folderId) || 'Untitled file';

      console.log('Renaming file', file.getDataValue('id'), 'to', decryptedName);
      
      const type = file.getDataValue('type');

      promises.push(file.update({
        plain_name: decryptedName,
      } as unknown as FileAttributes).catch((err) => {
        if (err.parent.code === '23505') {
          return tryRename(
            file, 
            folderId as number, 
            decryptedName,
            type
          );
        }
      }));
    }

    const results = await Promise.allSettled(promises);

    console.timeEnd('rename-files');

    totalFileRequests += results.length;
    failedFileRequests += results.filter((r) => r.status === 'rejected').length;

    totalFilesRenamed += results.length - failedFileRequests;

    hasMore = files.length === limit;
    offset += failedFileRequests;

    console.log('offset', offset);
  } while (hasMore);
};

async function start(limit = 20) {
  console.log('waiting 5 seconds to run...');
  await new Promise((r) => setTimeout(r, 5000));
  // await addFoldersPlainName(limit);

  await addFilesPlainName(limit);
}

start(parseInt(opts.limit || '20'))
  .catch((err) => {
    console.log('err', err);
  })
  .finally(() => {
    finishProgram();
  });