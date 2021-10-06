// TODO: The auth should be replaced by an auth token that will
// provide the team id of the user making the request
const build = (Service) => async (req, res, next) => {
  try {
    const teamId = req.params.idTeam || null;
    const user = req.behalfUser ? req.behalfUser : req.user;
    let teamMember = null;

    if (teamId) {
      teamMember = await Service.TeamsMembers.getMemberByIdTeam(teamId, user.email);
    }

    if (teamId && !teamMember) {
      return res.status(401).send();
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  build
};
