const addressService = require('../services/address.service');
const { success } = require('../utils/response');

const listAddresses = async (req, res) => {
  const addresses = await addressService.listAddresses(req.user.sub);
  return success(res, 'Addresses fetched successfully', addresses);
};

const createAddress = async (req, res) => {
  const address = await addressService.createAddress(req.user.sub, req.body);
  return success(res, 'Address created successfully', address, 201);
};

const updateAddress = async (req, res) => {
  const address = await addressService.updateAddress(
    req.user.sub,
    req.params.id,
    req.body,
  );
  return success(res, 'Address updated successfully', address);
};

const deleteAddress = async (req, res) => {
  const result = await addressService.deleteAddress(req.user.sub, req.params.id);
  return success(res, 'Address deleted successfully', result);
};

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
