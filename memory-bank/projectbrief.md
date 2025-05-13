# Project Brief: Contribuinte Legal

## Visão Geral
Contribuinte Legal é uma aplicação web desenvolvida com Next.js e Supabase para gerenciar documentos e usuários em um sistema de contribuição legal. O projeto tem um painel administrativo que permite aos administradores visualizar e gerenciar todos os documentos e usuários do sistema.

## Objetivos Principais
- Fornecer uma plataforma para cadastro e gerenciamento de documentos legais
- Implementar um painel administrativo seguro com controle total sobre usuários e documentos
- Garantir a segurança dos dados utilizando as políticas de RLS (Row Level Security) do Supabase
- Fornecer interface intuitiva para gerenciamento de usuários e documentos

## Escopo do Projeto
- Interface de usuário responsiva desenvolvida com Next.js e TailwindCSS
- Backend utilizando Supabase para autenticação e armazenamento de dados
- Painel administrativo protegido com políticas de acesso específicas
- Sistema de digitalização de documentos (com QR code via html5-qrcode)
- Geração de relatórios em PDF (usando jspdf)
- Gerenciamento de usuários com diferentes níveis de acesso

## Requisitos Técnicos
- Frontend: Next.js 15+, React 19+, TailwindCSS 4
- Backend: Supabase (Autenticação, Banco de Dados PostgreSQL, Storage)
- Autenticação: Sistema baseado em @supabase/auth-helpers-nextjs
- Controle de acesso: Row Level Security (RLS) do Supabase
- Gerenciamento de datas: date-fns
- Notificações: react-hot-toast
- Digitalização: html5-qrcode
- Geração de PDF: jspdf e jspdf-autotable

## Restrições
- O acesso administrativo requer configuração específica, incluindo variáveis de ambiente e funções SQL
- As permissões de acesso são controladas por políticas de RLS no Supabase
- Administradores precisam ter a flag `master = 'S'` no banco de dados

## Próximos Passos Importantes
- Completar a configuração do painel administrativo
- Implementar todas as funcionalidades de gerenciamento de documentos
- Garantir que as políticas de segurança estejam corretamente implementadas
- Finalizar a interface de usuário para todas as funcionalidades 