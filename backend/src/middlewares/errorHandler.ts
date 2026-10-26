import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error & { code?: string; status?: number },
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  console.error('[Error Middleware]:', err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'इस विवरण (ईमेल या आईडी) का रिकॉर्ड पहले से मौजूद है।',
      error: err.message,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'अनुरोधित रिकॉर्ड नहीं मिला।',
      error: err.message,
    });
  }

  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'आंतरिक सर्वर त्रुटि (Internal Server Error)',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
