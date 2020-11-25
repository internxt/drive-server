const Analytics = require('analytics-node');
const analytics = new Analytics(process.env.APP_SEGMENT_KEY);

module.exports = (Model, App) => {

    const track = (...params) => {
        return analytics.track(...params);
    };

    const identify = (...params) => {
        return analytics.identify(...params);
    };

    const trackEvent = (req, user, eventName, props) => {
        if (user && typeof user === 'string') {
            return analytics.track({ userId: user, event: eventName, ...props });
        } else {
            return analytics.track({ userId: user.uuid, event: eventName, ...props });
        }
    };

    const trackIfDesktop = (req, user, eventName, props) => {
        const device = determineClient(req);

        if (device === 'desktop') {
            return trackEvent(req, user, eventName, props);
        }
    };
    const trackIfMobile = (req, user, eventName, props) => {
        const device = determineClient(req);

        if (device === 'mobile') {
            return trackEvent(req, user, eventName, props);
        }
    };

    const determineClient = (req) => {
        let source = null;
        if (typeof req === 'object') {
            source = req.headers['internxt-client'];
        } else if (typeof req === 'string') {
            source = req;
        }

        if (source === 'x-cloud-web' || source === 'drive-web') {
            return 'web';
        }

        if (req.headers['user-agent'].includes(' Electron/')) {
            return 'desktop';
        }

        if (req.headers['user-agent'] === 'okhttp/3.12.1') {
            return 'mobile';
        }

        return null;
    };

    const trackAll = (req, user, eventName, props) => {
        let device = determineClient(req);
        const allowedSources = ['web', 'mobile', 'desktop'];

        if (allowedSources.indexOf(device) === -1) {
            device = 'unknown';
        }

        if (props.properties) {
            props.properties.platform = device;
        }
        return trackEvent(req, user, eventName, { ...props, platform: device });
    };

    return {
        Name: 'Analytics',
        track,
        trackEvent,
        determineClient,
        trackIfDesktop,
        trackIfMobile,
        trackAll,
        identify
    };
};