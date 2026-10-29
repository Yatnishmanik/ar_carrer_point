import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
export declare function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
