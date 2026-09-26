import prisma from '../config/prisma';

const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'OTHER'];
const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'];

const findByReimbursementId = (reimbursementId: unknown) => prisma.payment.findUnique({
  where: { reimbursementId: Number(reimbursementId) },
});

const complete = async (
  reimbursementId: unknown,
  { method, reference, proofUrl, paidAt }: { method: string; reference?: string | null; proofUrl?: string | null; paidAt: Date },
  actorId: number | null,
  note: string,
) => prisma.$transaction(async (transaction) => {
  const reimbursement = await transaction.reimbursement.findUnique({
    where: { id: Number(reimbursementId) },
    select: {
      id: true,
      amount: true,
      status: true,
      employeeId: true,
      managerId: true,
      financeId: true,
    },
  });

  if (!reimbursement) return null;
  if (reimbursement.status !== 'READY_FOR_PAYMENT') {
    return { error: 'Pembayaran hanya bisa diproses saat status READY_FOR_PAYMENT.' };
  }

  const payment = await transaction.payment.upsert({
    where: { reimbursementId: reimbursement.id },
    create: {
      reimbursementId: reimbursement.id,
      amount: reimbursement.amount,
      method: method as any,
      status: 'COMPLETED' as any,
      reference: reference || null,
      proofUrl: proofUrl || null,
      paidAt,
    },
    update: {
      method: method as any,
      status: 'COMPLETED' as any,
      reference: reference || null,
      proofUrl: proofUrl || null,
      paidAt,
    },
  });

  await transaction.reimbursement.update({
    where: { id: reimbursement.id },
    data: { status: 'PAID' },
  });

  await transaction.reimbursementHistory.create({
    data: {
      reimbursementId: reimbursement.id,
      status: 'PAID',
      note,
      actorId,
    },
  });

  await transaction.auditLog.create({
    data: {
      reimbursementId: reimbursement.id,
      actorId,
      action: 'PAYMENT_COMPLETED',
      details: note,
    },
  });

  const recipientIds = [reimbursement.employeeId, reimbursement.managerId, reimbursement.financeId]
    .filter((userId, index, ids) => userId && ids.indexOf(userId) === index);

  if (recipientIds.length) {
    await transaction.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        reimbursementId: reimbursement.id,
        title: 'Pembayaran reimbursement selesai',
        message: note,
      })),
    });
  }

  return payment;
});

const uploadProof = async (
  reimbursementId: unknown,
  { method, proofUrl }: { method: string; proofUrl?: string | null },
  actorId: number | null,
  note: string,
) => prisma.$transaction(async (transaction) => {
  const reimbursement = await transaction.reimbursement.findUnique({
    where: { id: Number(reimbursementId) },
    select: {
      id: true,
      amount: true,
      status: true,
      employeeId: true,
      managerId: true,
      financeId: true,
    },
  });

  if (!reimbursement) return null;
  if (!['READY_FOR_PAYMENT', 'PAID'].includes(reimbursement.status)) {
    return { error: 'Bukti transfer hanya bisa diunggah saat status READY_FOR_PAYMENT atau PAID.' };
  }

  const existingPayment = await transaction.payment.findUnique({
    where: { reimbursementId: reimbursement.id },
  });

  const payment = await transaction.payment.upsert({
    where: { reimbursementId: reimbursement.id },
    create: {
      reimbursementId: reimbursement.id,
      amount: reimbursement.amount,
      method: method as any,
      status: 'COMPLETED' as any,
      reference: existingPayment?.reference ?? null,
      proofUrl: proofUrl || null,
      paidAt: existingPayment?.paidAt ?? new Date(),
    },
    update: {
      method: method as any,
      status: existingPayment?.status ?? 'COMPLETED' as any,
      reference: existingPayment?.reference ?? null,
      proofUrl: proofUrl || null,
      paidAt: existingPayment?.paidAt ?? new Date(),
    },
  });

  await transaction.reimbursementHistory.create({
    data: {
      reimbursementId: reimbursement.id,
      status: reimbursement.status,
      note,
      actorId,
    },
  });

  await transaction.auditLog.create({
    data: {
      reimbursementId: reimbursement.id,
      actorId,
      action: 'PAYMENT_PROOF_UPLOADED',
      details: note,
    },
  });

  return payment;
});

export default {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  findByReimbursementId,
  complete,
  uploadProof,
};
