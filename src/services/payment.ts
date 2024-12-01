import { PaymentConfig, PaymentData, PaymentResponse, PaymentWebhookData } from '../types/payment';
import { sendWhatsAppMessage } from './whatsapp';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';

export async function createPixPayment(
  data: PaymentData,
  config: PaymentConfig,
  whatsappConfig?: { recipient: string; config?: any }
): Promise<PaymentResponse> {
  try {
    console.log('Iniciando criação de pagamento PIX:', {
      amount: data.transactionAmount,
      description: data.description
    });

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        transaction_amount: data.transactionAmount,
        description: data.description,
        payment_method_id: 'pix',
        payer: {
          email: data.payerEmail,
          first_name: data.payerFirstName,
          last_name: ''
        },
        notification_url: config.webhookUrl // URL do webhook configurada pelo usuário
      })
    });

    console.log('Resposta recebida:', {
      status: response.status,
      statusText: response.statusText
    });

    if (response.status !== 201) {
      const errorData = await response.json();
      console.error('Erro na resposta:', errorData);
      return {
        success: false,
        error: 'Erro ao gerar pagamento PIX'
      };
    }

    const result = await response.json();
    console.log('Pagamento criado:', {
      id: result.id,
      status: result.status
    });

    const pixCopiaECola = result.point_of_interaction.transaction_data.qr_code;

    // Se tiver configuração de WhatsApp, envia o QR Code
    if (whatsappConfig) {
      const pixMessage = `*Pagamento PIX Gerado*

Valor: R$ ${data.transactionAmount.toFixed(2)}
Descrição: ${data.description}

*Código PIX (Copia e Cola):*
\`\`\`
${pixCopiaECola}
\`\`\`

O pagamento será confirmado automaticamente após a transferência.`;

      await sendWhatsAppMessage({
        recipient: whatsappConfig.recipient,
        message: pixMessage,
        config: whatsappConfig.config
      });
    }

    return {
      success: true,
      pixCopiaECola,
      paymentId: result.id
    };
  } catch (error) {
    console.error('Erro ao criar pagamento:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
    });

    return {
      success: false,
      error: 'Erro ao processar pagamento'
    };
  }
}

export async function handlePaymentWebhook(data: PaymentWebhookData): Promise<boolean> {
  try {
    console.log('Webhook recebido:', data);

    // Encontrar o usuário e o pedido correspondente
    const store = useStore.getState();
    const authStore = useAuthStore.getState();
    const users = authStore.users;

    // Procurar em todos os usuários
    for (const user of users) {
      const userData = store.userData[user.id];
      if (!userData) continue;

      // Procurar o pedido com o paymentId correspondente
      const order = userData.orders.find(o => o.paymentId === data.id);
      if (!order) continue;

      console.log('Pedido encontrado:', {
        orderId: order.id,
        userId: user.id,
        status: data.status
      });

      // Atualizar o status do pagamento
      if (data.status === 'approved') {
        // Completar o pedido
        const result = store.completeOrder(order.id);
        
        if (!result.success) {
          console.error('Erro ao completar pedido:', result.error);
          return false;
        }

        console.log('Pedido completado com sucesso');
      } else if (data.status === 'rejected') {
        // Cancelar o pedido
        store.updateOrder(order.id, {
          status: 'cancelled',
          paymentStatus: 'rejected'
        });

        // Notificar o cliente sobre o cancelamento
        const customer = userData.customers.find(c => c.id === order.customerId);
        if (customer && user.whatsappConfig) {
          await sendWhatsAppMessage({
            recipient: customer.phone,
            message: `Olá ${customer.name}!\n\nInfelizmente o pagamento do seu pedido #${order.id.slice(0, 8)} foi rejeitado.\n\nPor favor, tente realizar um novo pedido.`,
            config: user.whatsappConfig
          });
        }
      }

      return true;
    }

    console.log('Pedido não encontrado para o pagamento:', data.id);
    return false;
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return false;
  }
}

// Função para gerar URL do webhook
export function generateWebhookUrl(userId: string): string {
  // Esta URL deve ser configurada no seu servidor para receber as notificações
  // Exemplo: https://seu-dominio.com/api/webhooks/mercadopago/{userId}
  return `${window.location.origin}/api/webhooks/mercadopago/${userId}`;
}