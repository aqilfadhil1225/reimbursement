import paymentModel from '../models/paymentModel';
import reimbursementModel from '../models/reimbursementModel';

const validateId = (id: unknown, label: string) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsedId;
};

const validatePayment = ({ method, reference }: any) => {
  const normalizedMethod = typeof method === 'string' ? method.trim().toUpperCase() : method;

  if (!paymentModel.PAYMENT_METHODS.includes(normalizedMethod)) {
    throw new Error('method harus BANK_TRANSFER, CASH, atau OTHER.');
  }

  if (reference !== undefined && reference !== null && typeof reference !== 'string') {
    throw new Error('reference harus berupa teks.');
  }

  return {
    method: normalizedMethod,
    reference: reference ? reference.trim() : null,
  };
};

const getPayment = async (reimbursementId: unknown, user: any) => {
  const parsedReimbursementId = validateId(reimbursementId, 'id reimbursement');
  const reimbursement = await reimbursementModel.findById(parsedReimbursementId, user);
  if (!reimbursement) return null;
  return paymentModel.findByReimbursementId(parsedReimbursementId);
};

const completePayment = async (reimbursementId: unknown, payload: any, user: any) => {
  const parsedReimbursementId = validateId(reimbursementId, 'id reimbursement');
  const reimbursement = await reimbursementModel.findById(parsedReimbursementId, user);
  if (!reimbursement) return null;
  const actorId = payload.actorId === undefined || payload.actorId === null
    ? null
    : validateId(payload.actorId, 'actorId');
  const note = payload.note && payload.note.trim()
    ? payload.note.trim()
    : 'Pembayaran reimbursement sudah diproses.';

  return paymentModel.complete(
    parsedReimbursementId,
    {
      ...validatePayment(payload),
      paidAt: new Date(),
    },
    actorId,
    note,
  );
};

export default {
  getPayment,
  completePayment,
};
