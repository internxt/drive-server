import { it } from 'mocha';
import { expect } from 'chai';
import { resetHistory, stub } from 'sinon';

import { ReferralAttributes } from '../../src/app/models/referral';

const initUserReferrals = require('../../src/app/services/usersReferrals');

const fakeReferralId = 1;
const fakeUserId = 1;
const fakeReferral: ReferralAttributes = {
  credit: 1,
  enabled: true,
  id: fakeReferralId,
  key: 'fake-referral',
  steps: 1,
  type: 'storage'
};

const fakeUserReferral: { applied: boolean } = {
  applied: true
};

const Model = {
  users_referrals: {
    bulkCreate: (referrals: any): Promise<void> => {
      return Promise.resolve();
    },
    update: (updatedReferral: { referred: boolean, applied: boolean }, userReferralId: number) => {
      return Promise.resolve();
    },
    findAll: (): { referral: ReferralAttributes }[] => {
      return [];
    },
    findOne: (): Promise<ReferralAttributes> => {
      return Promise.resolve(fakeReferral);
    }
  }
};

const App = {
  logger: {
    info: () => {}
  },
  services: {
    Referrals: {
      getAllEnabled: (): ReferralAttributes[] => {
        return []
      },
      getByKey: (refKey: string) => {
        const referralsList = [fakeReferral];

        return referralsList.filter(r => r.key === refKey);
      }
    },
    Inxt: {
      addStorage: (email: string, credit: number): Promise<void> => {
        return Promise.resolve();
      }
    },
    User: {
      findById: (userId: number): Promise<{ bridgeUser: string, userId: string }> => {
        return Promise.resolve({
          bridgeUser: '',
          userId: ''
        });
      }
    }
  }
};

const usersReferrals = initUserReferrals(Model, App);

const bulkCreateStub = stub(Model.users_referrals, 'bulkCreate');
const getAllEnabledStub = stub(App.services.Referrals, 'getAllEnabled');
const findAllStub = stub(Model.users_referrals, 'findAll');
const addStorageStub = stub(App.services.Inxt, 'addStorage');
const findUserByIdStub = stub(App.services.User, 'findById');
const getReferralByKey = stub(App.services.Referrals, 'getByKey');
const findOneReferralStub = stub(Model.users_referrals, 'findOne');
const hasReferralsProgramStub = stub(usersReferrals, 'hasReferralsProgram');

beforeEach(() => {
  resetHistory();
})

describe('# usersReferrals', () => {
  it('getByUserId()', async () => {
    const referrals = [{ ...fakeUserReferral, referral: fakeReferral }];
    const expected = [{
      key: fakeReferral.key,
      type: fakeReferral.type,
      credit: fakeReferral.credit,
      steps: fakeReferral.steps,
      isCompleted: fakeReferral.steps === (fakeUserReferral.applied ? 1 : 0),
      completedSteps: fakeUserReferral.applied ? 1 : 0
    }];
    findAllStub.returns(referrals);

    const obtained = await usersReferrals.getByUserId();

    expect(obtained).to.deep.equal(expected);
  });

  it('createUserReferrals()', async () => {
    const referrals = [fakeReferral];

    getAllEnabledStub.returns(referrals);

    await usersReferrals.createUserReferrals(fakeUserId)
    
    expect(getAllEnabledStub.calledOnce).to.be.true;
    expect(bulkCreateStub.calledOnce).to.be.true;

    expect(
      bulkCreateStub.getCall(0).args[0].map(referralToCreate => {
        delete referralToCreate.start_date;

        return referralToCreate;
      })
    ).to.deep.equal(referrals.map(r => {
      return {
        user_id: fakeUserId, 
        referral_id: fakeReferralId,
        applied: false
      }
    }));   
  });

  it('update()', async () => {
    const referrals = [fakeReferral];

    getAllEnabledStub.returns(referrals);

    await usersReferrals.createUserReferrals(fakeUserId)
    
    expect(getAllEnabledStub.calledOnce).to.be.true;
    expect(bulkCreateStub.calledOnce).to.be.true;

    expect(
      bulkCreateStub.getCall(0).args[0].map(referralToCreate => {
        delete referralToCreate.start_date;

        return referralToCreate;
      })
    ).to.deep.equal(referrals.map(r => {
      return {
        user_id: fakeUserId, 
        referral_id: fakeReferralId,
        applied: false
      }
    }));   
  });

  describe('redeemUserReferral()', () => {
    it('Should not try to add storage if the type is not storage', async () => {
      const referralToRedeem = {
        email: 'test@test.com',
        userId: 3,
        type: 'no-storage',
        credit: 0
      };

      await usersReferrals.redeemUserReferral(
        referralToRedeem.email, 
        referralToRedeem.userId, 
        referralToRedeem.type, 
        referralToRedeem.credit
      );
  
      expect(addStorageStub.notCalled).to.be.true;
    });
    
    it('Should apply storage if referral type is storage', async () => {
      // TODO
    });
  });

  describe('applyUserReferral()', () => {
    it('Should throw an error if user not found', async () => {
      const randomUserId = 1;
      let error: Error & { status: number } | null;

      findUserByIdStub.returns(null);

      try {
        await usersReferrals.applyUserReferral(randomUserId);
      } catch (err) {
        error = err;
      }
      
      expect(error).to.be.not.null;
      expect(error.message).to.equal('User not found');
    });

    it('Should throw an error if referral not found', async () => {
      const fakeReferralKey = fakeReferral.key + 'something';
      let error: Error & { status: number } | null;

      findUserByIdStub.returns(Promise.resolve({ bridgeUser: '', userId: '' }));
      getReferralByKey.returns(null);

      try {
        await usersReferrals.applyUserReferral(0, fakeReferralKey);
      } catch (err) {
        error = err;
      }
      
      expect(error).to.be.not.null;
      expect(error.message).to.equal('Referral not found')
    });

    it('Should not continue if user referral not found', async () => {
      findUserByIdStub.returns(Promise.resolve({ bridgeUser: '', userId: '' }));
      getReferralByKey.returns([fakeReferral]);
      findOneReferralStub.returns(null);

      await usersReferrals.applyUserReferral();

      expect(findUserByIdStub.calledOnce).to.be.true;
      expect(getReferralByKey.calledOnce).to.be.true;
      expect(findOneReferralStub.calledOnce).to.be.true;
      expect(hasReferralsProgramStub.notCalled).to.be.true;
    });

    // it('Should throw a 403 if user should not have referral program', async () => {
    //   let error: Error & { status: number } | null;

    //   findUserByIdStub.returns(Promise.resolve({ bridgeUser: '', userId: '' }));
    //   getReferralByKey.returns([fakeReferral]);
    //   findOneReferralStub.returns(Promise.resolve(fakeReferral));
    //   hasReferralsProgramStub.returns(null);

    //   try {
    //     await usersReferrals.applyUserReferral();  
    //   } catch (err) {
    //     console.log('err', err);
    //     error = err;
    //   }

    //   expect(findUserByIdStub.calledOnce).to.be.true;
    //   expect(getReferralByKey.calledOnce).to.be.true;
    //   expect(findOneReferralStub.calledOnce).to.be.true;
    //   expect(hasReferralsProgramStub.calledOnce).to.be.true;

    //   expect(error).to.be.not.null;
    //   expect(error.status).to.equal(403);
    //   expect(error.message).to.equal(`(usersReferralsService.applyUserReferral) referrals program not enabled for this user`);
    // });
  });
});
