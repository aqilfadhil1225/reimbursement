const prisma = require('../config/prisma');

const STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  MANAGER_APPROVED: 'MANAGER_APPROVED',
  FINANCE_REVIEW: 'FINANCE_REVIEW',
  READY_FOR_PAYMENT: 'READY_FOR_PAYMENT',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
};

const VALID_STATUSES = Object.values(STATUS);

const includeRelations = {
  employee: true,
  manager: true,
  finance: true,
  expenses: { orderBy: { expenseDate: 'asc' } },
  history: { orderBy: { createdAt: 'asc' }, include: { actor: true } },
  payment: true,
  notifications: { orderBy: { createdAt: 'desc' } },
  auditLogs: { orderBy: { createdAt: 'desc' }, include: { actor: true } },
};

const normalizeStatus = (status) => {
  const safeStatus = typeof status === 'string' ? status.trim().toUpperCase() : status;

  if (!VALID_STATUSES.includes(safeStatus)) {
    throw new Error(`status harus salah satu dari: ${VALID_STATUSES.join(', ')}.`);
  }

  return safeStatus;
};

const createReimbursement = async ({
  employeeName,
  employeeEmail,
  amount,
  category,
  description,
  receiptUrl,
  employeeId,
  managerId,
  financeId,
  expenses = [],
  status = STATUS.DRAFT,
}) => {
  const normalizedStatus = normalizeStatus(status);

  if (!employeeName || !employeeEmail || !category || amount === undefined || amount === null) {
    throw new Error('employeeName, employeeEmail, amount, and category are required.');
  }
  if (!Number.isFinite(Number(amount)) || Number(amount) < 0) {
    throw new Error('amount must be a non-negative number.');
  }
  if (!Array.isArray(expenses)) {
    throw new Error('expenses harus berupa array.');
  }

  return prisma.reimbursement.create({
    data: {
      employeeName,
      employeeEmail,
      amount: Number(amount),
      category,
      description: description || '',
      receiptUrl: receiptUrl || '',
      status: normalizedStatus,
      employeeId: employeeId ? Number(employeeId) : undefined,
      managerId: managerId ? Number(managerId) : undefined,
      financeId: financeId ? Number(financeId) : undefined,
      expenses: { create: expenses.map((expense) => {
        if (!expense.category || expense.amount === undefined || !expense.expenseDate || !expense.description) {
          throw new Error('Setiap expense wajib memiliki category, amount, expenseDate, dan description.');
        }

        const expenseAmount = Number(expense.amount);
        const expenseDate = new Date(expense.expenseDate);
        if (!Number.isFinite(expenseAmount) || expenseAmount < 0 || Number.isNaN(expenseDate.getTime())) {
          throw new Error('Data expense tidak valid.');
        }

        return {
          category: expense.category,
          amount: expenseAmount,
          expenseDate,
          description: expense.description,
          receiptUrl: expense.receiptUrl || null,
        };
      }) },
      history: {
        create: {
          status: normalizedStatus,
          note: 'Reimbursement record created.',
        },
      },
    },
    include: includeRelations,
  });
};

const accessFilter = ({ id, role }) => {
  if (role === 'EMPLOYEE') return { employeeId: Number(id) };
  if (role === 'MANAGER') {
    return { OR: [{ managerId: Number(id) }, { status: STATUS.SUBMITTED }] };
  }
  if (role === 'FINANCE') {
    return {
      OR: [
        { financeId: Number(id) },
        { status: { in: [STATUS.MANAGER_APPROVED, STATUS.FINANCE_REVIEW, STATUS.READY_FOR_PAYMENT] } },
      ],
    };
  }
  return { id: -1 };
};

const findAll = (user) => prisma.reimbursement.findMany({
  where: accessFilter(user),
  include: includeRelations,
  orderBy: { createdAt: 'desc' },
});

const findById = (id, user) => prisma.reimbursement.findFirst({
  where: { id: Number(id), ...accessFilter(user) },
  include: includeRelations,
});

const updateById = async (id, updates) => {
  const { expenses, ...reimbursementUpdates } = updates;

  if (expenses === undefined) {
    return prisma.reimbursement.update({
      where: { id: Number(id) },
      data: reimbursementUpdates,
      include: includeRelations,
    });
  }

  const expenseData = expenses.map((expense) => {
    if (!expense.category || expense.amount === undefined || !expense.expenseDate || !expense.description) {
      throw new Error('Setiap expense wajib memiliki category, amount, expenseDate, dan description.');
    }

    const expenseAmount = Number(expense.amount);
    const expenseDate = new Date(expense.expenseDate);
    if (!Number.isFinite(expenseAmount) || expenseAmount < 0 || Number.isNaN(expenseDate.getTime())) {
      throw new Error('Data expense tidak valid.');
    }

    return {
      category: expense.category,
      amount: expenseAmount,
      expenseDate,
      description: expense.description,
      receiptUrl: expense.receiptUrl || null,
    };
  });

  return prisma.$transaction(async (transaction) => {
    await transaction.reimbursement.update({
      where: { id: Number(id) },
      data: reimbursementUpdates,
    });
    await transaction.expense.deleteMany({
      where: { reimbursementId: Number(id) },
    });
    if (expenseData.length) {
      await transaction.expense.createMany({
        data: expenseData.map((expense) => ({
          ...expense,
          reimbursementId: Number(id),
        })),
      });
    }

    return transaction.reimbursement.findUnique({
      where: { id: Number(id) },
      include: includeRelations,
    });
  });
};

const deleteById = (id) => prisma.reimbursement.delete({
  where: { id: Number(id) },
});

const addHistoryEntry = (id, status, note) => prisma.reimbursementHistory.create({
  data: {
    reimbursementId: Number(id),
    status: normalizeStatus(status),
    note,
  },
});

const updateStatus = async (id, status, note, actorId, extraData = {}) => prisma.$transaction(async (transaction) => {
  const normalizedStatus = normalizeStatus(status);
  const parsedActorId = actorId === undefined || actorId === null ? undefined : Number(actorId);

  if (parsedActorId !== undefined && (!Number.isInteger(parsedActorId) || parsedActorId < 1)) {
    throw new Error('actorId tidak valid.');
  }

  await transaction.reimbursement.update({
    where: { id: Number(id) },
    data: { status: normalizedStatus, ...extraData },
  });

  await transaction.reimbursementHistory.create({
    data: {
      reimbursementId: Number(id),
      status: normalizedStatus,
      note,
      actorId: parsedActorId,
    },
  });

  await transaction.auditLog.create({
    data: {
      reimbursementId: Number(id),
      actorId: parsedActorId,
      action: 'STATUS_CHANGED',
      details: note,
    },
  });

  const reimbursement = await transaction.reimbursement.findUnique({
    where: { id: Number(id) },
    select: { employeeId: true, managerId: true, financeId: true },
  });
  const recipientIds = [reimbursement.employeeId, reimbursement.managerId, reimbursement.financeId]
    .filter((recipientId, index, ids) => recipientId && ids.indexOf(recipientId) === index);
  if (recipientIds.length) {
    await transaction.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        reimbursementId: Number(id),
        title: 'Reimbursement status updated',
        message: note,
      })),
    });
  }

  return transaction.reimbursement.findUnique({
    where: { id: Number(id) },
    include: includeRelations,
  });
});

module.exports = {
  STATUS,
  VALID_STATUSES,
  normalizeStatus,
  createReimbursement,
  findAll,
  findById,
  accessFilter,
  updateById,
  deleteById,
  addHistoryEntry,
  updateStatus,
};