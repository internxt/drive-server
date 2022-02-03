import { create } from 'domain';
import { stub } from 'sinon';

const initBackups = require('../../src/app/services/backups');

const App = {
  services: {
    Crypt: {
      encryptName(name, bucket) {},
    },
    User: {
      async FindUserObjByEmail(email) {
        return { backupsBucket: '' };
      },
    },
  },
};

const Model = {
  folder: {
    async findOne() {
      return {
        bucket: '',
      };
    },
    async update() {
      return {};
    },
    async create() {
      return {};
    },
  },
};

const backupsService = initBackups(Model, App);

const findOneStub = stub(Model.folder, 'findOne');
const encryptNameStub = stub(App.services.Crypt, 'encryptName');
const FindUserObjByEmailStub = stub(App.services.User, 'FindUserObjByEmail');

describe('# backups', () => {
  it('renameDeviceAsFolder()', async () => {
    const bucket = 'bucket';
    findOneStub.returns(Promise.resolve({ bucket, update() {} }));

    await backupsService.renameDeviceAsFolder({ id: 'foo' });

    encryptNameStub.calledOnceWith(undefined, bucket);
  });
  it('createDeviceAsFolder()', async () => {
    const bucket = 'bucket';
    FindUserObjByEmailStub.resolves({ backupsBucket: bucket });
    findOneStub.returns(Promise.resolve(null));

    await backupsService.createDeviceAsFolder({ id: 'foo', email: 'bar' });

    encryptNameStub.calledOnceWith(undefined, 'bucket');
  });
});
