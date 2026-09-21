import prisma from '../config/prisma';

const STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  MANAGER_APPROVED: 'MANAGER_APPROVED',
  FINANCE_REVIEW: 'FINANCE_REVIEW',
  READY_FOR_PAYMENT: 'READY_FOR_PAYMENT',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
} as const;

const VALID_STATUSES = Object.values(STATUS);

const validateReceiptUrl = (receiptUrl: unknown) => {
  if (!receiptUrl) return null;
  try {
    const url = new URL(String(receiptUrl));
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error('receiptUrl harus berupa URL http atau https yang valid.');
  }
  return String(receiptUrl).trim();
};

const includeRelations: any = {
  employee: true,
  manager: true,
  finance: true,
  expenses: { orderBy: { expenseDate: 'asc' as const } },
  history: { orderBy: { createdAt: 'asc' as const }, include: { actor: true } },
  payment: true,
  notifications: { orderBy: { createdAt: 'desc' as const } },
  auditLogs: { orderBy: { createdAt: 'desc' as const }, include: { actor: true } },
};

const normalizeStatus = (status: unknown) => {
  const safeStatus = typeof status === 'string' ? status.trim().toUpperCase() : status;

  if (!VALID_STATUSES.includes(safeStatus as (typeof VALID_STATUSES)[number])) {
    throw new Error(`status harus salah satu dari: ${VALID_STATUSES.join(', ')}.`);
  }

  return safeStatus as (typeof VALID_STATUSES)[number];
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
}: any) => {
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
  if (expenses.length) {
    const expenseTotal = expenses.reduce((sum: number, expense: any) => sum + Number(expense.amount), 0);
    if (!expenses.every((expense: any) => Number.isFinite(Number(expense.amount)) && Number(expense.amount) > 0)) {
      throw new Error('Setiap expense harus memiliki nominal lebih besar dari nol.');
    }
    if (Math.abs(expenseTotal - Number(amount)) > 0.01) {
      throw new Error('Total expense harus sama dengan total reimbursement.');
    }
  }
  validateReceiptUrl(receiptUrl);

  const expenseCreates = expenses.map((expense: any) => {
    if (!expense.category || expense.amount === undefined || !expense.expenseDate || !expense.description) {
      throw new Error('Setiap expense wajib memiliki category, amount, expenseDate, dan description.');
    }

    const expenseAmount = Number(expense.amount);
    const expenseDate = new Date(expense.expenseDate);
    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0 || Number.isNaN(expenseDate.getTime())) {
      throw new Error('Data expense tidak valid.');
    }
    if (expenseDate > new Date()) throw new Error('expenseDate tidak boleh di masa depan.');

    return {
      category: expense.category,
      amount: expenseAmount,
      expenseDate,
      description: expense.description,
      receiptUrl: validateReceiptUrl(expense.receiptUrl) || null,
    };
  });

  const data: any = {
    employeeName,
    employeeEmail,
    amount: Number(amount),
    category,
    description: description || '',
    receiptUrl: validateReceiptUrl(receiptUrl) || '',
    status: normalizedStatus,
    employeeId: employeeId ? Number(employeeId) : undefined,
    managerId: managerId ? Number(managerId) : undefined,
    financeId: financeId ? Number(financeId) : undefined,
    history: {
      create: {
        status: normalizedStatus,
        note: 'Reimbursement record created.',
      },
    },
  };

  if (expenseCreates.length) {
    data.expenses = { create: expenseCreates };
  }

  return prisma.reimbursement.create({
    data,
    include: includeRelations,
  });
};

const accessFilter = ({ id, role }: any) => {
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

const findAll = (user: any) => prisma.reimbursement.findMany({
  where: accessFilter(user),
  include: includeRelations,
  orderBy: { createdAt: 'desc' },
});

const findById = (id: unknown, user: any) => prisma.reimbursement.findFirst({
  where: { id: Number(id), ...accessFilter(user) },
  include: includeRelations,
});

const updateById = async (id: unknown, updates: any) => {
  const { expenses, ...reimbursementUpdates } = updates;

  if (expenses === undefined) {
    return prisma.reimbursement.update({
      where: { id: Number(id) },
      data: reimbursementUpdates,
      include: includeRelations,
    });
  }

  const expenseData = expenses.map((expense: any) => {
    if (!expense.category || expense.amount === undefined || !expense.expenseDate || !expense.description) {
      throw new Error('Setiap expense wajib memiliki category, amount, expenseDate, dan description.');
    }

    const expenseAmount = Number(expense.amount);
    const expenseDate = new Date(expense.expenseDate);
    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0 || Number.isNaN(expenseDate.getTime())) {
      throw new Error('Data expense tidak valid.');
    }
    if (expenseDate > new Date()) throw new Error('expenseDate tidak boleh di masa depan.');

    return {
      category: expense.category,
      amount: expenseAmount,
      expenseDate,
      description: expense.description,
      receiptUrl: validateReceiptUrl(expense.receiptUrl) || null,
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

const deleteById = (id: unknown) => prisma.reimbursement.delete({
  where: { id: Number(id) },
});

const addHistoryEntry = (id: unknown, status: string, note: string) => prisma.reimbursementHistory.create({
  data: {
    reimbursementId: Number(id),
    status: normalizeStatus(status),
    note,
  },
});

const updateStatus = async (id: unknown, status: string, note: string, actorId: unknown, extraData: any = {}) => prisma.$transaction(async (transaction) => {
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
      status: normalizedStatus as any,
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
  const recipientIds = [reimbursement?.employeeId, reimbursement?.managerId, reimbursement?.financeId]
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

export default {
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
