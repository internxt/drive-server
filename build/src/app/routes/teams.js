"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var crypto = require('crypto');
var sgMail = require('@sendgrid/mail');
var Stripe = require('stripe');
var _ = require('lodash');
var _a = require('../middleware/passport'), passportAuth = _a.passportAuth, Sign = _a.Sign;
var logger = require('../../lib/logger').default;
var Logger = logger.getInstance();
var StripeProduction = Stripe(process.env.STRIPE_SK, { apiVersion: '2020-08-27' });
var StripeTest = Stripe(process.env.STRIPE_SK_TEST, { apiVersion: '2020-08-27' });
module.exports = function (Router, Service, App) {
    Router.post('/teams/team/invitations', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var email, token, bridgePassword, Encryptmnemonic, user, teamInfo, totalUsers, existsUser, existsKeys, existsInvitation, existsMember, existsBridgeUser, saveInvitations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    email = req.body.email;
                    token = crypto.randomBytes(20).toString('hex');
                    bridgePassword = req.body.bridgePass;
                    Encryptmnemonic = req.body.mnemonicTeam;
                    user = req.user.email;
                    return [4 /*yield*/, Service.Team.getTeamBridgeUser(user)];
                case 1:
                    teamInfo = _a.sent();
                    return [4 /*yield*/, Service.TeamsMembers.getPeople(teamInfo.id)];
                case 2:
                    totalUsers = _a.sent();
                    if (totalUsers.length >= teamInfo.total_members) {
                        return [2 /*return*/, res.status(500).send({ error: "You cannot exceed the limit of " + teamInfo.total_members + " members" })];
                    }
                    return [4 /*yield*/, Service.User.FindUserByEmail(email).catch(function () { return null; })];
                case 3:
                    existsUser = _a.sent();
                    return [4 /*yield*/, Service.KeyServer.keysExists(existsUser)];
                case 4:
                    existsKeys = _a.sent();
                    // It is checked that the user exists and has passwords
                    if (!existsUser && !existsKeys) {
                        return [2 /*return*/, res.status(400).send({ error: 'You cannot invite this user. Please make sure that the user has an active Internxt account.' })];
                    }
                    return [4 /*yield*/, Service.TeamInvitations.getTeamInvitationByUser(email)];
                case 5:
                    existsInvitation = _a.sent();
                    if (!!existsInvitation) return [3 /*break*/, 10];
                    return [4 /*yield*/, Service.Team.getIdTeamByUser(email)];
                case 6:
                    existsMember = _a.sent();
                    if (!!existsMember) return [3 /*break*/, 9];
                    return [4 /*yield*/, Service.Team.getTeamBridgeUser(req.user.email)];
                case 7:
                    existsBridgeUser = _a.sent();
                    if (!existsBridgeUser) {
                        return [2 /*return*/, res.status(400).send({ error: 'You are not allow to invite' })];
                    }
                    return [4 /*yield*/, Service.TeamInvitations.save({
                            id_team: existsBridgeUser.id,
                            user: email,
                            token: token,
                            bridge_password: bridgePassword,
                            mnemonic: Encryptmnemonic
                        })];
                case 8:
                    saveInvitations = _a.sent();
                    if (!saveInvitations) {
                        return [2 /*return*/, res.status(400).send({ error: 'The invitation can not saved' })];
                    }
                    return [2 /*return*/, Service.Mail.sendEmailTeamsMember(existsUser.name, email, token, req.team).then(function () {
                            Logger.info('User %s sends invitations to %s to join a team', req.user.email, req.body.email);
                            res.status(200).send({});
                        }).catch(function () {
                            Logger.error('Error: Send invitation mail from %s to %s', req.user.email, req.body.email);
                            res.status(500).send({});
                        })];
                case 9:
                    // Check that the member's status is 200
                    if (existsMember.status === 200) {
                        res.status(200).send({});
                    }
                    else {
                        res.status(400).send({ error: 'This user is alredy a member' });
                    }
                    _a.label = 10;
                case 10: 
                // Forward email
                return [2 /*return*/, Service.Mail.sendEmailTeamsMember(existsUser.name, email, existsInvitation.token, req.team).then(function () {
                        Logger.info('The email is forwarded to the user %s', email);
                        res.status(200).send({});
                    }).catch(function () {
                        Logger.error('Error: Send invitation mail from %s to %s', req.user.email, email);
                        res.status(500).send({ error: 'Error: Send invitation mail' });
                    })];
            }
        });
    }); });
    Router.post('/teams/join/:token', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var token, getToken, getTeam, findUser, keysExists, saveMember;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = req.params.token;
                    return [4 /*yield*/, Service.TeamInvitations.getByToken(token)];
                case 1:
                    getToken = _a.sent();
                    return [4 /*yield*/, Service.Team.getTeamById(getToken.id_team)];
                case 2:
                    getTeam = _a.sent();
                    return [4 /*yield*/, Service.User.FindUserByEmail(getToken.user)];
                case 3:
                    findUser = _a.sent();
                    return [4 /*yield*/, Service.KeyServer.keysExists(findUser)];
                case 4:
                    keysExists = _a.sent();
                    // Control that the token,team, user and keys exists
                    if (!getToken && !getTeam && !findUser && !keysExists) {
                        Logger.error('Token %s doesn\'t exists', token);
                        return [2 /*return*/, res.status(500).send({ error: 'Invalid Team invitation link' })];
                    }
                    return [4 /*yield*/, Service.TeamsMembers.saveMembersFromInvitations({
                            id_team: getToken.id_team,
                            user: getToken.user,
                            bridge_password: getToken.bridge_password,
                            bridge_mnemonic: getToken.mnemonic
                        })];
                case 5:
                    saveMember = _a.sent();
                    if (!saveMember) {
                        Logger.error('Error: User %s could not be saved in teamMember ', getToken.user);
                        return [2 /*return*/, res.status(500).send({ error: 'Invalid Team invitation link' })];
                    }
                    // Destroy the invitation
                    return [2 /*return*/, getToken.destroy().then(function () {
                            res.status(200).send({});
                        }).catch(function () {
                            Logger.error('Error:The invitation could not be destroyed');
                            res.status(500).send({ error: 'The invitation could not be destroyed' });
                        })];
            }
        });
    }); });
    Router.get('/teams-members/:user', passportAuth, function (req, res) {
        var userEmail = req.params.user;
        Service.Team.getIdTeamByUser(userEmail).then(function (team) {
            Service.Team.getTeamById(team.id_team).then(function (team2) {
                res.status(200).json(team2.dataValues);
            }).catch(function () {
                Logger.error('Error: Team not exists');
            });
        }).catch(function (err) {
            Logger.error('Error: This user %s not is a member', userEmail);
            res.status(500).json(err);
        });
    });
    Router.get('/teams/members', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var user, teamInfo, members, result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = req.user.email;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, Service.Team.getTeamByEmail(user)];
                case 2:
                    teamInfo = _a.sent();
                    return [4 /*yield*/, Service.TeamsMembers.getPeople(teamInfo.id)];
                case 3:
                    members = _a.sent();
                    result = _.remove(members, function (member) { return member.user !== user; });
                    res.status(200).send(result);
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    res.status(500).send();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    Router.delete('/teams/member', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var removeUser, teamInfo, deleteMember;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    removeUser = req.body.item.user;
                    return [4 /*yield*/, Service.Team.getTeamByEmail(req.user.email)];
                case 1:
                    teamInfo = _a.sent();
                    if (!teamInfo) {
                        res.status(500).send({ info: 'You not have permissions' });
                    }
                    return [4 /*yield*/, Service.TeamsMembers.removeMembers(removeUser)];
                case 2:
                    deleteMember = _a.sent();
                    if (deleteMember === 1) {
                        res.status(200).send({ info: 'Successfully member deleted' });
                    }
                    else {
                        res.status(500).send({ err: 'Error, the member can not be deleted' });
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    Router.delete('/teams/invitation', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var removeUser, teamInfo, deleteInvitation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    removeUser = req.body.item.user;
                    return [4 /*yield*/, Service.Team.getTeamByEmail(req.user.email)];
                case 1:
                    teamInfo = _a.sent();
                    if (!teamInfo) {
                        res.status(500).send({ info: 'You not have permissions' });
                    }
                    return [4 /*yield*/, Service.TeamInvitations.removeInvitations(removeUser)];
                case 2:
                    deleteInvitation = _a.sent();
                    if (deleteInvitation === 1) {
                        res.status(200).send({ info: 'Successfully invitation deleted' });
                    }
                    else {
                        res.status(500).send({ err: 'Error, the invitation can not be deleted' });
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    Router.post('/teams/deleteAccount', passportAuth, function (req, res) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        var msg = {
            to: 'hello@internxt.com',
            from: 'hello@internxt.com',
            subject: 'Delete Teams Account',
            text: "Hello Internxt! I need to delete my team account " + req.user.email
        };
        sgMail.send(msg).then(function () {
            res.status(200).send({});
        }).catch(function (err) {
            Logger.error('Error: Error send deactivation email teams account of user %s', req.user.email);
            res.status(500).send(err);
        });
    });
    Router.get('/teams/info', passportAuth, function (req, res) {
        Service.Team.getTeamByMember(req.user.email).then(function (team) { return __awaiter(void 0, void 0, void 0, function () {
            var userTeam, internxtClient, tokenTeams, user, userBucket, member;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!team) {
                            throw Error('No teams');
                        }
                        userTeam = team.toJSON();
                        delete userTeam.id;
                        internxtClient = req.headers['internxt-client'];
                        tokenTeams = Sign(userTeam.bridge_user, App.config.get('secrets').JWT, internxtClient === 'drive-web');
                        return [4 /*yield*/, Service.User.FindUserByEmail(userTeam.bridge_user)];
                    case 1:
                        user = _a.sent();
                        userTeam.root_folder_id = user.root_folder_id;
                        return [4 /*yield*/, Service.User.GetUserBucket(user)];
                    case 2:
                        userBucket = _a.sent();
                        return [4 /*yield*/, Service.TeamsMembers.getMemberByIdTeam(team.id, req.user.email)];
                    case 3:
                        member = _a.sent();
                        userTeam.bridge_mnemonic = member.bridge_mnemonic;
                        userTeam.isAdmin = userTeam.admin === req.user.email;
                        userTeam.bucket = userBucket;
                        res.status(200).send({ userTeam: userTeam, tokenTeams: tokenTeams });
                        return [2 /*return*/];
                }
            });
        }); }).catch(function () {
            res.status(400).json({ error: 'Team not found' });
        });
    });
    Router.get('/teams/team/info', passportAuth, function (req, res) {
        Service.Team.getTeamByEmail(req.user.email).then(function (team) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!team) {
                    throw Error('No teams');
                }
                return [2 /*return*/, team];
            });
        }); })
            .then(function (teamInfo) {
            res.status(200).send(teamInfo);
        })
            .catch(function () {
            res.status(400).json({ error: 'Team not found' });
        });
    });
    Router.post('/teams/checkout/session', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var email, mnemonic, salt, encryptedSalt, newPassword, encryptedPassword, checkoutSessionId, stripe, session, team, user, userRegister, subscription, product, sizeBytes, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    email = req.user.email;
                    mnemonic = req.body.mnemonic;
                    salt = crypto.randomBytes(128 / 8).toString('hex');
                    encryptedSalt = App.services.Crypt.encryptText(salt);
                    newPassword = App.services.Crypt.encryptText('team', salt);
                    encryptedPassword = App.services.Crypt.encryptText(newPassword);
                    checkoutSessionId = req.body.checkoutSessionId;
                    stripe = req.body.test ? StripeTest : StripeProduction;
                    return [4 /*yield*/, stripe.checkout.sessions.retrieve(checkoutSessionId)];
                case 1:
                    session = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 13, , 14]);
                    if (!(session.payment_status === 'paid')) return [3 /*break*/, 11];
                    return [4 /*yield*/, Service.Team.getTeamByEmail(email)];
                case 3:
                    team = _a.sent();
                    user = {
                        email: team.bridge_user,
                        password: encryptedPassword,
                        salt: encryptedSalt,
                        mnemonic: mnemonic
                    };
                    return [4 /*yield*/, Service.User.FindOrCreate(user)];
                case 4:
                    userRegister = _a.sent();
                    return [4 /*yield*/, team.update({
                            bridge_password: userRegister.userId,
                            total_members: session.metadata.total_members
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, stripe.subscriptions.retrieve(session.subscription)];
                case 6:
                    subscription = _a.sent();
                    return [4 /*yield*/, stripe.products.retrieve(subscription.plan.product)];
                case 7:
                    product = _a.sent();
                    sizeBytes = parseInt(product.metadata.size_bytes, 10);
                    return [4 /*yield*/, Service.User.InitializeUser({ email: team.bridge_user, mnemonic: mnemonic })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, Service.Team.ApplyLicenseTeams(team.bridge_user, sizeBytes * session.metadata.total_members)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, Service.TeamsMembers.addTeamMember(team.id, team.admin, team.bridge_password, team.bridge_mnemonic)];
                case 10:
                    _a.sent();
                    res.status(200).send({ team: team });
                    return [3 /*break*/, 12];
                case 11: throw new Error('Team is not paid!');
                case 12: return [3 /*break*/, 14];
                case 13:
                    error_1 = _a.sent();
                    res.status(400).send({ error: error_1 });
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    }); });
    return Router;
};
