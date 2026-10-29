export declare function promoteAdmin(email: string): Promise<{
    email: string;
    role: import(".prisma/client").$Enums.Role;
    id: string;
}>;
