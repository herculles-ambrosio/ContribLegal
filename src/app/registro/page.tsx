'use client';

import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaUser, FaIdCard, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Funções de formatação
const formatCPFCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/g, '($1) $2-$3')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const formatCEP = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{5})(\d{3})/g, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

export default function Registro() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome_completo: '',
    cpf_cnpj: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplicar formatação apropriada
    if (name === 'cpf_cnpj') {
      formattedValue = formatCPFCNPJ(value);
    } else if (name === 'telefone') {
      formattedValue = formatPhone(value);
    } else if (name === 'cep') {
      formattedValue = formatCEP(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    if (!formData.nome_completo) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }
    
    if (!formData.cpf_cnpj) {
      newErrors.cpf_cnpj = 'CPF/CNPJ é obrigatório';
    }
    
    if (!formData.telefone) {
      newErrors.telefone = 'Telefone é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    setIsLoading(true);
    let authResponse;
    
    try {
      console.log('Iniciando registro do usuário...', formData);
      
      // Registrar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nome_completo: formData.nome_completo,
          }
        }
      });
      
      console.log('Resposta do registro auth:', { authData, authError });
      
      if (authError) {
        console.error('Erro no auth.signUp:', authError);
        throw new Error(`Erro no registro: ${authError.message}`);
      }
      
      if (!authData?.user?.id) {
        throw new Error('Usuário não foi criado corretamente: ID não encontrado');
      }

      authResponse = authData;
      
      console.log('Usuário criado com sucesso, ID:', authData.user.id);
      console.log('Inserindo dados na tabela usuarios...');

      const userData = {
        id: authData.user.id,
        email: formData.email,
        nome_completo: formData.nome_completo,
        cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        endereco: formData.endereco || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
        cep: formData.cep.replace(/\D/g, '') || '',
        role: 'contribuinte',
        tipo_usuario: 'Usuário'
      };

      console.log('Dados a serem inseridos:', userData);
      
      // Criar registro do usuário usando a API route
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar perfil do usuário');
      }

      console.log('Perfil criado com sucesso:', result.data);
      toast.success('Cadastro realizado com sucesso! Verifique seu email para confirmar o registro.');
      router.push('/login');
      
    } catch (error: any) {
      console.error('Erro completo:', error);
      
      let errorMessage = 'Ocorreu um erro durante o cadastro. Por favor, tente novamente.';
      
      if (error.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'Este CPF/CNPJ ou email já está cadastrado.';
        } else if (error.message.includes('invalid email')) {
          errorMessage = 'O email fornecido é inválido.';
        } else if (error.message.includes('weak password')) {
          errorMessage = 'A senha fornecida é muito fraca. Use pelo menos 6 caracteres.';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
      
      // Se houver erro na criação do perfil mas o usuário auth já foi criado,
      // vamos tentar deletar o usuário auth para manter consistência
      if (authResponse?.user?.id) {
        try {
          console.log('Tentando remover usuário auth após falha...', authResponse.user.id);
          const { error: deleteError } = await supabase.auth.admin.deleteUser(authResponse.user.id);
          if (deleteError) {
            console.error('Erro ao deletar usuário:', deleteError);
          } else {
            console.log('Usuário auth removido com sucesso após falha');
          }
        } catch (deleteError) {
          console.error('Erro ao limpar usuário após falha:', deleteError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <Card title="Cadastro de Contribuinte" className="bg-white shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Seu email"
                icon={FaEnvelope}
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                fullWidth
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Senha"
                  name="password"
                  type="password"
                  placeholder="Sua senha"
                  icon={FaLock}
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  fullWidth
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
                
                <Input
                  label="Confirmar Senha"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  icon={FaLock}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  fullWidth
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <Input
                label="Nome Completo"
                name="nome_completo"
                placeholder="Seu nome completo"
                icon={FaUser}
                value={formData.nome_completo}
                onChange={handleChange}
                error={errors.nome_completo}
                fullWidth
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={handleChange}
                      maxLength={18}
                      className={`pl-10 w-full rounded-md border ${
                        errors.cpf_cnpj ? 'border-red-500' : 'border-gray-300'
                      } focus:border-blue-500 focus:ring-blue-500 transition-all duration-200`}
                      placeholder="000.000.000-00"
                    />
                    <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.cpf_cnpj && (
                    <p className="mt-1 text-xs text-red-500">{errors.cpf_cnpj}</p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      maxLength={15}
                      className={`pl-10 w-full rounded-md border ${
                        errors.telefone ? 'border-red-500' : 'border-gray-300'
                      } focus:border-blue-500 focus:ring-blue-500 transition-all duration-200`}
                      placeholder="(00) 00000-0000"
                    />
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.telefone && (
                    <p className="mt-1 text-xs text-red-500">{errors.telefone}</p>
                  )}
                </div>
              </div>
              
              <Input
                label="Endereço"
                name="endereco"
                placeholder="Rua, número, bairro"
                icon={FaMapMarkerAlt}
                value={formData.endereco}
                onChange={handleChange}
                error={errors.endereco}
                fullWidth
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Cidade"
                  name="cidade"
                  placeholder="Sua cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  error={errors.cidade}
                  fullWidth
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className={`w-full rounded-md border ${
                      errors.estado ? 'border-red-500' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 py-2 px-3`}
                  >
                    <option value="">Selecione...</option>
                    {ESTADOS.map(estado => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                  {errors.estado && (
                    <p className="mt-1 text-xs text-red-500">{errors.estado}</p>
                  )}
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    maxLength={9}
                    className={`w-full rounded-md border ${
                      errors.cep ? 'border-red-500' : 'border-gray-300'
                    } focus:border-blue-500 focus:ring-blue-500 transition-all duration-200`}
                    placeholder="00000-000"
                  />
                  {errors.cep && (
                    <p className="mt-1 text-xs text-red-500">{errors.cep}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isLoading}
                fullWidth
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Cadastrar
              </Button>
              
              <p className="text-center text-sm text-gray-600">
                Já possui uma conta?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200">
                  Faça login
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
} 