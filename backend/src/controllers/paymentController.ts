import { RequestHandler } from 'express';
import { randomBytes } from 'crypto';
import paymentService from '../services/paymentService';
import apiView from '../views/apiView';
import objectStorageService from '../services/objectStorageService';

const getPayment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const payment = await paymentService.getPayment(authReq.params.reimbursementId, authReq.user);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment belum ditemukan.' });
    }

    return res.json({ success: true, data: await apiView.formatPayment(payment) });
  } catch (error) {
    return next(error);
  }
};

const completePayment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
    const payment: any = await paymentService.completePayment(authReq.params.reimbursementId, {
      ...authReq.body,
      actorId: authReq.user.id,
    }, authReq.user);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }

    if (payment.error) {
      return res.status(400).json({ success: false, message: payment.error });
    }

    return res.status(201).json({ success: true, data: await apiView.formatPayment(payment) });
  } catch (error) {
    return next(error);
  }
};

const uploadProof: RequestHandler = async (req, res, next) => {
  let uploadedObjectKey: string | undefined;
  let proofUpdateCommitted = false;
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; file?: Express.Multer.File };
    if (!authReq.file) {
      return res.status(400).json({ success: false, message: 'File bukti transfer wajib dikirim.' });
    }

    if (!objectStorageService.isValidEvidenceFile(authReq.file)) {
      return res.status(400).json({ success: false, message: 'Isi file tidak sesuai dengan format bukti transfer yang dipilih.' });
    }

    const extensionsByMimeType: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'application/pdf': '.pdf',
    };
    const reimbursementId = Number(authReq.params.reimbursementId);
    uploadedObjectKey = `payment-proofs/${reimbursementId}/${randomBytes(16).toString('hex')}${extensionsByMimeType[authReq.file.mimetype]}`;
    await objectStorageService.uploadObject(uploadedObjectKey, authReq.file.buffer, authReq.file.mimetype);
    const result: any = await paymentService.uploadProof(authReq.params.reimbursementId, uploadedObjectKey, authReq.user);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    proofUpdateCommitted = true;
    if (typeof result.previousProofUrl === 'string' && objectStorageService.isPaymentProofObjectKey(result.previousProofUrl)) {
      try {
        await objectStorageService.deleteObject(result.previousProofUrl);
      } catch (error) {
        console.error('Failed to remove the replaced payment proof from MinIO:', error);
      }
    }
    return res.status(201).json({ success: true, data: await apiView.formatPayment(result.payment) });
  } catch (error) {
    return next(error);
  } finally {
    if (uploadedObjectKey && !proofUpdateCommitted) {
      try {
        await objectStorageService.deleteObject(uploadedObjectKey);
      } catch (cleanupError) {
        console.error('Failed to remove an uncommitted payment proof from MinIO:', cleanupError);
      }
    }
  }
};

export default {
  getPayment,
  completePayment,
  uploadProof,
};
