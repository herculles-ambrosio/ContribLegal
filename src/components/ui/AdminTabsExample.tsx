'use client';

import React from 'react';
import Tabs, { TabItem } from './Tabs';
import { FaUsersCog, FaFileAlt, FaFilter } from 'react-icons/fa';

export default function AdminTabsExample() {
  // Conteúdo simplificado para demonstração
  const documentosContent = (
    <div className="p-6">
      {/* Filtros */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <FaFilter className="mr-2 text-blue-500" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="filtroContribuinte" className="block text-sm font-medium text-gray-700 mb-1">
              Contribuinte
            </label>
            <input
              type="text"
              id="filtroContribuinte"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nome do contribuinte"
            />
          </div>
          {/* Mais filtros aqui */}
        </div>
      </div>
      
      <div className="mb-6 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex flex-wrap justify-between items-center">
          <div className="text-blue-800">
            <span className="font-medium">Documentos filtrados:</span> 10 de 100
          </div>
          <div className="text-blue-800">
            <span className="font-medium">Valor total:</span> R$ 10.000,00
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-3 px-4 text-left">Contribuinte</th>
              <th className="py-3 px-4 text-left">Documento</th>
              <th className="py-3 px-4 text-left">Data</th>
              <th className="py-3 px-4 text-left">Valor</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                <div>Nome do Contribuinte</div>
                <div className="text-sm text-gray-500">123.456.789-10</div>
              </td>
              <td className="py-3 px-4">
                <div className="font-medium">Nota Fiscal de Serviço</div>
                <div className="text-sm text-gray-500">#12345</div>
              </td>
              <td className="py-3 px-4">01/05/2023</td>
              <td className="py-3 px-4">R$ 1.000,00</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Validado
                </span>
              </td>
              <td className="py-3 px-4">
                <button className="text-blue-600 hover:text-blue-800">Visualizar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const usuariosContent = (
    <div className="p-6">
      {/* Filtros */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <FaFilter className="mr-2 text-blue-500" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filtroUsuarioNome" className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <input
              type="text"
              id="filtroUsuarioNome"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nome do usuário"
            />
          </div>
          {/* Mais filtros aqui */}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-3 px-4 text-left">Nome</th>
              <th className="py-3 px-4 text-left">E-mail</th>
              <th className="py-3 px-4 text-left">CPF/CNPJ</th>
              <th className="py-3 px-4 text-left">Telefone</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                <div>João da Silva</div>
              </td>
              <td className="py-3 px-4">joao@example.com</td>
              <td className="py-3 px-4">123.456.789-10</td>
              <td className="py-3 px-4">(11) 98765-4321</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ativo
                </span>
              </td>
              <td className="py-3 px-4">
                <button className="text-blue-600 hover:text-blue-800 mr-2">Editar</button>
                <button className="text-red-600 hover:text-red-800">Desativar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const tabItems: TabItem[] = [
    {
      id: 'documentos',
      label: 'Documentos',
      icon: FaFileAlt,
      content: documentosContent
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: FaUsersCog,
      content: usuariosContent
    }
  ];

  return (
    <div className="bg-white shadow-lg rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold">Painel Administrativo</h2>
        <span className="text-sm text-gray-600">
          Administrador: <strong>Admin User</strong>
        </span>
      </div>
      
      <Tabs 
        items={tabItems} 
        defaultTabId="documentos"
      />
    </div>
  );
} 