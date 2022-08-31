require('dotenv').config();
const uuid = require('uuid');
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { encryptFilename, createTestUser, deleteTestUser, delay } from './utils';
import { Sign } from '../../src/app/middleware/passport';
import { applicationInitialization } from './setup';
import { FileModel } from '../../src/app/models/file';
import sequelize from 'sequelize';
const { Op } = sequelize;
const server = require('../../src/app');
const app = server.express;

const deleteAllUserFilesFromDatabase = async (userId: number): Promise<void> => {
  const files = await server.models.file.findAll({ where: { user_id: userId } });
  for (const file of files) {
    await file.destroy();
  }
};

const deleteAllUserFoldersFromDatabase = async (userId: number): Promise<void> => {
  const folders = await server.models.folder.findAll({ where: { user_id: userId } });
  for (const dolder of folders) {
    await dolder.destroy();
  }
};

const clearUserDrive = async (userId: number, rootFolderId: number): Promise<void> => {
  await deleteAllUserFilesFromDatabase(userId);

  const folders = await server.models.folder.findAll({ where: { user_id: userId, id: { [Op.not]: rootFolderId } } });
  await Promise.all(folders.map((folder: FileModel) => folder.destroy()));

  await server.database.query('DELETE FROM deleted_files WHERE user_id = (:userId)', {
    replacements: { userId },
  });
};

const createFolder = async (body: any, authToken: string): Promise<request.Response> =>
  await request(app).post('/api/storage/folder').set('Authorization', `Bearer ${authToken}`).send(body);

const createFileOnFolder = async (folderId: number, name: string, authToken: string): Promise<request.Response> =>
  await request(app)
    .post('/api/storage/file')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      file: {
        fileId: uuid.v4().substring(0, 24),
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
    try {
      if (process.env.NODE_ENV !== 'e2e') {
        throw new Error('Cannot do E2E tests without NODE_ENV=e2e ');
      }

      await applicationInitialization(app);
      const email = `test${Date.now()}@internxt.com`;
      const user = await createTestUser(email);

      if (!user.dataValues.id || !user.dataValues.root_folder_id) {
        process.exit();
      }

      userId = user.dataValues.id;
      rootFolderId = user.dataValues.root_folder_id;
      token = Sign({ email }, server.config.get('secrets').JWT);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error setting up storage e2e tests: %s', err.message);
      process.exit(1);
    }
  });

  afterAll(async () => {
    try {
      await deleteTestUser(userId);
      await deleteAllUserFilesFromDatabase(userId);
      await deleteAllUserFoldersFromDatabase(userId);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error after storage e2e tests: %s', err.message);
    } finally {
      await server.stop();
    }
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

      describe('File deletion', () => {
        describe('From folder', () => {
          it('should be able to delete a file', async () => {
            const deleteFileFromStorgeMock = jest.fn();
            deleteFileFromStorgeMock.mockReturnValueOnce(Promise.resolve());
            server.services.Inxt.DeleteFile = deleteFileFromStorgeMock;

            const fileName = encryptFilename(`test-${Date.now()}`, rootFolderId);
            const { body } = await createFileOnFolder(rootFolderId, fileName, token);

            const response = await request(app)
              .delete(`/api/storage/folder/${rootFolderId}/file/${body.id}`)
              .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.deleted).toBe(true);
          });

          it('should be able to delete a file inside a folder', async () => {
            const deleteFileFromStorgeMock = jest.fn();
            deleteFileFromStorgeMock.mockReturnValueOnce(Promise.resolve());
            server.services.Inxt.DeleteFile = deleteFileFromStorgeMock;

            const { body: folder } = await createFolder(
              {
                folderName: 'this is test',
                parentFolderId: rootFolderId,
              },
              token,
            );
            const fileName = encryptFilename(`test-${Date.now()}`, rootFolderId);
            const { body: file } = await createFileOnFolder(folder.id, fileName, token);

            const response = await request(app)
              .delete(`/api/storage/folder/${folder.id}/file/${file.id}`)
              .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.deleted).toBe(true);
          });
        });

        describe('From bucket', () => {
          it('should be able to delete a file', async () => {
            const deleteFileFromStorgeMock = jest.fn();
            deleteFileFromStorgeMock.mockReturnValueOnce(Promise.resolve());
            server.services.Inxt.DeleteFile = deleteFileFromStorgeMock;

            const fileName = encryptFilename(`test-${Date.now()}`, rootFolderId);
            const { body: file } = await createFileOnFolder(rootFolderId, fileName, token);

            const response = await request(app)
              .delete(`/api/storage/bucket/${file.bucket}/file/${file.fileId}`)
              .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.deleted).toBe(true);
          });
        });
      });

      describe('Move file', () => {
        it('should be able to move files', async () => {
          const name = 'my file';
          const encriptedFileName = encryptFilename(name, rootFolderId);
          const { body: file } = await createFileOnFolder(rootFolderId, encriptedFileName, token);
          const { body: destinationFolder } = await createFolder(
            {
              folderName: 'destination folder',
              parentFolderId: rootFolderId,
            },
            token,
          );

          const response = await request(app)
            .post('/api/storage/move/file')
            .set('Authorization', `Bearer ${token}`)
            .send({
              fileId: file.fileId,
              destination: destinationFolder.id,
            });

          expect(response.status).toBe(HttpStatus.OK);
          expect(response.body.moved).toBe(true);
          expect(response.body.item.name).toBe(name);
        });

        it('should fail if a file with te same name exist on the destianation folder', async () => {
          const name = 'my file';
          const encriptedFileName = encryptFilename(name, rootFolderId);
          const { body: file } = await createFileOnFolder(rootFolderId, encriptedFileName, token);
          const { body: destinationFolder } = await createFolder(
            {
              folderName: 'destination folder',
              parentFolderId: rootFolderId,
            },
            token,
          );

          await createFileOnFolder(destinationFolder.id, encryptFilename(name, destinationFolder.id), token);

          const response = await request(app)
            .post('/api/storage/move/file')
            .set('Authorization', `Bearer ${token}`)
            .send({
              fileId: file.fileId,
              destination: destinationFolder.id,
            });

          expect(response.status).toBe(HttpStatus.CONFLICT);
          expect(response.body.error).toBe('A file with same name exists in destination');
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

      describe('Folder deletion', () => {
        it('should be able to delete a folder', async () => {
          const { body: folder } = await request(app)
            .post('/api/storage/folder')
            .set('Authorization', `Bearer ${token}`)
            .send({
              folderName: 'folder on root',
              parentFolderId: rootFolderId,
            });

          const response = await request(app)
            .delete(`/api/storage/folder/${folder.id}`)
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(HttpStatus.NO_CONTENT);
        });

        it('should delete containing files', async () => {
          const { body: folder } = await request(app)
            .post('/api/storage/folder')
            .set('Authorization', `Bearer ${token}`)
            .send({
              folderName: 'folder on root',
              parentFolderId: rootFolderId,
            });
          const fileName = encryptFilename(`test-${Date.now()}`, folder.id);
          const { body: file } = await createFileOnFolder(folder.id, fileName, token);

          const response = await request(app)
            .delete(`/api/storage/folder/${folder.id}`)
            .set('Authorization', `Bearer ${token}`);
          expect(response.status).toBe(HttpStatus.NO_CONTENT);

          const [, result] = await server.database.query(
            'SELECT * FROM deleted_files WHERE file_id = (:fileId) AND user_id = (:userId)',
            {
              replacements: { fileId: file.fileId, userId },
            },
          );

          expect(result.rowCount).toBe(1);
        });

        it('should delete all subfolders', async () => {
          const { body: folder } = await request(app)
            .post('/api/storage/folder')
            .set('Authorization', `Bearer ${token}`)
            .send({
              folderName: 'folder on root',
              parentFolderId: rootFolderId,
            });

          await request(app).post('/api/storage/folder').set('Authorization', `Bearer ${token}`).send({
            folderName: 'firstSubfolder',
            parentFolderId: folder.id,
          });

          await request(app).post('/api/storage/folder').set('Authorization', `Bearer ${token}`).send({
            folderName: 'secondSubfolder',
            parentFolderId: folder.id,
          });

          const response = await request(app)
            .delete(`/api/storage/folder/${folder.id}`)
            .set('Authorization', `Bearer ${token}`);

          await delay(2); // A delay is needed to avoid race conditions invalidates the test

          const [, result] = await server.database.query(
            'SELECT * FROM folders WHERE user_id = (:userId) AND parent_id = (:folderId)',
            {
              replacements: { userId, folderId: folder.id },
            },
          );

          expect(response.status).toBe(HttpStatus.NO_CONTENT);
          expect(result.rowCount).toBe(0);
        });

        it('should not be able to delete a root folder', async () => {
          const response = await request(app)
            .delete(`/api/storage/folder/${rootFolderId}`)
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
      });

      describe('Move folder', () => {
        it('should be able to move folders', async () => {
          const { body: folder } = await createFolder(
            {
              folderName: 'folder to move',
              parentFolderId: rootFolderId,
            },
            token,
          );

          const { body: destinationFolder } = await createFolder(
            {
              folderName: 'destination',
              parentFolderId: rootFolderId,
            },
            token,
          );

          const response = await request(app)
            .post('/api/storage/move/folder')
            .set('Authorization', `Bearer ${token}`)
            .send({
              folderId: folder.id,
              destination: destinationFolder.id,
            });

          expect(response.status).toBe(HttpStatus.OK);
        });

        it('should not be able to move folder inside itself', async () => {
          const { body: folder } = await createFolder(
            {
              folderName: 'folder to move',
              parentFolderId: rootFolderId,
            },
            token,
          );

          const response = await request(app)
            .post('/api/storage/move/folder')
            .set('Authorization', `Bearer ${token}`)
            .send({
              folderId: folder.id,
              destination: folder.id,
            });

          expect(response.status).toBe(HttpStatus.CONFLICT);
        });

        it('should fail if a folder with the same name exists on destianation', async () => {
          const { body: folder } = await createFolder(
            {
              folderName: 'folder to move',
              parentFolderId: rootFolderId,
            },
            token,
          );

          const { body: destinationFolder } = await createFolder(
            {
              folderName: 'destination folder',
              parentFolderId: rootFolderId,
            },
            token,
          );

          await createFolder(
            {
              folderName: 'folder to move',
              parentFolderId: destinationFolder.id,
            },
            token,
          );

          const response = await request(app)
            .post('/api/storage/move/folder')
            .set('Authorization', `Bearer ${token}`)
            .send({
              folderId: folder.id,
              destination: destinationFolder.id,
            });

          expect(response.status).toBe(HttpStatus.CONFLICT);
        });

        it('should fail when the destination folder does not exists', async () => {
          const destinationFolderId = 50000;
          const { body: folder } = await createFolder(
            {
              folderName: 'folder to move',
              parentFolderId: rootFolderId,
            },
            token,
          );

          const response = await request(app)
            .post('/api/storage/move/folder')
            .set('Authorization', `Bearer ${token}`)
            .send({
              folderId: folder.id,
              destination: destinationFolderId,
            });

          expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });

        it('should fail when the folder to move does not exists', async () => {
          const folderId = 8800;
          const { body: destinationFolder } = await createFolder(
            {
              folderName: 'destination',
              parentFolderId: rootFolderId,
            },
            token,
          );

          const response = await request(app)
            .post('/api/storage/move/folder')
            .set('Authorization', `Bearer ${token}`)
            .send({
              folderId: folderId,
              destination: destinationFolder.id,
            });
          
          expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
      });
    });
  });
});
