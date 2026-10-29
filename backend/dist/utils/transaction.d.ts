import { Prisma } from '@prisma/client';
export declare function serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
