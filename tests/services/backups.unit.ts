import { expect } from 'chai';
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

    expect(encryptNameStub.calledOnceWith(undefined, bucket)).to.be.true;
  });
  it('createDeviceAsFolder()', async () => {
    const bucket = 'bucket';
    FindUserObjByEmailStub.resolves({ backupsBucket: bucket });
    findOneStub.returns(Promise.resolve(null));

    await backupsService.createDeviceAsFolder({ id: 'foo', email: 'bar' });

    expect(encryptNameStub.calledOnceWith(undefined, 'bucket')).to.be.true;
  });
});
