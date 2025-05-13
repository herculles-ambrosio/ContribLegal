# Contexto Técnico

## Tecnologias Utilizadas

### Frontend
- **Next.js 15.2.4**: Framework React com estrutura baseada em App Router
- **React 19.0.0**: Biblioteca para construção de interfaces de usuário
- **TailwindCSS 4**: Framework CSS utilitário para estilização
- **TypeScript 5**: Superset JavaScript com tipagem estática

### Backend e Dados
- **Supabase**: Plataforma de backend como serviço (BaaS)
  - **Autenticação**: Sistema de autenticação gerenciado
  - **Banco de Dados**: PostgreSQL gerenciado
  - **Storage**: Armazenamento de arquivos
  - **RLS (Row Level Security)**: Para controle de acesso granular

### Ferramentas e Bibliotecas
- **@supabase/auth-helpers-nextjs 0.10.0**: Helpers para integração do Supabase Auth com Next.js
- **date-fns 4.1.0**: Biblioteca para manipulação de datas
- **html5-qrcode 2.3.8**: Biblioteca para leitura de QR codes
- **jspdf 3.0.1** e **jspdf-autotable 5.0.2**: Para geração de PDFs e relatórios
- **react-hot-toast 2.5.2**: Biblioteca para notificações na interface
- **react-icons 5.5.0**: Conjunto de ícones para React
- **uuid 9.0.1**: Geração de IDs únicos

## Configuração de Desenvolvimento

### Requisitos de Sistema
- Node.js 18+ (recomendado 20+)
- NPM 9+ ou Yarn 1.22+
- Editor compatível com TypeScript (VS Code recomendado)

### Scripts de Desenvolvimento
- `npm run dev`: Inicia o servidor de desenvolvimento com TurboPack
- `npm run build`: Gera a versão de produção
- `npm run start`: Inicia o servidor com a versão de produção
- `npm run lint`: Executa verificação de linting

### Scripts Administrativos
- `npm run create-admin`: Cria um usuário administrador
- `npm run check-admin`: Verifica se um usuário é administrador
- `npm run reset-admin-password`: Redefine a senha de um administrador
- `npm run create-test-data`: Gera dados de teste para desenvolvimento

## Restrições Técnicas

### Supabase e RLS
- O funcionamento correto depende da configuração adequada de políticas RLS
- A implementação de bypass RLS para administradores requer a Service Role Key
- As funções SQL específicas devem ser criadas e mantidas no banco de dados

### Variáveis de Ambiente
Requisitos mínimos para o funcionamento:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### Arquitetura do Projeto
- App Router do Next.js requer estrutura específica de arquivos e diretórios
- Componentes cliente devem ser explicitamente marcados para interatividade
- A segurança dos dados depende da implementação correta das políticas RLS

## Dependências

### Principais
```json
{
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/supabase-js": "^2.49.3",
  "date-fns": "^4.1.0",
  "html5-qrcode": "^2.3.8",
  "jspdf": "^3.0.1",
  "jspdf-autotable": "^5.0.2",
  "next": "15.2.4",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-hot-toast": "^2.5.2",
  "react-icons": "^5.5.0",
  "uuid": "^9.0.1"
}
```

### Desenvolvimento
```json
{
  "@eslint/eslintrc": "^3",
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "15.2.4",
  "tailwindcss": "^4",
  "typescript": "^5"
}
``` 