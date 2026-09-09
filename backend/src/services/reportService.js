const reportModel = require('../models/reportModel');
const reimbursementModel = require('../models/reimbursementModel');

const getSummary = (user) => reportModel.getSummary(reimbursementModel.accessFilter(user));

module.exports = { getSummary };