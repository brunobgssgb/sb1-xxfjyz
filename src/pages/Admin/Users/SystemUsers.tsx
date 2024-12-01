import React, { useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { Table } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { 
  Plus, User, Mail, Phone, Lock, CheckCircle2, XCircle, 
  Edit2, Ban, UserCog, Key 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'user';
}

interface PasswordResetFormData {
  newPassword: string;
  confirmPassword: string;
}

export function SystemUsers() {
  const { 
    users, 
    user: currentUser,
    register: registerUser, 
    approveUser, 
    rejectUser,
    blockUser,
    updateUser,
    deleteUser,
    resetUserPassword
  } = useAuthStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null
  });
  const [passwordReset, setPasswordReset] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<UserFormData>();

  const {
    register: registerPasswordReset,
    handleSubmit: handleSubmitPasswordReset,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
    watch: watchPassword,
  } = useForm<PasswordResetFormData>();

  const password = watch('password');
  const newPassword = watchPassword('newPassword');

  const columns = [
    {
      header: 'Nome',
      accessor: 'name',
      cell: (value: string) => (
        <div className="flex items-center">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          {value}
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      cell: (value: string) => (
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gray-400 mr-2" />
          {value}
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessor: 'role',
      cell: (value: string) => (
        <div className="flex items-center">
          <UserCog className="h-5 w-5 text-gray-400 mr-2" />
          {value === 'admin' ? 'Administrador' : 'Usuário'}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value: string) => (
        <span className={clsx(
          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        )}>
          {value === 'active' ? 'Ativo' :
           value === 'pending' ? 'Pendente' :
           'Bloqueado'}
        </span>
      ),
    },
    {
      header: 'Ações',
      accessor: 'actions',
      cell: (_: any, row: any) => (
        <div className="flex space-x-2">
          {row.status === 'pending' ? (
            <>
              <Button
                variant="success"
                icon={CheckCircle2}
                onClick={() => handleApprove(row.id)}
              >
                Aprovar
              </Button>
              <Button
                variant="danger"
                icon={XCircle}
                onClick={() => handleReject(row.id)}
              >
                Rejeitar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                icon={Edit2}
                onClick={() => handleEdit(row)}
              >
                Editar
              </Button>
              <Button
                variant="secondary"
                icon={Key}
                onClick={() => setPasswordReset({ isOpen: true, userId: row.id })}
              >
                Redefinir Senha
              </Button>
              {row.status === 'active' ? (
                <Button
                  variant="danger"
                  icon={Ban}
                  onClick={() => handleBlock(row.id)}
                >
                  Bloquear
                </Button>
              ) : (
                <Button
                  variant="success"
                  icon={CheckCircle2}
                  onClick={() => handleUnblock(row.id)}
                >
                  Desbloquear
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const handleEdit = (user: any) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleBlock = (userId: string) => {
    blockUser(userId);
    setAlert({ type: 'success', message: 'Usuário bloqueado com sucesso!' });
  };

  const handleUnblock = (userId: string) => {
    approveUser(userId);
    setAlert({ type: 'success', message: 'Usuário desbloqueado com sucesso!' });
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
        });
        setAlert({ type: 'success', message: 'Usuário atualizado com sucesso!' });
      } else {
        const result = await registerUser({
          ...data,
          role: data.role,
        });

        if (result.success) {
          setAlert({ type: 'success', message: 'Usuário cadastrado com sucesso!' });
        } else {
          setAlert({ type: 'error', message: result.error || 'Erro ao cadastrar usuário' });
          return;
        }
      }
      
      setIsModalOpen(false);
      setEditingUser(null);
      reset();
    } catch (error) {
      setAlert({ type: 'error', message: 'Erro ao processar usuário' });
    }
  };

  const handleApprove = (userId: string) => {
    approveUser(userId);
    setAlert({ type: 'success', message: 'Usuário aprovado com sucesso!' });
  };

  const handleReject = (userId: string) => {
    rejectUser(userId);
    setAlert({ type: 'success', message: 'Usuário rejeitado com sucesso!' });
  };

  const handlePasswordReset = async (data: PasswordResetFormData) => {
    if (!currentUser || !passwordReset.userId) return;

    const result = await resetUserPassword(
      currentUser.id,
      passwordReset.userId,
      data.newPassword
    );

    if (result.success) {
      setAlert({ type: 'success', message: 'Senha redefinida com sucesso!' });
      setPasswordReset({ isOpen: false, userId: null });
      resetPasswordForm();
    } else {
      setAlert({ type: 'error', message: result.error || 'Erro ao redefinir senha' });
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-semibold text-gray-900">Usuários do Sistema</h2>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie os usuários que têm acesso ao sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button
            icon={Plus}
            onClick={() => {
              setEditingUser(null);
              reset();
              setIsModalOpen(true);
            }}
          >
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {alert && (
        <div className="mt-4">
          <Alert
            type={alert.type}
            title={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className="mt-8">
        <Table columns={columns} data={users} />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
          reset();
        }}
      >
        <h3 className="text-lg font-medium text-gray-900">
          {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Input
            label="Nome completo"
            icon={User}
            error={errors.name?.message}
            {...register('name', {
              required: 'Nome é obrigatório',
              minLength: {
                value: 3,
                message: 'Nome deve ter no mínimo 3 caracteres',
              },
            })}
          />

          <Input
            label="Email"
            type="email"
            icon={Mail}
            error={errors.email?.message}
            {...register('email', {
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            })}
          />

          <Input
            label="Telefone"
            icon={Phone}
            placeholder="Ex: 5511999999999"
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Telefone é obrigatório',
            })}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Usuário
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  value="user"
                  {...register('role', { required: 'Selecione o tipo de usuário' })}
                />
                <span className="ml-2">Usuário</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  value="admin"
                  {...register('role', { required: 'Selecione o tipo de usuário' })}
                />
                <span className="ml-2">Administrador</span>
              </label>
            </div>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          {!editingUser && (
            <>
              <Input
                label="Senha"
                type="password"
                icon={Lock}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter no mínimo 6 caracteres',
                  },
                })}
              />

              <Input
                label="Confirmar senha"
                type="password"
                icon={Lock}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: value =>
                    value === password || 'As senhas não conferem',
                })}
              />
            </>
          )}

          <div className="mt-5 sm:mt-6 flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingUser(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={passwordReset.isOpen}
        onClose={() => setPasswordReset({ isOpen: false, userId: null })}
      >
        <h3 className="text-lg font-medium text-gray-900">
          Redefinir Senha do Usuário
        </h3>
        <form onSubmit={handleSubmitPasswordReset(handlePasswordReset)} className="mt-4 space-y-4">
          <Input
            label="Nova Senha"
            type="password"
            icon={Lock}
            error={passwordErrors.newPassword?.message}
            {...registerPasswordReset('newPassword', {
              required: 'Nova senha é obrigatória',
              minLength: {
                value: 6,
                message: 'A senha deve ter no mínimo 6 caracteres',
              },
            })}
          />

          <Input
            label="Confirmar Nova Senha"
            type="password"
            icon={Lock}
            error={passwordErrors.confirmPassword?.message}
            {...registerPasswordReset('confirmPassword', {
              required: 'Confirmação de senha é obrigatória',
              validate: value =>
                value === newPassword || 'As senhas não conferem',
            })}
          />

          <div className="mt-5 sm:mt-6 flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPasswordReset({ isOpen: false, userId: null })}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Redefinir Senha
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={deleteConfirmation.isOpen} 
        onClose={() => setDeleteConfirmation({ isOpen: false, userId: null })}
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-medium text-gray-900">
              Excluir Usuário
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <Button
            variant="danger"
            onClick={() => {
              if (deleteConfirmation.userId) {
                deleteUser(deleteConfirmation.userId);
                setDeleteConfirmation({ isOpen: false, userId: null });
                setAlert({ type: 'success', message: 'Usuário excluído com sucesso!' });
              }
            }}
            className="w-full sm:ml-3 sm:w-auto"
          >
            Excluir
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDeleteConfirmation({ isOpen: false, userId: null })}
            className="mt-3 w-full sm:mt-0 sm:w-auto"
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}