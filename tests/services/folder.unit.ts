import { expect } from 'chai';
import { stub } from 'sinon';

const initFolder = require('../../src/app/services/folder');

const App = {
  services: {},
};

const Model = {
  folder: {
    async findOne() {
      return {
        deleted: false,
        deletedAt: null,
        save: () => { return true; }
      };
    },
  },
};

const folderService = initFolder(Model, App);

const findOneStub = stub(Model.folder, 'findOne');

describe('# Folders Service', () => {
  it('MoveFolderToTrash()', async () => {
    const user = { id: 'id1'};
    const folderId = '4';

    findOneStub.returns(Promise.resolve({ deleted: false, deletedAt: null, save() { return true; } }));

    const result = await folderService.MoveFolderToTrash(user, folderId);

    expect(result.result).to.include({
      deleted: true
    });
  });
});
