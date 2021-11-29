const bip39 = require('bip39');
const AesUtil = require('../../lib/AesUtil');
const CryptService = require('./crypt');
const logger = require('../../lib/logger').default;

const Logger = logger.getInstance();

const APPSUMO_TIER_LIMITS = {
  internxt_free1: 0,
  internxt_tier1: 1,
  internxt_tier2: 5,
  internxt_tier3: 10,
  internxt_tier4: 25,
  internxt_tier5: 100,
};

module.exports = (Model, App) => {
  const cryptService = CryptService(Model, App);

  const getHost = (email) => {
    return Model.users.findOne({ where: { username: email } });
  };

  const inviteUsage = async (host) => {
    const invitations = await Model.Invitation.findAll({ where: { host: host.id } });

    return invitations.length;
  };

  const hasUnlimitedMembers = (userId) => {
    return Model.plan.findOne({ where: { userId, name: 'unlimited_members' } }).then((plan) => !!plan);
  };

  const inviteMembersLimit = async (userId) => {
    const appsumo = await Model.AppSumo.findOne({ where: { userId } });

    // TODO: Remove this dissociation when appsumo finishes, Plans is the truth source
    if (appsumo) {
      if (!Object.keys(APPSUMO_TIER_LIMITS).indexOf(appsumo.planId) === -1) {
        // Not valid appsumo  plan
        return 0;
      }

      return APPSUMO_TIER_LIMITS[appsumo.planId];
    }

    // TODO: Remove this when readjusted database plans
    const unlimitedMembers = await Model.plan.findOne({ where: { userId, name: 'appsumo_unlimited_members' } });
    const hasUnlimited = await hasUnlimitedMembers(userId);

    if (unlimitedMembers || hasUnlimited) {
      return Number.MAX_SAFE_INTEGER;
    }

    return 0;
  };

  const invitationsLeft = async (host) => {
    const usage = await inviteUsage(host);
    const limit = await inviteMembersLimit(host.id);

    return Math.max(limit - usage, 0);
  };

  const canInvite = async (host, guest) => {
    if (!guest) {
      throw Error('Guest does not exists');
    }

    if (guest.email !== guest.bridgeUser) {
      throw Error('Guest is already in other workspace');
    }

    if (guest.sharedWorkspace) {
      throw Error('Guest is a host');
    }

    const invitation = await Model.Invitation.findOne({
      where: {
        host: host.id,
        guest: guest.id,
      },
    });

    if (invitation) {
      throw Error('Guest already invited');
    }

    const left = await invitationsLeft(host);

    if (left === 0) {
      throw Error('No invitations left');
    }

    return true;
  };

  const invite = async (host, guestEmail, key) => {
    const guest = await Model.users.findOne({ where: { username: guestEmail } });
    await canInvite(host, guest);

    return Model.Invitation.create({
      host: host.id,
      guest: guest.id,
      inviteId: key,
    });
  };

  const acceptInvitation = async (guestUser, payload) => {
    if (!payload) {
      throw Error('Missing user key');
    }

    const invitation = await Model.Invitation.findOne({ where: { guest: guestUser.id } });

    if (!invitation) {
      throw Error('User not invited');
    }

    const hostUser = await Model.users.findOne({ where: { id: invitation.host } });
    const hostKey = AesUtil.decrypt(invitation.inviteId);
    const masterKey = bip39.entropyToMnemonic(hostKey);

    const guestKey = Buffer.from(payload, 'hex').toString();

    const newKey = cryptService.encryptTextWithKey(masterKey, guestKey);

    guestUser.mnemonic = newKey;
    guestUser.bridgeUser = hostUser.bridgeUser;
    guestUser.root_folder_id = hostUser.root_folder_id;
    guestUser.userId = hostUser.userId;

    invitation.accepted = true;

    await invitation.save();
    await guestUser.save();

    Logger.info('User %s accepted shared workspace. Host: %s', guestUser.email, hostUser.email);
  };

  return {
    Name: 'Guest',
    getHost,
    invite,
    acceptInvitation,
  };
};
