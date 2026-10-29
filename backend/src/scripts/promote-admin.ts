import { prisma } from '../lib/prisma';

export async function promoteAdmin(email: string) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Provide an existing registered email address.');
  return prisma.user.update({ where: { email: normalized }, data: { role: 'ADMIN' }, select: { id: true, email: true, role: true } });
}

if (require.main === module) {
  promoteAdmin(process.argv[2]).then(user => console.log(`Admin access enabled for ${user.email}. Sign in with the existing password.`))
    .catch(error => { console.error(error.code === 'P2025' ? 'Account not found. Register this email first.' : error.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
