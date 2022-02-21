import sinon from 'sinon';
import { AuthController } from '../../src/app/routes/auth';
import { Request, Response } from 'express';
import { expect } from 'chai';

describe('Auth controller', () => {

  describe('/register', () => {

    it('should verify recaptcha when is not invoked from mobile', async () => {
      // Arrange
      const services = {
        User: {
          RegisterUser: sinon
            .stub({
              RegisterUser: null
            }, 'RegisterUser').returns({
              user: {}
            })
        },
        Analytics: {
          trackSignUp: sinon.spy()
        },
        ReCaptcha: {
          verify: sinon.spy()
        },
      };
      const request = {
        headers: {
          'internxt-client': 'drive-web'
        },
        header: (header: string) => header,
        body: {
          captcha: ''
        }
      } as unknown as Request<{ email: string }>;
      const response = {
        status: () => {
          return {
            send: sinon.spy()
          };
        }
      } as unknown as Response;
      const controller = getController(services);

      // Act
      await controller.register(request, response);

      // Assert
      expect(services.ReCaptcha.verify.calledOnce).to.be.true;
      expect(services.User.RegisterUser.calledOnce).to.be.true;
      expect(services.Analytics.trackSignUp.calledOnce).to.be.true;
    });

    it('should not verify recaptcha when is invoked from mobile', async () => {
      // Arrange
      const services = {
        User: {
          RegisterUser: sinon.stub({
            RegisterUser: () => {
              return {};
            }
          }, 'RegisterUser').returns({
            user: {}
          })
        },
        Analytics: {
          trackSignUp: sinon.spy()
        },
        ReCaptcha: {
          verify: sinon.spy()
        },
        Crypt: {
          encryptText: sinon.spy()
        },
        KeyServer: {
          keysExists: sinon.spy()
        },
      };
      const request = {
        headers: {
          'internxt-client': 'drive-mobile'
        },
      } as unknown as Request<{ email: string }>;
      const response = {
        status: () => {
          return {
            send: () => null
          };
        }
      } as unknown as Response;
      const controller = getController(services);

      // Act
      await controller.register(request, response);

      // Assert
      expect(services.ReCaptcha.verify.calledOnce).to.be.false;
      expect(services.User.RegisterUser.calledOnce).to.be.true;
      expect(services.Analytics.trackSignUp.calledOnce).to.be.true;
    });

  });

  describe('/login', () => {

    it('should throw exception when no email on body', async () => {
      // Arrange
      const request = {
        body: ''
      } as unknown as Request;
      const response = {} as unknown as Response;
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
          FindUserByEmail: sinon.stub({
            FindUserByEmail: null
          }, 'FindUserByEmail')
            .returns({
              hKey: '',
              secret_2FA: ''
            })
        },
        Crypt: {
          encryptText: sinon.spy()
        },
        KeyServer: {
          keysExists: sinon.spy()
        }
      };

      const request = {
        body: {
          email: 'CAPS@EMAIL.COM'
        }
      } as unknown as Request;
      const response = {
        status: () => {
          return {
            send: sinon.spy()
          };
        }
      } as unknown as Response;
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
          FindUserByEmail: sinon.stub({
            FindUserByEmail: null
          }, 'FindUserByEmail')
            .rejects({})
        },
      };

      const request = {
        body: {
          email: 'CAPS@EMAIL.COM'
        }
      } as unknown as Request;
      const response = {
        status: () => {
          return {
            send: sinon.spy()
          };
        }
      } as unknown as Response;
      const controller = getController(services);

      try {
        // Act
        await controller.login(request, response);
      } catch ({ message }) {
        // Assert
        expect(message).to.equal('Wrong email/password');
      }
    });

    it('should return correct body when successful', async () => {
      // Arrange
      const services = {
        User: {
          FindUserByEmail: sinon.stub({
            FindUserByEmail: null
          }, 'FindUserByEmail')
            .returns({
              hKey: '',
              secret_2FA: ''
            })
        },
        Crypt: {
          encryptText: sinon.spy()
        },
        KeyServer: {
          keysExists: sinon.spy()
        }
      };

      const request = {
        body: {
          email: 'CAPS@EMAIL.COM'
        }
      } as unknown as Request;
      const sendSpy = sinon.spy();
      const response = {
        status: () => {
          return {
            send: sendSpy
          };
        }
      } as unknown as Response;
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


});


function getController(services = {}): AuthController {
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

  return new AuthController(finalServices);
}