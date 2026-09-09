const reportService = require('../services/reportService');

const getSummary = async (req, res, next) => {
  try {
    const summary = await reportService.getSummary(req.user, {
      status: req.query.status?.trim().toUpperCase(),
      from: req.query.from,
      to: req.query.to,
    });
    return res.json({ success: true, data: summary });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getSummary };