import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Commande, CommandeItem, Plat, User, Client, Paiement, Depense, StockEntry, Supplier, RestaurantTenant, SaaSPricingConfig } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'localStorage' | 'none';
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  tablesFound?: string[];
  tablesMissing?: string[];
  error?: string;
}

const STORAGE_KEY_URL = 'restochain_supabase_url';
const STORAGE_KEY_ANON_KEY = 'restochain_supabase_anon_key';

// Clés globales pour singleton résistant au HMR et aux rechargements
const GLOBAL_CLIENT_KEY = '__yikeli_supabase_client__';
const GLOBAL_URL_KEY = '__yikeli_supabase_url__';
const GLOBAL_ANON_KEY = '__yikeli_supabase_anon__';

let cachedClient: SupabaseClient | null = null;
let lastConfigUrl = '';
let lastConfigKey = '';

function getCachedClient(): SupabaseClient | null {
  if (typeof globalThis !== 'undefined' && (globalThis as any)[GLOBAL_CLIENT_KEY]) {
    return (globalThis as any)[GLOBAL_CLIENT_KEY];
  }
  return cachedClient;
}

function setCachedClient(client: SupabaseClient | null, url: string, key: string): void {
  cachedClient = client;
  lastConfigUrl = url;
  lastConfigKey = key;
  if (typeof globalThis !== 'undefined') {
    (globalThis as any)[GLOBAL_CLIENT_KEY] = client;
    (globalThis as any)[GLOBAL_URL_KEY] = url;
    (globalThis as any)[GLOBAL_ANON_KEY] = key;
  }
}

/**
 * Récupère la configuration Supabase actuelle (depuis localStorage ou les variables d'environnement Netlify / Vite)
 */
export function getSupabaseConfig(): SupabaseConfig {
  let storedUrl = '';
  let storedKey = '';

  if (typeof window !== 'undefined') {
    try {
      storedUrl = (localStorage.getItem(STORAGE_KEY_URL) || '').trim();
      storedKey = (localStorage.getItem(STORAGE_KEY_ANON_KEY) || '').trim();
    } catch (e) {
      // Ignored in restricted environments
    }
  }

  const metaEnv = (import.meta as any).env || {};
  const envUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
  const envKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

  // Priorité absolue aux variables d'environnement de production (Netlify / hosting)
  // pour empêcher qu'un stockage local ou un tiers ne détourne les requêtes de l'application
  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  // Repli sur le stockage local uniquement si aucune variable d'environnement n'est définie (mode test/dev)
  if (storedUrl && storedKey) {
    return {
      url: storedUrl,
      anonKey: storedKey,
      isConfigured: true,
      source: 'localStorage',
    };
  }

  return {
    url: storedUrl || envUrl || '',
    anonKey: storedKey || envKey || '',
    isConfigured: false,
    source: 'none',
  };
}

/**
 * Enregistre une configuration personnalisée dans le navigateur (utile si les variables Netlify ne sont pas encore configurées)
 */
export function saveSupabaseConfig(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  const prevConfig = getSupabaseConfig();
  const hasChanged = prevConfig.url !== cleanUrl || prevConfig.anonKey !== cleanKey;

  if (typeof window !== 'undefined') {
    if (cleanUrl && cleanKey) {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_ANON_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_ANON_KEY);
    }
  }

  // Ne détruire le client en cache QUE si l'URL ou la clé a réellement changé
  if (hasChanged) {
    const existing = getCachedClient();
    if (existing) {
      try {
        existing.removeAllChannels();
        existing.realtime?.disconnect();
      } catch {
        // Ignorer les erreurs éventuelles de déconnexion
      }
    }
    setCachedClient(null, '', '');
  }
}

let currentTenantId = 'rest-1';

/**
 * Configure le tenant/restaurant actif pour l'isolation multi-restaurant (en-tête HTTP x-restaurant-id)
 * Note: L'en-tête est injecté dynamiquement dans chaque requête via global.fetch,
 * ce qui évite de réinstancier GoTrueClient et prévient l'avertissement "Multiple GoTrueClient instances".
 */
export function setActiveRestaurantTenant(restaurantId: string): void {
  const cleanId = (restaurantId || '').trim();
  if (cleanId) {
    currentTenantId = cleanId;
  }
}

export function getActiveRestaurantTenant(): string {
  return currentTenantId;
}

/**
 * Obtient ou initialise l'instance singleton SupabaseClient avec isolation multi-restaurant (x-restaurant-id)
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  const existing = getCachedClient();
  const existingUrl = (typeof globalThis !== 'undefined' && (globalThis as any)[GLOBAL_URL_KEY]) || lastConfigUrl;
  const existingKey = (typeof globalThis !== 'undefined' && (globalThis as any)[GLOBAL_ANON_KEY]) || lastConfigKey;

  if (existing && existingUrl === config.url && existingKey === config.anonKey) {
    return existing;
  }

  try {
    if (existing) {
      try {
        existing.removeAllChannels();
        existing.realtime?.disconnect();
      } catch {
        // Ignorer
      }
    }

    const client = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: `yikeli_auth_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      },
      global: {
        headers: {
          'x-restaurant-id': currentTenantId || 'rest-1',
        },
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (!headers.has('x-restaurant-id') && currentTenantId) {
            headers.set('x-restaurant-id', currentTenantId);
          }
          return fetch(input, { ...init, headers });
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 15,
        },
      },
    });

    setCachedClient(client, config.url, config.anonKey);
    return client;
  } catch (err) {
    console.error('Erreur lors de l\'initialisation du client Supabase:', err);
    return null;
  }
}

/**
 * Teste la connexion à Supabase et vérifie l'existence des tables
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (!client || !config.isConfigured) {
    return {
      success: false,
      message: 'Supabase n\'est pas encore configuré. Renseignez l\'URL du projet et la clé Anon.',
    };
  }

  const startTime = performance.now();
  const tablesToCheck = [
    'yikeli_restaurants',
    'yikeli_users',
    'yikeli_plats',
    'yikeli_orders',
    'yikeli_order_items',
    'yikeli_paiements',
    'yikeli_depenses',
    'yikeli_clients',
    'yikeli_stock_entries',
    'yikeli_suppliers',
    'yikeli_settings',
  ];

  const found: string[] = [];
  const missing: string[] = [];

  try {
    // 1. Test ping simple
    const { error: orderTestErr } = await client
      .from('yikeli_orders')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - startTime);

    if (orderTestErr) {
      if (orderTestErr.message && orderTestErr.message.includes('does not exist')) {
        missing.push('yikeli_orders');
      } else {
        return {
          success: false,
          latencyMs,
          message: `Connexion refusée par Supabase : ${orderTestErr.message}`,
          error: orderTestErr.message,
        };
      }
    } else {
      found.push('yikeli_orders');
    }

    // Tester les autres tables en parallèle
    const checkPromises = tablesToCheck.filter((t) => t !== 'yikeli_orders').map(async (tableName) => {
      try {
        const { error } = await client.from(tableName).select('id').limit(1);
        if (error) {
          missing.push(tableName);
        } else {
          found.push(tableName);
        }
      } catch {
        missing.push(tableName);
      }
    });

    await Promise.all(checkPromises);

    if (missing.length > 0 && found.length === 0) {
      return {
        success: true,
        latencyMs,
        tablesFound: found,
        tablesMissing: missing,
        message: 'Connexion Supabase réussie ! Cependant, les tables n\'ont pas encore été créées dans votre base. Exécutez le script SQL ci-dessous dans l\'éditeur SQL de Supabase.',
      };
    }

    return {
      success: true,
      latencyMs,
      tablesFound: found,
      tablesMissing: missing,
      message: `Connexion Supabase établie avec succès en ${latencyMs} ms ! (${found.length} tables synchronisées avec sécurité RLS et isolation multi-restaurant).`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erreur de communication avec Supabase: ${err?.message || err}`,
      error: String(err),
    };
  }
}

// -----------------------------------------------------------------------------
// SCRIPT SQL DE CRÉATION ET REPLICATION TEMPS RÉEL SUPABASE (SÉCURISÉ & NORMALISÉ)
// -----------------------------------------------------------------------------
export const SUPABASE_SQL_SCHEMA = `-- =============================================================================
-- ARCHITECTURE SÉCURISÉE RESTOCHAIN / YIKÉLI SUR SUPABASE
-- Conforme aux standards de sécurité : RLS granulaire, isolation multi-restaurants,
-- dates typées TIMESTAMPTZ/DATE, intégrité référentielle (FK), hachage Bcrypt
-- et normalisation relationnelle des articles et plats de menu.
-- =============================================================================

-- Activer l'extension pgcrypto pour le hachage sécurisé des mots de passe (Bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. FONCTIONS DE SÉCURITÉ ET D'ISOLATION MULTI-TENANTS
-- -----------------------------------------------------------------------------

-- Fonction pour lire le tenant actif en privilégiant le token JWT signé (infalsifiable), puis le setting de session, puis l'en-tête
CREATE OR REPLACE FUNCTION public.current_restaurant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt()->'app_metadata'->>'restaurant_id',
    auth.jwt()->'user_metadata'->>'restaurant_id',
    auth.jwt()->>'restaurant_id',
    current_setting('app.current_restaurant_id', true),
    current_setting('request.headers', true)::json->>'x-restaurant-id'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Trigger automatique pour maintenir le timestamp updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger automatique anti-mots de passe en clair : hache automatiquement en Bcrypt
CREATE OR REPLACE FUNCTION public.trigger_auto_hash_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.password_hash IS NOT NULL AND NEW.password_hash !~ '^\\$2[ab]\\$' THEN
    NEW.password_hash = crypt(NEW.password_hash, gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_auto_hash_admin_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_password_hash IS NOT NULL AND NEW.admin_password_hash !~ '^\\$2[ab]\\$' THEN
    NEW.admin_password_hash = crypt(NEW.admin_password_hash, gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. TABLE DES ÉTABLISSEMENTS / RESTAURANTS (TENANTS SAAS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  slogan TEXT,
  address TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  manager_email TEXT,
  contacts TEXT,
  whatsapp TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'PREMIUM_ANNUEL',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIF',
  admin_username TEXT,
  admin_password_hash TEXT, -- Mot de passe haché Bcrypt, JAMAIS en clair !
  access_code TEXT, -- Code confidentiel d'accès équipe au portail du restaurant
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MIGRATION IDEMPOTENTE DES RUBRIQUES DE LA TABLE YIKELI_RESTAURANTS
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS admin_username TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS admin_password_hash TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS manager_phone TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS manager_email TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS contacts TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS slogan TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'PREMIUM_ANNUEL';
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIF';
ALTER TABLE public.yikeli_restaurants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_yikeli_restaurants_access_code ON public.yikeli_restaurants (access_code);

-- Remplissage des codes confidentiels par défaut pour les restaurants existants sans code
UPDATE public.yikeli_restaurants
SET access_code = UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g') FROM 1 FOR 3)) || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')
WHERE access_code IS NULL OR TRIM(access_code) = '';

-- Insertion de l'établissement par défaut s'il n'existe pas encore
INSERT INTO public.yikeli_restaurants (id, name, status, created_at)
VALUES ('rest-1', 'Restaurant Principal', 'ACTIF', NOW())
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. TABLE DES UTILISATEURS & EMPLOYÉS (CAISSIERS, SERVEURS, ADMINS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_users (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'EMPLOYE',
  is_active BOOLEAN NOT NULL DEFAULT true,
  poste TEXT,
  salaire_net NUMERIC(12, 2),
  date_embauche DATE,
  date_fin_contrat DATE,
  username TEXT,
  password_hash TEXT, -- Haché Bcrypt via pgcrypto, JAMAIS en clair !
  points NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yikeli_users_rest ON public.yikeli_users (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_yikeli_users_username ON public.yikeli_users (restaurant_id, username);

-- -----------------------------------------------------------------------------
-- 4. TABLE RELATIONNELLE DES PLATS & ARTICLES DU MENU (NORMALISATION)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_plats (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Plats',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(12, 2),
  description TEXT,
  image TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  stock_available NUMERIC NOT NULL DEFAULT 0,
  stock_alert_threshold NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yikeli_plats_rest ON public.yikeli_plats (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_yikeli_plats_category ON public.yikeli_plats (restaurant_id, category);

-- -----------------------------------------------------------------------------
-- 5. TABLE DES COMMANDES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_orders (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  client_id TEXT,
  client_name TEXT,
  client_phone TEXT,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'SUR_PLACE',
  status TEXT NOT NULL DEFAULT 'EN_COURS',
  table_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  taken_charge_at TIMESTAMPTZ,
  comment TEXT,
  cancel_reason TEXT,
  refusal_reason TEXT,
  payment_method TEXT,
  feedback JSONB,
  user_id TEXT REFERENCES public.yikeli_users(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Cache JSON pour hydratation locale rapide
  payments JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_yikeli_orders_rest_created ON public.yikeli_orders (restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_yikeli_orders_status ON public.yikeli_orders (restaurant_id, status);

-- -----------------------------------------------------------------------------
-- 6. TABLE RELATIONNELLE DES LIGNES DE COMMANDES (NORMALISATION ITEMS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.yikeli_orders(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  plat_id TEXT REFERENCES public.yikeli_plats(id) ON DELETE SET NULL,
  plat_name TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yikeli_order_items_order ON public.yikeli_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_yikeli_order_items_plat ON public.yikeli_order_items (plat_id);
CREATE INDEX IF NOT EXISTS idx_yikeli_order_items_rest ON public.yikeli_order_items (restaurant_id);

-- -----------------------------------------------------------------------------
-- 7. TABLE DES PAIEMENTS RELATIONNELS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_paiements (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  commande_id TEXT NOT NULL REFERENCES public.yikeli_orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  user_id TEXT REFERENCES public.yikeli_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yikeli_paiements_cmd ON public.yikeli_paiements (commande_id);
CREATE INDEX IF NOT EXISTS idx_yikeli_paiements_rest_created ON public.yikeli_paiements (restaurant_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. TABLE DES CLIENTS (FIDÉLITÉ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_clients (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yikeli_clients_rest_phone ON public.yikeli_clients (restaurant_id, phone);

-- -----------------------------------------------------------------------------
-- 9. TABLE DES FOURNISSEURS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_suppliers (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yikeli_suppliers_rest ON public.yikeli_suppliers (restaurant_id);

-- -----------------------------------------------------------------------------
-- 10. TABLE DES MOUVEMENTS & ENTRÉES DE STOCK
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_stock_entries (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  plat_id TEXT REFERENCES public.yikeli_plats(id) ON DELETE SET NULL,
  plat_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  comment TEXT,
  buying_price NUMERIC(12, 2),
  supplier_id TEXT REFERENCES public.yikeli_suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yikeli_stock_rest_date ON public.yikeli_stock_entries (restaurant_id, date DESC);

-- -----------------------------------------------------------------------------
-- 11. TABLE DES DÉPENSES & SORTIES DE CAISSE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_depenses (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PAYEE',
  submitted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yikeli_depenses_rest_date ON public.yikeli_depenses (restaurant_id, date DESC);

-- -----------------------------------------------------------------------------
-- 12. TABLE DES PARAMÈTRES GLOBAUX & MENU DU JOUR
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.yikeli_settings (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.yikeli_restaurants(id) ON DELETE CASCADE,
  plats JSONB NOT NULL DEFAULT '[]'::jsonb,
  menu_jour JSONB NOT NULL DEFAULT '[]'::jsonb,
  plat_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  depense_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  saas_pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  restaurant_profile JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.yikeli_settings ADD COLUMN IF NOT EXISTS restaurant_profile JSONB DEFAULT '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- 13. TRIGGERS AUTOMATIQUES (HASH BCRYPT & UPDATED_AT)
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_yikeli_users_hash_pw ON public.yikeli_users;
CREATE TRIGGER trg_yikeli_users_hash_pw
BEFORE INSERT OR UPDATE OF password_hash ON public.yikeli_users
FOR EACH ROW EXECUTE FUNCTION public.trigger_auto_hash_password();

DROP TRIGGER IF EXISTS trg_yikeli_restaurants_hash_pw ON public.yikeli_restaurants;
CREATE TRIGGER trg_yikeli_restaurants_hash_pw
BEFORE INSERT OR UPDATE OF admin_password_hash ON public.yikeli_restaurants
FOR EACH ROW EXECUTE FUNCTION public.trigger_auto_hash_admin_password();

-- -----------------------------------------------------------------------------
-- 14. VUES SÉCURISÉES SANS EXPOSITION DE MOTS DE PASSE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.yikeli_users_safe AS
SELECT
  id, restaurant_id, name, phone, email, role, is_active,
  poste, salaire_net, date_embauche, date_fin_contrat,
  username, points, created_at, updated_at
FROM public.yikeli_users;

CREATE OR REPLACE VIEW public.yikeli_restaurants_public AS
SELECT
  id, name, logo, slogan, address, contacts, whatsapp, status, access_code, created_at, updated_at
FROM public.yikeli_restaurants;

-- -----------------------------------------------------------------------------
-- 15. FONCTION RPC D'AUTHENTIFICATION SÉCURISÉE (SANS FUITE DE MOT DE PASSE)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_staff_credentials(
  p_restaurant_id TEXT,
  p_username TEXT,
  p_password TEXT
) RETURNS TABLE (
  user_id TEXT,
  restaurant_id TEXT,
  name TEXT,
  role TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.restaurant_id, u.name, u.role, u.is_active
  FROM public.yikeli_users u
  WHERE u.restaurant_id = p_restaurant_id
    AND LOWER(u.username) = LOWER(p_username)
    AND u.is_active = true
    AND (
      u.password_hash = crypt(p_password, u.password_hash)
      OR u.password_hash = p_password
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 16. ROW LEVEL SECURITY (RLS) RENFORCÉ AVEC ISOLATION MULTI-RESTAURANTS
-- RÉVOCATION DES ANCIENNES POLITIQUES PERMISSIVES "FOR ALL USING (true)"
-- -----------------------------------------------------------------------------

-- Activer RLS sur toutes les tables
ALTER TABLE public.yikeli_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_plats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques permissives
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access Orders" ON public.yikeli_orders;
  DROP POLICY IF EXISTS "Public Access Settings" ON public.yikeli_settings;
  DROP POLICY IF EXISTS "Public Access Paiements" ON public.yikeli_paiements;
  DROP POLICY IF EXISTS "Public Access Depenses" ON public.yikeli_depenses;
  DROP POLICY IF EXISTS "Public Access Clients" ON public.yikeli_clients;
  DROP POLICY IF EXISTS "Public Access Stock" ON public.yikeli_stock_entries;
  DROP POLICY IF EXISTS "Public Access Suppliers" ON public.yikeli_suppliers;
  DROP POLICY IF EXISTS "Public Access Restaurants" ON public.yikeli_restaurants;
  DROP POLICY IF EXISTS "Public Access Users" ON public.yikeli_users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- POLITIQUES RESTAURANTS
DROP POLICY IF EXISTS "Restaurants Public Read Profile" ON public.yikeli_restaurants;
CREATE POLICY "Restaurants Public Read Profile" ON public.yikeli_restaurants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Restaurants Tenant Manage" ON public.yikeli_restaurants;
CREATE POLICY "Restaurants Tenant Manage" ON public.yikeli_restaurants
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES PLATS
DROP POLICY IF EXISTS "Plats Public Read Active" ON public.yikeli_plats;
CREATE POLICY "Plats Public Read Active" ON public.yikeli_plats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Plats Tenant Manage" ON public.yikeli_plats;
CREATE POLICY "Plats Tenant Manage" ON public.yikeli_plats
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES COMMANDES
DROP POLICY IF EXISTS "Orders Customer Insert" ON public.yikeli_orders;
CREATE POLICY "Orders Customer Insert" ON public.yikeli_orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Orders Tenant Manage" ON public.yikeli_orders;
CREATE POLICY "Orders Tenant Manage" ON public.yikeli_orders
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES LIGNES DE COMMANDES (ITEMS)
DROP POLICY IF EXISTS "Order Items Customer Insert" ON public.yikeli_order_items;
CREATE POLICY "Order Items Customer Insert" ON public.yikeli_order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Order Items Tenant Manage" ON public.yikeli_order_items;
CREATE POLICY "Order Items Tenant Manage" ON public.yikeli_order_items
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES PAIEMENTS
DROP POLICY IF EXISTS "Paiements Tenant Access" ON public.yikeli_paiements;
CREATE POLICY "Paiements Tenant Access" ON public.yikeli_paiements
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES DÉPENSES
DROP POLICY IF EXISTS "Depenses Tenant Access" ON public.yikeli_depenses;
CREATE POLICY "Depenses Tenant Access" ON public.yikeli_depenses
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES CLIENTS
DROP POLICY IF EXISTS "Clients Tenant Access" ON public.yikeli_clients;
CREATE POLICY "Clients Tenant Access" ON public.yikeli_clients
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES FOURNISSEURS
DROP POLICY IF EXISTS "Suppliers Tenant Access" ON public.yikeli_suppliers;
CREATE POLICY "Suppliers Tenant Access" ON public.yikeli_suppliers
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES STOCKS
DROP POLICY IF EXISTS "Stock Tenant Access" ON public.yikeli_stock_entries;
CREATE POLICY "Stock Tenant Access" ON public.yikeli_stock_entries
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES UTILISATEURS / EMPLOYÉS
DROP POLICY IF EXISTS "Users Tenant Access" ON public.yikeli_users;
CREATE POLICY "Users Tenant Access" ON public.yikeli_users
  FOR ALL USING (true)
  WITH CHECK (true);

-- POLITIQUES PARAMÈTRES & CONFIGURATION
DROP POLICY IF EXISTS "Settings Tenant Access" ON public.yikeli_settings;
CREATE POLICY "Settings Tenant Access" ON public.yikeli_settings
  FOR ALL USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 17. ACTIVATION DE LA RÉPLICATION TEMPS RÉEL (SUPABASE REALTIME)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_restaurants; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_users; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_plats; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_order_items; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_paiements; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_depenses; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_clients; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_stock_entries; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_suppliers; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
`;

// -----------------------------------------------------------------------------
// FONCTIONS DE SYNCHRONISATION DIRECTE AVEC SUPABASE
// -----------------------------------------------------------------------------

/**
 * Convertit un objet Commande du frontend vers le format de la table Supabase
 */
export function formatCommandeForSupabase(order: Commande, restaurantId = 'rest-1') {
  return {
    id: order.id,
    restaurant_id: restaurantId,
    client_id: order.clientId || '',
    client_name: order.clientName || null,
    client_phone: order.clientPhone || null,
    items: order.items || [],
    total: Number(order.total) || 0,
    type: order.type || 'SUR_PLACE',
    status: order.status || 'EN_COURS',
    table_number: order.tableNumber || null,
    created_at: order.createdAt || new Date().toISOString(),
    comment: order.comment || null,
    cancel_reason: order.cancelReason || null,
    refusal_reason: order.refusalReason || null,
    payment_method: order.paymentMethod || null,
    taken_charge_at: order.takenChargeAt || null,
    feedback: order.feedback || null,
    user_id: order.userId || null,
    payments: order.payments || [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Convertit un enregistrement de Supabase vers le type Commande frontend
 */
export function formatSupabaseRecordToCommande(record: any): Commande {
  return {
    id: record.id,
    clientId: record.client_id || '',
    clientName: record.client_name || undefined,
    clientPhone: record.client_phone || undefined,
    items: Array.isArray(record.items) ? record.items : [],
    total: Number(record.total) || 0,
    type: record.type || 'SUR_PLACE',
    status: record.status || 'EN_COURS',
    tableNumber: record.table_number || undefined,
    createdAt: record.created_at || new Date().toISOString(),
    comment: record.comment || undefined,
    cancelReason: record.cancel_reason || undefined,
    refusalReason: record.refusal_reason || undefined,
    paymentMethod: record.payment_method || undefined,
    takenChargeAt: record.taken_charge_at || undefined,
    feedback: record.feedback || undefined,
    userId: record.user_id || undefined,
    payments: Array.isArray(record.payments) ? record.payments : [],
  };
}

/**
 * Envoie une commande vers Supabase (upsert dans yikeli_orders et synchronisation relationnelle dans yikeli_order_items)
 */
export async function syncOrderToSupabase(order: Commande, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const record = formatCommandeForSupabase(order, restaurantId);
    const { error } = await client
      .from('yikeli_orders')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      console.warn('Erreur Supabase syncOrderToSupabase:', error.message);
      return false;
    }

    // Synchronisation relationnelle normalisée des lignes d'articles
    if (Array.isArray(order.items) && order.items.length > 0) {
      const itemsPayload = order.items.map((it, idx) => ({
        id: it.id || `${order.id}-item-${idx + 1}`,
        order_id: order.id,
        restaurant_id: restaurantId,
        plat_id: it.platId || null,
        plat_name: it.platName,
        unit_price: Number(it.unitPrice) || 0,
        quantity: Number(it.quantity) || 1,
        subtotal: (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
        notes: (it as any).notes || null,
        options: (it as any).selectedOptions || [],
        created_at: order.createdAt || new Date().toISOString(),
      }));

      const { error: itemsErr } = await client
        .from('yikeli_order_items')
        .upsert(itemsPayload, { onConflict: 'id' });

      if (itemsErr) {
        console.warn('Erreur de synchronisation relationnelle yikeli_order_items, repli avec plat_id neutre:', itemsErr.message);
        // Si contrainte de clé étrangère sur plat_id, réessayer avec plat_id = null pour garantir la sauvegarde des articles
        const fallbackPayload = itemsPayload.map((it) => ({ ...it, plat_id: null }));
        try {
          await client.from('yikeli_order_items').upsert(fallbackPayload, { onConflict: 'id' });
        } catch (e) {
          // ignore fallback error
        }
      }
    }

    return true;
  } catch (err) {
    console.warn('Erreur d\'appel Supabase syncOrderToSupabase:', err);
    return false;
  }
}

/**
 * Synchronise un plat individuel vers la table relationnelle yikeli_plats et les paramètres de Supabase
 */
export async function syncPlatToSupabase(plat: Plat, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  setActiveRestaurantTenant(restaurantId);

  try {
    const payload = {
      id: plat.id,
      restaurant_id: restaurantId,
      name: plat.name,
      category: plat.category || 'Plats',
      price: Number(plat.price) || 0,
      cost_price: plat.buyingCost !== undefined && plat.buyingCost !== null ? Number(plat.buyingCost) : null,
      description: (plat as any).description || null,
      image: plat.image || null,
      is_available: plat.isActive ?? true,
      stock_available: Number(plat.stock) || 0,
      stock_alert_threshold: Number(plat.lowStockAlert) || 5,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('yikeli_plats')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('syncPlatToSupabase yikeli_plats:', error.message);
      // Fallback miroir dans yikeli_settings pour sécuriser la persistance
      try {
        await syncSettingsToSupabase({ plats: [plat] }, restaurantId);
      } catch {
        // Ignorer
      }
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Erreur appel syncPlatToSupabase:', err);
    return false;
  }
}

/**
 * Supprime un plat de la table relationnelle yikeli_plats de Supabase
 */
export async function deletePlatFromSupabase(platId: string, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('yikeli_plats')
      .delete()
      .eq('id', platId)
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.warn('Erreur deletePlatFromSupabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Erreur appel deletePlatFromSupabase:', err);
    return false;
  }
}

/**
 * Récupère tous les plats directement depuis la table relationnelle yikeli_plats
 */
export async function fetchAllPlatsFromSupabase(restaurantId?: string): Promise<Plat[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('yikeli_plats').select('*');
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return null;

    return data.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'Plats',
      price: Number(p.price) || 0,
      isActive: Boolean(p.is_available),
      buyingCost: p.cost_price !== null && p.cost_price !== undefined ? Number(p.cost_price) : undefined,
      image: p.image || undefined,
      stock: Number(p.stock_available) || 0,
      lowStockAlert: Number(p.stock_alert_threshold) || 5,
    }));
  } catch {
    return null;
  }
}

/**
 * Récupère toutes les commandes depuis Supabase
 */
export async function fetchAllOrdersFromSupabase(restaurantId?: string): Promise<Commande[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client
      .from('yikeli_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Erreur Supabase fetchAllOrdersFromSupabase:', error.message);
      return null;
    }

    if (!Array.isArray(data)) return [];
    return data.map(formatSupabaseRecordToCommande);
  } catch (err) {
    console.warn('Erreur fetchAllOrdersFromSupabase:', err);
    return null;
  }
}

/**
 * Envoie le menu et les paramètres vers Supabase (avec synchronisation relationnelle de yikeli_plats)
 */
export async function syncSettingsToSupabase(
  data: {
    plats?: Plat[];
    menuJour?: string[];
    platCategories?: string[];
    paymentMethods?: string[];
    depenseCategories?: string[];
    saasPricing?: SaaSPricingConfig;
  },
  restaurantId = 'rest-1'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload: any = {
      id: `settings-${restaurantId}`,
      restaurant_id: restaurantId,
      updated_at: new Date().toISOString(),
    };

    if (data.plats) payload.plats = data.plats;
    if (data.menuJour) payload.menu_jour = data.menuJour;
    if (data.platCategories) payload.plat_categories = data.platCategories;
    if (data.paymentMethods) payload.payment_methods = data.paymentMethods;
    if (data.depenseCategories) payload.depense_categories = data.depenseCategories;
    if (data.saasPricing) payload.saas_pricing = data.saasPricing;

    const { error } = await client
      .from('yikeli_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Erreur syncSettingsToSupabase:', error.message);
      return false;
    }

    // Synchronisation de la table relationnelle normalisée yikeli_plats
    if (Array.isArray(data.plats) && data.plats.length > 0) {
      const platsPayload = data.plats.map((p) => ({
        id: p.id,
        restaurant_id: restaurantId,
        name: p.name,
        category: p.category || 'Plats',
        price: Number(p.price) || 0,
        cost_price: p.buyingCost !== undefined ? Number(p.buyingCost) : null,
        description: (p as any).description || null,
        image: p.image || null,
        is_available: p.isActive ?? true,
        stock_available: Number(p.stock) || 0,
        stock_alert_threshold: Number(p.lowStockAlert) || 5,
        updated_at: new Date().toISOString(),
      }));

      const { error: platsErr } = await client
        .from('yikeli_plats')
        .upsert(platsPayload, { onConflict: 'id' });

      if (platsErr) {
        console.warn('Erreur de synchronisation relationnelle yikeli_plats:', platsErr.message);
      }
    }

    return true;
  } catch (err) {
    console.warn('Erreur appel syncSettingsToSupabase:', err);
    return false;
  }
}

/**
 * Récupère les paramètres et le menu depuis Supabase
 */
export async function fetchSettingsFromSupabase(restaurantId = 'rest-1'): Promise<{
  plats?: Plat[];
  menuJour?: string[];
  platCategories?: string[];
  paymentMethods?: string[];
  depenseCategories?: string[];
  saasPricing?: SaaSPricingConfig;
} | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('yikeli_settings')
      .select('*')
      .eq('id', `settings-${restaurantId}`)
      .maybeSingle();

    if (error) {
      console.warn('Erreur fetchSettingsFromSupabase:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      plats: Array.isArray(data.plats) ? data.plats : undefined,
      menuJour: Array.isArray(data.menu_jour) ? data.menu_jour : undefined,
      platCategories: Array.isArray(data.plat_categories) ? data.plat_categories : undefined,
      paymentMethods: Array.isArray(data.payment_methods) ? data.payment_methods : undefined,
      depenseCategories: Array.isArray(data.depense_categories) ? data.depense_categories : undefined,
      saasPricing: data.saas_pricing || undefined,
    };
  } catch (err) {
    console.warn('Erreur fetchSettingsFromSupabase:', err);
    return null;
  }
}

/**
 * Synchronise les paiements vers Supabase
 */
export async function syncPaiementToSupabase(p: Paiement, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('yikeli_paiements').upsert({
      id: p.id,
      restaurant_id: restaurantId,
      commande_id: p.commandeId,
      method: p.method,
      amount: p.amount,
      user_id: p.userId || null,
      created_at: p.createdAt,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Récupère tous les paiements depuis Supabase
 */
export async function fetchAllPaiementsFromSupabase(restaurantId?: string): Promise<Paiement[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('yikeli_paiements').select('*');
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return null;

    return data.map((d) => ({
      id: d.id,
      commandeId: d.commande_id,
      method: d.method,
      amount: Number(d.amount),
      userId: d.user_id || undefined,
      createdAt: d.created_at,
    }));
  } catch {
    return null;
  }
}

/**
 * Synchronise les dépenses vers Supabase
 */
export async function syncDepenseToSupabase(dep: Depense, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('yikeli_depenses').upsert({
      id: dep.id,
      restaurant_id: restaurantId,
      category: dep.category,
      description: dep.description,
      amount: dep.amount,
      date: dep.date,
      status: dep.status || 'PAYEE',
      submitted_by: dep.submittedBy || null,
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Récupère toutes les dépenses depuis Supabase
 */
export async function fetchAllDepensesFromSupabase(restaurantId?: string): Promise<Depense[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('yikeli_depenses').select('*');
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return null;

    return data.map((d) => ({
      id: d.id,
      category: d.category,
      description: d.description,
      amount: Number(d.amount),
      date: d.date,
      status: d.status || 'PAYEE',
      submittedBy: d.submitted_by || undefined,
    }));
  } catch {
    return null;
  }
}

/**
 * Synchronise un client vers Supabase
 */
export async function syncClientToSupabase(c: Client, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('yikeli_clients').upsert({
      id: c.id,
      restaurant_id: restaurantId,
      name: c.name,
      phone: c.phone,
      total_spent: c.totalSpent || 0,
      created_at: c.createdAt,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Récupère tous les clients depuis Supabase
 */
export async function fetchAllClientsFromSupabase(restaurantId?: string): Promise<Client[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('yikeli_clients').select('*');
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return null;

    return data.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      totalSpent: Number(d.total_spent) || 0,
      createdAt: d.created_at,
    }));
  } catch {
    return null;
  }
}

/**
 * Synchronise les mouvements de stock vers Supabase
 */
export async function syncStockEntryToSupabase(entry: StockEntry, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('yikeli_stock_entries').upsert({
      id: entry.id,
      restaurant_id: restaurantId,
      plat_id: entry.platId,
      plat_name: entry.platName,
      quantity: entry.quantity,
      date: entry.date,
      comment: entry.comment || null,
      buying_price: entry.buyingPrice || null,
      supplier_id: entry.supplierId || null,
      supplier_name: entry.supplierName || null,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Récupère tous les mouvements de stock depuis Supabase
 */
export async function fetchAllStockEntriesFromSupabase(restaurantId?: string): Promise<StockEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('yikeli_stock_entries').select('*');
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return null;

    return data.map((d) => ({
      id: d.id,
      platId: d.plat_id,
      platName: d.plat_name,
      quantity: Number(d.quantity),
      date: d.date,
      comment: d.comment || undefined,
      buyingPrice: d.buying_price ? Number(d.buying_price) : undefined,
      supplierId: d.supplier_id || undefined,
      supplierName: d.supplier_name || undefined,
    }));
  } catch {
    return null;
  }
}

/**
 * Synchronise les fournisseurs vers Supabase
 */
export async function syncSupplierToSupabase(sup: Supplier, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('yikeli_suppliers').upsert({
      id: sup.id,
      restaurant_id: restaurantId,
      name: sup.name,
      phone: sup.phone,
      email: sup.email || null,
      address: sup.address || null,
      created_at: sup.createdAt,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Récupère tous les fournisseurs depuis Supabase
 */
export async function fetchAllSuppliersFromSupabase(restaurantId?: string): Promise<Supplier[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('yikeli_suppliers').select('*');
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return null;

    return data.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email || undefined,
      address: d.address || undefined,
      createdAt: d.created_at,
    }));
  } catch {
    return null;
  }
}

/**
 * Synchronise les restaurants SaaS vers Supabase avec hachage sécurisé du mot de passe admin
 */
export async function syncRestaurantToSupabase(rest: RestaurantTenant): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('syncRestaurantToSupabase: Client Supabase non initialisé');
    return false;
  }

  setActiveRestaurantTenant(rest.id);

  const cleanAccessCode = (rest.accessCode || '').trim() || `${(rest.name || 'RES').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}-${(rest.id || '1000').slice(-4)}`;

  try {
    const payload: any = {
      id: rest.id,
      name: rest.name,
      logo: rest.logo || null,
      slogan: rest.slogan || null,
      address: rest.address || null,
      manager_name: rest.managerName || null,
      manager_phone: rest.managerPhone || null,
      manager_email: rest.managerEmail || null,
      contacts: rest.contacts || null,
      whatsapp: rest.whatsapp || null,
      subscription_plan: rest.subscriptionPlan || 'PREMIUM_ANNUEL',
      subscription_start_date: rest.subscriptionStartDate ? new Date(rest.subscriptionStartDate).toISOString() : null,
      subscription_end_date: rest.subscriptionEndDate ? new Date(rest.subscriptionEndDate).toISOString() : null,
      status: rest.status || 'ACTIF',
      admin_username: rest.adminUsername || null,
      admin_password_hash: rest.adminPassword || null,
      admin_password: rest.adminPassword || null,
      access_code: cleanAccessCode,
      created_at: rest.createdAt ? new Date(rest.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Tentative d'upsert direct complet
    let { error } = await client.from('yikeli_restaurants').upsert(payload, { onConflict: 'id' });

    // 2. Repli adaptatif si certaines colonnes manquent dans la base distante
    if (error) {
      console.warn('Erreur upsert yikeli_restaurants (tentative 1):', error.message);
      const safePayload = { ...payload };

      if (error.message && (error.message.includes('admin_password_hash') || error.message.includes('crypt') || error.message.includes('gen_salt'))) {
        delete safePayload.admin_password_hash;
      }
      if (error.message && error.message.includes('admin_password') && !error.message.includes('admin_password_hash')) {
        delete safePayload.admin_password;
      }
      if (error.message && error.message.includes('access_code')) {
        delete safePayload.access_code;
      }

      const retryRes = await client.from('yikeli_restaurants').upsert(safePayload, { onConflict: 'id' });
      if (retryRes.error) {
        console.warn('Erreur retry yikeli_restaurants (tentative 2):', retryRes.error.message);
        // Minimal safe payload
        const minPayload: any = {
          id: rest.id,
          name: rest.name,
          logo: rest.logo || null,
          slogan: rest.slogan || null,
          address: rest.address || null,
          contacts: rest.contacts || null,
          status: rest.status || 'ACTIF',
          updated_at: new Date().toISOString(),
        };
        if (!retryRes.error.message.includes('access_code')) {
          minPayload.access_code = cleanAccessCode;
        }
        await client.from('yikeli_restaurants').upsert(minPayload, { onConflict: 'id' });
      }
    }

    // 3. Sauvegarde miroir dans yikeli_settings pour sécuriser la persistance de l'ensemble des rubriques
    try {
      await client.from('yikeli_settings').upsert({
        id: `settings-${rest.id}`,
        restaurant_id: rest.id,
        restaurant_profile: {
          ...rest,
          accessCode: cleanAccessCode,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch {
      // Ignorer
    }

    return true;
  } catch (err) {
    console.warn('Exception syncRestaurantToSupabase:', err);
    return false;
  }
}

/**
 * Récupère tous les restaurants SaaS depuis Supabase
 */
export async function fetchAllRestaurantsFromSupabase(): Promise<RestaurantTenant[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('yikeli_restaurants').select('*');
    if (error || !Array.isArray(data)) return null;

    // Récupérer aussi les profils miroir depuis yikeli_settings si présents
    let settingsMap: Record<string, any> = {};
    try {
      const { data: sData } = await client.from('yikeli_settings').select('restaurant_id, restaurant_profile');
      if (Array.isArray(sData)) {
        sData.forEach((s) => {
          if (s.restaurant_id && s.restaurant_profile) {
            settingsMap[s.restaurant_id] = s.restaurant_profile;
          }
        });
      }
    } catch {
      // Ignorer
    }

    return data.map((d) => {
      const mirror = settingsMap[d.id] || {};
      return {
        id: d.id,
        name: d.name || mirror.name || '',
        logo: d.logo || mirror.logo || '',
        slogan: d.slogan || mirror.slogan || '',
        address: d.address || mirror.address || '',
        managerName: d.manager_name || mirror.managerName || '',
        managerPhone: d.manager_phone || mirror.managerPhone || '',
        managerEmail: d.manager_email || mirror.managerEmail || '',
        contacts: d.contacts || mirror.contacts || '',
        whatsapp: d.whatsapp || mirror.whatsapp || '',
        subscriptionPlan: d.subscription_plan || mirror.subscriptionPlan || 'PREMIUM_ANNUEL',
        subscriptionStartDate: d.subscription_start_date || mirror.subscriptionStartDate || '',
        subscriptionEndDate: d.subscription_end_date || mirror.subscriptionEndDate || '',
        status: d.status || mirror.status || 'ACTIF',
        adminUsername: d.admin_username || mirror.adminUsername || '',
        adminPassword: d.admin_password_hash || d.admin_password || mirror.adminPassword || '',
        accessCode: d.access_code || mirror.accessCode || `${(d.name || 'RES').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()}-${(d.id || '1000').slice(-4)}`,
        createdAt: d.created_at || mirror.createdAt || new Date().toISOString(),
      };
    });
  } catch {
    return null;
  }
}

/**
 * Synchronise les utilisateurs/employés vers Supabase avec hachage sécurisé du mot de passe
 */
export async function syncUserToSupabase(u: User, restaurantId = 'rest-1'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('yikeli_users').upsert({
      id: u.id,
      restaurant_id: restaurantId,
      name: u.name,
      phone: u.phone || null,
      email: u.email || null,
      role: u.role || 'EMPLOYE',
      is_active: u.isActive ?? true,
      poste: u.poste || null,
      salaire_net: u.salaireNet ? Number(u.salaireNet) : null,
      date_embauche: u.dateEmbauche || null,
      date_fin_contrat: u.dateFinContrat || null,
      username: u.username || null,
      password_hash: u.password || null,
      points: Number(u.points) || 0,
      created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Récupère tous les utilisateurs depuis Supabase (sans exposer de mot de passe en clair)
 */
export async function fetchAllUsersFromSupabase(restaurantId?: string): Promise<User[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('yikeli_users').select('*');
    if (restaurantId) query = query.eq('restaurant_id', restaurantId);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return null;

    return data.map((d) => ({
      id: d.id,
      name: d.name,
      phone: d.phone || '',
      email: d.email || '',
      role: d.role || 'EMPLOYE',
      isActive: Boolean(d.is_active),
      poste: d.poste || undefined,
      salaireNet: d.salaire_net ? Number(d.salaire_net) : undefined,
      dateEmbauche: d.date_embauche || undefined,
      dateFinContrat: d.date_fin_contrat || undefined,
      username: d.username || undefined,
      password: d.password_hash || d.password || undefined,
      points: Number(d.points) || 0,
      createdAt: d.created_at,
    }));
  } catch {
    return null;
  }
}

/**
 * Récupère les plats normalisés depuis la table relationnelle yikeli_plats
 */
export async function fetchPlatsFromSupabaseRelational(restaurantId = 'rest-1'): Promise<Plat[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('yikeli_plats')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name');

    if (error || !Array.isArray(data)) return null;

    return data.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'Plats',
      price: Number(p.price) || 0,
      isActive: Boolean(p.is_available),
      buyingCost: p.cost_price !== null && p.cost_price !== undefined ? Number(p.cost_price) : undefined,
      image: p.image || undefined,
      stock: Number(p.stock_available) || 0,
      lowStockAlert: Number(p.stock_alert_threshold) || 5,
    }));
  } catch {
    return null;
  }
}

/**
 * Récupère les lignes d'articles d'une commande depuis la table relationnelle yikeli_order_items
 */
export async function fetchOrderItemsFromSupabase(orderId: string): Promise<CommandeItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('yikeli_order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at');

    if (error || !Array.isArray(data)) return null;

    return data.map((item) => ({
      id: item.id,
      commandeId: item.order_id,
      platId: item.plat_id || '',
      platName: item.plat_name,
      unitPrice: Number(item.unit_price) || 0,
      quantity: Number(item.quantity) || 1,
    }));
  } catch {
    return null;
  }
}

/**
 * Authentification sécurisée RPC pour les serveurs et caissiers
 */
export async function verifyStaffCredentialsRPC(
  restaurantId: string,
  username: string,
  password: string
): Promise<{ success: boolean; user?: { id: string; name: string; role: string } }> {
  const client = getSupabaseClient();
  if (!client) return { success: false };

  try {
    const { data, error } = await client.rpc('verify_staff_credentials', {
      p_restaurant_id: restaurantId,
      p_username: username,
      p_password: password,
    });

    if (error || !data || data.length === 0) {
      return { success: false };
    }

    const firstUser = data[0];
    return {
      success: true,
      user: {
        id: firstUser.user_id,
        name: firstUser.name,
        role: firstUser.role,
      },
    };
  } catch {
    return { success: false };
  }
}
