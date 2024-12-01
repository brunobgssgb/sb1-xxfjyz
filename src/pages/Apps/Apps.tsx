import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, AppWindow, Edit2, QrCode } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import clsx from 'clsx';
import { App } from '../../types';

interface AppFormData {
  name: string;
  price: string;
}

export function Apps() {
  const apps = useStore((state) => state.getApps());
  const rechargeCodes = useStore((state) => state.getRechargeCodes());
  const { addApp, updateApp } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AppFormData>({
    defaultValues: {
      name: editingApp?.name || '',
      price: editingApp?.price.toString() || '',
    }
  });

  const getAvailableCodesCount = (appId: string) => {
    return rechargeCodes.filter(code => code.appId === appId && !code.isUsed).length;
  };

  const columns = [
    { 
      header: 'ID',
      accessor: 'id',
      cell: (value: string) => (
        <span className="font-mono text-xs text-gray-500">
          {value.slice(0, 8)}
        </span>
      )
    },
    { 
      header: 'Aplicativo',
      accessor: 'name',
      cell: (value: string) => (
        <div className="flex items-center">
          <AppWindow className="h-5 w-5 text-gray-400 mr-2" />
          {value}
        </div>
      )
    },
    { 
      header: 'Preço',
      accessor: 'price',
      cell: (value: number) => `R$ ${value.toFixed(2)}`
    },
    {
      header: 'Códigos Disponíveis',
      accessor: 'codesCount',
      cell: (_: any, row: App) => {
        const count = getAvailableCodesCount(row.id);
        return (
          <div className="flex items-center">
            <QrCode className="h-4 w-4 text-gray-400 mr-2" />
            <span className={clsx(
              "px-2 py-1 rounded-full text-xs font-medium",
              count > 10 ? "bg-green-100 text-green-800" :
              count > 0 ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            )}>
              {count} códigos
            </span>
          </div>
        );
      }
    },
    {
      header: 'Ações',
      accessor: 'actions',
      cell: (_: any, row: App) => (
        <Button
          variant="secondary"
          icon={Edit2}
          onClick={() => {
            setEditingApp(row);
            reset({
              name: row.name,
              price: row.price.toString(),
            });
            setIsModalOpen(true);
          }}
        >
          Editar
        </Button>
      )
    }
  ];

  const onSubmit = (data: AppFormData) => {
    if (editingApp) {
      updateApp(editingApp.id, {
        name: data.name,
        price: parseFloat(data.price),
      });
    } else {
      addApp({
        name: data.name,
        price: parseFloat(data.price),
      });
    }
    setIsModalOpen(false);
    setEditingApp(null);
    reset();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingApp(null);
    reset();
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-semibold text-gray-900">Aplicativos</h2>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie seu catálogo de aplicativos
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button 
            icon={Plus} 
            onClick={() => {
              setEditingApp(null);
              reset();
              setIsModalOpen(true);
            }}
          >
            Adicionar Aplicativo
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Table columns={columns} data={apps} />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h3 className="text-lg font-medium text-gray-900">
          {editingApp ? 'Editar Aplicativo' : 'Adicionar Novo Aplicativo'}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Input
            label="Nome do Aplicativo"
            placeholder="Digite o nome do aplicativo"
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
            type="number"
            step="0.01"
            label="Preço"
            placeholder="0,00"
            error={errors.price?.message}
            {...register('price', { 
              required: 'Preço é obrigatório',
              min: {
                value: 0,
                message: 'Preço deve ser maior que zero'
              }
            })}
          />

          <div className="mt-5 sm:mt-6 flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingApp ? 'Salvar Alterações' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}