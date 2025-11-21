import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
};