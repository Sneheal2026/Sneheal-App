const success = (res, message, data = null, statusCode = 200) => {
  const body = { success: true, message };
  if (data !== null) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
};

const fail = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { success, fail };
