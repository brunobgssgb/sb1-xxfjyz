import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { useForm } from 'react-hook-form';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const changePassword = useAuthStore((state) => state.changePassword);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordChangeForm>();

  const newPassword = watch('newPassword');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const onSubmit = async (data: PasswordChangeForm) => {
    if (!user) return;

    const result = await changePassword(user.id, data.currentPassword, data.newPassword);

    if (result.success) {
      setAlert({ type: 'success', message: 'Senha alterada com sucesso!' });
      setTimeout(() => {
        setIsModalOpen(false);
        reset();
        setAlert(null);
      }, 2000);
    } else {
      setAlert({ type: 'error', message: result.error || 'Erro ao alterar senha' });
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {user?.name}
              </span>
            </div>
            <Button
              variant="secondary"
              icon={Lock}
              onClick={() => setIsModalOpen(true)}
            >
              Alterar Senha
            </Button>
          </div>
          <Button
            variant="secondary"
            icon={LogOut}
            onClick={handleLogout}
          >
            Sair
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
          setAlert(null);
        }}
      >
        <h3 className="text-lg font-medium text-gray-900">
          Alterar Senha
        </h3>

        {alert && (
          <div className="mt-4">
            <Alert
              type={alert.type}
              title={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Input
            label="Senha Atual"
            type="password"
            icon={Lock}
            error={errors.currentPassword?.message}
            {...register('currentPassword', {
              required: 'Senha atual é obrigatória',
            })}
          />

          <Input
            label="Nova Senha"
            type="password"
            icon={Lock}
            error={errors.newPassword?.message}
            {...register('newPassword', {
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
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Confirmação de senha é obrigatória',
              validate: (value) =>
                value === newPassword || 'As senhas não conferem',
            })}
          />

          <div className="mt-5 sm:mt-6 flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                reset();
                setAlert(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Alterar Senha
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
}