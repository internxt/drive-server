const bip39 = require('bip39');
const AesUtil = require('../../lib/AesUtil');
const CryptService = require('./crypt');

const APPSUMO_TIER_LIMITS = {
  internxt_free1: 0,
  internxt_tier1: 1,
  internxt_tier2: 5,
  internxt_tier3: 10,
  internxt_tier4: 25,
  internxt_tier5: 100
};

module.exports = (Model, App) => {
  const cryptService = CryptService(Model, App);

  const enableShareWorkspace = (user, guest, key) => {
    user.tempKey = key;
    return user.save();
  };

  const inviteUsage = async (host) => {
    const invitations = await Model.Invitation.findAll({ where: { host: host.id } });

    if (!invitations) {
      return 0;
    }

    return invitations.length;
  };

  const inviteLimit = async (host) => {
    const appsumo = await Model.AppSumo.findOne({ where: { user_id: host.id } });

    if (!appsumo) {
      // Not appsumo user
      return 0;
    }

    if (!Object.keys(APPSUMO_TIER_LIMITS).indexOf(appsumo.planId) === -1) {
      // Not valid appsumo  plan
      return 0;
    }

    return APPSUMO_TIER_LIMITS[appsumo.planId];
  };

  const invitationsLeft = async (host) => {
    const usage = await inviteUsage(host);
    const limit = await inviteLimit(host);

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
        guest: guest.id
      }
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
    const guest = await Model.users.findOne({ where: { email: guestEmail } });
    await canInvite(host, guest);

    return Model.Invitation.create({
      host: host.id,
      guest: guest.id,
      inviteId: key
    });
  };

  const acceptInvitation = async (guest, payload) => {
    if (!payload) {
      throw Error('Missing user key');
    }

    const invitation = await Model.Invitation.findOne({ where: { guest: guest.id } });

    if (!invitation) {
      throw Error('User not invited');
    }

    const host = await Model.users.findOne({ where: { id: invitation.host } });
    const guestKey = Buffer.from(payload, 'hex').toString();
    const hostKey = AesUtil.decrypt(invitation.inviteId);
    const masterKey = bip39.entropyToMnemonic(hostKey);
    const newKey = cryptService.encryptTextWithKey(masterKey, guestKey);

    guest.mnemonic = newKey;
    guest.bridgeUser = host.bridgeUser;
    guest.root_folder_id = host.root_folder_id;
    guest.userId = host.userId;
    // await guest.save();
    console.log('SAVE');
  };

  return {
    Name: 'Guest',
    enableShareWorkspace,
    invite,
    acceptInvitation
  };
};
