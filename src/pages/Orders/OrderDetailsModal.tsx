import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { QrCode, Package, User } from 'lucide-react';
import { Order, App, Customer, RechargeCode } from '../../types';
import clsx from 'clsx';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  apps: App[];
  customers: Customer[];
  rechargeCodes: RechargeCode[];
}

export function OrderDetailsModal({ order, onClose, apps, customers, rechargeCodes }: OrderDetailsModalProps) {
  if (!order) return null;

  const customer = customers.find(c => c.id === order.customerId);
  const orderCodes = rechargeCodes.filter(code => order.rechargeCodes.includes(code.id));

  const getAppName = (appId: string) => {
    return apps.find(app => app.id === appId)?.name || 'Aplicativo não encontrado';
  };

  return (
    <Modal isOpen={!!order} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Package className="h-5 w-5 text-gray-500 mr-2" />
            Detalhes do Pedido
            <span className="ml-2 text-sm text-gray-500 font-mono">
              #{order.id.slice(0, 8)}
            </span>
          </h3>
          <div className="mt-2">
            <div className="flex items-center text-sm text-gray-500">
              <User className="h-4 w-4 mr-1" />
              Cliente: {customer?.name || 'Cliente não encontrado'}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Data: {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'long',
                timeStyle: 'short'
              }).format(new Date(order.createdAt))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900">Itens do Pedido</h4>
          <div className="mt-2 divide-y divide-gray-200">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getAppName(item.appId)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quantidade: {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  R$ {(item.quantity * item.unitPrice).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="py-3 flex justify-between font-medium">
              <p className="text-sm text-gray-900">Total</p>
              <p className="text-sm text-gray-900">R$ {order.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {order.status === 'completed' && orderCodes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Códigos de Recarga</h4>
            <div className="space-y-2">
              {orderCodes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex items-center">
                    <QrCode className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-mono text-sm">{code.code}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {getAppName(code.appId)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}