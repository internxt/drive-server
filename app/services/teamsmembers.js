const sequelize = require('sequelize');
const _ = require('lodash');

const { Op } = sequelize;

module.exports = (Model) => {
  /**
     * @swagger
     * Function: Method remove members of DB
     */
  const removeMembers = (member) => Model.teams_members.destroy({ where: { user: { [Op.eq]: member } } });

  /**
     * @swagger
     * Function: Method get info team with the idTeam
     */
  const getTeamsAdminById = (idTeam) => Model.teams.findOne({ where: { id: { [Op.eq]: idTeam } } });

  /**
     * @swagger
     * Function: Method get info all team members with idTeam
     */
  const getMembersByIdTeam = (idTeam) => Model.teams_members.findAll({ where: { id_team: { [Op.eq]: idTeam } } });

  /**
     * @swagger
     * Function: Method get info all invitations with idTeam
     */
  const getInvitationsByIdTeam = (idTeam) => Model.team_invitations.findAll({ where: { id_team: { [Op.eq]: idTeam } } });

  /**
     * @swagger
     * Function: Method get members and invitations for the list of manage team for the admin
     */
  const getPeople = async (idTeam) => {
    const result = [];
    const members = await getMembersByIdTeam(idTeam);
    const invitations = await getInvitationsByIdTeam(idTeam);
    const admin = await getTeamsAdminById(idTeam);
    _.remove(members, (member) => member.dataValues.user === admin.dataValues.admin);
    members.forEach((m) => result.push({ isMember: true, isInvitation: false, user: m.user }));
    invitations.forEach((m) => result.push({ isMember: false, isInvitation: true, user: m.user }));
    return result;
  };

  /**
     * @swagger
     * Function: Method get info team members with the idTeam and the user (this method is used in the access)
     */
  const getMemberByIdTeam = (idTeam, email) => Model.teams_members.findOne({
    where: {
      id_team: { [Op.eq]: idTeam },
      user: { [Op.eq]: email }
    }
  });

  /**
     * @swagger
     * Function: Method to add a team member(inclusive admin)
     */
  const addTeamMember = (idTeam, userEmail, bridgePassword, bridgeMnemonic) => Model.teams_members.findOne({
    where: {
      id_team: { [Op.eq]: idTeam },
      user: { [Op.eq]: userEmail }
    }
  }).then((teamMember) => (teamMember ? null : Model.teams_members.create({
    id_team: idTeam,
    user: userEmail,
    bridgePassword,
    bridgeMnemonic
  })));

  /**
     * @swagger
     * Function: Method to save the emails that are coming from of the invitations
     */
  const saveMembersFromInvitations = (invitedMembers) => new Promise((resolve, reject) => {
    Model.teams_members.findOne({
      where: {
        user: { [Op.eq]: invitedMembers.user },
        id_team: { [Op.eq]: invitedMembers.id_team },
        bridge_password: { [Op.eq]: invitedMembers.bridge_password },
        bridge_mnemonic: { [Op.eq]: invitedMembers.bridge_mnemonic }
      }
    }).then((teamMember) => {
      if (teamMember) {
        reject();
      }
      Model.teams_members.create({
        id_team: invitedMembers.id_team,
        user: invitedMembers.user,
        bridge_password: invitedMembers.bridge_password,
        bridge_mnemonic: invitedMembers.bridge_mnemonic
      }).then((newMember) => {
        resolve(newMember);
      }).catch((err) => {
        reject(err);
      });
    }).catch((err) => {
      reject(err);
    });
  });

  return {
    Name: 'TeamsMembers',
    getMembersByIdTeam,
    addTeamMember,
    saveMembersFromInvitations,
    getMemberByIdTeam,
    getInvitationsByIdTeam,
    getPeople,
    removeMembers,
    getTeamsAdminById
  };
};
