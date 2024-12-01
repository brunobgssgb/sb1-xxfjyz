import React from 'react';
import { useStore } from '../store/useStore';
import { Users, AppWindow, QrCode, ShoppingCart } from 'lucide-react';

export function Dashboard() {
  const { customers, apps, rechargeCodes, orders } = useStore();

  const stats = [
    { name: 'Total de Clientes', value: customers.length, icon: Users },
    { name: 'Total de Aplicativos', value: apps.length, icon: AppWindow },
    { name: 'Códigos Disponíveis', value: rechargeCodes.filter(code => !code.isUsed).length, icon: QrCode },
    { name: 'Total de Pedidos', value: orders.length, icon: ShoppingCart },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
      
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
            >
              <dt>
                <div className="absolute rounded-md bg-indigo-500 p-3">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </dd>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">Pedidos Recentes</h3>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          {/* Tabela de pedidos recentes aqui */}
        </div>
      </div>
    </div>
  );
}