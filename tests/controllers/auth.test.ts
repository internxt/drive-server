import sinon from 'sinon';
import { AuthController } from '../../src/app/routes/auth';
import { Request, Response } from 'express';
import { expect } from 'chai';
import Config from '../../src/config/config';

describe('Auth controller', () => {

  describe('/register', () => {

    // it('should verify recaptcha when is not invoked from mobile', async () => {
    //   // Arrange
    //   const services = {
    //     User: {
    //       RegisterUser: sinon
    //         .stub({
    //           RegisterUser: null
    //         }, 'RegisterUser').returns({
    //           user: {}
    //         })
    //     },
    //     Analytics: {
    //       trackSignUp: sinon.spy()
    //     },
    //     ReCaptcha: {
    //       verify: sinon.spy()
    //     },
    //   };
    //   const request = getRequest({
    //     headers: {
    //       'internxt-client': 'drive-web'
    //     },
    //     header: (header: string) => header,
    //     body: {
    //       captcha: ''
    //     }
    //   });
    //   const response = getResponse({
    //     status: () => {
    //       return {
    //         send: sinon.spy()
    //       };
    //     }
    //   });
    //   const controller = getController(services);

    //   // Act
    //   await controller.register(request as Request<{ email: string }>, response);

    //   // Assert
    //   expect(services.ReCaptcha.verify.calledOnce).to.be.true;
    //   expect(services.User.RegisterUser.calledOnce).to.be.true;
    //   expect(services.Analytics.trackSignUp.calledOnce).to.be.true;
    // });

    // it('should not verify recaptcha when is invoked from mobile', async () => {
    //   // Arrange
    //   const services = {
    //     User: {
    //       RegisterUser: sinon.stub({
    //         RegisterUser: () => {
    //           return {};
    //         }
    //       }, 'RegisterUser').returns({
    //         user: {}
    //       })
    //     },
    //     Analytics: {
    //       trackSignUp: sinon.spy()
    //     },
    //     ReCaptcha: {
    //       verify: sinon.spy()
    //     },
    //     Crypt: {
    //       encryptText: sinon.spy()
    //     },
    //     KeyServer: {
    //       keysExists: sinon.spy()
    //     },
    //   };
    //   const request = getRequest({
    //     headers: {
    //       'internxt-client': 'drive-mobile'
    //     },
    //   });
    //   const response = getResponse({
    //     status: () => {
    //       return {
    //         send: () => null
    //       };
    //     }
    //   });
    //   const controller = getController(services);

    //   // Act
    //   await controller.register(request as Request<{ email: string }>, response);

    //   // Assert
    //   expect(services.ReCaptcha.verify.calledOnce).to.be.false;
    //   expect(services.User.RegisterUser.calledOnce).to.be.true;
    //   expect(services.Analytics.trackSignUp.calledOnce).to.be.true;
    // });

  });

  describe('/login', () => {
    it('should throw exception when no email on body', async () => {
      // Arrange
      const request = getRequest({
        body: '',
      });
      const response = getResponse();
      const controller = getController();

      try {
        // Act
        await controller.login(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Missing email param');
      }
    });

    it('should convert email to lowercase', async () => {
      // Arrange
      const services = {
        User: {
          FindUserByEmail: sinon
            .stub(
              {
                FindUserByEmail: null,
              },
              'FindUserByEmail',
            )
            .returns({
              hKey: '',
              secret_2FA: '',
            }),
        },
        Crypt: {
          encryptText: sinon.spy(),
        },
        KeyServer: {
          keysExists: sinon.spy(),
        },
      };

      const request = getRequest({
        body: {
          email: 'CAPS@EMAIL.COM',
        },
      });
      const response = getResponse({
        status: () => {
          return {
            send: sinon.spy(),
          };
        },
      });
      const controller = getController(services);

      // Act
      await controller.login(request, response);

      // Assert
      expect(services.User.FindUserByEmail.args[0][0]).to.equal('caps@email.com');
    });

    it('should return error if user is not found', async () => {
      // Arrange
      const services = {
        User: {
          FindUserByEmail: sinon
            .stub(
              {
                FindUserByEmail: null,
              },
              'FindUserByEmail',
            )
            .rejects({}),
        },
      };

      const request = getRequest({
        body: {
          email: 'CAPS@EMAIL.COM',
        },
      });
      const response = getResponse({
        status: () => {
          return {
            send: sinon.spy(),
          };
        },
      });
      const controller = getController(services);

      try {
        // Act
        await controller.login(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Wrong login credentials');
      }
    });

    it('should return correct body when successful', async () => {
      // Arrange
      const services = {
        User: {
          FindUserByEmail: sinon
            .stub(
              {
                FindUserByEmail: null,
              },
              'FindUserByEmail',
            )
            .returns({
              hKey: '',
              secret_2FA: '',
            }),
        },
        Crypt: {
          encryptText: sinon.spy(),
        },
        KeyServer: {
          keysExists: sinon.spy(),
        },
      };

      const request = getRequest({
        body: {
          email: 'CAPS@EMAIL.COM',
        },
      });
      const sendSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            send: sendSpy,
          };
        },
      });
      const controller = getController(services);

      // Act
      await controller.login(request, response);

      // Assert
      expect(services.Crypt.encryptText.calledOnce).to.be.true;
      expect(services.KeyServer.keysExists.calledOnce).to.be.true;
      expect(sendSpy.args[0][0]).to.deep.equal({
        hasKeys: undefined,
        sKey: undefined,
        tfa: '',
      });
    });
  });

  describe('/access', () => {
    it('should fail if no user data is found', async () => {
      // Arrange
      const services = {
        User: {
          FindUserByEmail: sinon.stub({ FindUserByEmail: null }, 'FindUserByEmail').rejects(),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        body: {
          email: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.access(request, response);
      } catch ({ message }) {
        expect(message).to.equal('Wrong login credentials');
      }
    });

    it('should fail when max failed login tries have been reached', async () => {
      // Arrange
      const services = {
        User: {
          FindUserByEmail: sinon
            .stub(
              {
                FindUserByEmail: null,
              },
              'FindUserByEmail',
            )
            .resolves({
              errorLoginCount: 10,
            }),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        body: {
          email: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.access(request, response);
      } catch ({ message }) {
        expect(message).to.equal('Your account has been blocked for security reasons. Please reach out to us');
      }
    });

    it('should fail when hashed password does not match', async () => {
      // Arrange
      const services = {
        User: {
          FindUserByEmail: sinon
            .stub(
              {
                FindUserByEmail: null,
              },
              'FindUserByEmail',
            )
            .resolves({
              errorLoginCount: 9,
              password: 'stored_hash',
            }),
          LoginFailed: sinon.spy(),
        },
        Crypt: {
          decryptText: sinon
            .stub(
              {
                decryptText: null,
              },
              'decryptText',
            )
            .returns('given_hash'),
        },
      };
      const controller = getController(services);
      const request = getRequest({
        body: {
          email: '',
        },
      });
      const response = getResponse();

      try {
        // Act
        await controller.access(request, response);
      } catch ({ message }) {
        expect(message).to.equal('Wrong login credentials');
        expect(services.User.LoginFailed.calledOnce).to.be.true;
        expect(services.User.LoginFailed.args[0]).to.deep.equal(['', true]);
      }
    });

    it('should update account activity and return data on correct login', async () => {
      // Arrange
      const services = {
        User: {
          FindUserByEmail: sinon
            .stub(
              {
                FindUserByEmail: null,
              },
              'FindUserByEmail',
            )
            .resolves({
              errorLoginCount: 9,
              password: 'stored_hash',
            }),
          LoginFailed: sinon.spy(),
          UpdateAccountActivity: sinon.spy(),
          GetUserBucket: sinon.spy(),
        },
        Crypt: {
          decryptText: sinon
            .stub(
              {
                decryptText: null,
              },
              'decryptText',
            )
            .returns('stored_hash'),
        },
        KeyServer: {
          keysExists: sinon.spy(),
          getKeys: sinon.spy(),
        },
        Team: {
          getTeamByMember: sinon.spy(),
        },
        AppSumo: {
          GetDetails: sinon
            .stub(
              {
                GetDetails: null,
              },
              'GetDetails',
            )
            .returns(Promise.all([])),
        },
        UsersReferrals: {
          hasReferralsProgram: sinon.spy(),
        },
      };
      const controller = getController(services, {
        JWT: 'token',
      });
      const request = getRequest({
        headers: {
          'internxt-client': 'drive-web',
        },
        body: {
          email: '',
        },
      });
      const jsonSpy = sinon.spy();
      const response = getResponse({
        status: () => {
          return {
            json: jsonSpy,
          };
        },
      });

      // Act
      await controller.access(request, response);

      // Assert
      expect(services.User.LoginFailed.calledOnce).to.be.true;
      expect(services.User.LoginFailed.args[0]).to.deep.equal(['', false]);
      expect(services.User.UpdateAccountActivity.calledOnce).to.be.true;
      expect(services.User.GetUserBucket.calledOnce).to.be.true;
      expect(services.KeyServer.keysExists.calledOnce).to.be.true;
      expect(services.KeyServer.getKeys.calledOnce).to.be.true;
      expect(services.AppSumo.GetDetails.calledOnce).to.be.true;
      expect(services.UsersReferrals.hasReferralsProgram.calledOnce).to.be.true;
      expect(jsonSpy.calledOnce).to.be.true;
    });
  });

});


function getController(services = {}, secrets = {}): AuthController {
  const defaultServices = {
    User: {},
    Analytics: {},
    ReCaptcha: {},
    Crypt: {},
    KeyServer: {},
    Team: {},
    AppSumo: {},
    UsersReferrals: {},
  };

  const finalServices = {
    ...defaultServices,
    ...services
  };

  const config = {
    get: () => {
      return secrets;
    }
  };

  return new AuthController(finalServices, config as unknown as Config);
}

function getRequest(props = {}): Request {
  return props as unknown as Request;
}

function getResponse(props = {}): Response {
  return props as unknown as Response;
}