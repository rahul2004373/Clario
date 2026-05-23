import { supabase, prisma } from '../db';
import { SignupData, LoginData, AuthResponse } from '../types/auth';

export class AuthService {
    static async signUp(data: SignupData): Promise<AuthResponse> {
        const { email, password, name } = data;

        const { data: authData, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;
        if (!authData.user) throw new Error('User creation failed');

        // Sync with our local Prisma DB
        const user = await prisma.user.create({
            data: {
                id: authData.user.id,
                email: authData.user.email!,
                name: name || null,
            },
        });

        return {
            user,
            session: authData.session,
        };
    }

    static async login(data: LoginData): Promise<AuthResponse> {
        const { email, password } = data;

        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        if (!authData.user) throw new Error('Login failed');

        const user = await prisma.user.findUnique({
            where: { id: authData.user.id }
        });

        return {
            user: user!,
            session: authData.session,
        };
    }

    static async getMe(userId: string) {
        let user = await prisma.user.findUnique({
            where: { id: userId },
            include: { workspaces: true }
        });

        // 1. Just-in-time sync for OAuth users
        if (!user) {
            const { data: { user: sbUser }, error } = await supabase.auth.admin.getUserById(userId);
            if (error || !sbUser) {
                throw new Error('User not found in Supabase authentication system.');
            }

            user = await prisma.user.create({
                data: {
                    id: sbUser.id,
                    email: sbUser.email!,
                    name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || null,
                },
                include: { workspaces: true }
            });
        }

        // 2. Just-in-time default workspace creation
        if (!user.workspaces || user.workspaces.length === 0) {
            await prisma.workspace.create({
                data: {
                    name: 'My Workspace',
                    ownerId: userId
                }
            });

            // Refetch user with newly created workspace
            user = (await prisma.user.findUnique({
                where: { id: userId },
                include: { workspaces: true }
            }))!;
        }

        return user;
    }
}
