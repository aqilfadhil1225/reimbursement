type BodyDefinition = {
  description: string;
  schema: Record<string, unknown>;
  contentType?: string;
};

type OperationDefinition = {
  tag: string;
  summary: string;
  description?: string;
  isPublic?: boolean;
  parameters?: Record<string, unknown>[];
  body?: BodyDefinition;
  successCode?: number;
  successDescription?: string;
};

const jsonBody = (description: string, required: string[], properties: Record<string, unknown>): BodyDefinition => ({
  description,
  schema: { type: 'object', required, properties },
});

const pathId = (name: string, description: string): Record<string, unknown> => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
});

const queryParameter = (name: string, description: string, schema: Record<string, unknown>): Record<string, unknown> => ({
  name,
  in: 'query',
  required: false,
  description,
  schema,
});

const operation = ({
  tag,
  summary,
  description,
  isPublic = false,
  parameters,
  body,
  successCode = 200,
  successDescription = 'Operasi berhasil.',
}: OperationDefinition) => {
  const responses: Record<string, unknown> = {
    [successCode]: successCode === 204
      ? { description: successDescription }
      : {
        description: successDescription,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } },
      },
    400: { description: 'Request tidak valid.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
    401: { description: 'Token tidak ada atau tidak valid.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
    403: { description: 'Role tidak memiliki akses ke operasi ini.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
    404: { description: 'Data tidak ditemukan.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
    500: { description: 'Kesalahan internal server.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
  };

  if (successCode === 204) {
    delete responses[400];
  }

  return {
    tags: [tag],
    summary,
    ...(description ? { description } : {}),
    security: isPublic ? [] : [{ BearerAuth: [] }],
    ...(parameters ? { parameters } : {}),
    ...(body ? {
      requestBody: {
        required: true,
        description: body.description,
        content: { [body.contentType ?? 'application/json']: { schema: body.schema } },
      },
    } : {}),
    responses,
  };
};

const idParameter = pathId('id', 'ID data.');
const reimbursementIdParameter = pathId('reimbursementId', 'ID reimbursement.');
const uploadBody = (field: string, description: string): BodyDefinition => ({
  description,
  contentType: 'multipart/form-data',
  schema: {
    type: 'object',
    required: [field],
    properties: { [field]: { type: 'string', format: 'binary' } },
  },
});

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Reimbursement API',
    version: '1.0.0',
    description: 'Dokumentasi API untuk aplikasi reimbursement. Endpoint selain register dan login memerlukan Bearer token.',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Backend lokal' }],
  tags: [
    { name: 'Authentication' },
    { name: 'Reimbursements' },
    { name: 'Expenses' },
    { name: 'Payments' },
    { name: 'Users' },
    { name: 'Notifications' },
    { name: 'Audit logs' },
    { name: 'Reports' },
    { name: 'Profile' },
  ],
  paths: {
    '/api/auth/register': {
      post: operation({
        tag: 'Authentication',
        summary: 'Register employee',
        description: 'Registrasi publik selalu membuat akun dengan role EMPLOYEE.',
        isPublic: true,
        body: jsonBody('Data akun baru.', ['name', 'email', 'password'], {
          name: { type: 'string', example: 'Employee Satu' },
          email: { type: 'string', format: 'email', example: 'employee@example.com' },
          password: { type: 'string', minLength: 6, example: 'password123' },
        }),
        successCode: 201,
        successDescription: 'Akun berhasil dibuat.',
      }),
    },
    '/api/auth/login': {
      post: operation({
        tag: 'Authentication',
        summary: 'Login',
        description: 'Mengembalikan data user dan JWT yang berlaku selama satu hari.',
        isPublic: true,
        body: jsonBody('Kredensial login.', ['email', 'password'], {
          email: { type: 'string', format: 'email', example: 'employee@example.com' },
          password: { type: 'string', example: 'password123' },
        }),
        successDescription: 'Login berhasil. Token dikembalikan pada data.token.',
      }),
    },
    '/api/reimbursements': {
      get: operation({
        tag: 'Reimbursements',
        summary: 'List reimbursements',
        description: 'Daftar reimbursement dibatasi berdasarkan role user yang sedang login.',
      }),
      post: operation({
        tag: 'Reimbursements',
        summary: 'Create reimbursement',
        description: 'Hanya EMPLOYEE. Identitas pengaju diambil dari token. Jumlah expenses, jika dikirim, harus sama dengan amount.',
        body: jsonBody('Data reimbursement baru.', ['category', 'amount'], {
          category: { type: 'string', example: 'Transportasi' },
          amount: { type: 'number', minimum: 0, example: 150000 },
          description: { type: 'string', example: 'Perjalanan dinas ke kantor cabang' },
          receiptUrl: { type: 'string', format: 'uri', nullable: true },
          expenses: {
            type: 'array',
            items: { $ref: '#/components/schemas/ExpenseInput' },
          },
        }),
        successCode: 201,
        successDescription: 'Reimbursement berhasil dibuat.',
      }),
    },
    '/api/reimbursements/{id}': {
      get: operation({ tag: 'Reimbursements', summary: 'Get reimbursement', parameters: [idParameter] }),
      patch: operation({
        tag: 'Reimbursements',
        summary: 'Update reimbursement',
        description: 'Hanya EMPLOYEE; reimbursement hanya dapat diubah sebelum disetujui manager.',
        parameters: [idParameter],
        body: jsonBody('Field yang dapat diubah.', [], {
          category: { type: 'string' },
          amount: { type: 'number', minimum: 0 },
          description: { type: 'string' },
          receiptUrl: { type: 'string', format: 'uri', nullable: true },
          expenses: { type: 'array', items: { $ref: '#/components/schemas/ExpenseInput' } },
        }),
      }),
      delete: operation({
        tag: 'Reimbursements',
        summary: 'Delete reimbursement',
        description: 'Hanya EMPLOYEE; hanya reimbursement yang belum disetujui yang dapat dihapus.',
        parameters: [idParameter],
        successCode: 204,
        successDescription: 'Reimbursement berhasil dihapus.',
      }),
    },
    '/api/reimbursements/{id}/submit': {
      patch: operation({
        tag: 'Reimbursements',
        summary: 'Submit reimbursement',
        description: 'Hanya EMPLOYEE. Total expense harus sesuai nominal dan setidaknya satu bukti harus tersedia.',
        parameters: [idParameter],
      }),
    },
    '/api/reimbursements/{id}/manager': {
      patch: operation({
        tag: 'Reimbursements',
        summary: 'Manager review',
        description: 'Hanya MANAGER. note wajib diisi untuk action reject atau revise.',
        parameters: [idParameter],
        body: jsonBody('Keputusan manager.', ['action'], {
          action: { type: 'string', enum: ['approve', 'reject', 'revise'] },
          note: { type: 'string' },
        }),
      }),
    },
    '/api/reimbursements/{id}/finance': {
      patch: operation({
        tag: 'Reimbursements',
        summary: 'Finance review',
        description: 'Hanya FINANCE. note wajib diisi untuk action reject atau revise.',
        parameters: [idParameter],
        body: jsonBody('Keputusan finance.', ['action'], {
          action: { type: 'string', enum: ['start', 'verify', 'reject', 'revise'] },
          note: { type: 'string' },
        }),
      }),
    },
    '/api/reimbursements/{id}/receipt': {
      post: operation({
        tag: 'Reimbursements',
        summary: 'Upload reimbursement receipt',
        description: 'Hanya EMPLOYEE. Bukti hanya dapat diunggah ketika status DRAFT atau REVISION_REQUIRED.',
        parameters: [idParameter],
        body: uploadBody('receipt', 'File bukti reimbursement.'),
      }),
    },
    '/api/reimbursements/{reimbursementId}/expenses': {
      get: operation({ tag: 'Expenses', summary: 'List expenses', parameters: [reimbursementIdParameter] }),
      post: operation({
        tag: 'Expenses',
        summary: 'Create expense',
        description: 'Hanya EMPLOYEE pemilik reimbursement dan hanya saat status DRAFT atau REVISION_REQUIRED.',
        parameters: [reimbursementIdParameter],
        body: jsonBody('Detail expense.', ['category', 'amount', 'expenseDate', 'description'], {
          category: { type: 'string', example: 'Transportasi' },
          amount: { type: 'number', exclusiveMinimum: 0, example: 150000 },
          expenseDate: { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          receiptUrl: { type: 'string', format: 'uri', nullable: true },
        }),
        successCode: 201,
      }),
    },
    '/api/reimbursements/{reimbursementId}/expenses/{id}': {
      patch: operation({
        tag: 'Expenses',
        summary: 'Update expense',
        description: 'Hanya EMPLOYEE pemilik reimbursement dan hanya saat status DRAFT atau REVISION_REQUIRED.',
        parameters: [reimbursementIdParameter, idParameter],
        body: jsonBody('Field expense yang akan diperbarui.', [], {
          category: { type: 'string' },
          amount: { type: 'number', exclusiveMinimum: 0 },
          expenseDate: { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          receiptUrl: { type: 'string', format: 'uri', nullable: true },
        }),
      }),
      delete: operation({
        tag: 'Expenses',
        summary: 'Delete expense',
        description: 'Hanya EMPLOYEE pemilik reimbursement dan hanya saat status DRAFT atau REVISION_REQUIRED.',
        parameters: [reimbursementIdParameter, idParameter],
        successCode: 204,
        successDescription: 'Expense berhasil dihapus.',
      }),
    },
    '/api/reimbursements/{reimbursementId}/expenses/{id}/receipt': {
      post: operation({
        tag: 'Expenses',
        summary: 'Upload expense receipt',
        description: 'Hanya EMPLOYEE pemilik reimbursement dan hanya saat status DRAFT atau REVISION_REQUIRED.',
        parameters: [reimbursementIdParameter, idParameter],
        body: uploadBody('receipt', 'File bukti expense.'),
      }),
    },
    '/api/reimbursements/{reimbursementId}/payment': {
      get: operation({ tag: 'Payments', summary: 'Get payment', parameters: [reimbursementIdParameter] }),
      post: operation({
        tag: 'Payments',
        summary: 'Complete payment',
        description: 'Hanya FINANCE. Payment method harus BANK_TRANSFER, CASH, atau OTHER.',
        parameters: [reimbursementIdParameter],
        body: jsonBody('Informasi pembayaran.', ['method'], {
          method: { type: 'string', enum: ['BANK_TRANSFER', 'CASH', 'OTHER'] },
          reference: { type: 'string', nullable: true, example: 'TRX-001' },
          note: { type: 'string' },
        }),
        successCode: 201,
      }),
    },
    '/api/reimbursements/{reimbursementId}/payment/proof': {
      post: operation({
        tag: 'Payments',
        summary: 'Upload payment proof',
        description: 'Hanya FINANCE.',
        parameters: [reimbursementIdParameter],
        body: uploadBody('proof', 'File bukti pembayaran.'),
        successCode: 201,
      }),
    },
    '/api/users': {
      get: operation({
        tag: 'Users',
        summary: 'List users',
        description: 'Hanya FINANCE.',
        parameters: [queryParameter('role', 'Filter role user.', { type: 'string', enum: ['EMPLOYEE', 'MANAGER', 'FINANCE'] })],
      }),
      post: operation({
        tag: 'Users',
        summary: 'Create user',
        description: 'Hanya FINANCE.',
        body: jsonBody('Data user baru.', ['name', 'email', 'password', 'role'], {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['EMPLOYEE', 'MANAGER', 'FINANCE'] },
        }),
        successCode: 201,
      }),
    },
    '/api/users/{id}': {
      get: operation({ tag: 'Users', summary: 'Get user', description: 'Hanya FINANCE.', parameters: [idParameter] }),
      patch: operation({
        tag: 'Users',
        summary: 'Update user',
        description: 'Hanya FINANCE. Kirim field yang ingin diubah saja.',
        parameters: [idParameter],
        body: jsonBody('Field user yang akan diperbarui.', [], {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['EMPLOYEE', 'MANAGER', 'FINANCE'] },
        }),
      }),
      delete: operation({
        tag: 'Users',
        summary: 'Delete user',
        description: 'Hanya FINANCE.',
        parameters: [idParameter],
        successCode: 204,
        successDescription: 'User berhasil dihapus.',
      }),
    },
    '/api/notifications': {
      get: operation({ tag: 'Notifications', summary: 'List current user notifications' }),
    },
    '/api/notifications/{id}/read': {
      patch: operation({ tag: 'Notifications', summary: 'Mark notification as read', parameters: [idParameter] }),
    },
    '/api/audit-logs': {
      get: operation({
        tag: 'Audit logs',
        summary: 'List audit logs',
        description: 'Hanya MANAGER dan FINANCE.',
        parameters: [
          queryParameter('reimbursementId', 'Filter berdasarkan reimbursement.', { type: 'integer', minimum: 1 }),
          queryParameter('actorId', 'Filter berdasarkan user yang melakukan aksi.', { type: 'integer', minimum: 1 }),
        ],
      }),
    },
    '/api/reports/summary': {
      get: operation({
        tag: 'Reports',
        summary: 'Get reimbursement summary',
        parameters: [
          queryParameter('status', 'Filter status reimbursement.', { type: 'string' }),
          queryParameter('from', 'Tanggal awal filter.', { type: 'string', format: 'date' }),
          queryParameter('to', 'Tanggal akhir filter.', { type: 'string', format: 'date' }),
        ],
      }),
    },
    '/api/profile': {
      get: operation({ tag: 'Profile', summary: 'Get current user profile' }),
      patch: operation({
        tag: 'Profile',
        summary: 'Update current user profile',
        description: 'Untuk mengganti password, kirim currentPassword dan password baru.',
        body: jsonBody('Field profil yang akan diperbarui.', [], {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          currentPassword: { type: 'string' },
          password: { type: 'string', minLength: 6 },
        }),
      }),
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Gunakan token dari endpoint login tanpa awalan "Bearer ".',
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
        },
      },
      ErrorEnvelope: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Request tidak valid.' },
        },
      },
      ExpenseInput: {
        type: 'object',
        required: ['category', 'amount', 'expenseDate', 'description'],
        properties: {
          category: { type: 'string', example: 'Transportasi' },
          amount: { type: 'number', exclusiveMinimum: 0, example: 150000 },
          expenseDate: { type: 'string', format: 'date-time', example: '2026-09-30T09:00:00.000Z' },
          description: { type: 'string', example: 'Taksi ke lokasi meeting' },
          receiptUrl: { type: 'string', format: 'uri', nullable: true },
        },
      },
    },
  },
};

export default openApiDocument;