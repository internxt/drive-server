require('dotenv').config();
const server = require('../../src/app');
import { HttpStatus } from '@nestjs/common';
import sinon from 'sinon';
import request from 'supertest';
const app = server.express;
import { applicationInitialization } from './setup';

const registrationBodyFor = (email: string) => ({
  name: 'e2e',
  captcha:
    // eslint-disable-next-line max-len
    '03ANYolquuZzhqnd04-npJ7XE2cd4Ypkhtv8HT834JQfm0y2jT5rbBSwX2sbjb3828OvE43DZxRpwbwTqsK3V-zKO79KBTDz9T4SKSCpMeZJ3smWNPHFxOL-dSSpzxyZer9FsAYBwWEfQPcOOvEdMT5VOm-cg1yuxp6P5qcP6toyt9lfD0F_vPXPudN7nrvb3l8P3u5_xLpsXLKTKQJZr_t8H47s1HrWs47eEboy9Y29jAfovq7S8x4u2fAvO0RTWx2bNf_m_TuX2ECy8rcUu09VeYAj7i7puhvzYKZymU_Ofbr9Vv-pkOGHtvGXsNS_Pcylncsz4RhTDDzMATub5IPqdyid4d5zJhp2JJEVWa525y-QjP1X7gnsepGWjtUaMGwN30fPNhLLHsTgm68f23-qRqqggGBE3nt9fVqRJqLSTJra_DNc9jB18tCAc5Sncs_x1ZJsmfVS9h2ANZUqXw3a8SdtHqCOLcFKNVRscjd5dNwNTmcaALQ08kB_fdTn2z9-E6e3vWDbxF',
  lastname: 'test',
  email: email,
  password:
    // eslint-disable-next-line max-len
    '53616c7465645f5f2d3fdd7b5fb2cfeb3e2a398549816c74c86f11fccceda28b00d21a015c8d37cc0ce8e178b2a4da7d139f2084a377bb8278c643a168c3703f72b668d7172ad5e0c0eff7b2e20f683593ab070ef037887ad2a709ed867f32ce',
  mnemonic:
    // eslint-disable-next-line max-len
    '53616c7465645f5f9057a400ca37a3e323d7d38b0d7ccaf0d7449e7a347010af0351722f6ab3dbd748b13988eec0f2cf6e0e876dc3893153707586483372bcb738bc6ae9de30bbe2ea4521c656d233d80eb50aec5158d96026ee631715dce36b8d4b957843c0b8ac7cf175a395d75e0920680a0cee72295b27a728a05554dc5cbe7ece85eaf145bcca8669542883f7a000474302e96139bbe74d4c03429e2982c91791f8d6d99c6010b7ac038eca59fa',
  salt:
    // eslint-disable-next-line max-len
    '53616c7465645f5f8e17d06c84994cb00c87d8d3dc9c00725c4d3acfa1c6006296c7385a52db834f63f4082474b5d3d88436ea11e78b0da18f129ea1859f77e0',
  privateKey:
    // eslint-disable-next-line max-len
    'ONzgORtJ77qI28jDnr+GjwJn6xELsAEqsn3FKlKNYbHR7Z129AD/WOMkAChEKx6rm7hOER2drdmXmC296dvSXtE5y5os0XCS554YYc+dcCPONNcU+elt60nUhTZaDfW96KbDioiZT0ZdXl4d+2vmBTWoxgJeo5Bt+gj45HYbihvDzXeLjbwSvx/nWAJEOe+OLLcUQVQ0+3S+OaPknlGS/IiDXy8VhtQuuaayGH5kMmwaoulY7w7/BtJnK9kXkPm5J4zIq3xJiMzqcKaLSvVWIXe7rBItPh2IjgB/3vALXSwEjHBZoo/FjBz/iLwbonTM8htMkNJjX1oaGymnt0AmM4zTdAohfiMgpfkngxkVsiLxuADw4AB4KZMfFLOPV7YVpUWsulv3mal1MkjtNbwP785JUaLDnnsmjnnVG0z/w/+pXqs+9uUrXoNBmj4VybIKY27JS14Fxz2/VvbpAUxjocQ9JgTHRpSl52ShexlcD3rdt+wfNzR7UW3kl1JVUM6dSZcrtMwuSqawhRNv7FEmUyJLWE41GqWGlWo/93APjt5xr5ASilfg0MUOj2FIHCxQSDlNBcxpkA8EzQUczqSzeUJJFICAoS/axanXDhw4ht/Km1ipIOzvKBYagJ+lSvsU+/rjgaBKueM9FIrleW64C/Cvp5/yAZ7fTQcnXuDxm36q9LJISg4bu0LC47f0sPBonWc248ZoGHi6jnK87uKUBucdx0MXFm3GrQYfX2Pb+ded5yVQwkdyP2sUNcWB7+hWbsz8zFtU/tfmxsYXE9BZSWWd7cwlgGS7SVOXxdo0lmW+ggRTXF2WzUt6CmCPySVXgWT4mq83WrcqjtCpj2zeOyYCkgrMZ1qkSgiBNzM+v9maH5K0CS7ODuzLQSChm+KPPnhn+OAsyJcz2YrjH3Gf+pjhqVLJGxPwrqnPyQe+7ehwSYfDxLdffx9M0Ih293IK+t/FVYlIdMrcBSVJHImeq+eeMsQ+wP9+SGpoU6NboWefc2UQVhcZbrqMu7UPyiQS2+7RoEV4m7dfhqiqaIxDqfF/JPAgg1e3UpcRN89opYn6JAktBnRXScIjqhLbzhAGIaKYLT9z/KzCagvSp5ig42DLv+r3p0k+nUiLcKzegPpDs+5YCvqtZp5X0FHYuSWCZhiFVHLtZZanCUkbVWtTh8CQaMdrTNVqamSSkVE=',
  publicKey:
    // eslint-disable-next-line max-len
    'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tDQpWZXJzaW9uOiBPcGVuUEdQLmpzIHY0LjEwLjEwDQpDb21tZW50OiBodHRwczovL29wZW5wZ3Bqcy5vcmcNCg0KeGpNRVl2dGF3aFlKS3dZQkJBSGFSdzhCQVFkQUFjV1JHeGpyUkY4U1FkOEcxZGR4NDkvcGFQdGVPcmRqDQpBOWhObjBIaUh5ek5EenhwYm5oMFFHbHVlSFF1WTI5dFBzS1BCQkFXQ2dBZ0JRSmkrMXJDQmdzSkJ3Z0QNCkFnUVZDQW9DQkJZQ0FRQUNHUUVDR3dNQ0hnRUFJUWtRSFY5SWdPaUtVeTBXSVFUa0d3OFo4TDVDa25nSQ0KR2pjZFgwaUE2SXBUTFlDMUFQMFl6S1dYTUtGTTRZTzhZV3o0Z0FEL3BIL3FiRFJNS0xSVXppZ1NIU01zDQpuUUQ1QUdPcXNUVEM1dk93RjhqZnNwUC93SFVhTm52eHVaSFZ0MUVHcTAwVTdRYk9PQVJpKzFyQ0Vnb3INCkJnRUVBWmRWQVFVQkFRZEFHYnkxNjdFbEsvTlkxUXptQ2RpUU1HZjVaeFJySU1sWUt2Z3dRa3JoelZVRA0KQVFnSHduZ0VHQllJQUFrRkFtTDdXc0lDR3d3QUlRa1FIVjlJZ09pS1V5MFdJUVRrR3c4WjhMNUNrbmdJDQpHamNkWDBpQTZJcFRMWGlyQVA5TVFyRHlRZi9zajlzdGVpbEZlMithMVd3R21ZeHRKVm51M1BXSnl5dWgNCmx3RUFvYnNWY0QyUGV4a3ZiMXdPRGt2c3YxMVJJR2dCQ0NKdExVWXZ0V2J5aGdRPQ0KPXNaVmwNCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0NCg==',
  revocationKey:
    // eslint-disable-next-line max-len
    'LS0tLS1CRUdJTiBQR1AgUFVCTElDIEtFWSBCTE9DSy0tLS0tDQpWZXJzaW9uOiBPcGVuUEdQLmpzIHY0LjEwLjEwDQpDb21tZW50OiBodHRwczovL29wZW5wZ3Bqcy5vcmcNCkNvbW1lbnQ6IFRoaXMgaXMgYSByZXZvY2F0aW9uIGNlcnRpZmljYXRlDQoNCnduZ0VJQllLQUFrRkFtTDdXc0lDSFFBQUlRa1FIVjlJZ09pS1V5MFdJUVRrR3c4WjhMNUNrbmdJR2pjZA0KWDBpQTZJcFRMUkt4QVFEY29tMFVBYW9IS0tNaHVVV3U1eFdMWnFYblh1ZGNlTmEyNkl2OHBBS3JBQUQ3DQpCMDkxQW90bXZCRHJuaUtxZjA1MjZPV0ZGaThSdFlGWC95TzFJUkRVVXcwPQ0KPVI2bEQNCi0tLS0tRU5EIFBHUCBQVUJMSUMgS0VZIEJMT0NLLS0tLS0NCg==',
});

const dummyUsers: Array<any> = [];
const TEST_USER_EMAIL = 'e2etest@intext.com';
const createDummyUserInDatabase = async (email: string): Promise<any> => {
  const { dataValues: user } = await server.models.users.create({
    email,
    name: 'Dummy',
    lastname: 'User',
    password: '1HkNK0zndXE1HQDnPtQq',
    mnemonic: 'JYy7qoMVR9QrKpKJFXTt',
    hKey: 'a5GlkCWnlOL0c4aKaLai',
    referrer: null,
    referralCode: '6cead4f8-b309-56e3-aed6-5537a13d4db7',
    uuid: null,
    credit: 0,
    welcomePack: true,
    registerCompleted: true,
    username: 'Dummy User',
    bridgeUser: null,
  });

  await server.services.UsersReferrals.createUserReferrals(user.id);

  dummyUsers.push(user);

  return user;
};

const deleteCreatedUsers = async (): Promise<void> => {
  const dummyUsersEmail = dummyUsers.map((user) => user.email);
  await server.database.query('DELETE FROM users WHERE email in (:userEmails)', {
    replacements: { userEmails: [TEST_USER_EMAIL, ...dummyUsersEmail] },
  });
  //mail_limit
};

describe('Auth (e2e)', () => {
  beforeAll(async () => {
    try {
      if (process.env.NODE_ENV !== 'e2e') {
        throw new Error('Cannot do E2E tests without NODE_ENV=e2e ');
      }

      await applicationInitialization(app);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error setting up storage e2e tests: %s', err.message);
      process.exit(1);
    }
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('user registration', () => {

    afterEach(async () => {
      server.services.Inxt.RegisterBridgeUser.restore();
      await deleteCreatedUsers();
    });

    it('should be able to register a user', async () => {
      const RegisterBridgeUserMock = sinon.stub(server.services.Inxt, 'RegisterBridgeUser');
      RegisterBridgeUserMock.returns({
        response: {
          status: 200,
        },
        data: {
          uuid: 'cfb1a279-d72a-594e-b71b-556012e6592b',
        },
      });

      server.services.Inxt.RegisterBridgeUser = RegisterBridgeUserMock;
      const response = await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.user.registerCompleted).toBe(true);
    });

    it('should be able to register a referred user', async () => {
      await server.database.query(
        'INSERT INTO referrals ("key", "type", credit, steps, enabled) VALUES(\'invite-friends\', \'storage\', 0, 0, true) ON CONFLICT DO NOTHING',
      );

      const RegisterBridgeUserMock = sinon.stub(server.services.Inxt, 'RegisterBridgeUser');
      RegisterBridgeUserMock.returns({
        response: {
          status: 200,
        },
        data: {
          uuid: 'cfb1a279-d72a-594e-b71b-556012e6592b',
        },
      });

      server.services.Inxt.RegisterBridgeUser = RegisterBridgeUserMock;

      const sendInviteFriendMailMock = sinon.stub(server.services.Mail, 'sendInviteFriendMail');
      sendInviteFriendMailMock.resolves();

      server.services.Mail.endInviteFriendMail = sendInviteFriendMailMock;

      const dummyUser = await createDummyUserInDatabase('inviter@internxt.com');
      const requestBoy = {
        ...registrationBodyFor(TEST_USER_EMAIL),
        referrer: dummyUser.referralCode,
      };

      const { status } = await request(app).post('/api/register').send(requestBoy);

      expect(status).toBe(HttpStatus.OK);
      sendInviteFriendMailMock.restore();
    });

    it('should rollback succecfully if fails after the user is insterted on the database', async () => {
      const RegisterBridgeUserMock = sinon.stub(server.services.Inxt, 'RegisterBridgeUser');
      RegisterBridgeUserMock.returns({
        response: {
          status: 500,
          data: {
            error: 'fake error',
          },
        },
      });

      server.services.Inxt.RegisterBridgeUser = RegisterBridgeUserMock;

      const response = await request(app).post('/api/register').send(registrationBodyFor(TEST_USER_EMAIL));

      const [, result] = await server.database.query('SELECT * FROM users WHERE email = (:userEmail)', {
        replacements: { userEmail: TEST_USER_EMAIL },
      });

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.rowCount).toBe(0);
    });
  });
});
