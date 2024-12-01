import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, User, Search, Mail, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export function Customers() {
  const customers = useStore((state) => state.getCustomers());
  const { addCustomer } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>();

  const filteredCustomers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const columns = [
    { 
      header: 'Nome',
      accessor: 'name',
      cell: (value: string) => (
        <div className="flex items-center">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          {value}
        </div>
      )
    },
    { 
      header: 'Email',
      accessor: 'email',
      cell: (value: string) => (
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gray-400 mr-2" />
          {value}
        </div>
      )
    },
    { 
      header: 'Telefone',
      accessor: 'phone',
      cell: (value: string) => (
        <div className="flex items-center">
          <Phone className="h-5 w-5 text-gray-400 mr-2" />
          <span className="font-mono">{value}</span>
        </div>
      )
    }
  ];

  const onSubmit = (data: CustomerFormData) => {
    addCustomer({
      name: data.name.toUpperCase(),
      email: data.email.toLowerCase(),
      phone: data.phone,
    });
    setAlert({
      type: 'success',
      title: 'Cliente adicionado com sucesso!'
    });
    setIsModalOpen(false);
    reset();
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-semibold text-gray-900">Clientes</h2>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie sua base de clientes
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Adicionar Cliente
          </Button>
        </div>
      </div>

      {alert && (
        <div className="mt-4">
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className="mt-4">
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          className="max-w-md"
        />
      </div>

      <div className="mt-8">
        <Table columns={columns} data={filteredCustomers} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        reset();
      }}>
        <h3 className="text-lg font-medium text-gray-900">Adicionar Novo Cliente</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Input
            label="Nome"
            placeholder="Digite o nome completo"
            icon={User}
            error={errors.name?.message}
            {...register('name', { 
              required: 'Nome é obrigatório',
              minLength: {
                value: 3,
                message: 'Nome deve ter pelo menos 3 caracteres'
              },
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
              }
            })}
          />

          <Input
            type="email"
            label="Email"
            placeholder="cliente@exemplo.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email', { 
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido'
              },
              onChange: (e) => {
                e.target.value = e.target.value.toLowerCase();
              }
            })}
          />

          <Input
            type="text"
            label="Telefone"
            placeholder="Ex: 5511999999999"
            icon={Phone}
            error={errors.phone?.message}
            {...register('phone', { 
              required: 'Telefone é obrigatório',
              pattern: {
                value: /^\d+$/,
                message: 'Digite apenas números'
              },
              minLength: {
                value: 8,
                message: 'Telefone deve ter no mínimo 8 dígitos'
              },
              maxLength: {
                value: 15,
                message: 'Telefone deve ter no máximo 15 dígitos'
              }
            })}
          />

          <div className="mt-5 sm:mt-6 flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}