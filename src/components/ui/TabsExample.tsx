'use client';

import React from 'react';
import Tabs, { TabItem } from './Tabs';
import { FaUser, FaCog, FaInfoCircle } from 'react-icons/fa';

export default function TabsExample() {
  // Define os itens das abas
  const tabItems: TabItem[] = [
    {
      id: 'tab1',
      label: 'Perfil',
      icon: FaUser,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Informações do Perfil</h2>
          <p className="text-gray-600">
            Este é o conteúdo da aba de perfil. Aqui você pode exibir informações sobre o usuário.
          </p>
        </div>
      )
    },
    {
      id: 'tab2',
      label: 'Configurações',
      icon: FaCog,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Configurações da Conta</h2>
          <p className="text-gray-600">
            Este é o conteúdo da aba de configurações. Aqui você pode permitir que o usuário altere as configurações da conta.
          </p>
        </div>
      )
    },
    {
      id: 'tab3',
      label: 'Sobre',
      icon: FaInfoCircle,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Sobre a Aplicação</h2>
          <p className="text-gray-600">
            Este é o conteúdo da aba sobre. Aqui você pode fornecer informações sobre a aplicação.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto my-8">
      <h1 className="text-2xl font-bold mb-6">Exemplo de Uso do Componente Tabs</h1>
      
      {/* Exemplo com o tema claro (padrão) */}
      <div className="mb-12">
        <h2 className="text-xl font-medium mb-4">Tema Claro</h2>
        <div className="border rounded-lg overflow-hidden">
          <Tabs 
            items={tabItems} 
            defaultTabId="tab1"
            contentClassName="bg-white"
          />
        </div>
      </div>
      
      {/* Exemplo com o tema escuro */}
      <div>
        <h2 className="text-xl font-medium mb-4">Tema Escuro</h2>
        <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
          <Tabs 
            items={tabItems} 
            defaultTabId="tab2"
            variant="dark"
            contentClassName="bg-gray-800 text-white"
          />
        </div>
      </div>
    </div>
  );
} 