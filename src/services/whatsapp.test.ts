import { sendWhatsAppMessage } from './whatsapp';

export async function testWhatsAppMessage() {
  const testMessage = `Olá! 👋

Esta é uma mensagem de teste do Sistema de Recargas.

*Teste realizado com sucesso!* ✅

Hora do teste: ${new Date().toLocaleTimeString('pt-BR')}`;

  try {
    const result = await sendWhatsAppMessage({
      recipient: "5512988115563",
      message: testMessage
    });

    console.log(result ? "✅ Mensagem enviada com sucesso!" : "❌ Falha ao enviar mensagem");
    return result;
  } catch (error) {
    console.error("Erro ao enviar mensagem de teste:", error);
    return false;
  }
}