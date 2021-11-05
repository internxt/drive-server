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
// Google ReCaptcha V3
var axios = require('axios').default;
var encode = require('querystring').encode;
var Logger = require('./logger').default;
var log = Logger.getInstance();
var GOOGLE_RECAPTCHA_V3_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';
function verify(captcha, remoteip) {
    if (remoteip === void 0) { remoteip = undefined; }
    return __awaiter(this, void 0, void 0, function () {
        var body;
        return __generator(this, function (_a) {
            if (process.env.NODE_ENV !== 'production') {
                return [2 /*return*/, {}];
            }
            body = {
                secret: process.env.RECAPTCHA_V3,
                response: captcha,
                remoteip: remoteip
            };
            return [2 /*return*/, axios.post(GOOGLE_RECAPTCHA_V3_ENDPOINT, encode(body), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then(function (res) {
                    if (!res.data.success) {
                        throw Error(res.data['error-codes']);
                    }
                    var scoreThreshold = process.env.RECAPTCHA_V3_SCORE_THRESHOLD || 0.5;
                    var score = res.data.score;
                    if (score < scoreThreshold) {
                        throw Error("Score " + score + " under " + scoreThreshold);
                    }
                    return res.data;
                }).catch(function (err) {
                    log.error("RECAPTCHA ERROR " + (err.isAxiosError ? JSON.stringify(err.response.data) : err.message));
                    throw err;
                })];
        });
    });
}
module.exports = {
    verify: verify
};
