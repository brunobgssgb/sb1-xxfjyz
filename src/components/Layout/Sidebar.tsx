import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { navigation, adminNavigation, userNavigation } from './navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [openMenus, setOpenMenus] = React.useState<string[]>(['Administração']);

  const toggleMenu = (menuName: string) => {
    setOpenMenus(current =>
      current.includes(menuName)
        ? current.filter(name => name !== menuName)
        : [...current, menuName]
    );
  };

  return (
    <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <h1 className="text-xl font-bold text-gray-900">Sistema de Recargas</h1>
      </div>
      <div className="mt-5 flex-grow flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )}
              >
                <Icon
                  className={clsx(
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5'
                  )}
                />
                {item.name}
              </Link>
            );
          })}

          {/* User Navigation */}
          <div className="pt-4">
            <div className="border-t border-gray-200 pt-4">
              {userNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <Icon
                      className={clsx(
                        isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 h-5 w-5'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin Navigation */}
          {user?.role === 'admin' && (
            <div className="pt-4">
              <div className="border-t border-gray-200 pt-4">
                {adminNavigation.map((section) => {
                  const Icon = section.icon;
                  const isOpen = openMenus.includes(section.name);

                  return (
                    <div key={section.name}>
                      <button
                        onClick={() => toggleMenu(section.name)}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                      >
                        <div className="flex items-center">
                          <Icon className="mr-3 h-5 w-5 text-gray-400" />
                          {section.name}
                        </div>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="ml-8 mt-1 space-y-1">
                          {section.items.map((item) => {
                            const SubIcon = item.icon;
                            const isActive = location.pathname === item.href;

                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                  isActive
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                                )}
                              >
                                <SubIcon
                                  className={clsx(
                                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                                    'mr-3 h-5 w-5'
                                  )}
                                />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}