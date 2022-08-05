require('dotenv').config();
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { encryptFilename, createTestUser, deleteTestUser } from './utils';
import { Sign } from '../../src/app/middleware/passport';
import { applicationInitialization } from './setup';
import { FileModel } from '../../src/app/models/file';
import { FolderModel } from '../../src/app/models/folder';
import sequelize from 'sequelize';
const { Op } = sequelize;
const server = require('../../src/app');
const app = server.express;

const deleteAllUserFilesFromDatabase = async (userId: number): Promise<void> => {
  const files = await server.models.file.findAll({ where: { user_id: userId } });
  await files.forEach((file: FileModel) => file.destroy());
};

const deleteAllUserFoldersFromDatabase = async (userId: number): Promise<void> => {
  const folders = await server.models.folder.findAll({ where: { user_id: userId } });
  await folders.forEach((folder: FolderModel) => folder.destroy());
};

const clearUserDrive = async (userId: number, rootFolderId: number): Promise<void> => {
  await deleteAllUserFilesFromDatabase(userId);

  const folders = await server.models.folder.findAll({ where: { user_id: userId, id: { [Op.not]: rootFolderId } } });
  await folders.map((folder: FileModel) => folder.destroy());
};

const createFolder = async (body: any, authToken: string): Promise<request.Response> =>
  await request(app).post('/api/storage/folder').set('Authorization', `Bearer ${authToken}`).send(body);

const createFileOnFolder = async (folderId: number, name: string, authToken: string): Promise<request.Response> =>
  await request(app)
    .post('/api/storage/file')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      file: {
        fileId: '62e7adcfbf9465001f6a4d01',
        type: 'jpg',
        bucket: '01fa78f686158a14f8f7009b',
        size: 57,
        folder_id: folderId,
        name: name,
        encrypt_version: '03-aes',
      },
    });

describe('Storage controller (e2e)', () => {
  let token: string;
  let userId: number;
  let rootFolderId: number;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'e2e') {
      throw new Error('Cannot do E2E tests without NODE_ENV=e2e ');
    }

    await applicationInitialization(app);
    const email = `test${Date.now()}@internxt.com`;
    const user = await createTestUser(email);

    userId = user.dataValues.id;
    rootFolderId = user.dataValues.root_folder_id;
    token = Sign({ email }, server.config.get('secrets').JWT);
  });

  afterAll(async () => {
    try {
      await deleteTestUser(userId);
      await deleteAllUserFilesFromDatabase(userId);
      await deleteAllUserFoldersFromDatabase(userId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    await server.stop();
  });

  afterEach(async () => {
    await clearUserDrive(userId, rootFolderId);
  });

  describe('Storage Endpoints', () => {
    describe('File management', () => {
      describe('File creation', () => {
        it('creates a file on users root folder', async () => {
          const fileName = encryptFilename(`test-${Date.now()}`, rootFolderId);
          const response = await createFileOnFolder(rootFolderId, fileName, token);

          expect(response.status).toBe(HttpStatus.OK);
        });

        it('creates a file on users folder', async () => {
          const { body: folder } = await createFolder(
            {
              folderName: 'this is test',
              parentFolderId: rootFolderId,
            },
            token,
          );
          const fileName = encryptFilename(`test-${Date.now()}`, rootFolderId);

          const response = await createFileOnFolder(folder.id, fileName, token);

          expect(response.status).toBe(HttpStatus.OK);
        });

        it('should fail when trying to create a file on an invalid folder', async () => {
          const fileName = encryptFilename(`test-${Date.now()}`, rootFolderId);
          const response = await createFileOnFolder(0, fileName, token);

          expect(response.status).toBe(HttpStatus.BAD_REQUEST);
          expect(response.body.error).toBe('Invalid metadata for new file');
        });

        it('should fail when trying to create a file on non existent folder', async () => {
          const folderId = Number.MAX_VALUE;
          const fileName = encryptFilename(`test-${Date.now()}`, folderId);
          const response = await createFileOnFolder(folderId, fileName, token);

          expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });

        it('should fail when creating a file with a name that already exists', async () => {
          const folder = await createFolder(
            {
              folderName: 'duplicate files',
              parentFolderId: rootFolderId,
            },
            token,
          );
          const fileName = encryptFilename('cat-meme', folder.body.id);

          await createFileOnFolder(folder.body.id, fileName, token);

          const response = await createFileOnFolder(folder.body.id, fileName, token);

          expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
      });
    });

    describe('Folder management', () => {
      describe('Folder creation', () => {
        it('should create a folder on the user root folder', async () => {
          const response = await request(app).post('/api/storage/folder').set('Authorization', `Bearer ${token}`).send({
            folderName: 'folder on root',
            parentFolderId: rootFolderId,
          });

          expect(response.status).toBe(HttpStatus.CREATED);
          expect(response.body.parentId).toBe(rootFolderId);
          expect(response.body.userId).toBe(userId);
        });

        it('should create a folder inside another folder', async () => {
          const firstFolderResponse = await createFolder(
            {
              folderName: 'another folder',
              parentFolderId: rootFolderId,
            },
            token,
          );
          const firstFolderId = firstFolderResponse.body.id;

          const secondFolderResponse = await createFolder(
            {
              folderName: 'second',
              parentFolderId: firstFolderId,
            },
            token,
          );

          expect(secondFolderResponse.status).toBe(HttpStatus.CREATED);
          expect(secondFolderResponse.body.parentId).toBe(firstFolderId);
          expect(secondFolderResponse.body.userId).toBe(userId);
        });

        it('should fail when creating a folder that already exists', async () => {
          const firstFolderResponse = await createFolder(
            {
              folderName: 'my folder',
              parentFolderId: rootFolderId,
            },
            token,
          );

          const secondFolderResponse = await createFolder(
            {
              folderName: 'my folder',
              parentFolderId: rootFolderId,
            },
            token,
          );

          expect(firstFolderResponse.status).toBe(HttpStatus.CREATED);
          expect(secondFolderResponse.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          expect(secondFolderResponse.body.error).toBe('Folder with the same name already exists');
        });
      });
    });
  });
});
