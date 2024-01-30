require('dotenv').config();
const uuid = require('uuid');
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { encryptFilename, createTestUser, deleteTestUser, delay } from './utils';
import { Sign } from '../../src/app/middleware/passport';
import { applicationInitialization } from './setup';
import sequelize from 'sequelize';
import speakeasy from 'speakeasy';
import sinon from 'sinon';
const { Op } = sequelize;

const server = require('../../src/app');
const app = server.express;

function enforcePropertiesInObject(object: Record<string, any>, expectedProperties: string[]) {
  expectedProperties.forEach((property) => {
    expect(object).toHaveProperty(property);
  });

  Object.keys(object).forEach((property) => {
    if (!expectedProperties.includes(property)) {
      throw new Error(`Property ${property} not expected`);
    }
  });
}

describe('E2E TEST', () => {
  beforeAll(async () => {
    try {
      if (process.env.NODE_ENV !== 'e2e') {
        throw new Error('Cannot do E2E tests without NODE_ENV=e2e ');
      }

      await applicationInitialization(app);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error setting up storage e2e tests: %s', err.message);
      process.exit(1);
    }
  });

  afterAll(async () => {
    await server.stop();
  });

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

  const createFolder = async (body: any, authToken: string): Promise<request.Response> =>
    await request(app).post('/api/storage/folder').set('Authorization', `Bearer ${authToken}`).send(body);

  const deleteAllUserFilesFromDatabase = async (userId: number): Promise<void> => {
    await server.models.file.destroy({ where: { user_id: userId } });
  };

  const deleteAllUserFoldersFromDatabase = async (userId: number): Promise<void> => {
    await server.models.folder.destroy({ where: { user_id: userId } });
  };

  const clearUserDrive = async (userId: number, rootFolderId: number): Promise<void> => {
    await deleteAllUserFilesFromDatabase(userId);

    await server.models.folder.destroy({
      where: { user_id: userId, id: { [Op.not]: rootFolderId } },
    });

    await server.database.query('DELETE FROM deleted_files WHERE user_id = (:userId)', {
      replacements: { userId },
    });
  };
  describe('Storage', () => {
    let token: string;
    let userId: number;
    let rootFolderId: number;

    beforeAll(async () => {
      try {
        const email = `test${Date.now()}@internxt.com`;
        const user = await createTestUser(email);

        if (!user.dataValues.id || !user.dataValues.root_folder_id) {
          process.exit();
        }

        userId = user.dataValues.id;
        rootFolderId = user.dataValues.root_folder_id;
        token = Sign(email, server.config.get('secrets').JWT);
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

          it('should fail if a file with the same name exist on the destination folder', async () => {
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
            const response = await request(app)
              .post('/api/storage/folder')
              .set('Authorization', `Bearer ${token}`)
              .send({
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

          it('should fail when the folder to move does not exist', async () => {
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

  describe('Auth', () => {
    const testUsersEmail: Array<any> = [];
    const TEST_USER_EMAIL = 'e2etest@internxt.com';

    const registrationBodyFor = (email: string) => ({
      name: 'e2e',
      captcha:
        // eslint-disable-next-line max-len
        '03ANYolquuZzhqnd04-npJ7XE2cd4Ypkhtv8HT834JQfm0y2jT5rbBSwX2sbjb3828OvE43DZxRpwbwTqsK3V-zKO79KBTDz9T4SKSCpMeZJ3smWNPHFxOL-dSSpzxyZer9FsAYBwWEfQPcOOvEdMT5VOm-cg1yuxp6P5qcP6toyt9lfD0F_vPXPudN7nrvb3l8P3u5_xLpsXLKTKQJZr_t8H47s1HrWs47eEboy9Y29jAfovq7S8x4u2fAvO0RTWx2bNf_m_TuX2ECy8rcUu09VeYAj7i7puhvzYKZymU_Ofbr9Vv-pkOGHtvGXsNS_Pcylncsz4RhTDDzMATub5IPqdyid4d5zJhp2JJEVWa525y-QjP1X7gnsepGWjtUaMGwN30fPNhLLHsTgm68f23-qRqqggGBE3nt9fVqRJqLSTJra_DNc9jB18tCAc5Sncs_x1ZJsmfVS9h2ANZUqXw3a8SdtHqCOLcFKNVRscjd5dNwNTmcaALQ08kB_fdTn2z9-E6e3vWDbxF',
      lastname: 'test',
      email: email,
      password:
        // eslint-disable-next-line max-len
        '53616c7465645f5f2d3fdd7b5fb2cfeb3e2a398549816c74c86f11fccceda28b00d21a015c8d37cc0ce8e178b2a4da7d139f2084a377bb8278c643a168c3703f72b668d7172ad5e0c0eff7b2e20f683593ab070ef037887ad2a709ed867f32ce',
      mnemonic:
        // eslint-disable-next-line max-len
        '53616c7465645f5f9057a400ca37a3e323d7d38b0d7ccaf0d7449e7a347010af0351722f6ab3dbd748b13988eec0f2cf6e0e876dc3893153707586483372bcb738bc6ae9de30bbe2ea4521c656d233d80eb50aec5158d96026ee631715dce36b8d4b957843c0b8ac7cf175a395d75e0920680a0cee72295b27a728a05554dc5cbe7ece85eaf145bcca8669542883f7a000474302e96139bbe74d4c03429e2982c91791f8d6d99c6010b7ac038eca59fa',
      salt:
        // eslint-disable-next-line max-len
        '53616c7465645f5f8e17d06c84994cb00c87d8d3dc9c00725c4d3acfa1c6006296c7385a52db834f63f4082474b5d3d88436ea11e78b0da18f129ea1859f77e0',
      privateKey:
        // eslint-disable-next-line max-len
        'ONzgORtJ77qI28jDnr+GjwJn6xELsAEqsn3FKlKNYbHR7Z129AD/WOMkAChEKx6rm7hOER2drdmXmC296dvSXtE5y5os0XCS554YYc+dcCPONNcU+elt60nUhTZaDfW96KbDioiZT0ZdXl4d+2vmBTWoxgJeo5Bt+gj45HYbihvDzXeLjbwSvx/nWAJEOe+OLLcUQVQ0+3S+OaPknlGS/IiDXy8VhtQuuaayGH5kMmwaoulY7w7/BtJnK9kXkPm5J4zIq3xJiMzqcKaLSvVWIXe7rBItPh2IjgB/3vALXSwEjHBZoo/FjBz/iLwbonTM8htMkNJjX1oaGymnt0AmM4zTdAohfiMgpfkngxkVsiLxuADw4AB4KZMfFLOPV7YVpUWsulv3mal1MkjtNbwP785JUaLDnnsmjnnVG0z/w/+pXqs+9uUrXoNBmj4VybIKY27JS14Fxz2/VvbpAUxjocQ9JgTHRpSl52ShexlcD3rdt+wfNzR7UW3kl1JVUM6dSZcrtMwuSqawhRNv7FEmUyJLWE41GqWGlWo/93APjt5xr5ASilfg0MUOj2FIHCxQSDlNBcxpkA8EzQUczqSzeUJJFICAoS/axanXDhw4ht/Km1ipIOzvKBYagJ+lSvsU+/rjgaBKueM9FIrleW64C/Cvp5/yAZ7fTQcnXuDxm36q9LJISg4bu0LC47f0sPBonWc248ZoGHi6jnK87uKUBucdx0MXFm3GrQYfX2Pb+ded5yVQwkdyP2sUNcWB7+hWbsz8zFtU/tfmxsYXE9BZSWWd7cwlgGS7SVOXxdo0lmW+ggRTXF2WzUt6CmCPySVXgWT4mq83WrcqjtCpj2zeOyYCkgrMZ1qkSgiBNzM+v9maH5K0CS7ODuzLQSChm+KPPnhn+OAsyJcz2YrjH3Gf+pjhqVLJGxPwrqnPyQe+7ehwSYfDxLdffx9M0Ih293IK+t/FVYlIdMrcBSVJHImeq+eeMsQ+wP9+SGpoU6NboWefc2UQVhcZbrqMu7UPyiQS2+7RoEV4m7dfhqiqaIxDqfF/JPAgg1e3UpcRN89opYn6JAktBnRXScIjqhLbzhAGIaKYLT9z/KzCagvSp5ig42DLv+r3p0k+nUiLcKzegPpDs+5YCvqtZp5X0FHYuSWCZhiFVHLtZZanCUkbVWtTh8CQaMdrTNVqamSSkVE=',
      publicKey:
        // eslint-disable-next-line max-len
        'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tDQpWZXJzaW9uOiBPcGVuUEdQLmpzIHY0LjEwLjEwDQpDb21tZW50OiBodHRwczovL29wZW5wZ3Bqcy5vcmcNCg0KeGpNRVl2dGF3aFlKS3dZQkJBSGFSdzhCQVFkQUFjV1JHeGpyUkY4U1FkOEcxZGR4NDkvcGFQdGVPcmRqDQpBOWhObjBIaUh5ek5EenhwYm5oMFFHbHVlSFF1WTI5dFBzS1BCQkFXQ2dBZ0JRSmkrMXJDQmdzSkJ3Z0QNCkFnUVZDQW9DQkJZQ0FRQUNHUUVDR3dNQ0hnRUFJUWtRSFY5SWdPaUtVeTBXSVFUa0d3OFo4TDVDa25nSQ0KR2pjZFgwaUE2SXBUTFlDMUFQMFl6S1dYTUtGTTRZTzhZV3o0Z0FEL3BIL3FiRFJNS0xSVXppZ1NIU01zDQpuUUQ1QUdPcXNUVEM1dk93RjhqZnNwUC93SFVhTm52eHVaSFZ0MUVHcTAwVTdRYk9PQVJpKzFyQ0Vnb3INCkJnRUVBWmRWQVFVQkFRZEFHYnkxNjdFbEsvTlkxUXptQ2RpUU1HZjVaeFJySU1sWUt2Z3dRa3JoelZVRA0KQVFnSHduZ0VHQllJQUFrRkFtTDdXc0lDR3d3QUlRa1FIVjlJZ09pS1V5MFdJUVRrR3c4WjhMNUNrbmdJDQpHamNkWDBpQTZJcFRMWGlyQVA5TVFyRHlRZi9zajlzdGVpbEZlMithMVd3R21ZeHRKVm51M1BXSnl5dWgNCmx3RUFvYnNWY0QyUGV4a3ZiMXdPRGt2c3YxMVJJR2dCQ0NKdExVWXZ0V2J5aGdRPQ0KPXNaVmwNCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0NCg==',
      revocationKey:
        // eslint-disable-next-line max-len
        'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tDQpWZXJzaW9uOiBPcGVuUEdQLmpzIHY0LjEwLjEwDQpDb21tZW50OiBodHRwczovL29wZW5wZ3Bqcy5vcmcNCkNvbW1lbnQ6IFRoaXMgaXMgYSByZXZvY2F0aW9uIGNlcnRpZmljYXRlDQoNCnduZ0VJQllLQUFrRkFtTDdXc0lDSFFBQUlRa1FIVjlJZ09pS1V5MFdJUVRrR3c4WjhMNUNrbmdJR2pjZA0KWDBpQTZJcFRMUkt4QVFEY29tMFVBYW9IS0tNaHVVV3U1eFdMWnFYblh1ZGNlTmEyNkl2OHBBS3JBQUQ3DQpCMDkxQW90bXZCRHJuaUtxZjA1MjZPV0ZGaThSdFlGWC95TzFJUkRVVXcwPQ0KPVI2bEQNCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0NCg==',
    });

    const insertReferral = async (key: string): Promise<number | undefined> => {
      const [data] = await server.database.query(
        // eslint-disable-next-line max-len
        'INSERT INTO referrals ("key", "type", credit, steps, enabled) VALUES((:key), \'storage\', 0, 2, true) ON CONFLICT DO NOTHING RETURNING id',
        {
          replacements: { key },
        },
      );

      return data[0]?.id;
    };

    const deleteReferral = async (id: number): Promise<void> => {
      await server.database.query('DELETE FROM referrals WHERE id = (:id)', {
        replacements: { id },
      });
    };

    const registerTestUser = async (email: string): Promise<any> => {
      const { body } = await request(app).post('/api/register').send(registrationBodyFor(email));

      testUsersEmail.push(email);

      return body;
    };

    const deleteCreatedUsers = async (): Promise<void> => {
      await server.database.query('DELETE FROM users WHERE email in (:userEmails)', {
        replacements: { userEmails: [TEST_USER_EMAIL, ...testUsersEmail] },
      });
    };

    afterEach(async () => {
      await deleteCreatedUsers();
    });

    describe('Sign up', () => {
      afterEach(async () => {
        server.services.Inxt.RegisterBridgeUser.restore();
      });

      it('should be able to register a user', async () => {
        const RegisterBridgeUserMock = sinon.stub(server.services.Inxt, 'RegisterBridgeUser');
        RegisterBridgeUserMock.returns({
          response: {
            status: HttpStatus.OK,
          },
          data: {
            uuid: 'cfb1a279-d72a-594e-b71b-556012e6592b',
          },
        });

        server.services.Inxt.RegisterBridgeUser = RegisterBridgeUserMock;
        const response = await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.user.registerCompleted).toBe(true);
      });

      it('should be able to register a referred user', async () => {
        const referralInserted = await insertReferral('invite-friends');

        server.services.Inxt.RegisterBridgeUser = sinon
          .stub(server.services.Inxt, 'RegisterBridgeUser')
          .onFirstCall()
          .returns({
            response: {
              status: HttpStatus.OK,
            },
            data: {
              uuid: '94b6b993-0a39-5ed0-8838-28fdae43c38a',
            },
          })
          .onSecondCall()
          .returns({
            response: {
              status: HttpStatus.OK,
            },
            data: {
              uuid: 'e0d49789-d80c-5ae8-8775-0f7041688b46',
            },
          });
        server.services.Mail.sendInviteFriendMail = sinon.stub(server.services.Mail, 'sendInviteFriendMail').resolves();
        server.services.Inxt.addStorage = sinon.stub(server.services.Inxt, 'addStorage').resolves();
        server.services.Plan.hasBeenIndividualSubscribedAnyTime = sinon
          .stub(server.services.Plan, 'hasBeenIndividualSubscribedAnyTime')
          .resolves(false);

        const inviter = await registerTestUser('inviter@internxt.com');

        const { status } = await request(app)
          .post('/api/register')
          .send({
            ...registrationBodyFor(TEST_USER_EMAIL),
            referrer: inviter.referralCode,
          });

        expect(status).toBe(HttpStatus.OK);

        server.services.Mail.sendInviteFriendMail.restore();
        server.services.Inxt.addStorage.restore();
        server.services.Plan.hasBeenIndividualSubscribedAnyTime.restore();

        if (referralInserted !== undefined) {
          await deleteReferral(referralInserted);
        }
      });

      it('should rollback successfully if fails after the user is created', async () => {
        const RegisterBridgeUserMock = sinon.stub(server.services.Inxt, 'RegisterBridgeUser');
        RegisterBridgeUserMock.returns({
          response: {
            status: 500,
            data: {
              error: 'fake error',
            },
          },
        });

        server.services.Inxt.RegisterBridgeUser = RegisterBridgeUserMock;

        const response = await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

        const [, result] = await server.database.query('SELECT * FROM users WHERE email = (:userEmail)', {
          replacements: { userEmail: TEST_USER_EMAIL },
        });

        expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(result.rowCount).toBe(0);
      });
    });

    describe('Login', () => {
      // eslint-disable-next-block max-len
      const TEST_USER_LOGIN_BODY = {
        email: TEST_USER_EMAIL,
        password:
          // eslint-disable-next-line max-len
          '53616c7465645f5f2d3fdd7b5fb2cfeb3e2a398549816c74c86f11fccceda28b00d21a015c8d37cc0ce8e178b2a4da7d139f2084a377bb8278c643a168c3703f72b668d7172ad5e0c0eff7b2e20f683593ab070ef037887ad2a709ed867f32ce',
        privateKey:
          // eslint-disable-next-line max-len
          'ONzgORtJ77qI28jDnr+GjwJn6xELsAEqsn3FKlKNYbHR7Z129AD/WOMkAChEKx6rm7hOER2drdmXmC296dvSXtE5y5os0XCS554YYc+dcCPONNcU+elt60nUhTZaDfW96KbDioiZT0ZdXl4d+2vmBTWoxgJeo5Bt+gj45HYbihvDzXeLjbwSvx/nWAJEOe+OLLcUQVQ0+3S+OaPknlGS/IiDXy8VhtQuuaayGH5kMmwaoulY7w7/BtJnK9kXkPm5J4zIq3xJiMzqcKaLSvVWIXe7rBItPh2IjgB/3vALXSwEjHBZoo/FjBz/iLwbonTM8htMkNJjX1oaGymnt0AmM4zTdAohfiMgpfkngxkVsiLxuADw4AB4KZMfFLOPV7YVpUWsulv3mal1MkjtNbwP785JUaLDnnsmjnnVG0z/w/+pXqs+9uUrXoNBmj4VybIKY27JS14Fxz2/VvbpAUxjocQ9JgTHRpSl52ShexlcD3rdt+wfNzR7UW3kl1JVUM6dSZcrtMwuSqawhRNv7FEmUyJLWE41GqWGlWo/93APjt5xr5ASilfg0MUOj2FIHCxQSDlNBcxpkA8EzQUczqSzeUJJFICAoS/axanXDhw4ht/Km1ipIOzvKBYagJ+lSvsU+/rjgaBKueM9FIrleW64C/Cvp5/yAZ7fTQcnXuDxm36q9LJISg4bu0LC47f0sPBonWc248ZoGHi6jnK87uKUBucdx0MXFm3GrQYfX2Pb+ded5yVQwkdyP2sUNcWB7+hWbsz8zFtU/tfmxsYXE9BZSWWd7cwlgGS7SVOXxdo0lmW+ggRTXF2WzUt6CmCPySVXgWT4mq83WrcqjtCpj2zeOyYCkgrMZ1qkSgiBNzM+v9maH5K0CS7ODuzLQSChm+KPPnhn+OAsyJcz2YrjH3Gf+pjhqVLJGxPwrqnPyQe+7ehwSYfDxLdffx9M0Ih293IK+t/FVYlIdMrcBSVJHImeq+eeMsQ+wP9+SGpoU6NboWefc2UQVhcZbrqMu7UPyiQS2+7RoEV4m7dfhqiqaIxDqfF/JPAgg1e3UpcRN89opYn6JAktBnRXScIjqhLbzhAGIaKYLT9z/KzCagvSp5ig42DLv+r3p0k+nUiLcKzegPpDs+5YCvqtZp5X0FHYuSWCZhiFVHLtZZanCUkbVWtTh8CQaMdrTNVqamSSkVE=',
        publicKey:
          // eslint-disable-next-line max-len
          'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tDQpWZXJzaW9uOiBPcGVuUEdQLmpzIHY0LjEwLjEwDQpDb21tZW50OiBodHRwczovL29wZW5wZ3Bqcy5vcmcNCg0KeGpNRVl2dGF3aFlKS3dZQkJBSGFSdzhCQVFkQUFjV1JHeGpyUkY4U1FkOEcxZGR4NDkvcGFQdGVPcmRqDQpBOWhObjBIaUh5ek5EenhwYm5oMFFHbHVlSFF1WTI5dFBzS1BCQkFXQ2dBZ0JRSmkrMXJDQmdzSkJ3Z0QNCkFnUVZDQW9DQkJZQ0FRQUNHUUVDR3dNQ0hnRUFJUWtRSFY5SWdPaUtVeTBXSVFUa0d3OFo4TDVDa25nSQ0KR2pjZFgwaUE2SXBUTFlDMUFQMFl6S1dYTUtGTTRZTzhZV3o0Z0FEL3BIL3FiRFJNS0xSVXppZ1NIU01zDQpuUUQ1QUdPcXNUVEM1dk93RjhqZnNwUC93SFVhTm52eHVaSFZ0MUVHcTAwVTdRYk9PQVJpKzFyQ0Vnb3INCkJnRUVBWmRWQVFVQkFRZEFHYnkxNjdFbEsvTlkxUXptQ2RpUU1HZjVaeFJySU1sWUt2Z3dRa3JoelZVRA0KQVFnSHduZ0VHQllJQUFrRkFtTDdXc0lDR3d3QUlRa1FIVjlJZ09pS1V5MFdJUVRrR3c4WjhMNUNrbmdJDQpHamNkWDBpQTZJcFRMWGlyQVA5TVFyRHlRZi9zajlzdGVpbEZlMithMVd3R21ZeHRKVm51M1BXSnl5dWgNCmx3RUFvYnNWY0QyUGV4a3ZiMXdPRGt2c3YxMVJJR2dCQ0NKdExVWXZ0V2J5aGdRPQ0KPXNaVmwNCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0NCg==',
        revocationKey:
          // eslint-disable-next-line max-len
          'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tDQpWZXJzaW9uOiBPcGVuUEdQLmpzIHY0LjEwLjEwDQpDb21tZW50OiBodHRwczovL29wZW5wZ3Bqcy5vcmcNCkNvbW1lbnQ6IFRoaXMgaXMgYSByZXZvY2F0aW9uIGNlcnRpZmljYXRlDQoNCnduZ0VJQllLQUFrRkFtTDdXc0lDSFFBQUlRa1FIVjlJZ09pS1V5MFdJUVRrR3c4WjhMNUNrbmdJR2pjZA0KWDBpQTZJcFRMUkt4QVFEY29tMFVBYW9IS0tNaHVVV3U1eFdMWnFYblh1ZGNlTmEyNkl2OHBBS3JBQUQ3DQpCMDkxQW90bXZCRHJuaUtxZjA1MjZPV0ZGaThSdFlGWC95TzFJUkRVVXcwPQ0KPVI2bEQNCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0NCg==',
        tfa: '',
      };

      beforeEach(() => {
        server.services.Inxt.RegisterBridgeUser = sinon.stub(server.services.Inxt, 'RegisterBridgeUser').returns({
          response: {
            status: HttpStatus.OK,
          },
          data: {
            uuid: 'cfb1a279-d72a-594e-b71b-556012e6592b',
          },
        });

        server.services.UsersReferrals.hasReferralsProgram = sinon
          .stub(server.services.UsersReferrals, 'hasReferralsProgram')
          .returns(false);
      });

      afterEach(() => {
        server.services.Inxt.RegisterBridgeUser.restore();
        server.services.UsersReferrals.hasReferralsProgram.restore();
      });

      it('should be able to login', async () => {
        await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

        const loginResponse = await request(app).post('/api/login').send({
          email: TEST_USER_EMAIL,
        });

        expect(loginResponse.status).toBe(HttpStatus.OK);
      });

      it('should be able to access the account', async () => {
        await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

        const accesResponse = await request(app).post('/api/access').send(TEST_USER_LOGIN_BODY);

        expect(accesResponse.status).toBe(HttpStatus.OK);
      });

      it('should be able to access with TFA', async () => {
        const secret = speakeasy.generateSecret({ length: 20 });

        await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));
        await server.database.query('UPDATE users SET secret_2_f_a = (:secret) WHERE email = (:email)', {
          replacements: { secret: secret.base32, email: TEST_USER_EMAIL },
        });

        const token = speakeasy.totp({
          secret: secret.base32,
          encoding: 'base32',
        });

        const accesResponse = await request(app)
          .post('/api/access')
          .send({
            ...TEST_USER_LOGIN_BODY,
            tfa: token,
          });

        expect(accesResponse.status).toBe(HttpStatus.OK);
      });

      it('should fail to access with an invalid TFA', async () => {
        const secret = speakeasy.generateSecret({ length: 20 });

        await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));
        await server.database.query('UPDATE users SET secret_2_f_a = (:secret) WHERE email = (:email)', {
          replacements: { secret: secret.base32, email: TEST_USER_EMAIL },
        });

        const { status, body } = await request(app)
          .post('/api/access')
          .send({
            ...TEST_USER_LOGIN_BODY,
            tfa: 1234,
          });

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
        expect(body.error).toBe('Wrong 2-factor auth code');
      });

      it('should fail to login with a non-existent email', async () => {
        await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

        const { status, body } = await request(app)
          .post('/api/access')
          .send({
            ...TEST_USER_LOGIN_BODY,
            email: 'uniehiko@me.cl',
          });

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
        expect(body.error).toBe('Wrong login credentials');
      });

      it('should fail to login with a wrong password', async () => {
        await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

        const { status, body } = await request(app)
          .post('/api/access')
          .send({
            ...TEST_USER_LOGIN_BODY,
            password: 'LHRLiqbJeGCqfRJ53UxL8bQn4fs3xp5Z8g0Zn7UuAGPEIyXwUudxH20LbQhp2wogQmdJ2V',
          });

        await delay(1);

        const [data] = await server.database.query('SELECT error_login_count FROM users u WHERE u.email = (:email)', {
          replacements: {
            email: TEST_USER_EMAIL,
          },
        });

        expect(status).toBe(HttpStatus.UNAUTHORIZED);
        expect(body.error).toBe('Wrong login credentials');
        expect(data[0].error_login_count).toBe(1);
      });

      it('should fail when the maximum login attempts is reached', async () => {
        const MAX_LOGIN_FAIL_ATTEMPTS = 10;
        await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

        await Promise.all(
          Array(MAX_LOGIN_FAIL_ATTEMPTS)
            .fill(null)
            .map(async () => {
              await request(app)
                .post('/api/access')
                .send({
                  ...TEST_USER_LOGIN_BODY,
                  password: 'LHRLiqbJeGCqfRJ53UxL8bQn4fs3xp5Z8g0Zn7UuAGPEIyXwUudxH20LbQhp2wogQmdJ2V',
                });
              await delay(1);
            }),
        );

        const { status, body } = await request(app)
          .post('/api/access')
          .send({ ...TEST_USER_LOGIN_BODY });

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(body.error).toBe('Your account has been blocked for security reasons. Please reach out to us');
      });
    });

    describe('renew authorization token', () => {
      afterEach(() => {
        server.services.Inxt.RegisterBridgeUser.restore();
      });

      it('should return a new token for the user', async () => {
        const RegisterBridgeUserMock = sinon.stub(server.services.Inxt, 'RegisterBridgeUser');
        RegisterBridgeUserMock.returns({
          response: {
            status: HttpStatus.OK,
          },
          data: {
            uuid: 'cfb1a279-d72a-594e-b71b-556012e6592b',
          },
        });
        const user = await registerTestUser(TEST_USER_EMAIL);

        const { status, body } = await request(app).get('/api/new-token').set('Authorization', `Bearer ${user.token}`);

        expect(status).toBe(HttpStatus.OK);
        expect(body).toHaveProperty('newToken');
      });
    });
  });

  describe('Desktop', () => {
    let token: string;
    let userId: number;
    let rootFolderId: number;

    beforeAll(async () => {
      try {
        const email = `test${Date.now()}@internxt.com`;
        const user = await createTestUser(email);

        if (!user.dataValues.id || !user.dataValues.root_folder_id) {
          process.exit();
        }

        userId = user.dataValues.id;
        rootFolderId = user.dataValues.root_folder_id;
        token = Sign(email, server.config.get('secrets').JWT);
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
      }
    });

    afterEach(async () => {
      await clearUserDrive(userId, rootFolderId);
    });

    it('should return all the info from a file', async () => {
      const fileName = encryptFilename(`test-${Date.now()}`, rootFolderId);
      await createFileOnFolder(rootFolderId, fileName, token);

      const response = await request(app).get('/api/desktop/list/0').set('Authorization', `Bearer ${token}`);

      const file = response.body.files[0];

      const expectedProperties = [
        'id',
        'created_at',
        'fileId',
        'name',
        'type',
        'size',
        'bucket',
        'folder_id',
        'encrypt_version',
        'deleted',
        'deletedAt',
        'userId',
        'modificationTime',
        'createdAt',
        'updatedAt',
        'folderId',
        'plain_name'
      ];
      enforcePropertiesInObject(file, expectedProperties);
    });

    it('should return all the info from a folder', async () => {
      const { body: folder } = await createFolder(
        {
          folderName: 'folderOnRoot',
          parentFolderId: rootFolderId,
        },
        token,
      );

      const response = await request(app).get('/api/desktop/list/0').set('Authorization', `Bearer ${token}`);

      const result = response.body.folders[0];

      expect(result.id).toBe(folder.id);

      const expectedPropertis = ['id', 'parent_id', 'name', 'bucket', 'updated_at', 'created_at'];
      enforcePropertiesInObject(result, expectedPropertis);
    });

    it('should return the folders and files of a user', async () => {
      const fileName = encryptFilename(`test-${Date.now()}`, rootFolderId);
      const { body: fileOnRoot } = await createFileOnFolder(rootFolderId, fileName, token);
      const { body: folderOnRoot } = await createFolder(
        {
          folderName: 'folderOnRoot',
          parentFolderId: rootFolderId,
        },
        token,
      );
      const { body: fileOnFolder } = await createFileOnFolder(
        folderOnRoot.id,
        encryptFilename(`test-${Date.now()}`, folderOnRoot.id),
        token,
      );

      const response = await request(app).get('/api/desktop/list/0').set('Authorization', `Bearer ${token}`);

      const filesId = response.body.files.map((file: { id: number }) => file.id);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.folders[0].id).toBe(folderOnRoot.id);
      expect(filesId).toContain(fileOnRoot.id);
      expect(filesId).toContain(fileOnFolder.id);
    });
  });
});
