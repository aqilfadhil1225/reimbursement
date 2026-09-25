import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const reimbursementClaim = pgTable('reimbursement_claim', {
  id: text('id').primaryKey(),
  employeeId: text('employeeId').notNull(),
  managerId: text('managerId'),
  financeId: text('financeId'),
  description: text('description').notNull(),
  category: text('category').notNull(),
  amount: integer('amount').notNull(),
  receiptUrl: text('receiptUrl'),
  status: text('status').notNull().default('pending_manager'),
  submittedAt: timestamp('submittedAt').notNull().defaultNow(),
  managerReviewedAt: timestamp('managerReviewedAt'),
  financeProcessedAt: timestamp('financeProcessedAt'),
  rejectionReason: text('rejectionReason'),
})

export const reimbursementAudit = pgTable('reimbursement_audit', {
  id: text('id').primaryKey(),
  claimId: text('claimId').notNull(),
  actorId: text('actorId').notNull(),
  action: text('action').notNull(),
  note: text('note'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type ClaimStatus = 'pending_manager' | 'pending_finance' | 'approved' | 'rejected' | 'paid'
export type UserRole = 'employee' | 'manager' | 'finance'
