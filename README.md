# 🏋️‍♂️ ImpulseFit — Sistema de Gestão de Academia

## 🌐 Acesso Online (GitHub Pages)
- **Aplicação Web (GitHub Pages):** [https://thamilischvs.github.io/impulsefit/](https://thamilischvs.github.io/impulsefit/)
- **Repositório Oficial:** [https://github.com/thamilischvs/impulsefit](https://github.com/thamilischvs/impulsefit)

---

## 📌 Visão Geral
O **ImpulseFit** é um sistema Web responsivo para gestão administrativa e recepção de academias, desenvolvido com **HTML5, CSS3, JavaScript Vanilla (ES6+), Tailwind CSS e Supabase**.

O sistema permite gerenciar o ciclo completo de **Alunos**, **Planos**, **Treinos** (com associação a alunos específicos) e **Matrículas Relacionais**, calculando indicadores financeiros e operacionais em tempo real no **Dashboard**.

---

## 🚀 Tecnologias e Regras Arquiteturais

- **Front-end:** HTML5, CSS3, JavaScript Vanilla (manipulação nativa de DOM, `async/await` e `try/catch`) e **Tailwind CSS**.
- **Back-end as a Service (BaaS):** **Supabase** (Autenticação JWT + PostgreSQL com políticas de Row Level Security — utilizando exclusivamente a chave pública `anon`).
- **UI/UX:** **SweetAlert2** (modais de confirmação e feedback de Sucesso/Erro) e **Lucide Icons**.
- **Zero Frameworks / Zero LocalStorage Data Persistence:** Toda persistência de dados ocorre exclusivamente via API do Supabase.

---

## 🗄️ Arquitetura do Banco de Dados (Supabase)

O script completo encontra-se em [`sql/schema.sql`](./sql/schema.sql) e contempla as 4 tabelas exigidas:

1. **`alunos`**: `id`, `nome`, `cpf`, `telefone`, `data_nascimento`, `status` (`ativo` / `inativo`)
2. **`planos`**: `id`, `nome`, `preco`, `duracao_meses`, `descricao`
3. **`treinos`**: `id`, `nome_treino`, `descricao`, `nivel`, `aluno_id` (associação de treino a aluno específico)
4. **`matriculas` (Tabela Relacional)**: `id`, `aluno_id`, `plano_id`, `data_inicio`, `data_fim`

---

## 📂 Estrutura Modular de Arquivos

```text
impulsefit/
├── index.html                  # Autenticação exclusiva de Operadores/Admin (Supabase Auth)
├── dashboard.html              # Layout Principal: Dashboard, Alunos, Planos, Treinos e Matrículas
├── README.md                   # Documentação do projeto
├── sql/
│   └── schema.sql              # Script SQL das 4 tabelas, FKs, GRANTs e políticas RLS
└── assets/
    ├── css/
    │   └── styles.css          # Estilos customizados, Glassmorphism e Background Fixo (Planos)
    └── js/
        ├── supabaseConfig.js   # Inicialização do cliente Supabase, Auth Guard e helpers globais
        ├── auth.js             # Login Administrativo, validação de e-mail e Logout
        ├── dashboard.js        # Orquestração de abas e cálculo dos 3 Cards de Resumo (KPIs)
        ├── alunos.js           # CRUD 1: Gestão completa da tabela `alunos`
        ├── planos.js           # CRUD 2: Gestão da tabela `planos` em Grid de 3 Cards com bg-fixed
        ├── treinos.js          # CRUD 3: Gestão da tabela `treinos` e vínculo com aluno específico
        └── matriculas.js       # Relacional: Vínculo entre `alunos` e `planos` na tabela `matriculas`
```
