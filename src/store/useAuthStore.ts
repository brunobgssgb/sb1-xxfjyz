import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bcrypt from 'bcryptjs';
import { AuthState, LoginCredentials, RegisterData, User, PasswordRecovery } from '../types/auth';
import { sendWhatsAppMessage } from '../services/whatsapp';

interface AuthStore extends AuthState {
  users: User[];
  passwordRecoveries: PasswordRecovery[];
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData & { role?: 'admin' | 'user' }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  blockUser: (userId: string) => void;
  updateUser: (userId: string, data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => void;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (adminId: string, userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordRecovery: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      users: [
        {
          id: '1',
          name: 'Admin',
          email: 'admin@admin.com',
          password: bcrypt.hashSync('admin123', 10),
          role: 'admin',
          status: 'active',
          createdAt: new Date(),
          phone: '5511999999999'
        },
      ],
      passwordRecoveries: [],

      login: async (credentials) => {
        const user = get().users.find(u => u.email === credentials.email);

        if (!user) {
          return { success: false, error: 'Usuário não encontrado' };
        }

        if (!bcrypt.compareSync(credentials.password, user.password)) {
          return { success: false, error: 'Senha incorreta' };
        }

        if (user.status !== 'active') {
          return { success: false, error: 'Usuário não está ativo' };
        }

        set({ user, isAuthenticated: true, token: 'dummy-token' });
        return { success: true };
      },

      register: async (data) => {
        const existingUser = get().users.find(u => u.email === data.email);

        if (existingUser) {
          return { success: false, error: 'Email já cadastrado' };
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          name: data.name,
          email: data.email,
          password: bcrypt.hashSync(data.password, 10),
          role: data.role || 'user',
          status: 'pending',
          createdAt: new Date(),
          phone: ''
        };

        set(state => ({
          users: [...state.users, newUser]
        }));

        return { success: true };
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      approveUser: (userId) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, status: 'active' } : user
          )
        }));
      },

      rejectUser: (userId) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, status: 'inactive' } : user
          )
        }));
      },

      blockUser: (userId) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, status: 'inactive' } : user
          )
        }));
      },

      updateUser: async (userId, data) => {
        const { users } = get();
        const existingUser = users.find(u => u.id === userId);

        if (!existingUser) {
          return { success: false, error: 'Usuário não encontrado' };
        }

        if (data.email && data.email !== existingUser.email) {
          const emailExists = users.some(u => u.email === data.email && u.id !== userId);
          if (emailExists) {
            return { success: false, error: 'Email já está em uso' };
          }
        }

        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, ...data } : user
          ),
          user: state.user?.id === userId ? { ...state.user, ...data } : state.user
        }));

        return { success: true };
      },

      deleteUser: (userId) => {
        set(state => ({
          users: state.users.filter(user => user.id !== userId)
        }));
      },

      changePassword: async (userId, currentPassword, newPassword) => {
        const { users } = get();
        const user = users.find(u => u.id === userId);

        if (!user) {
          return { success: false, error: 'Usuário não encontrado' };
        }

        if (!bcrypt.compareSync(currentPassword, user.password)) {
          return { success: false, error: 'Senha atual incorreta' };
        }

        set(state => ({
          users: state.users.map(u =>
            u.id === userId
              ? { ...u, password: bcrypt.hashSync(newPassword, 10) }
              : u
          )
        }));

        return { success: true };
      },

      resetUserPassword: async (adminId, userId, newPassword) => {
        const { users } = get();
        const admin = users.find(u => u.id === adminId);
        const user = users.find(u => u.id === userId);

        if (!admin || admin.role !== 'admin') {
          return { success: false, error: 'Permissão negada' };
        }

        if (!user) {
          return { success: false, error: 'Usuário não encontrado' };
        }

        set(state => ({
          users: state.users.map(u =>
            u.id === userId
              ? { ...u, password: bcrypt.hashSync(newPassword, 10) }
              : u
          )
        }));

        return { success: true };
      },

      requestPasswordRecovery: async (email) => {
        try {
          console.log('Iniciando recuperação de senha:', { email });

          const user = get().users.find(u => u.email === email);
          console.log('Usuário encontrado:', { 
            found: !!user,
            hasPhone: user?.phone ? 'sim' : 'não'
          });

          if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
          }

          if (!user.phone) {
            return { success: false, error: 'Usuário não possui telefone cadastrado' };
          }

          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutos

          console.log('Código gerado:', { 
            codeLength: code.length,
            expiresAt 
          });

          const message = `Seu código de recuperação de senha é: *${code}*\n\nEste código expira em 15 minutos.`;
          
          const whatsappConfig = user.whatsappConfig || undefined;
          console.log('Configuração WhatsApp:', {
            usingCustomConfig: !!whatsappConfig
          });

          const result = await sendWhatsAppMessage({
            recipient: user.phone,
            message,
            config: whatsappConfig
          });

          console.log('Resultado do envio:', result);

          if (!result.success) {
            return { 
              success: false, 
              error: result.error || 'Erro ao enviar código de recuperação' 
            };
          }

          set(state => ({
            passwordRecoveries: [
              ...state.passwordRecoveries.filter(r => r.email !== email),
              { email, code, expiresAt }
            ]
          }));

          console.log('Recuperação registrada com sucesso');
          return { success: true };
        } catch (error) {
          console.error('Erro na recuperação de senha:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
            errorStack: error instanceof Error ? error.stack : undefined
          });

          return { 
            success: false, 
            error: 'Erro interno ao processar recuperação de senha' 
          };
        }
      },

      resetPasswordWithCode: async (email, code, newPassword) => {
        const { passwordRecoveries, users } = get();
        const recovery = passwordRecoveries.find(r => r.email === email && r.code === code);

        if (!recovery) {
          return { success: false, error: 'Código inválido' };
        }

        if (new Date() > new Date(recovery.expiresAt)) {
          return { success: false, error: 'Código expirado' };
        }

        const user = users.find(u => u.email === email);
        if (!user) {
          return { success: false, error: 'Usuário não encontrado' };
        }

        set(state => ({
          users: state.users.map(u =>
            u.id === user.id
              ? { ...u, password: bcrypt.hashSync(newPassword, 10) }
              : u
          ),
          passwordRecoveries: state.passwordRecoveries.filter(r => r.email !== email)
        }));

        return { success: true };
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);