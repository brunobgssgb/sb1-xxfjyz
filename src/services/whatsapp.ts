import { WhatsAppMessage, WhatsAppConfig } from '../types/whatsapp';

const DEFAULT_CONFIG: WhatsAppConfig = {
  secret: "3a0e16d380a426e10fae9becea16675adc3b8fa1",
  account: "1725731608c4ca4238a0b923820dcc509a6f75849b66dc931828f13"
};

export async function sendWhatsAppMessage({ recipient, message, config = DEFAULT_CONFIG }: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Iniciando envio de mensagem WhatsApp:', {
      recipient,
      messageLength: message.length,
      hasConfig: !!config
    });

    const payload = {
      secret: config.secret,
      account: config.account,
      priority: 1,
      recipient,
      type: "text",
      message
    };

    console.log('Payload preparado:', {
      ...payload,
      message: payload.message.substring(0, 50) + '...' // Log parcial da mensagem
    });

    const response = await fetch("https://envia.ihostnotebooks.com.br/api/send/whatsapp", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload)
    });

    console.log('Resposta recebida:', {
      status: response.status,
      statusText: response.statusText
    });

    const result = await response.json();
    console.log('Resultado do envio:', result);

    if (!result.success) {
      return { 
        success: false, 
        error: result.error || 'Erro desconhecido ao enviar mensagem'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao enviar mensagem'
    };
  }
}

export function formatOrderMessage(orderData: {
  customerName: string;
  orderNumber: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number; }>;
}): string {
  const { customerName, orderNumber, total, items } = orderData;
  
  const itemsList = items
    .map(item => `- ${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2)})`)
    .join('\n');

  return `Olá ${customerName}!

Seu pedido #${orderNumber} foi recebido com sucesso!

*Detalhes do Pedido:*
${itemsList}

*Total: R$ ${total.toFixed(2)}*

Agradecemos pela preferência! Em breve você receberá os códigos de recarga.

Qualquer dúvida estamos à disposição.`;
}