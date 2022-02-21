import sinon from 'sinon';
import { AuthController } from '../../src/app/routes/auth';
import { Request, Response } from 'express';
import { expect } from 'chai';

describe('Auth controller', () => {

  describe('/register', () => {

    it('should verify recaptcha when is not invoked from mobile', async () => {
      // Arrange
      const UserService = {
        RegisterUser: () => {
          return {};
        }
      };
      const services = {
        User: {
          RegisterUser: sinon.stub(UserService, 'RegisterUser').returns({
            user: {}
          })
        },
        Analytics: {
          trackSignUp: sinon.spy()
        },
        ReCaptcha: {
          verify: sinon.spy()
        }
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
            send: () => null
          };
        }
      } as unknown as Response;
      const controller = new AuthController(services);

      // Act
      await controller.register(request, response);

      // Assert
      expect(services.ReCaptcha.verify.calledOnce).to.be.true;
      expect(services.User.RegisterUser.calledOnce).to.be.true;
      expect(services.Analytics.trackSignUp.calledOnce).to.be.true;
    });

    it('should not verify recaptcha when is invoked from mobile', async () => {
      // Arrange
      const UserService = {
        RegisterUser: () => {
          return {};
        }
      };
      const services = {
        User: {
          RegisterUser: sinon.stub(UserService, 'RegisterUser').returns({
            user: {}
          })
        },
        Analytics: {
          trackSignUp: sinon.spy()
        },
        ReCaptcha: {
          verify: sinon.spy()
        }
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
      const controller = new AuthController(services);

      // Act
      await controller.register(request, response);

      // Assert
      expect(services.ReCaptcha.verify.calledOnce).to.be.false;
      expect(services.User.RegisterUser.calledOnce).to.be.true;
      expect(services.Analytics.trackSignUp.calledOnce).to.be.true;
    });

  });

});