# Contexto do Produto

## Por que o Contribuinte Legal Existe?

O Contribuinte Legal foi desenvolvido para facilitar a gestão e verificação de documentos legais, criando um sistema centralizado que permite aos usuários registrar, digitalizar e gerenciar documentos importantes relacionados a conformidades legais e fiscais.

## Problemas que Resolve

1. **Fragmentação de documentos**: Centraliza documentos legais que antes estavam espalhados por diversos sistemas ou em formato físico.
2. **Dificuldade de acesso**: Permite acesso rápido e seguro aos documentos através de uma interface web.
3. **Falta de visibilidade**: Fornece aos administradores visão completa de todos os documentos e usuários no sistema.
4. **Complexidade de gestão**: Simplifica o processo de digitalização e armazenamento de documentos através de interface intuitiva.
5. **Segurança e conformidade**: Implementa controles de acesso rigorosos através das políticas de RLS do Supabase.

## Como o Sistema Deve Funcionar

### Fluxo Principal
1. **Cadastro e Autenticação**: Usuários se cadastram e acessam o sistema através de autenticação segura pelo Supabase.
2. **Gestão de Documentos**: Usuários podem registrar novos documentos, digitalizá-los (via QR code quando aplicável) e gerenciá-los.
3. **Controle Administrativo**: Administradores têm acesso ao painel administrativo para visualizar e gerenciar todos os documentos e usuários.
4. **Geração de Relatórios**: O sistema permite gerar relatórios em PDF para documentação e acompanhamento.

### Hierarquia de Usuários
- **Administradores** (`master = 'S'`): Acesso total ao sistema, incluindo todos os documentos e usuários
- **Usuários Regulares**: Acesso apenas aos seus próprios documentos e informações

## Objetivos de Experiência do Usuário

### Para Usuários Regulares
- Interface intuitiva e responsiva para facilitar o registro e gestão de documentos
- Processo de digitalização simplificado usando scanners de QR code quando aplicável
- Notificações claras sobre o status de operações (usando react-hot-toast)
- Acesso rápido e organizado aos seus documentos

### Para Administradores
- Painel administrativo completo com visão de todos os usuários e documentos
- Ferramentas de gestão para modificar permissões e dados de usuários
- Interface para monitorar atividades e gerir o sistema
- Capacidade de gerar relatórios abrangentes

## Valor Agregado
- **Conformidade**: Ajuda organizações a manterem-se em conformidade com requisitos legais e fiscais
- **Eficiência**: Reduz o tempo gasto na localização e gestão de documentos importantes
- **Segurança**: Implementa controles de acesso rigorosos para proteger informações sensíveis
- **Visibilidade**: Fornece visão consolidada de documentos e status de conformidade 