import request from 'supertest';
const uuid = require('uuid');

export const createFileOnFolder = async (
  app: any,
  folderId: number,
  name: string,
  authToken: string,
): Promise<request.Response> =>
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
