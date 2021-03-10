const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const Stripe = require('stripe');
const { passportAuth, Sign } = require('../middleware/passport');
const logger = require('../../lib/logger');

const Logger = logger.getInstance();

const StripeProduction = Stripe(process.env.STRIPE_SK, { apiVersion: '2020-08-27' });
const StripeTest = Stripe(process.env.STRIPE_SK_TEST, { apiVersion: '2020-08-27' });

module.exports = (Router, Service, App) => {
  /**
   * @swagger
   * /teams/initialize:
   *   post:
   *     description: User team initialize.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user object with all info
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull user initialization
   *       204:
   *         description: User needs to be activated
   *
   *
   */
  Router.post('/teams/initialize', passportAuth, async (req, res) => {
    const { mnemonic, email: bridgeUser } = req.body;
    const { user } = req;

    // Take the object team
    const team = await Service.Team.getTeamByMember(req.user.email);

    if (!team) {
      Logger.error('Team not found');
      return res.status(200).send({ error: 'Team not found' });
    }
    // If the team does not exist and is not admin
    if (team && team.admin !== user.email) {
      Logger.error('You are not the admin');
      return res.status(400).send({ error: 'You are not the admin' });
    }

    const userData = await Service.User.InitializeUser({ email: bridgeUser, mnemonic });
    const teamUser = await Service.User.FindUserByEmail(bridgeUser);

    userData.id = teamUser.id;
    userData.email = teamUser.email;
    userData.password = teamUser.password;
    userData.mnemonic = teamUser.mnemonic;
    userData.root_folder_id = teamUser.root_folder_id;

    res.status(200).send({ userData });
  });

  /**
   * @swagger
   * /team-invitations:
   *   post:
   *     description: Invite members for teams.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user object with the info of team
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull invite
   *       204:
   *         description: User not allow to invite
   *      additional info:
   *        This method will also control the limit range of 10 people for the 200GB plan
   */
  Router.post('/teams/team/invitations', passportAuth, async (req, res) => {
    // Datas
    const { email } = req.body;
    const token = crypto.randomBytes(20).toString('hex');
    const bridgePassword = req.body.bridgePass;
    const Encryptmnemonic = req.body.mnemonicTeam;
    const user = req.user.email;
    // Datas for control the 10-person limit
    const teamInfo = await Service.Team.getTeamBridgeUser(user);
    const totalUsers = await Service.TeamsMembers.getPeople(teamInfo.id);

    if (totalUsers.length >= teamInfo.quantity) {
      return res.status(500).send({ error: `You cannot exceed the limit of ${teamInfo.quantity} members` });
    }
    // Datas needed for invite a user
    const existsUser = await Service.User.FindUserByEmail(email);
    const existsKeys = await Service.KeyServer.keysExists(existsUser);
    // It is checked that the user exists and has passwords
    if (!existsUser && !existsKeys) {
      return res.status(500).send({ error: 'You can not invite this user' });
    }
    // Check if the invitation exists
    const existsInvitation = await Service.TeamInvitations.getTeamInvitationByUser(email);
    // If it exists, forward mail, otherwise, check if is a member
    if (!existsInvitation) {
      const existsMember = await Service.Team.getIdTeamByUser(email);
      // If  not a member, check if the user teams of the bridge can send emails
      if (!existsMember) {
        const existsBridgeUser = await Service.Team.getTeamBridgeUser(req.user.email);
        if (!existsBridgeUser) {
          return res.status(500).send({ error: 'You are not allow to invite' });
        }
        // If this user is allow to invite, save the invitation and send mail
        const saveInvitations = await Service.TeamInvitations.save({
          id_team: existsBridgeUser.id,
          user: email,
          token,
          bridge_password: bridgePassword,
          mnemonic: Encryptmnemonic
        });
        if (!saveInvitations) {
          return res.status(500).send({ error: 'The invitation can not saved' });
        }

        return Service.Mail.sendEmailTeamsMember(email, token, req.team).then(() => {
          Logger.info('User %s sends invitations to %s to join a team', req.user.email, req.body.email);
          res.status(200).send({});
        }).catch(() => {
          Logger.error('Error: Send invitation mail from %s to %s 2', req.user.email, req.body.email);
          res.status(500).send({});
        });
      }
      // Check that the member's status is 200
      if (existsMember.status === 200) {
        res.status(200).send({});
      } else {
        res.status(400).send({ error: 'This user is alredy a member' });
      }
    }
    // Forward email
    return Service.Mail.sendEmailTeamsMember(email, existsInvitation.token, req.team).then(() => {
      Logger.info('The email is forwarded to the user %s', email);
      res.status(200).send({});
    }).catch(() => {
      Logger.error('Error: Send invitation mail from %s to %s 1', req.user.email, email);
      res.status(500).send({ error: 'Error: Send invitation mail' });
    });
  });

  /**
   * @swagger
   * /teams/join/:token:
   *   post:
   *     description: Join team.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user object with the a token
   *         in: url
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull join
   *       204:
   *         description: token invalid
   *      additional info:
   *        This method will destroy the invitation it had
   */

  Router.post('/teams/join/:token', async (req, res) => {
    const { token } = req.params;
    // Datas need for join a team
    const getToken = await Service.TeamInvitations.getByToken(token);
    const getTeam = await Service.Team.getTeamById(getToken.id_team);
    const findUser = await Service.User.FindUserByEmail(getToken.user);
    const keysExists = await Service.KeyServer.keysExists(findUser);
    // Control that the token,team, user and keys exists
    if (!getToken && !getTeam && !findUser && !keysExists) {
      Logger.error('Token %s doesn\'t exists', token);
      return res.status(500).send({ error: 'Invalid Team invitation link' });
    }
    // Save the member
    const saveMember = await Service.TeamsMembers.saveMembersFromInvitations({
      id_team: getToken.id_team,
      user: getToken.user,
      bridge_password: getToken.bridge_password,
      bridge_mnemonic: getToken.mnemonic
    });
    if (!saveMember) {
      Logger.error('Error: User %s could not be saved in teamMember ', getToken.user);
      return res.status(500).send({ error: 'Invalid Team invitation link' });
    }
    // Destroy the invitation
    return getToken.destroy().then(() => {
      res.status(200).send({});
    }).catch(() => {
      Logger.error('Error:The invitation could not be destroyed');
      res.status(500).send({ error: 'The invitation could not be destroyed' });
    });
  });

  /**
   * @swagger
   * /teams-members/:user:
   *   get:
   *     description: get information team if the user is a member.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user object with email
   *         in: url
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull the user is a member and has a team
   *       204:
   *         description: the user is not a member
   *      additional info: is used to update xTeam in web
   *
   */
  Router.get('/teams-members/:user', passportAuth, (req, res) => {
    const userEmail = req.params.user;

    Service.Team.getIdTeamByUser(userEmail).then((team) => {
      Service.Team.getTeamById(team.id_team).then((team2) => {
        res.status(200).json(team2.dataValues);
      }).catch(() => {
        Logger.error('Error: Team not exists');
      });
    }).catch((err) => {
      Logger.error('Error: This user %s not is a member', userEmail);
      res.status(500).json(err);
    });
  });

  /**
   * @swagger
   * /teams/members/:idTeam:
   *   get:
   *     description: get members.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: idteam to to make a difference
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull get members
   *       204:
   *         description: with this idTeam not have members
   *      additional info: is used to the usage and limit in web
   *
   */
  Router.get('/teams/members/:idTeam', passportAuth, async (req, res) => {
    const { idTeam } = req.params;
    const members = await Service.TeamsMembers.getPeople(idTeam);
    res.status(200).send(members);
  });

  /**
   * @swagger
   * /teams/member:
   *   delete:
   *     description: delete members.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: idteam to to make a difference,a user, and the email to remove user
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull delete members
   *       204:
   *         description: The user is not allow to delete members
   *
   *
   */
  Router.delete('/teams/member', passportAuth, (req, res) => {
    const { user } = req;
    const { idTeam } = req.body;
    const removeUser = req.body.item.user;

    Service.Team.getTeamByEmail(user.email).then((team) => {
      if (idTeam === team.id) {
        Service.TeamsMembers.removeMembers(removeUser).then(() => {
          res.status(200).send({ info: 'The user is removed ' });
        }).catch((err) => {
          res.status(500).json({ error: err });
        });
      } else {
        Logger.error('Error: This member is not of this team');
        res.status(500).send({ info: 'You not have permissions' });
      }
    }).catch(() => {
      Logger.error('Error: You not have permissions');
      res.status(500).send({ info: 'You not have permissions' });
    });
  });

  /**
   * @swagger
   * /teams/deleteAccount:
   *   post:
   *     description: send deactivate email teams account.
   *     produces:
   *       - application/json
   *     parameters:
   *       - description: user email that make the request
   *         in: body
   *         required: true
   *     responses:
   *       200:
   *         description: Successfull send email
   *       204:
   *         description: Erorr in send email
   *
   *
   */
  Router.post('/teams/deleteAccount', passportAuth, (req, res) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: 'hello@internxt.com',
      from: 'hello@internxt.com',
      subject: 'Delete Teams Account',
      text: `Hello Internxt! I need to delete my team account ${req.user.email}`
    };
    sgMail.send(msg).then(() => {
      res.status(200).send({});
    }).catch((err) => {
      Logger.error('Error: Error send deactivation email teams account of user %s', req.user.email);
      res.status(500).send(err);
    });
  });

  Router.get('/teams/info', passportAuth, (req, res) => {
    Service.Team.getTeamByMember(req.user.email).then(async (team) => {
      if (!team) {
        throw Error('No teams');
      }
      const userTeam = team.toJSON();
      delete userTeam.id;
      const internxtClient = req.headers['internxt-client'];
      const tokenTeams = Sign(userTeam.bridge_user, App.config.get('secrets').JWT, internxtClient === 'drive-web');

      const user = await Service.User.FindUserByEmail(userTeam.bridge_user);
      userTeam.root_folder_id = user.root_folder_id;

      const member = await Service.TeamsMembers.getMemberByIdTeam(team.id, req.user.email);

      userTeam.bridge_mnemonic = member.bridge_mnemonic;
      userTeam.isAdmin = userTeam.admin === req.user.email;

      res.status(200).send({ userTeam, tokenTeams });
    }).catch(() => {
      res.status(400).json({ error: 'Team not found' });
    });
  });

  Router.get('/teams/team/info', passportAuth, (req, res) => {
    Service.Team.getTeamByEmail(req.user.email).then(async (team) => {
      if (!team) {
        throw Error('No teams');
      }
      const userTeam = team.toJSON();
      res.status(200).send({ userTeam });
    }).catch((err) => {
      res.status(400).json({ error: 'Team not found' });
    });
  });

  Router.post('/teams/checkout/session', passportAuth, async (req, res) => {
    const { email } = req.user;
    const { mnemonic } = req.body;
    const salt = crypto.randomBytes(128 / 8).toString('hex');
    const encryptedSalt = App.services.Crypt.encryptText(salt);
    const newPassword = App.services.Crypt.encryptText('team', salt);
    const encryptedPassword = App.services.Crypt.encryptText(newPassword);
    const { checkoutSessionId } = req.body;
    const stripe = req.body.test ? StripeTest : StripeProduction;
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    if (session.payment_status == 'paid') {
      const team = await Service.Team.getTeamByEmail(email);
      const user = {
        email: team.bridge_user,
        password: encryptedPassword,
        salt: encryptedSalt,
        mnemonic
      };
      const userRegister = await Service.User.FindOrCreate(user);
      await team.update({
        bridge_password: userRegister.userId,
        total_members: session.metadata.total_members
      });
      await Service.User.InitializeUser({ email: team.bridge_user, mnemonic });
      await Service.TeamsMembers.addTeamMember(team.id, team.admin, team.bridge_password, team.bridge_mnemonic);

      res.status(200).send({ team });
    } else {
      res.status(400).send({ error: 'Team is not paid' });
    }
  });

  return Router;
};
