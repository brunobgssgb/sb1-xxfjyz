import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

interface RecoveryFormData {
  email: string;
}

interface VerificationFormData {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export function PasswordRecovery() {
  const navigate = useNavigate();
  const { requestPasswordRecovery, resetPasswordWithCode } = useAuthStore();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors, isSubmitting: isRequestSubmitting }
  } = useForm<RecoveryFormData>();

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    watch,
    formState: { errors: verifyErrors, isSubmitting: isVerifySubmitting }
  } = useForm<VerificationFormData>();

  const newPassword = watch('newPassword');

  const onRequestSubmit = async (data: RecoveryFormData) => {
    try {
      const result = await requestPasswordRecovery(data.email);
      
      if (result.success) {
        setEmail(data.email);
        setStep('verify');
        setAlert({
          type: 'success',
          message: 'Código de recuperação enviado para seu WhatsApp'
        });
      } else {
        setAlert({
          type: 'error',
          message: result.error || 'Erro ao solicitar recuperação de senha'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erro ao processar solicitação'
      });
    }
  };

  const onVerifySubmit = async (data: VerificationFormData) => {
    try {
      const result = await resetPasswordWithCode(email, data.code, data.newPassword);
      
      if (result.success) {
        setAlert({
          type: 'success',
          message: 'Senha alterada com sucesso!'
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setAlert({
          type: 'error',
          message: result.error || 'Erro ao redefinir senha'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erro ao processar solicitação'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Recuperação de Senha
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'request'
              ? 'Digite seu email para receber o código de recuperação'
              : 'Digite o código recebido no WhatsApp e sua nova senha'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {alert && (
            <div className="mb-4">
              <Alert
                type={alert.type}
                title={alert.message}
                onClose={() => setAlert(null)}
              />
            </div>
          )}

          {step === 'request' ? (
            <form className="space-y-6" onSubmit={handleSubmitRequest(onRequestSubmit)}>
              <Input
                label="Email"
                type="email"
                icon={Mail}
                error={requestErrors.email?.message}
                {...registerRequest('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
              />

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRequestSubmitting}
                >
                  {isRequestSubmitting ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </button>
                <span className="ml-2">Email: {email}</span>
              </div>

              <form className="space-y-6" onSubmit={handleSubmitVerify(onVerifySubmit)}>
                <Input
                  label="Código de Verificação"
                  icon={KeyRound}
                  error={verifyErrors.code?.message}
                  {...registerVerify('code', {
                    required: 'Código é obrigatório',
                    minLength: {
                      value: 6,
                      message: 'Código deve ter 6 dígitos'
                    },
                    maxLength: {
                      value: 6,
                      message: 'Código deve ter 6 dígitos'
                    }
                  })}
                />

                <Input
                  label="Nova Senha"
                  type="password"
                  icon={Lock}
                  error={verifyErrors.newPassword?.message}
                  {...registerVerify('newPassword', {
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
                  error={verifyErrors.confirmPassword?.message}
                  {...registerVerify('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
                    validate: value =>
                      value === newPassword || 'As senhas não conferem',
                  })}
                />

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isVerifySubmitting}
                  >
                    {isVerifySubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  ou
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}