const paymentService = require('../services/paymentService');

const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPayment(req.params.reimbursementId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment belum ditemukan.' });
    }

    return res.json({ success: true, data: payment });
  } catch (error) {
    return next(error);
  }
};

const completePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.completePayment(req.params.reimbursementId, req.body);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }

    if (payment.error) {
      return res.status(400).json({ success: false, message: payment.error });
    }

    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPayment,
  completePayment,
};
