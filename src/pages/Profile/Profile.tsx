import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Key, Webhook, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { generateWebhookUrl } from '../../services/payment';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  whatsappSecret: string;
  whatsappAccount: string;
  mercadoPagoAccessToken: string;
}

export function Profile() {
  const { user, updateUser } = useAuthStore();
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      whatsappSecret: user?.whatsappConfig?.secret || '',
      whatsappAccount: user?.whatsappConfig?.account || '',
      mercadoPagoAccessToken: user?.paymentConfig?.accessToken || '',
    },
  });

  useEffect(() => {
    if (user) {
      setWebhookUrl(generateWebhookUrl(user.id));
    }
  }, [user]);

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar URL:', err);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const result = await updateUser(user!.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        whatsappConfig: {
          secret: data.whatsappSecret,
          account: data.whatsappAccount,
        },
        paymentConfig: {
          accessToken: data.mercadoPagoAccessToken,
          webhookUrl: webhookUrl,
        },
      });

      if (result.success) {
        setAlert({
          type: 'success',
          message: 'Perfil atualizado com sucesso!',
        });
      } else {
        setAlert({
          type: 'error',
          message: result.error || 'Erro ao atualizar perfil',
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erro ao processar atualização',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">Meu Perfil</h2>
          <p className="mt-1 text-sm text-gray-500">
            Atualize suas informações pessoais e configurações
          </p>

          {alert && (
            <div className="mt-4">
              <Alert
                type={alert.type}
                title={alert.message}
                onClose={() => setAlert(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div className="space-y-6">
              <Input
                label="Nome"
                icon={User}
                error={errors.name?.message}
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 3,
                    message: 'Nome deve ter pelo menos 3 caracteres'
                  }
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
                    message: 'Email inválido'
                  }
                })}
              />

              <Input
                label="Telefone"
                icon={Phone}
                placeholder="Ex: 5511999999999"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Telefone é obrigatório'
                })}
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">
                Configurações do WhatsApp
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure suas credenciais para envio de mensagens via WhatsApp
              </p>

              <div className="mt-6 space-y-6">
                <Input
                  label="Secret Key"
                  icon={Key}
                  error={errors.whatsappSecret?.message}
                  {...register('whatsappSecret', {
                    required: 'Secret Key é obrigatória'
                  })}
                />

                <Input
                  label="Account ID"
                  icon={Key}
                  error={errors.whatsappAccount?.message}
                  {...register('whatsappAccount', {
                    required: 'Account ID é obrigatório'
                  })}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">
                Configurações do Mercado Pago
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure suas credenciais para processamento de pagamentos
              </p>

              <div className="mt-6 space-y-6">
                <Input
                  label="Access Token"
                  icon={Key}
                  error={errors.mercadoPagoAccessToken?.message}
                  {...register('mercadoPagoAccessToken', {
                    required: 'Access Token é obrigatório',
                  })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    URL do Webhook
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex flex-grow items-stretch">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Webhook className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={webhookUrl}
                        readOnly
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Configure esta URL no painel do Mercado Pago para receber notificações de pagamento
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}