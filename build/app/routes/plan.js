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
var createHttpError = require('http-errors');
var passport = require('../middleware/passport');
var logger = require('../../lib/logger').default;
var Logger = logger.getInstance();
var passportAuth = passport.passportAuth;
module.exports = function (Router, Service) {
    Router.get('/plan/individual', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var user, appSumoPlan, result, plan, error_1, statusCode, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    user = req.user;
                    return [4 /*yield*/, Service.AppSumo.GetDetails(user).catch(function () { return null; })];
                case 1:
                    appSumoPlan = _a.sent();
                    if (appSumoPlan && appSumoPlan.planId !== 'internxt_free1') {
                        result = {
                            isAppSumo: true,
                            price: 0,
                            details: appSumoPlan
                        };
                        return [2 /*return*/, res.status(200).send(result)];
                    }
                    return [4 /*yield*/, Service.Plan.getIndividualPlan(user.bridgeUser, user.userId)];
                case 2:
                    plan = _a.sent();
                    if (!plan) {
                        throw createHttpError(404, 'Individual plan not found');
                    }
                    return [2 /*return*/, res.status(200).json(plan)];
                case 3:
                    error_1 = _a.sent();
                    statusCode = error_1.statusCode || 500;
                    errorMessage = error_1.message || '';
                    Logger.error("Error getting stripe individual plan " + req.user.email + ": " + error_1.message);
                    return [2 /*return*/, res.status(statusCode).send({ error: errorMessage })];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    Router.get('/plan/team', passportAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var team, teamAdminUser, plan, error_2, statusCode, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, Service.Team.getTeamByMember(req.user.email)];
                case 1:
                    team = _a.sent();
                    if (!team) {
                        throw createHttpError(404, "Team not found by member email: " + req.user.email);
                    }
                    return [4 /*yield*/, Service.User.FindUserByEmail(team.admin)];
                case 2:
                    teamAdminUser = _a.sent();
                    return [4 /*yield*/, Service.Plan.getTeamPlan(teamAdminUser.email, teamAdminUser.userId)];
                case 3:
                    plan = _a.sent();
                    if (!plan) {
                        throw createHttpError(404, 'Team plan not found');
                    }
                    return [2 /*return*/, res.status(200).json(plan)];
                case 4:
                    error_2 = _a.sent();
                    statusCode = error_2.statusCode || 500;
                    errorMessage = error_2.message || '';
                    Logger.error("Error getting stripe team plan " + req.user.email + ": " + error_2.message);
                    return [2 /*return*/, res.status(statusCode).send({ error: errorMessage })];
                case 5: return [2 /*return*/];
            }
        });
    }); });
};
