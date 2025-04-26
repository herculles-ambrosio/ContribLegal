import React, { ReactNode, useState } from 'react';

export type TabItem = {
  id: string;
  label: string;
  icon?: React.ElementType;
  content: ReactNode;
};

export type TabsProps = {
  items: TabItem[];
  defaultTabId?: string;
  variant?: 'light' | 'dark';
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
};

export default function Tabs({
  items,
  defaultTabId,
  variant = 'light',
  className = '',
  tabClassName = '',
  contentClassName = ''
}: TabsProps) {
  const [activeTabId, setActiveTabId] = useState<string>(defaultTabId || (items.length > 0 ? items[0].id : ''));
  
  const isDark = variant === 'dark';
  
  const borderClass = isDark 
    ? 'border-gray-700' 
    : 'border-gray-200';
  
  const activeTabClass = isDark
    ? 'border-blue-500 text-blue-400 font-medium'
    : 'border-blue-500 text-blue-700 font-medium';
  
  const inactiveTabClass = isDark
    ? 'text-gray-400 hover:text-blue-300'
    : 'text-gray-600 hover:text-blue-500';

  const activeContent = items.find(item => item.id === activeTabId)?.content;
  
  return (
    <div className={`w-full ${className}`}>
      <div className={`flex space-x-4 border-b ${borderClass}`}>
        {items.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabId;
          
          return (
            <button
              key={tab.id}
              className={`py-2 px-4 focus:outline-none ${
                isActive
                  ? `border-b-2 ${activeTabClass}`
                  : inactiveTabClass
              } ${tabClassName}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="flex items-center">
                {Icon && <Icon className="mr-2" />}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      
      <div className={contentClassName}>
        {activeContent}
      </div>
    </div>
  );
} 