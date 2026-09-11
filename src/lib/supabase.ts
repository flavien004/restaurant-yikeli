import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Commande, Plat, User, Client, Paiement, Depense, StockEntry, Supplier, RestaurantTenant, SaaSPricingConfig } from '../types';

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

let cachedClient: SupabaseClient | null = null;
let lastConfigUrl = '';
let lastConfigKey = '';

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

  if (storedUrl && storedKey) {
    return {
      url: storedUrl,
      anonKey: storedKey,
      isConfigured: true,
      source: 'localStorage',
    };
  }

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
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

  if (typeof window !== 'undefined') {
    if (cleanUrl && cleanKey) {
      localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_ANON_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_ANON_KEY);
    }
  }

  // Invalider le client en cache pour réinitialisation
  cachedClient = null;
  lastConfigUrl = '';
  lastConfigKey = '';
}

/**
 * Obtient ou initialise l'instance singleton SupabaseClient
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient && lastConfigUrl === config.url && lastConfigKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 15,
        },
      },
    });
    lastConfigUrl = config.url;
    lastConfigKey = config.anonKey;
    return cachedClient;
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
    'yikeli_orders',
    'yikeli_settings',
    'yikeli_paiements',
    'yikeli_depenses',
    'yikeli_clients',
    'yikeli_stock_entries',
    'yikeli_suppliers',
    'yikeli_restaurants',
    'yikeli_users',
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
      if (orderTestErr.message && orderTestErr.message.includes('relation "public.yikeli_orders" does not exist')) {
        // La connexion fonctionne, mais la table n'a pas encore été créée
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
      message: `Connexion Supabase établie avec succès en ${latencyMs} ms ! (${found.length} tables synchronisées).`,
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
// SCRIPT SQL DE CRÉATION ET REPLICATION TEMPS RÉEL SUPABASE
// -----------------------------------------------------------------------------
export const SUPABASE_SQL_SCHEMA = `-- =============================================================================
-- SCRIPT DE CONFIGURATION DE LA BASE DE DONNÉES RESTOCHAIN / YIKÉLI SUR SUPABASE
-- À exécuter dans : Supabase Dashboard > SQL Editor > New Query > RUN
-- =============================================================================

-- 1. Table des Commandes (Synchronisation Caisse, Salle, Cuisine & Clients QR)
CREATE TABLE IF NOT EXISTS public.yikeli_orders (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT DEFAULT 'rest-1',
  client_id TEXT DEFAULT '',
  client_name TEXT,
  client_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'SUR_PLACE',
  status TEXT NOT NULL DEFAULT 'EN_COURS',
  table_number INTEGER,
  created_at TEXT NOT NULL,
  comment TEXT,
  cancel_reason TEXT,
  refusal_reason TEXT,
  payment_method TEXT,
  taken_charge_at TEXT,
  feedback JSONB,
  user_id TEXT,
  payments JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_yikeli_orders_restaurant ON public.yikeli_orders (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_yikeli_orders_status ON public.yikeli_orders (status);
CREATE INDEX IF NOT EXISTS idx_yikeli_orders_created_at ON public.yikeli_orders (created_at DESC);

-- 2. Table des Paramètres Globaux (Menu, Plats, Menu du jour, Catégories, Tarifs SaaS)
CREATE TABLE IF NOT EXISTS public.yikeli_settings (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT DEFAULT 'rest-1',
  plats JSONB DEFAULT '[]'::jsonb,
  menu_jour JSONB DEFAULT '[]'::jsonb,
  plat_categories JSONB DEFAULT '[]'::jsonb,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  depense_categories JSONB DEFAULT '[]'::jsonb,
  saas_pricing JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Paiements Encaissés
CREATE TABLE IF NOT EXISTS public.yikeli_paiements (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT DEFAULT 'rest-1',
  commande_id TEXT NOT NULL,
  method TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  user_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_yikeli_paiements_cmd ON public.yikeli_paiements (commande_id);

-- 4. Table des Dépenses & Sorties de Caisse
CREATE TABLE IF NOT EXISTS public.yikeli_depenses (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT DEFAULT 'rest-1',
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'PAYEE',
  submitted_by TEXT,
  created_at TEXT
);

-- 5. Table des Clients (Fidélité & Historique)
CREATE TABLE IF NOT EXISTS public.yikeli_clients (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT DEFAULT 'rest-1',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  total_spent NUMERIC DEFAULT 0,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_yikeli_clients_phone ON public.yikeli_clients (phone);

-- 6. Table des Mouvements et Entrées de Stock
CREATE TABLE IF NOT EXISTS public.yikeli_stock_entries (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT DEFAULT 'rest-1',
  plat_id TEXT NOT NULL,
  plat_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  comment TEXT,
  buying_price NUMERIC,
  supplier_id TEXT,
  supplier_name TEXT
);

-- 7. Table des Fournisseurs
CREATE TABLE IF NOT EXISTS public.yikeli_suppliers (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT DEFAULT 'rest-1',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TEXT
);

-- 8. Table des Établissements / Tenants Multi-Restaurants
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
  subscription_plan TEXT DEFAULT 'PREMIUM_ANNUEL',
  subscription_start_date TEXT,
  subscription_end_date TEXT,
  status TEXT DEFAULT 'ACTIF',
  admin_username TEXT,
  admin_password TEXT,
  created_at TEXT
);

-- 9. Table des Utilisateurs et Employés (Caissiers, Serveurs, Admins)
CREATE TABLE IF NOT EXISTS public.yikeli_users (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT DEFAULT 'rest-1',
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'EMPLOYE',
  is_active BOOLEAN DEFAULT true,
  poste TEXT,
  salaire_net NUMERIC,
  date_embauche TEXT,
  date_fin_contrat TEXT,
  username TEXT,
  password TEXT,
  points NUMERIC DEFAULT 0,
  created_at TEXT
);

-- =============================================================================
-- POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Permet la lecture et l'écriture sécurisée pour l'application cliente connectée
-- =============================================================================

ALTER TABLE public.yikeli_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yikeli_users ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès complet (CRUD) pour la clé API publique anon
DO $$
BEGIN
  -- yikeli_orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_orders' AND policyname = 'Public Access Orders') THEN
    CREATE POLICY "Public Access Orders" ON public.yikeli_orders FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- yikeli_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_settings' AND policyname = 'Public Access Settings') THEN
    CREATE POLICY "Public Access Settings" ON public.yikeli_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- yikeli_paiements
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_paiements' AND policyname = 'Public Access Paiements') THEN
    CREATE POLICY "Public Access Paiements" ON public.yikeli_paiements FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- yikeli_depenses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_depenses' AND policyname = 'Public Access Depenses') THEN
    CREATE POLICY "Public Access Depenses" ON public.yikeli_depenses FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- yikeli_clients
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_clients' AND policyname = 'Public Access Clients') THEN
    CREATE POLICY "Public Access Clients" ON public.yikeli_clients FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- yikeli_stock_entries
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_stock_entries' AND policyname = 'Public Access Stock') THEN
    CREATE POLICY "Public Access Stock" ON public.yikeli_stock_entries FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- yikeli_suppliers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_suppliers' AND policyname = 'Public Access Suppliers') THEN
    CREATE POLICY "Public Access Suppliers" ON public.yikeli_suppliers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- yikeli_restaurants
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_restaurants' AND policyname = 'Public Access Restaurants') THEN
    CREATE POLICY "Public Access Restaurants" ON public.yikeli_restaurants FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- yikeli_users
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yikeli_users' AND policyname = 'Public Access Users') THEN
    CREATE POLICY "Public Access Users" ON public.yikeli_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================================
-- ACTIVATION DU TEMPS RÉEL (SUPABASE REALTIME) POUR LA SYNCHRONISATION MULTI-POSTES
-- Permet aux caisses, tablettes serveurs, cuisines et clients d'échanger en <100ms
-- =============================================================================

DO $$
BEGIN
  -- Vérifier si la publication realtime existe et ajouter les tables
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_orders;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_settings;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_paiements;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_depenses;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_clients;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_stock_entries;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_suppliers;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_restaurants;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.yikeli_users;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
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
 * Envoie une commande vers Supabase (upsert)
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
    return true;
  } catch (err) {
    console.warn('Erreur d\'appel Supabase syncOrderToSupabase:', err);
    return false;
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
 * Envoie le menu et les paramètres vers Supabase
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
 * Synchronise les restaurants SaaS vers Supabase
 */
export async function syncRestaurantToSupabase(rest: RestaurantTenant): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('yikeli_restaurants').upsert({
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
      subscription_start_date: rest.subscriptionStartDate || null,
      subscription_end_date: rest.subscriptionEndDate || null,
      status: rest.status || 'ACTIF',
      admin_username: rest.adminUsername || null,
      admin_password: rest.adminPassword || null,
      created_at: rest.createdAt,
    }, { onConflict: 'id' });
    return !error;
  } catch {
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

    return data.map((d) => ({
      id: d.id,
      name: d.name,
      logo: d.logo || '',
      slogan: d.slogan || '',
      address: d.address || '',
      managerName: d.manager_name || '',
      managerPhone: d.manager_phone || '',
      managerEmail: d.manager_email || '',
      contacts: d.contacts || '',
      whatsapp: d.whatsapp || '',
      subscriptionPlan: d.subscription_plan || 'PREMIUM_ANNUEL',
      subscriptionStartDate: d.subscription_start_date || '',
      subscriptionEndDate: d.subscription_end_date || '',
      status: d.status || 'ACTIF',
      adminUsername: d.admin_username || '',
      adminPassword: d.admin_password || '',
      createdAt: d.created_at || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

/**
 * Synchronise les utilisateurs/employés vers Supabase
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
      salaire_net: u.salaireNet || null,
      date_embauche: u.dateEmbauche || null,
      date_fin_contrat: u.dateFinContrat || null,
      username: u.username || null,
      password: u.password || null,
      points: u.points || 0,
      created_at: u.createdAt,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Récupère tous les utilisateurs depuis Supabase
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
      password: d.password || undefined,
      points: Number(d.points) || 0,
      createdAt: d.created_at,
    }));
  } catch {
    return null;
  }
}
