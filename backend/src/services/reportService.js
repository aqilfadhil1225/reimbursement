const reportModel = require('../models/reportModel');
const reimbursementModel = require('../models/reimbursementModel');

const getSummary = (user, filters = {}) => {
	const allowedStatuses = Object.values(reimbursementModel.STATUS);
	if (filters.status && !allowedStatuses.includes(filters.status)) {
		throw new Error(`status harus salah satu dari: ${allowedStatuses.join(', ')}.`);
	}
	for (const [label, value] of [['from', filters.from], ['to', filters.to]]) {
		if (value !== undefined && (Number.isNaN(new Date(value).getTime()))) {
			throw new Error(`${label} harus berupa tanggal yang valid.`);
		}
	}
	return reportModel.getSummary(reportModel.getWhere({
		baseWhere: reimbursementModel.accessFilter(user),
		status: filters.status,
		from: filters.from,
		to: filters.to,
	}));
};

module.exports = { getSummary };