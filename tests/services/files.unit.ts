import { expect } from 'chai';
import { stub } from 'sinon';

const initFiles = require('../../src/app/services/files');

const App = {
  services: {},
};

const Model = {
  file: {
    async findOne() {
      return {
        deleted: false,
        deletedAt: null,
        save: () => { return true; }
      };
    },
  },
};

const filesService = initFiles(Model, App);

const findOneStub = stub(Model.file, 'findOne');

describe('# Files Service', () => {
  it('moveFileToTrash()', async () => {
    const user = { id: 'id1'};
    const fileId = '4';

    findOneStub.returns(Promise.resolve({ deleted: false, deletedAt: null, save() { return true; } }));

    const result = await filesService.moveFileToTrash(user, fileId);

    expect(result.result).to.include({
      deleted: true
    });
  });
});
