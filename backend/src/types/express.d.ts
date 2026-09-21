declare global {
  namespace Express {
    interface Request {
      user?: any;
      file?: any;
    }
  }
}

export {};
