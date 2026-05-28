
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  tecnico_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Técnicos
CREATE TABLE public.tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tecnicos TO authenticated;
GRANT ALL ON public.tecnicos TO service_role;
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tecnicos_select_all" ON public.tecnicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "tecnicos_admin_all" ON public.tecnicos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Status enum
CREATE TYPE public.os_status AS ENUM ('agendado', 'em_andamento', 'concluido', 'nao_realizado');

-- Ordens de serviço
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_os SERIAL NOT NULL UNIQUE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  endereco TEXT NOT NULL,
  data_agendada TIMESTAMPTZ NOT NULL,
  tipo_equipamento TEXT NOT NULL,
  tipo_servico TEXT NOT NULL,
  descricao_problema TEXT,
  tecnico_id UUID REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  valor NUMERIC(10,2) DEFAULT 0,
  status os_status NOT NULL DEFAULT 'agendado',
  -- checklist
  chk_chegou BOOLEAN DEFAULT false,
  chk_diagnostico BOOLEAN DEFAULT false,
  chk_peca_trocada BOOLEAN DEFAULT false,
  chk_teste_ok BOOLEAN DEFAULT false,
  -- técnicos
  kg_gas NUMERIC(10,2),
  pressao_alta TEXT,
  pressao_baixa TEXT,
  amperagem TEXT,
  marca_modelo TEXT,
  numero_serie TEXT,
  -- financeiro
  forma_pagamento TEXT,
  garantia_ate DATE,
  hora_finalizado TIMESTAMPTZ,
  laudo TEXT,
  motivo_nao_realizado TEXT,
  assinatura_cliente TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.ordens_servico_numero_os_seq TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é o técnico da OS
CREATE OR REPLACE FUNCTION public.is_tecnico_da_os(_user_id UUID, _tecnico_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.tecnicos WHERE id = _tecnico_id AND user_id = _user_id)
$$;

CREATE POLICY "os_admin_all" ON public.ordens_servico FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "os_tecnico_select" ON public.ordens_servico FOR SELECT TO authenticated
  USING (public.is_tecnico_da_os(auth.uid(), tecnico_id));
CREATE POLICY "os_tecnico_update" ON public.ordens_servico FOR UPDATE TO authenticated
  USING (public.is_tecnico_da_os(auth.uid(), tecnico_id));

-- Fotos
CREATE TABLE public.os_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('antes', 'depois')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.os_fotos TO authenticated;
GRANT ALL ON public.os_fotos TO service_role;
ALTER TABLE public.os_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fotos_admin_all" ON public.os_fotos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "fotos_tecnico" ON public.os_fotos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND public.is_tecnico_da_os(auth.uid(), o.tecnico_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_id AND public.is_tecnico_da_os(auth.uid(), o.tecnico_id)));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_os_updated BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger auto-criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  -- por padrão atribui role tecnico; admin atribui manualmente depois
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tecnico');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('os-fotos', 'os-fotos', true);

CREATE POLICY "fotos_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'os-fotos');
CREATE POLICY "fotos_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'os-fotos');
CREATE POLICY "fotos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'os-fotos');
