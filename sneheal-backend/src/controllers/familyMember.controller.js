const familyMemberService = require('../services/familyMember.service');
const { success } = require('../utils/response');

const listFamilyMembers = async (req, res) => {
  const members = await familyMemberService.listFamilyMembers(req.user.sub);
  return success(res, 'Family members fetched successfully', members);
};

const createFamilyMember = async (req, res) => {
  const member = await familyMemberService.createFamilyMember(req.user.sub, req.body);
  return success(res, 'Family member created successfully', member, 201);
};

const updateFamilyMember = async (req, res) => {
  const member = await familyMemberService.updateFamilyMember(
    req.user.sub,
    req.params.id,
    req.body,
  );
  return success(res, 'Family member updated successfully', member);
};

module.exports = {
  listFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
};
