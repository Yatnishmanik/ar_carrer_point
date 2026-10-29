"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializable = serializable;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
// Retry serialization conflicts so publication and role changes remain atomic under concurrent requests.
async function serializable(work) {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            return await prisma_1.prisma.$transaction(work, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (!(error instanceof client_1.Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034')
                throw error;
            if (attempt === 2)
                throw Object.assign(new Error('The data changed. Please retry.'), { status: 409 });
        }
    }
    throw new Error('Transaction did not complete');
}
