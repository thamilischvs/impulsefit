-- ============================================================================
-- SISTEMA DE GESTÃO DE ACADEMIA (IRONPULSE GYM)
-- Script SQL Completo: Recriação Limpa de Tabelas, Permissões GRANT e RLS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Limpar tabelas e políticas antigas para garantir a estrutura exata
DROP TABLE IF EXISTS public.matriculas CASCADE;
DROP TABLE IF EXISTS public.treinos CASCADE;
DROP TABLE IF EXISTS public.fichas_treino CASCADE;
DROP TABLE IF EXISTS public.alunos CASCADE;
DROP TABLE IF EXISTS public.planos CASCADE;

-- ============================================================================
-- 2. TABELA: ALUNOS (public.alunos)
-- Estrutura: id, nome, cpf, telefone, data_nascimento, status (ativo/inativo)
-- ============================================================================
CREATE TABLE public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(20) NOT NULL UNIQUE,
    telefone VARCHAR(30) NOT NULL,
    data_nascimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (LOWER(status) IN ('ativo', 'inativo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. TABELA: PLANOS (public.planos)
-- Estrutura: id, nome, preco, duracao_meses, descricao
-- ============================================================================
CREATE TABLE public.planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
    duracao_meses INTEGER NOT NULL CHECK (duracao_meses > 0),
    descricao TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. TABELA: TREINOS (public.treinos)
-- Estrutura: id, nome_treino, descricao, nivel (+ aluno_id para associação)
-- ============================================================================
CREATE TABLE public.treinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_treino VARCHAR(120) NOT NULL,
    descricao TEXT NOT NULL,
    nivel VARCHAR(50) NOT NULL DEFAULT 'Intermediário',
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. TABELA RELACIONAL: MATRÍCULAS (public.matriculas)
-- Estrutura: id, aluno_id, plano_id, data_inicio, data_fim
-- ============================================================================
CREATE TABLE public.matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    plano_id UUID NOT NULL REFERENCES public.planos(id) ON DELETE RESTRICT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_datas_matricula CHECK (data_fim >= data_inicio)
);

-- ============================================================================
-- 6. PERMISSÕES DE ACESSO À API DO SUPABASE (GRANT)
-- Corrige o erro "permission denied for table ..."
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.alunos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.planos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.treinos TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.matriculas TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- 7. SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

-- Políticas para ALUNOS
CREATE POLICY "alunos_policy_all" ON public.alunos
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para PLANOS
CREATE POLICY "planos_policy_all" ON public.planos
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para TREINOS
CREATE POLICY "treinos_policy_all" ON public.treinos
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para MATRÍCULAS
CREATE POLICY "matriculas_policy_all" ON public.matriculas
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
