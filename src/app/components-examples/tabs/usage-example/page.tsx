'use client';

import React from 'react';
import Layout from '@/components/Layout';
import Tabs, { TabItem } from '@/components/ui/Tabs';
import { FaUser, FaCog, FaBell, FaQuestion, FaUserShield } from 'react-icons/fa';
import Card from '@/components/ui/Card';

export default function TabsUsageExamplePage() {
  // Exemplo básico de tabs
  const basicTabItems: TabItem[] = [
    {
      id: 'perfil',
      label: 'Perfil',
      icon: FaUser,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Informações do Perfil</h2>
          <p className="text-gray-600 mb-4">
            Aqui você pode gerenciar todas as informações do seu perfil de usuário.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" defaultValue="João Silva" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md" defaultValue="joao@example.com" />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'config',
      label: 'Configurações',
      icon: FaCog,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Configurações da Conta</h2>
          <p className="text-gray-600 mb-4">
            Gerencie as configurações relacionadas à sua conta e preferências.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Receber notificações por email</h3>
                <p className="text-sm text-gray-500">Receba atualizações sobre sua conta por email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Tema escuro</h3>
                <p className="text-sm text-gray-500">Usar o tema escuro na interface</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notif',
      label: 'Notificações',
      icon: FaBell,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Central de Notificações</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
              <div className="flex items-start">
                <FaBell className="text-blue-500 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-800">Documento validado</h3>
                  <p className="text-sm text-blue-600">Seu documento fiscal #12345 foi validado com sucesso.</p>
                  <p className="text-xs text-blue-500 mt-1">Hoje, 14:30</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-md bg-gray-50 border-gray-200">
              <div className="flex items-start">
                <FaUser className="text-gray-500 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium">Atualização de perfil</h3>
                  <p className="text-sm text-gray-600">Seus dados de perfil foram atualizados.</p>
                  <p className="text-xs text-gray-500 mt-1">Ontem, 09:15</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ajuda',
      label: 'Ajuda',
      icon: FaQuestion,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Central de Ajuda</h2>
          <p className="text-gray-600 mb-4">
            Encontre respostas para as perguntas mais frequentes abaixo:
          </p>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-medium mb-2">Como validar um documento fiscal?</h3>
              <p className="text-sm text-gray-600">
                Para validar um documento fiscal, acesse a página "Validação de Documentos" e faça o upload do arquivo
                ou escaneie o QR code presente no documento.
              </p>
            </div>
            <div className="border-b pb-3">
              <h3 className="font-medium mb-2">Como recuperar minha senha?</h3>
              <p className="text-sm text-gray-600">
                Na tela de login, clique em "Esqueci minha senha" e siga as instruções enviadas para seu email.
              </p>
            </div>
            <div className="border-b pb-3">
              <h3 className="font-medium mb-2">Como atualizar meus dados cadastrais?</h3>
              <p className="text-sm text-gray-600">
                Acesse a aba "Perfil" em seu painel e edite as informações desejadas.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Exemplo de tabs administrativas
  const adminTabItems: TabItem[] = [
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: FaUserShield,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Gestão de Usuários</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-3 px-4 text-left">Nome</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Função</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">Usuário {i}</td>
                    <td className="py-3 px-4">usuario{i}@example.com</td>
                    <td className="py-3 px-4">{i === 1 ? 'Administrador' : 'Usuário'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${i === 3 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {i === 3 ? 'Inativo' : 'Ativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-800 mr-2">Editar</button>
                      <button className="text-red-600 hover:text-red-800">
                        {i === 3 ? 'Ativar' : 'Desativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: FaCog,
      content: (
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Configurações do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-3">Configurações gerais</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da plataforma
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue="ContribLegal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de contato
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue="contato@contriblegal.com.br"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-3">Segurança</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Autenticação em dois fatores</h3>
                    <p className="text-sm text-gray-500">Exigir para todos os usuários</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Exemplos de Uso do Componente Tabs</h1>
        
        <div className="space-y-12">
          {/* Exemplo básico */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Tabs Básico (Tema Claro)</h2>
            <Card>
              <Tabs items={basicTabItems} defaultTabId="perfil" />
            </Card>
          </div>
          
          {/* Exemplo com tema escuro */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Tabs com Tema Escuro</h2>
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <Tabs 
                items={basicTabItems} 
                defaultTabId="notif" 
                variant="dark" 
                contentClassName="bg-gray-800 text-white"
              />
            </div>
          </div>
          
          {/* Exemplo administrativo */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Painel Administrativo</h2>
            <div className="bg-white shadow-lg rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold">Painel de Administração</h2>
                <span className="text-sm text-gray-600">
                  Administrador: <strong>Admin User</strong>
                </span>
              </div>
              <Tabs 
                items={adminTabItems} 
                defaultTabId="usuarios"
              />
            </div>
          </div>
        </div>
        
        {/* Instruções de uso */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Como usar o componente Tabs</h2>
          <p className="mb-4">
            O componente de Tabs foi projetado para ser fácil de usar e altamente configurável.
            Para implementá-lo, defina os itens de tab e passe-os para o componente:
          </p>
          <div className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-auto mb-4">
            <pre>{`
// 1. Importe o componente e a interface TabItem
import Tabs, { TabItem } from '@/components/ui/Tabs';
import { FaUser, FaCog } from 'react-icons/fa';

// 2. Defina os itens das abas
const tabItems: TabItem[] = [
  {
    id: 'tab1',      // ID único da aba
    label: 'Perfil', // Texto exibido na aba
    icon: FaUser,    // Ícone opcional (react-icons)
    content: (       // Conteúdo renderizado quando a aba está ativa
      <div>
        <h2>Conteúdo da aba Perfil</h2>
        <p>Aqui vai o conteúdo da aba...</p>
      </div>
    )
  },
  {
    id: 'tab2',
    label: 'Configurações',
    icon: FaCog,
    content: <div>Conteúdo da aba Configurações</div>
  }
];

// 3. Use o componente na sua aplicação
<Tabs 
  items={tabItems}              // Array de itens de tab
  defaultTabId="tab1"           // ID da aba inicialmente ativa (opcional)
  variant="light"               // 'light' ou 'dark' (opcional, padrão: 'light')
  className="custom-class"      // Classes CSS adicionais para o componente (opcional)
  contentClassName="p-4 bg-white" // Classes CSS para o contêiner de conteúdo (opcional)
/>
            `}</pre>
          </div>
        </div>
      </div>
    </Layout>
  );
} 