import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, QrCode, Search, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';
import { InfiniteScroll } from '../../components/ui/InfiniteScroll';
import clsx from 'clsx';

interface RechargeCodeFormData {
  appId: string;
  codes: string;
}

interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

const ITEMS_PER_PAGE = 15;

export function RechargeCodes() {
  const apps = useStore((state) => state.getApps());
  const rechargeCodes = useStore((state) => state.getRechargeCodes());
  const { addRechargeCodes, deleteRechargeCode } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RechargeCodeFormData>();

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    codeId: string | null;
  }>({
    isOpen: false,
    codeId: null,
  });

  const filteredCodes = useMemo(() => {
    return rechargeCodes.filter(code => {
      const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesApp = !selectedAppId || code.appId === selectedAppId;
      return matchesSearch && matchesApp;
    });
  }, [rechargeCodes, searchTerm, selectedAppId]);

  const displayedCodes = useMemo(() => {
    return filteredCodes.slice(0, visibleItems);
  }, [filteredCodes, visibleItems]);

  const loadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleItems(prev => prev + ITEMS_PER_PAGE);
      setIsLoading(false);
    }, 500);
  };

  const columns = [
    { 
      header: 'Código',
      accessor: 'code',
      cell: (value: string) => (
        <div className="flex items-center">
          <QrCode className="h-5 w-5 text-gray-400 mr-2" />
          <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
            {value}
          </code>
        </div>
      )
    },
    { 
      header: 'Aplicativo',
      accessor: 'appId',
      cell: (value: string) => apps.find(app => app.id === value)?.name || 'Aplicativo não encontrado'
    },
    { 
      header: 'Status',
      accessor: 'isUsed',
      cell: (value: boolean) => (
        <span className={clsx(
          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
          value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        )}>
          {value ? 'Usado' : 'Disponível'}
        </span>
      )
    },
    {
      header: 'Ações',
      accessor: 'actions',
      cell: (_, row) => (
        <Button
          variant="danger"
          icon={Trash2}
          onClick={() => setDeleteConfirmation({ isOpen: true, codeId: row.id })}
        >
          Excluir
        </Button>
      )
    }
  ];

  const onSubmit = (data: RechargeCodeFormData) => {
    const newCodes = data.codes
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    const result = addRechargeCodes(data.appId, newCodes);

    if (result.duplicates.length > 0) {
      setAlert({
        type: 'warning',
        title: 'Códigos Duplicados Encontrados',
        message: result.duplicates.map(d => 
          `${d.code} (já existe no aplicativo ${d.appName})`
        ).join('\n')
      });
      return;
    }

    if (result.added.length > 0) {
      setAlert({
        type: 'success',
        title: 'Códigos Adicionados',
        message: `${result.added.length} códigos foram adicionados com sucesso.`
      });
      setIsModalOpen(false);
      reset();
    }
  };

  const handleDelete = () => {
    if (deleteConfirmation.codeId) {
      deleteRechargeCode(deleteConfirmation.codeId);
      setDeleteConfirmation({ isOpen: false, codeId: null });
      setAlert({
        type: 'success',
        title: 'Código Excluído',
        message: 'O código foi excluído com sucesso.'
      });
    }
  };

  React.useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [searchTerm, selectedAppId]);

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-semibold text-gray-900">Códigos de Recarga</h2>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie seu estoque de códigos de recarga
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Adicionar Códigos
          </Button>
        </div>
      </div>

      {alert && (
        <div className="mt-4">
          <Alert {...alert} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="Buscar por código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
          icon={Search}
        />
        <Select
          value={selectedAppId}
          onChange={(e) => setSelectedAppId(e.target.value)}
          className="max-w-md"
        >
          <option value="">Todos os Aplicativos</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-8">
        <InfiniteScroll
          onLoadMore={loadMore}
          hasMore={displayedCodes.length < filteredCodes.length}
          isLoading={isLoading}
        >
          <Table columns={columns} data={displayedCodes} />
        </InfiniteScroll>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        reset();
      }}>
        <h3 className="text-lg font-medium text-gray-900">Adicionar Códigos de Recarga</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Select
            label="Selecionar Aplicativo"
            error={errors.appId?.message}
            {...register('appId', { required: 'Selecione um aplicativo' })}
          >
            <option value="">Selecione um aplicativo...</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </Select>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Códigos (um por linha)
            </label>
            <textarea
              {...register('codes', { required: 'Digite pelo menos um código' })}
              rows={5}
              className={clsx(
                "w-full rounded-lg border bg-white px-4 py-3 text-sm transition-colors",
                "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none",
                errors.codes ? "border-red-500" : "border-gray-300"
              )}
              placeholder="Digite os códigos aqui..."
            />
            {errors.codes && (
              <p className="text-sm text-red-500">{errors.codes.message}</p>
            )}
            <p className="text-sm text-gray-500">
              Insira um código por linha. Códigos duplicados serão identificados automaticamente.
            </p>
          </div>

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
              Adicionar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={deleteConfirmation.isOpen} 
        onClose={() => setDeleteConfirmation({ isOpen: false, codeId: null })}
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-medium text-gray-900">
              Excluir Código
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Tem certeza que deseja excluir este código? Esta ação não pode ser desfeita.
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
            onClick={() => setDeleteConfirmation({ isOpen: false, codeId: null })}
            className="mt-3 w-full sm:mt-0 sm:w-auto"
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}