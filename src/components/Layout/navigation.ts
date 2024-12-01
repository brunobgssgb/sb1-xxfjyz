import { LayoutDashboard, Users, AppWindow, QrCode, ShoppingCart, Settings, UserCog, User } from 'lucide-react';

export const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Aplicativos', href: '/aplicativos', icon: AppWindow },
  { name: 'Códigos de Recarga', href: '/codigos', icon: QrCode },
  { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
] as const;

export const userNavigation = [
  { name: 'Meu Perfil', href: '/perfil', icon: User },
] as const;

export const adminNavigation = [
  { 
    name: 'Administração',
    icon: Settings,
    items: [
      { name: 'Usuários do Sistema', href: '/admin/usuarios', icon: UserCog },
    ]
  }
] as const;