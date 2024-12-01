import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { App, Customer, Order, RechargeCode, OrderItem } from '../types';
import { sendWhatsAppMessage, formatOrderMessage } from '../services/whatsapp';
import { createPixPayment } from '../services/payment';
import { useAuthStore } from './useAuthStore';

interface UserData {
  customers: Customer[];
  apps: App[];
  rechargeCodes: RechargeCode[];
  orders: Order[];
}

interface Store {
  userData: Record<string, UserData>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  addApp: (app: Omit<App, 'id' | 'createdAt'>) => void;
  updateApp: (id: string, app: Partial<Omit<App, 'id' | 'createdAt'>>) => void;
  addRechargeCodes: (appId: string, codes: string[]) => { 
    added: string[];
    duplicates: { code: string; appName: string; }[];
  };
  deleteRechargeCode: (id: string) => void;
  createOrder: (customerId: string, items: Omit<OrderItem, 'id'>[]) => Promise<{ success: boolean; error?: string }>;
  updateOrder: (id: string, data: Partial<Omit<Order, 'id' | 'createdAt'>>) => void;
  deleteOrder: (id: string) => void;
  completeOrder: (id: string) => { success: boolean; error?: string };
  
  // Getters para dados específicos do usuário
  getCustomers: () => Customer[];
  getApps: () => App[];
  getRechargeCodes: () => RechargeCode[];
  getOrders: () => Order[];
}

const getCurrentUserId = () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Usuário não autenticado');
  return user.id;
};

const getCurrentUser = () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Usuário não autenticado');
  return user;
};

const getInitialUserData = (): UserData => ({
  customers: [],
  apps: [],
  rechargeCodes: [],
  orders: [],
});

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      userData: {},

      // Getters
      getCustomers: () => {
        const userId = getCurrentUserId();
        return get().userData[userId]?.customers || [];
      },
      
      getApps: () => {
        const userId = getCurrentUserId();
        return get().userData[userId]?.apps || [];
      },
      
      getRechargeCodes: () => {
        const userId = getCurrentUserId();
        return get().userData[userId]?.rechargeCodes || [];
      },
      
      getOrders: () => {
        const userId = getCurrentUserId();
        return get().userData[userId]?.orders || [];
      },

      addCustomer: (customerData) => {
        const userId = getCurrentUserId();
        set((state) => {
          const userData = state.userData[userId] || getInitialUserData();
          return {
            userData: {
              ...state.userData,
              [userId]: {
                ...userData,
                customers: [
                  ...userData.customers,
                  {
                    ...customerData,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                  },
                ],
              },
            },
          };
        });
      },

      addApp: (appData) => {
        const userId = getCurrentUserId();
        set((state) => {
          const userData = state.userData[userId] || getInitialUserData();
          return {
            userData: {
              ...state.userData,
              [userId]: {
                ...userData,
                apps: [
                  ...userData.apps,
                  {
                    ...appData,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                  },
                ],
              },
            },
          };
        });
      },

      updateApp: (id, appData) => {
        const userId = getCurrentUserId();
        set((state) => {
          const userData = state.userData[userId] || getInitialUserData();
          return {
            userData: {
              ...state.userData,
              [userId]: {
                ...userData,
                apps: userData.apps.map((app) =>
                  app.id === id ? { ...app, ...appData } : app
                ),
              },
            },
          };
        });
      },

      deleteRechargeCode: (id) => {
        const userId = getCurrentUserId();
        set((state) => {
          const userData = state.userData[userId] || getInitialUserData();
          return {
            userData: {
              ...state.userData,
              [userId]: {
                ...userData,
                rechargeCodes: userData.rechargeCodes.filter((code) => code.id !== id),
              },
            },
          };
        });
      },

      addRechargeCodes: (appId, codes) => {
        const userId = getCurrentUserId();
        const state = get();
        const userData = state.userData[userId] || getInitialUserData();
        const duplicates: { code: string; appName: string; }[] = [];
        const validCodes: string[] = [];

        codes.forEach(code => {
          const existingCode = userData.rechargeCodes.find(rc => rc.code === code);
          if (existingCode) {
            const app = userData.apps.find(a => a.id === existingCode.appId);
            duplicates.push({
              code,
              appName: app?.name || 'Aplicativo Desconhecido'
            });
          } else {
            validCodes.push(code);
          }
        });

        if (validCodes.length > 0) {
          set((state) => {
            const userData = state.userData[userId] || getInitialUserData();
            return {
              userData: {
                ...state.userData,
                [userId]: {
                  ...userData,
                  rechargeCodes: [
                    ...userData.rechargeCodes,
                    ...validCodes.map((code) => ({
                      id: crypto.randomUUID(),
                      code,
                      appId,
                      isUsed: false,
                      createdAt: new Date(),
                    })),
                  ],
                },
              },
            };
          });
        }

        return {
          added: validCodes,
          duplicates
        };
      },

      createOrder: async (customerId, items) => {
        try {
          const userId = getCurrentUserId();
          const user = getCurrentUser();
          const state = get();
          const userData = state.userData[userId] || getInitialUserData();
          const orderId = crypto.randomUUID();
          const customer = userData.customers.find(c => c.id === customerId);
          
          if (!user.paymentConfig?.accessToken) {
            return { 
              success: false, 
              error: 'Configuração de pagamento não encontrada' 
            };
          }
          
          if (!customer) {
            return { 
              success: false, 
              error: 'Cliente não encontrado' 
            };
          }

          const orderItems = items.map((item) => ({ 
            ...item, 
            id: crypto.randomUUID() 
          }));

          const total = orderItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

          // Criar pagamento PIX
          const paymentResult = await createPixPayment(
            {
              transactionAmount: total,
              description: `Pedido #${orderId.slice(0, 8)}`,
              payerEmail: customer.email,
              payerFirstName: customer.name
            },
            user.paymentConfig,
            {
              recipient: customer.phone,
              config: user.whatsappConfig
            }
          );

          if (!paymentResult.success) {
            return {
              success: false,
              error: paymentResult.error || 'Erro ao gerar pagamento'
            };
          }

          // Enviar mensagem com resumo do pedido
          const messageData = {
            customerName: customer.name,
            orderNumber: orderId.slice(0, 8),
            total,
            items: orderItems.map(item => {
              const app = userData.apps.find(a => a.id === item.appId);
              return {
                name: app?.name || 'Aplicativo',
                quantity: item.quantity,
                price: item.unitPrice
              };
            })
          };

          await sendWhatsAppMessage({
            recipient: customer.phone,
            message: formatOrderMessage(messageData),
            config: user.whatsappConfig
          });

          // Salvar pedido
          set((state) => {
            const userData = state.userData[userId] || getInitialUserData();
            return {
              userData: {
                ...state.userData,
                [userId]: {
                  ...userData,
                  orders: [
                    ...userData.orders,
                    {
                      id: orderId,
                      customerId,
                      items: orderItems,
                      total,
                      createdAt: new Date(),
                      status: 'pending',
                      rechargeCodes: [],
                      paymentId: paymentResult.paymentId,
                      paymentStatus: 'pending'
                    },
                  ],
                },
              },
            };
          });

          return { success: true };
        } catch (error) {
          console.error('Erro ao criar pedido:', error);
          return { 
            success: false, 
            error: 'Erro ao processar pedido' 
          };
        }
      },

      updateOrder: (id, data) => {
        const userId = getCurrentUserId();
        set((state) => {
          const userData = state.userData[userId] || getInitialUserData();
          return {
            userData: {
              ...state.userData,
              [userId]: {
                ...userData,
                orders: userData.orders.map((order) =>
                  order.id === id ? { ...order, ...data } : order
                ),
              },
            },
          };
        });
      },

      deleteOrder: (id) => {
        const userId = getCurrentUserId();
        set((state) => {
          const userData = state.userData[userId] || getInitialUserData();
          return {
            userData: {
              ...state.userData,
              [userId]: {
                ...userData,
                orders: userData.orders.filter((order) => order.id !== id),
              },
            },
          };
        });
      },

      completeOrder: (id) => {
        const userId = getCurrentUserId();
        const user = getCurrentUser();
        const state = get();
        const userData = state.userData[userId] || getInitialUserData();
        const order = userData.orders.find(o => o.id === id);
        
        if (!order) {
          return { success: false, error: 'Pedido não encontrado' };
        }

        if (order.status === 'completed') {
          return { success: false, error: 'Pedido já está concluído' };
        }

        // Tratar cada item do pedido individualmente
        const neededCodes: { appId: string; count: number }[] = [];
        
        // Calcular quantos códigos são necessários para cada app
        order.items.forEach(item => {
          // Agora usamos a quantidade do item para determinar quantos códigos precisamos
          neededCodes.push({ 
            appId: item.appId, 
            count: item.quantity 
          });
        });

        const availableCodes = userData.rechargeCodes.filter(code => !code.isUsed);
        const selectedCodes: string[] = [];

        // Verificar disponibilidade de códigos para cada item
        for (const need of neededCodes) {
          const codes = availableCodes
            .filter(code => code.appId === need.appId && !selectedCodes.includes(code.id))
            .slice(0, need.count)
            .map(code => code.id);

          if (codes.length < need.count) {
            return {
              success: false,
              error: `Códigos insuficientes para um dos aplicativos do pedido`
            };
          }

          selectedCodes.push(...codes);
        }

        // Atualizar os códigos como usados e vincular ao pedido
        set((state) => {
          const userData = state.userData[userId] || getInitialUserData();
          return {
            userData: {
              ...state.userData,
              [userId]: {
                ...userData,
                rechargeCodes: userData.rechargeCodes.map(code => 
                  selectedCodes.includes(code.id)
                    ? { ...code, isUsed: true }
                    : code
                ),
                orders: userData.orders.map(order => 
                  order.id === id
                    ? { ...order, status: 'completed', rechargeCodes: selectedCodes }
                    : order
                ),
              },
            },
          };
        });

        // Enviar mensagem WhatsApp com os códigos
        const customer = userData.customers.find(c => c.id === order.customerId);
        const codes = selectedCodes.map(id => {
          const code = userData.rechargeCodes.find(c => c.id === id);
          const app = userData.apps.find(a => a.id === code?.appId);
          return {
            code: code?.code || '',
            appName: app?.name || 'Aplicativo'
          };
        });

        if (customer) {
          const codesMessage = `Olá ${customer.name}!

Seu pedido #${order.id.slice(0, 8)} foi concluído!

*Seus códigos de recarga:*
${codes.map(c => `- ${c.appName}: ${c.code}`).join('\n')}

Agradecemos pela preferência!`;

          sendWhatsAppMessage({
            recipient: customer.phone,
            message: codesMessage,
            config: user.whatsappConfig
          });
        }

        return { success: true };
      },
    }),
    {
      name: 'user-data-storage',
    }
  )
);