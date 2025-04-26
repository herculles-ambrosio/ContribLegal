'use client';

import React, { useState, ReactNode } from 'react';
import { IconType } from 'react-icons';

export interface TabItem {
  id: string;
  label: string;
  icon?: IconType;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  variant?: 'light' | 'dark';
  className?: string;
  contentClassName?: string;
}

export default function Tabs({ 
  items, 
  defaultTabId,
  variant = 'light', 
  className = '',
  contentClassName = ''
}: TabsProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTabId || (items.length > 0 ? items[0].id : ''));

  // Cores baseadas no tema
  const bgColor = variant === 'dark' ? 'bg-gray-800' : 'bg-white';
  const tabColor = variant === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const activeTabColor = variant === 'dark' ? 'bg-gray-600' : 'bg-white';
  const textColor = variant === 'dark' ? 'text-white' : 'text-gray-800';
  const textColorInactive = variant === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = variant === 'dark' ? 'border-gray-600' : 'border-gray-200';

  return (
    <div className={`${className}`}>
      {/* Cabeçalho das tabs */}
      <div className={`flex ${bgColor} border-b ${borderColor}`}>
        {items.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center px-4 py-3 focus:outline-none transition-colors
                ${isActive 
                  ? `${activeTabColor} ${textColor} font-medium` 
                  : `${textColorInactive} hover:text-gray-800 hover:bg-gray-50`
                }
                ${isActive && variant === 'light' ? 'border-t-2 border-l border-r border-gray-200' : ''}
              `}
              style={isActive && variant === 'light' 
                ? { marginBottom: '-1px', borderTopColor: '#3b82f6', borderTopWidth: '2px' } 
                : {}
              }
            >
              {TabIcon && <TabIcon className="mr-2 h-4 w-4" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da tab ativa */}
      <div className={contentClassName}>
        {items.find(tab => tab.id === activeTab)?.content || null}
      </div>
    </div>
  );
}

// Para manter a retro-compatibilidade com a interface antiga
export function Tabs2({
  children,
  defaultValue,
  value,
  onValueChange,
  className = ''
}: {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string; }) {
  return (
    <div className={`flex ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  children,
  value,
  className = '',
  onClick
}: {
  children: ReactNode;
  value: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={`py-2 px-4 focus:outline-none ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  children,
  value,
  className = ''
}: {
  children: ReactNode;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
} 