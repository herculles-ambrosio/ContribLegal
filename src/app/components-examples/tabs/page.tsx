'use client';

import React from 'react';
import Layout from '@/components/Layout';
import TabsExample from '@/components/ui/TabsExample';
import AdminTabsExample from '@/components/ui/AdminTabsExample';
import Card from '@/components/ui/Card';

export default function TabsExamplePage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Componentes de Tabs</h1>
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Tabs Básico</h2>
          <p className="mb-6 text-gray-600">
            Este é um exemplo de utilização do componente Tabs com diferentes tipos de conteúdo.
            Os temas claro e escuro são suportados.
          </p>
          
          <Card>
            <TabsExample />
          </Card>
        </div>
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Exemplo de Painel Administrativo</h2>
          <p className="mb-6 text-gray-600">
            Este exemplo demonstra como o componente Tabs pode ser usado para refatorar o código 
            existente no painel administrativo.
          </p>
          
          <AdminTabsExample />
        </div>

        <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 mt-12">
          <h2 className="text-2xl font-bold mb-4">Como usar o componente</h2>
          <p className="mb-4 text-gray-600">
            O componente de Tabs foi projetado para ser fácil de usar e altamente personalizável.
            Veja abaixo um exemplo de como implementar:
          </p>
          
          <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-auto">
            <pre>{`
import Tabs, { TabItem } from '@/components/ui/Tabs';
import { FaUser, FaCog } from 'react-icons/fa';

// Definir os itens das abas
const tabItems: TabItem[] = [
  {
    id: 'tab1',
    label: 'Perfil',
    icon: FaUser,
    content: <div>Conteúdo da aba Perfil</div>
  },
  {
    id: 'tab2',
    label: 'Configurações',
    icon: FaCog,
    content: <div>Conteúdo da aba Configurações</div>
  }
];

// Usando o componente
<Tabs 
  items={tabItems}
  defaultTabId="tab1"
  variant="light" // ou "dark"
  className="custom-class"
  contentClassName="p-4 bg-white"
/>
            `}</pre>
          </div>
        </div>
      </div>
    </Layout>
  );
} 