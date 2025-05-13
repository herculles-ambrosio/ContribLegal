# Padrões do Sistema

## Arquitetura do Sistema

O Contribuinte Legal segue uma arquitetura moderna baseada em:

1. **Frontend**
   - Next.js 15+ com App Router
   - React 19+ para interface de usuário
   - TailwindCSS 4 para estilização
   - Componentização modular para manter o código organizado

2. **Backend**
   - Supabase como principal serviço de backend
   - PostgreSQL como banco de dados (fornecido pelo Supabase)
   - Row Level Security (RLS) para controle de acesso
   - Funções SQL personalizadas para operações administrativas

3. **Autenticação e Autorização**
   - Sistema baseado em Supabase Auth
   - Estratégia de token JWT
   - Controle de acesso baseado em atributos (ABAC) via RLS
   - Flag `master` para identificar administradores

## Decisões Técnicas Principais

### Escolha do Next.js com App Router
- Adoção do App Router para roteamento moderno baseado em arquivos
- Uso de componentes de servidor e cliente para otimização de performance
- Implementação de server components para operações que não requerem interatividade
- TurboBack para desenvolvimento mais rápido

### Integração com Supabase
- Escolha do Supabase como solução completa para autenticação, banco de dados e armazenamento
- Implementação de múltiplas estratégias para garantir acesso administrativo (RPC, SQL direto, fetch com apikey)
- Políticas de RLS para garantir acesso seguro aos dados

### Estratégia para Painel Administrativo
- Uso da Service Role Key para bypass de políticas RLS quando necessário
- Implementação de funções SQL específicas para operações administrativas
- Múltiplas estratégias de fallback para garantir o funcionamento do painel

### Geração de PDF e Relatórios
- Uso de jspdf e jspdf-autotable para geração de relatórios
- Implementação modular para permitir diferentes tipos de relatórios

## Padrões de Design em Uso

### Padrão de Autenticação
- Supabase Auth para gerenciamento de autenticação
- Hooks customizados para verificação de autenticação
- Middleware do Next.js para proteção de rotas

### Padrão de Gerenciamento de Estado
- Estado local para componentes simples
- Context API para estados compartilhados em áreas específicas
- Passagem de dados via Server Components quando possível

### Padrão de Componentes
- Componentes reutilizáveis e modulares
- Separação clara entre componentes de servidor e cliente
- Uso de componentes específicos para funcionalidades como escaneamento de QR code

### Padrão de Tratamento de Erros
- Sistema de notificações via react-hot-toast
- Tratamento de erros com fallbacks para garantir funcionamento
- Logging de erros no console para depuração

## Relacionamentos entre Componentes

### Estrutura de Pastas e Organização
```
/src
  /app             # Páginas e rotas da aplicação (App Router)
  /components      # Componentes reutilizáveis
  /hooks           # Hooks personalizados
  /lib             # Utilitários e funções auxiliares
  /services        # Serviços para APIs e integrações
  /types           # Definições de tipos TypeScript
  /db              # Scripts e relacionados ao banco de dados
  /scripts         # Scripts utilitários para tarefas específicas
```

### Fluxo de Dados
- Componentes cliente fazem requisições via hooks ou funções auxiliares
- Dados são processados e armazenados no Supabase
- Validação de acesso através de políticas RLS
- Resultados são exibidos em componentes com tratamento de estado de carregamento e erro 