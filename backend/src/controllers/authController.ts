import { Request, Response } from 'express';
import authService from '../services/authService';

const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.code === 'P2002' ? 409 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default {
  register,
  login,
};
