import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, ShoppingCart, Edit2, Trash2, CheckCircle, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { OrderDetailsModal } from './OrderDetailsModal';
import clsx from 'clsx';
import { Order } from '../../types';

interface OrderFormData {
  customerId: string;
  items: Array<{
    appId: string;
    quantity: number;
  }>;
}

interface AlertMessage {
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
}

export function Orders() {
  const customers = useStore((state) => state.getCustomers());
  const apps = useStore((state) => state.getApps());
  const orders = useStore((state) => state.getOrders());
  const rechargeCodes = useStore((state) => state.getRechargeCodes());
  const { createOrder, deleteOrder, completeOrder, updateOrder } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    orderId: string | null;
  }>({
    isOpen: false,
    orderId: null
  });

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<OrderFormData>({
    defaultValues: {
      items: [{ appId: '', quantity: 1 }]
    }
  });

  const formItems = watch('items', []);

  const columns = [
    { 
      header: 'Pedido',
      accessor: 'id',
      cell: (value: string) => (
        <div className="flex items-center">
          <ShoppingCart className="h-5 w-5 text-gray-400 mr-2" />
          <span className="font-mono text-sm">{value.slice(0, 8)}</span>
        </div>
      )
    },
    { 
      header: 'Cliente',
      accessor: 'customerId',
      cell: (value: string) => customers.find(c => c.id === value)?.name || 'Cliente não encontrado'
    },
    { 
      header: 'Total',
      accessor: 'total',
      cell: (value: number) => `R$ ${value.toFixed(2)}`
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value: string) => (
        <span className={clsx(
          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        )}>
          {value === 'completed' ? 'Concluído' :
           value === 'cancelled' ? 'Cancelado' :
           'Pendente'}
        </span>
      )
    },
    {
      header: 'Ações',
      accessor: 'actions',
      cell: (_: any, row: Order) => (
        <div className="flex space-x-2">
          {row.status === 'pending' ? (
            <>
              <Button
                variant="secondary"
                icon={Edit2}
                onClick={() => {
                  setEditingOrder(row);
                  setValue('customerId', row.customerId);
                  setValue('items', row.items.map(item => ({
                    appId: item.appId,
                    quantity: item.quantity
                  })));
                  setIsModalOpen(true);
                }}
              >
                Editar
              </Button>
              <Button
                variant="success"
                icon={CheckCircle}
                onClick={() => handleCompleteOrder(row.id)}
              >
                Concluir
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setDeleteConfirmation({
                  isOpen: true,
                  orderId: row.id
                })}
              >
                Excluir
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              icon={Eye}
              onClick={() => setViewingOrder(row)}
            >
              Detalhes
            </Button>
          )}
        </div>
      )
    }
  ];

  const handleCompleteOrder = (orderId: string) => {
    const result = completeOrder(orderId);
    
    if (result.success) {
      setAlert({
        type: 'success',
        title: 'Pedido Concluído',
        message: 'O pedido foi concluído com sucesso e os códigos foram vinculados.'
      });
    } else {
      setAlert({
        type: 'error',
        title: 'Erro ao Concluir Pedido',
        message: result.error
      });
    }
  };

  const handleDelete = () => {
    if (deleteConfirmation.orderId) {
      deleteOrder(deleteConfirmation.orderId);
      setDeleteConfirmation({ isOpen: false, orderId: null });
      setAlert({
        type: 'success',
        title: 'Pedido Excluído',
        message: 'O pedido foi excluído com sucesso.'
      });
    }
  };

  const addItem = () => {
    const currentItems = watch('items') || [];
    const newItems = [...currentItems, { appId: '', quantity: 1 }];
    setValue('items', newItems);
  };

  const removeItem = (index: number) => {
    const currentItems = watch('items') || [];
    if (currentItems.length > 1) {
      const newItems = currentItems.filter((_, i) => i !== index);
      setValue('items', newItems);
    }
  };

  const calculateSubtotal = (appId: string, quantity: number) => {
    const app = apps.find(a => a.id === appId);
    return app ? app.price * quantity : 0;
  };

  const calculateTotal = () => {
    return formItems.reduce((total, item) => {
      return total + calculateSubtotal(item.appId, item.quantity);
    }, 0);
  };

  const onSubmit = (data: OrderFormData) => {
    const orderItems = data.items.map(item => ({
      appId: item.appId,
      quantity: Number(item.quantity),
      unitPrice: apps.find(app => app.id === item.appId)?.price || 0,
    }));

    if (editingOrder) {
      updateOrder(editingOrder.id, {
        customerId: data.customerId,
        items: orderItems.map(item => ({ ...item, id: crypto.randomUUID() })),
        total: orderItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
      });
      setAlert({
        type: 'success',
        title: 'Pedido Atualizado',
        message: 'O pedido foi atualizado com sucesso.'
      });
    } else {
      createOrder(data.customerId, orderItems);
      setAlert({
        type: 'success',
        title: 'Pedido Criado',
        message: 'O pedido foi criado com sucesso.'
      });
    }

    setIsModalOpen(false);
    setEditingOrder(null);
    reset({ items: [{ appId: '', quantity: 1 }] });
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-semibold text-gray-900">Pedidos</h2>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie os pedidos dos clientes
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button 
            icon={Plus} 
            onClick={() => {
              setEditingOrder(null);
              reset({ items: [{ appId: '', quantity: 1 }] });
              setIsModalOpen(true);
            }}
          >
            Criar Pedido
          </Button>
        </div>
      </div>

      {alert && (
        <div className="mt-4">
          <Alert {...alert} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="mt-8">
        <Table columns={columns} data={orders} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setEditingOrder(null);
        reset({ items: [{ appId: '', quantity: 1 }] });
      }}>
        <h3 className="text-lg font-medium text-gray-900">
          {editingOrder ? 'Editar Pedido' : 'Criar Novo Pedido'}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Select
            label="Cliente"
            error={errors?.customerId?.message}
            {...register('customerId', { required: 'Selecione um cliente' })}
          >
            <option value="">Selecione um cliente...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>

          <div className="space-y-4">
            {formItems.map((_, index) => (
              <div key={index} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  <Select
                    label="Aplicativo"
                    error={errors?.items?.[index]?.appId?.message}
                    {...register(`items.${index}.appId` as const, { 
                      required: 'Selecione um aplicativo' 
                    })}
                  >
                    <option value="">Selecione um aplicativo...</option>
                    {apps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name} - R$ {app.price.toFixed(2)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    label="Quantidade"
                    min="1"
                    error={errors?.items?.[index]?.quantity?.message}
                    {...register(`items.${index}.quantity` as const, { 
                      required: 'Digite a quantidade',
                      min: {
                        value: 1,
                        message: 'Mínimo de 1'
                      },
                      valueAsNumber: true
                    })}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => removeItem(index)}
                    disabled={formItems.length === 1}
                    icon={Trash2}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={addItem}
              icon={Plus}
            >
              Adicionar Item
            </Button>
            <div className="text-lg font-semibold">
              Total: R$ {calculateTotal().toFixed(2)}
            </div>
          </div>

          <div className="mt-5 sm:mt-6 flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingOrder(null);
                reset({ items: [{ appId: '', quantity: 1 }] });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingOrder ? 'Salvar Alterações' : 'Criar Pedido'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={deleteConfirmation.isOpen} 
        onClose={() => setDeleteConfirmation({ isOpen: false, orderId: null })}
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-medium text-gray-900">
              Excluir Pedido
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <Button
            variant="danger"
            onClick={handleDelete}
            className="w-full sm:ml-3 sm:w-auto"
          >
            Excluir
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDeleteConfirmation({ isOpen: false, orderId: null })}
            className="mt-3 w-full sm:mt-0 sm:w-auto"
          >
            Cancelar
          </Button>
        </div>
      </Modal>

      <OrderDetailsModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        apps={apps}
        customers={customers}
        rechargeCodes={rechargeCodes}
      />
    </div>
  );
}