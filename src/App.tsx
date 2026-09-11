import React, { useState, useMemo, Suspense, lazy } from 'react';
import { useYikeliDb } from './db';
import { User } from './types';
import Logo from './components/Logo';
import { ToastProvider } from './components/shared/ToastNotification';
import {
  ChefHat,
  Users,
  Smartphone,
  Sliders,
  Settings,
  Tv,
  Building2,
  ShieldCheck,
  Sparkles,
  Database,
} from 'lucide-react';

// Code-splitting / Lazy loading des vues lourdes pour un chargement instantané du menu QR client
const AdminInterface = lazy(() => import('./components/AdminInterface'));
const EmployeeInterface = lazy(() => import('./components/EmployeeInterface'));
const ClientInterface = lazy(() => import('./components/ClientInterface'));
const ServerMonitorScreen = lazy(() => import('./components/ServerMonitorScreen'));
const SuperAdminSaaS = lazy(() => import('./components/SuperAdminSaaS'));
const SaaSLandingPage = lazy(() => import('./components/SaaSLandingPage'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));
const SupabaseSyncModal = lazy(() => import('./components/SupabaseSyncModal'));

function ViewLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3 py-12">
      <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Chargement de l'espace...</p>
    </div>
  );
}

export default function App() {
  const db = useYikeliDb();

  // Détection des query params
  const getQueryParam = (key: string) => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  const isClientMode = getQueryParam('view') === 'client' || window.location.hash === '#/client' || window.location.hash === '#client';

  const defaultRole = isClientMode ? 'client' : 'landing';
  const [currentRoleView, setCurrentRoleView] = useState<'saas' | 'landing' | 'admin' | 'employe' | 'salle_serveurs' | 'client' | 'portal'>(defaultRole);

  // États d'authentification
  const [loggedSuperAdmin, setLoggedSuperAdmin] = useState<User | null>(null);
  const [loggedEmployee, setLoggedEmployee] = useState<User | null>(null);
  const [loggedAdmin, setLoggedAdmin] = useState<User | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const activeRest = db.activeRestaurant;

  // Isolation de sécurité stricte : La vue Client (menu scanné) ne reçoit JAMAIS les mots de passe ni les données sensibles du personnel
  const dbForClient = useMemo(() => {
    return {
      ...db,
      users: db.users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
    };
  }, [db]);

  const isClientView = currentRoleView === 'client';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="application-root">
        
        {/* Navigation épurée pour les clients scannant le QR code à table */}
        {isClientView ? (
          <header className="bg-slate-900 border-b border-slate-800 text-white py-2.5 px-4 sticky top-0 z-50 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" width={26} height={26} className="bg-white rounded-full p-0.5 shadow-xs shrink-0" />
              <div className="leading-tight">
                <span className="font-extrabold text-xs tracking-tight text-white block">{activeRest.name}</span>
                <span className="text-[10px] text-orange-450 font-medium">Menu digital & Commande</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentRoleView('portal')}
              className="text-[11px] font-bold text-slate-400 hover:text-white transition px-2.5 py-1 rounded-lg border border-slate-700/80 hover:border-slate-600 bg-slate-800/80 cursor-pointer"
            >
              Accès Équipe
            </button>
          </header>
        ) : (
          <header className="bg-slate-900 border-b border-slate-800 text-white py-3 px-4 sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              
              {/* Tenant branding & Restaurant Switcher */}
              <div className="flex items-center gap-3">
                <Logo size="sm" width={28} height={28} className="bg-white rounded-full p-0.5 shadow-sm shrink-0" />
                
                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl">
                  <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <select
                    value={db.activeRestaurantId}
                    onChange={(e) => {
                      db.setActiveRestaurantId(e.target.value);
                    }}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-2"
                  >
                    {db.restaurants.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                        {r.name} ({r.subscriptionPlan})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boutons de navigation entre les rôles */}
              <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
                
                <button
                  onClick={() => setCurrentRoleView('landing')}
                  id="nav-landing"
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoleView === 'landing'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-300" />
                  Vitrine SaaS
                </button>

                <button
                  onClick={() => setCurrentRoleView('saas')}
                  id="nav-saas"
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoleView === 'saas'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                  Super Admin
                </button>

                <button
                  onClick={() => setCurrentRoleView('admin')}
                  id="nav-admin"
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoleView === 'admin'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Gérant Admin
                </button>

                <button
                  onClick={() => setCurrentRoleView('employe')}
                  id="nav-employe"
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoleView === 'employe'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Caisse POS
                </button>

                <button
                  onClick={() => setCurrentRoleView('salle_serveurs')}
                  id="nav-salle-serveurs"
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoleView === 'salle_serveurs'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  Écran Cuisine/Salle
                </button>

                <button
                  onClick={() => setCurrentRoleView('client')}
                  id="nav-client"
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoleView === 'client'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Vue Client
                </button>

                <button
                  onClick={() => setCurrentRoleView('portal')}
                  id="nav-portal"
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoleView === 'portal'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Portail
                </button>

              </div>

              {/* Statut Supabase & SaaS (contrôles réservés au personnel gérant / admin) */}
              <div className="flex items-center gap-2">
                {(loggedAdmin || loggedSuperAdmin) && (
                  <button
                    onClick={() => setIsSupabaseModalOpen(true)}
                    id="btn-supabase-sync"
                    title="Gérer la synchronisation Supabase (Multi-postes & Cloud)"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition shadow-sm cursor-pointer ${
                      db.supabaseStatus === 'CONNECTED'
                        ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
                        : db.supabaseStatus === 'CONNECTING'
                        ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/80'
                        : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="hidden sm:inline">
                      {db.supabaseStatus === 'CONNECTED'
                        ? 'Supabase Connecté'
                        : db.supabaseStatus === 'CONNECTING'
                        ? 'Connexion...'
                        : 'Synchro Supabase'}
                    </span>
                    {db.supabaseRealtimeActive ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Realtime Actif (WebSockets)"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0"></span>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-1.5 bg-slate-800/85 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-[10px] text-gray-300 font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${db.isBackupSuccess ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                  <span className="truncate">RestoChain SaaS</span>
                </div>
              </div>

            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="layout-view-canvas">
          <Suspense fallback={<ViewLoadingFallback />}>
            {/* Portail d'accueil */}
            {currentRoleView === 'portal' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-3xl text-orange-600 mb-2 shadow-inner">
                    <ChefHat className="w-10 h-10" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                    Portail d'Accès RestoChain
                  </h1>
                  <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Plateforme Cloud de gestion de restaurant : Commandes en ligne, Caisse tactile et Administration.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Option 1: Vue Client */}
                  <div
                    onClick={() => setCurrentRoleView('client')}
                    className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-orange-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">Menu Client QR</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Interface publique pour les clients à table ou en livraison, sans mot de passe requis.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                      <span>Ouvrir le menu</span>
                      <span>&rarr;</span>
                    </div>
                  </div>

                  {/* Option 2: Caisse POS */}
                  <div
                    onClick={() => setCurrentRoleView('employe')}
                    className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-orange-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">Caisse & POS</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Prise de commande rapide au comptoir, encaissements et suivi des tickets de salle.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                      <span>Connexion caisse</span>
                      <span>&rarr;</span>
                    </div>
                  </div>

                  {/* Option 3: Admin Gérant */}
                  <div
                    onClick={() => setCurrentRoleView('admin')}
                    className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-orange-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sliders className="w-6 h-6" />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">Espace Gérant</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Gestion de la carte, des stocks, des dépenses, du personnel et de la comptabilité.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                      <span>Connexion gérance</span>
                      <span>&rarr;</span>
                    </div>
                  </div>

                  {/* Option 4: Écran Cuisine/KDS */}
                  <div
                    onClick={() => setCurrentRoleView('salle_serveurs')}
                    className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-orange-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Tv className="w-6 h-6" />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">Écran Cuisine/KDS</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Affichage dynamique des commandes en cours avec alertes sonores pour la cuisine.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                      <span>Ouvrir l'écran</span>
                      <span>&rarr;</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vitrine SaaS Landing */}
            {currentRoleView === 'landing' && (
              <SaaSLandingPage
                saasPricing={db.saasPricing}
                onSelectPlan={() => setCurrentRoleView('portal')}
              />
            )}

            {/* Super Admin SaaS */}
            {currentRoleView === 'saas' && (
              <div className="space-y-4 animate-fadeIn">
                {!loggedSuperAdmin ? (
                  <div className="space-y-4">
                    <LoginScreen
                      users={db.users}
                      requiredRole="SUPER_ADMIN"
                      restaurantId={db.activeRestaurantId}
                      restaurantName="RestoChain Platform"
                      onLoginSuccess={(u) => setLoggedSuperAdmin(u)}
                    />
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setCurrentRoleView('portal')}
                        className="text-xs font-extrabold text-gray-400 hover:text-orange-600 transition tracking-wide uppercase font-mono cursor-pointer"
                      >
                        &larr; Retour au Portail Personnel
                      </button>
                    </div>
                  </div>
                ) : (
                  <SuperAdminSaaS
                    restaurants={db.restaurants}
                    saasPricing={db.saasPricing}
                    activeRestaurantId={db.activeRestaurantId}
                    onCreateRestaurant={db.createRestaurant}
                    onUpdateRestaurant={db.updateRestaurant}
                    onDeleteRestaurant={db.deleteRestaurant}
                    onRenewSubscription={db.renewSubscription}
                    onUpdatePricing={db.updateSaaSPricing}
                    onSelectActiveRestaurant={(id) => {
                      db.setActiveRestaurantId(id);
                      setCurrentRoleView('admin');
                    }}
                    onLogoutSuperAdmin={() => {
                      setLoggedSuperAdmin(null);
                      setCurrentRoleView('portal');
                    }}
                  />
                )}
              </div>
            )}

            {/* View 1: Client digital menu (version assainie sans informations d'employés) */}
            {currentRoleView === 'client' && (
              <div className="space-y-4 animate-fadeIn">
                <ClientInterface db={dbForClient} />
              </div>
            )}

            {/* View 2: Cashier POS */}
            {currentRoleView === 'employe' && (
              <div className="space-y-4 animate-fadeIn">
                {!loggedEmployee ? (
                  <div className="space-y-4">
                    <LoginScreen
                      users={db.users}
                      requiredRole="EMPLOYE"
                      restaurantId={db.activeRestaurantId}
                      restaurantName={activeRest.name}
                      restaurantLogo={activeRest.logo}
                      onLoginSuccess={(u) => setLoggedEmployee(u)}
                    />
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setCurrentRoleView('portal')}
                        className="text-xs font-extrabold text-gray-400 hover:text-orange-600 transition tracking-wide uppercase font-mono cursor-pointer"
                      >
                        &larr; Retour au Portail Personnel
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmployeeInterface
                    db={db}
                    activeEmployee={loggedEmployee}
                    onLogout={() => {
                      setLoggedEmployee(null);
                      setCurrentRoleView('portal');
                    }}
                  />
                )}
              </div>
            )}

            {/* View 3: Server Monitor Screen / KDS */}
            {currentRoleView === 'salle_serveurs' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => setCurrentRoleView('portal')}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] rounded-xl border border-gray-250 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wide"
                  >
                    &larr; Retour au Portail Personnel
                  </button>
                </div>
                <ServerMonitorScreen db={db} />
              </div>
            )}

            {/* View 4: Restaurant Admin */}
            {currentRoleView === 'admin' && (
              <div className="space-y-4 animate-fadeIn">
                {!loggedAdmin ? (
                  <div className="space-y-4">
                    <LoginScreen
                      users={db.users}
                      requiredRole="ADMIN"
                      restaurantId={db.activeRestaurantId}
                      restaurantName={activeRest.name}
                      restaurantLogo={activeRest.logo}
                      onLoginSuccess={(u) => setLoggedAdmin(u)}
                    />
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setCurrentRoleView('portal')}
                        className="text-xs font-extrabold text-gray-400 hover:text-orange-600 transition tracking-wide uppercase font-mono cursor-pointer"
                      >
                        &larr; Retour au Portail Personnel
                      </button>
                    </div>
                  </div>
                ) : (
                  <AdminInterface
                    db={db}
                    activeAdmin={loggedAdmin}
                    onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
                    onLogout={() => {
                      setLoggedAdmin(null);
                      setCurrentRoleView('portal');
                    }}
                  />
                )}
              </div>
            )}
          </Suspense>
        </main>

        {/* Supabase Cloud Synchronisation Modal (accessible uniquement aux administrateurs) */}
        {isSupabaseModalOpen && (
          <Suspense fallback={null}>
            <SupabaseSyncModal
              isOpen={isSupabaseModalOpen}
              onClose={() => setIsSupabaseModalOpen(false)}
              supabaseStatus={db.supabaseStatus}
              supabaseRealtimeActive={db.supabaseRealtimeActive}
              lastSyncTime={db.lastSyncTime}
              onForceSync={async () => {
                await db.pushAllLocalDataToSupabase();
              }}
              onPushLocalToRemote={db.pushAllLocalDataToSupabase}
              localStats={{
                commandesCount: db.commandes.length,
                platsCount: db.plats.length,
                paiementsCount: db.paiements.length,
                depensesCount: db.depenses.length,
                clientsCount: db.clients.length,
                stockEntriesCount: db.stockEntries.length,
              }}
              onConfigChanged={() => {
                db.refreshSupabaseConfig();
              }}
            />
          </Suspense>
        )}

        {/* Footer Branding Area */}
        <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 mt-auto select-none">
          <div className="max-w-7xl mx-auto space-y-1">
            <p className="font-bold text-gray-500">© 2026 {activeRest.name} — Plateforme SaaS RestoChain</p>
            <p className="text-[10px] text-gray-400">{activeRest.address} &bull; Contact: {activeRest.contacts}</p>
          </div>
        </footer>

      </div>
    </ToastProvider>
  );
}
