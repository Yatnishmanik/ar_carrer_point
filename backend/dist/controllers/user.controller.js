"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.updateRole = updateRole;
const prisma_1 = require("../lib/prisma");
const transaction_1 = require("../utils/transaction");
const publicFields = { id: true, name: true, email: true, role: true, createdAt: true };
async function listUsers(req, res, next) {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
        const users = await prisma_1.prisma.user.findMany({
            where: search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] } : {},
            select: publicFields, orderBy: { createdAt: 'desc' }, take: 50,
        });
        res.json({ success: true, data: users });
    }
    catch (error) {
        next(error);
    }
}
async function updateRole(req, res, next) {
    try {
        const role = req.body?.role;
        const id = String(req.params.id);
        if (role !== 'ADMIN' && role !== 'STUDENT')
            return res.status(400).json({ success: false, message: 'Role must be ADMIN or STUDENT.' });
        if (id === req.user.userId)
            return res.status(409).json({ success: false, message: 'You cannot change your own role.' });
        const user = await (0, transaction_1.serializable)(async (tx) => {
            const actor = await tx.user.findUnique({ where: { id: req.user.userId } });
            if (actor?.role !== 'ADMIN')
                throw Object.assign(new Error('Admin access required.'), { status: 403 });
            const target = await tx.user.findUnique({ where: { id } });
            if (!target)
                throw Object.assign(new Error('User not found.'), { status: 404 });
            if (target.role === 'ADMIN' && role === 'STUDENT' && await tx.user.count({ where: { role: 'ADMIN' } }) <= 1) {
                throw Object.assign(new Error('At least one administrator must remain.'), { status: 409 });
            }
            return tx.user.update({ where: { id }, data: { role }, select: publicFields });
        });
        return res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
}
