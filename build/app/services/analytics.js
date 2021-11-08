"use strict";
var Analytics = require('analytics-node');
var analytics = new Analytics(process.env.APP_SEGMENT_KEY);
module.exports = function () {
    var track = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        return analytics.track.apply(analytics, params);
    };
    var identify = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        return analytics.identify.apply(analytics, params);
    };
    return {
        Name: 'Analytics',
        track: track,
        identify: identify
    };
};
