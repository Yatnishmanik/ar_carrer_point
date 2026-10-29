import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Retry serialization conflicts so publication and role changes remain atomic under concurrent requests.
export async function serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
    catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') throw error;
      if (attempt === 2) throw Object.assign(new Error('The data changed. Please retry.'), { status: 409 });
    }
  }
  throw new Error('Transaction did not complete');
}
