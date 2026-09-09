const reportService = require('../services/reportService');

const getSummary = async (req, res, next) => {
  try {
    const summary = await reportService.getSummary(req.user);
    return res.json({ success: true, data: summary });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getSummary };