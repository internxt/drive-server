import { expect } from 'chai';
import { describe, it } from 'mocha';

import Server from '../../src/config/initializers/server';

const utilsService = require('../../src/app/services/utils');

const App = new Server();
const utils = utilsService(null, App);

const validBucketIds = ['aaaaaaaaaaaaaaaaaaaaaaaa', '154785478541256987458987'];

const validDatabaseIds = [0, 999, 54125, 14, 12566];

describe('# Utils', () => {
  describe('# isBucketId', () => {
    validBucketIds.forEach((bucketId) => {
      it(`bucket id ${bucketId} should be valid`, () => {
        expect(utils.IsBucketId(bucketId)).to.be.true;
      });
    });

    validDatabaseIds.forEach((databaseId) => {
      it(`database id ${databaseId} should NOT be valid bucket id`, () => {
        expect(utils.IsBucketId(databaseId)).to.be.false;
      });
    });
  });

  describe('# isDatabaseId', () => {
    validBucketIds.forEach((bucketId) => {
      it(`bucket id ${bucketId} should NOT be valid database id`, () => {
        expect(utils.IsDatabaseId(bucketId)).to.be.false;
      });
    });

    validDatabaseIds.forEach((databaseId) => {
      it(`database id ${databaseId} should be valid`, () => {
        expect(utils.IsDatabaseId(databaseId)).to.be.true;
      });
    });

    it('invalid databaseIds', () => {
      expect(utils.IsDatabaseId(Number.MAX_VALUE)).to.be.false;
      expect(utils.IsDatabaseId(Number.MAX_SAFE_INTEGER)).to.be.true;
    });
  });
});
