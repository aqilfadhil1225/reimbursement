import { RequestHandler } from 'express';
import userService from '../services/userService';
import apiView from '../views/apiView';

const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { query: Record<string, any> };
    const users = await userService.getUsers(authReq.query.role);
    return res.json({ success: true, data: users.map(apiView.formatUser) });
  } catch (error) {
    return next(error);
  }
};

const getUser: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { params: Record<string, any> };
    const user = await userService.getUserById(authReq.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    return res.json({ success: true, data: apiView.formatUser(user) });
  } catch (error) {
    return next(error);
  }
};

const createUser: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { body: Record<string, any> };
    const user = await userService.createUser(authReq.body);
    return res.status(201).json({ success: true, data: apiView.formatUser(user) });
  } catch (error) {
    return next(error);
  }
};

const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { params: Record<string, any>; body: Record<string, any> };
    const user = await userService.updateUser(authReq.params.id, authReq.body);
    return res.json({ success: true, data: apiView.formatUser(user) });
  } catch (error) {
    return next(error);
  }
};

const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { params: Record<string, any> };
    await userService.deleteUser(authReq.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export default {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
