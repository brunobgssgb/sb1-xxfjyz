import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import clsx from 'clsx';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  type: AlertType;
  title: string;
  message?: string;
  onClose?: () => void;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: any }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertCircle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Info,
  },
};

export function Alert({ type, title, message, onClose }: AlertProps) {
  const styles = alertStyles[type];
  const Icon = styles.icon;

  return (
    <div className={clsx(
      'rounded-lg border p-4 mb-4',
      styles.bg,
      styles.border
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={clsx('h-5 w-5', styles.text)} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={clsx('text-sm font-medium', styles.text)}>{title}</h3>
          {message && (
            <div className={clsx('mt-2 text-sm', styles.text)}>
              {message}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className={clsx(
                'inline-flex rounded-md p-1.5',
                styles.text,
                'hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2',
                `focus:ring-${type}-500`
              )}
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}