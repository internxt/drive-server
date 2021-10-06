module.exports = (Model) => {
  const enableShareWorkspace = (user, guest, key) => {
    user.tempKey = key;
    return user.save();
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

  return {
    Name: 'Guest',
    enableShareWorkspace,
    invite
  };
};
