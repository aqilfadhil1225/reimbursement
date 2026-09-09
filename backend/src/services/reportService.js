const reportModel = require('../models/reportModel');
const reimbursementModel = require('../models/reimbursementModel');

const getSummary = (user, filters = {}) => {
	const allowedStatuses = Object.values(reimbursementModel.STATUS);
	const status = filters.status || undefined;
	const from = filters.from || undefined;
	const to = filters.to || undefined;
	if (status && !allowedStatuses.includes(status)) {
		throw new Error(`status harus salah satu dari: ${allowedStatuses.join(', ')}.`);
	}
	for (const [label, value] of [['from', from], ['to', to]]) {
		if (value !== undefined && (Number.isNaN(new Date(value).getTime()))) {
			throw new Error(`${label} harus berupa tanggal yang valid.`);
		}
	}
	return reportModel.getSummary(reportModel.getWhere({
		baseWhere: reimbursementModel.accessFilter(user),
		status,
		from,
		to,
	}));
};

module.exports = { getSummary };