import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
export declare function getTestScoreboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
