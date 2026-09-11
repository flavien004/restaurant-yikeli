import React, { useState } from 'react';
import { useYikeliDb } from './db';
import AdminInterface from './components/AdminInterface';
import EmployeeInterface from './components/EmployeeInterface';
import ClientInterface from './components/ClientInterface';
import ServerMonitorScreen from './components/ServerMonitorScreen';
import SuperAdminSaaS from './components/SuperAdminSaaS';
import SaaSLandingPage from './components/SaaSLandingPage';
import LoginScreen from './components/LoginScreen';
import SupabaseSyncModal from './components/SupabaseSyncModal';
import { User } from './types';
import Logo from './components/Logo';
import {
  ChefHat,
  Users,
  Smartphone,
  Sliders,
  Settings,
  Tv,
  Building2,
  ShieldCheck,
  RotateCw,
  LogOut,
  ChevronDown,
  Sparkles,
  Database,
  Cloud,
} from 'lucide-react';

export default function App() {
  const db = useYikeliDb();

  // Detect query params
  const getQueryParam = (key: string) => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  const isClientMode = getQueryParam('view') === 'client' || window.location.hash === '#/client' || window.location.hash === '#client';

  const defaultRole = isClientMode ? 'client' : 'landing';
  const [currentRoleView, setCurrentRoleView] = useState<'saas' | 'landing' | 'admin' | 'employe' | 'salle_serveurs' | 'client' | 'portal'>(defaultRole);

  // Authenticated states
  const [loggedSuperAdmin, setLoggedSuperAdmin] = useState<User | null>(null);
  const [loggedEmployee, setLoggedEmployee] = useState<User | null>(null);
  const [loggedAdmin, setLoggedAdmin] = useState<User | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const activeRest = db.activeRestaurant;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="application-root">
      
      {/* SaaS Navigation Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white py-3 px-4 sticky top-0 z-50 shadow-md">
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

          {/* Core role selection buttons */}
          <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            
            <button
              onClick={() => setCurrentRoleView('landing')}
              id="nav-landing"
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                currentRoleView === 'salle_serveurs'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Écran Salle
            </button>

            <button
              onClick={() => setCurrentRoleView('client')}
              id="nav-client"
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                currentRoleView === 'portal'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Portail
            </button>

          </div>

          {/* Right backup & status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              id="btn-supabase-sync"
              title="Gérer la synchronisation Supabase (Multi-postes & Cloud Netlify)"
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

            <div className="flex items-center gap-1.5 bg-slate-800/85 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-[10px] text-gray-300 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${db.isBackupSuccess ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
              <span className="truncate">SaaS V1.0</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="layout-view-canvas">
        
        {/* Portal landing view */}
        {currentRoleView === 'portal' && (
          <div className="max-w-4xl mx-auto my-8 space-y-8 animate-fadeIn" id="yikeli-restaurant-portal">
            {/* Header branding */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Logo size="lg" width={96} height={96} className="bg-white p-2 rounded-full shadow-lg border border-gray-100" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-extrabold uppercase tracking-widest text-slate-900 font-sans">
                  {activeRest.name}
                </h2>
                <p className="text-xs text-orange-650 font-mono tracking-widest uppercase font-black">
                  Plateforme SaaS RestoChain &bull; {activeRest.address}
                </p>
                <p className="text-xs text-gray-400 max-w-lg mx-auto font-medium">
                  {activeRest.slogan || "Bienvenue sur le système d'exploitation du restaurant. Sélectionnez votre espace de travail."}
                </p>
              </div>
            </div>

            {/* Grid of access cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 0: Super Admin RestoChain SaaS */}
              <button
                type="button"
                onClick={() => setCurrentRoleView('saas')}
                className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-sm hover:shadow-lg transition duration-300 cursor-pointer group"
              >
                <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition duration-200">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white">Super Admin RestoChain</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Gestion globale de la plateforme, des abonnements et des restaurants.
                  </p>
                </div>
                <div className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest group-hover:translate-x-1.5 transition duration-200 inline-flex items-center gap-1 font-mono">
                  Gérer la Plateforme &rarr;
                </div>
              </button>

              {/* Card 1: Caisse */}
              <button
                type="button"
                onClick={() => setCurrentRoleView('employe')}
                className="bg-white hover:bg-slate-50 border border-gray-150 hover:border-orange-500 rounded-3xl p-6 text-center space-y-4 shadow-sm hover:shadow-lg transition duration-300 cursor-pointer group text-gray-800"
              >
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition duration-200">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800">Espace Caisse</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                    Caissiers et vendeurs. Prise de commandes sur place et facturation.
                  </p>
                </div>
                <div className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest group-hover:translate-x-1.5 transition duration-200 inline-flex items-center gap-1 font-mono">
                  S'identifier &rarr;
                </div>
              </button>

              {/* Card 2: Server monitor */}
              <button
                type="button"
                onClick={() => setCurrentRoleView('salle_serveurs')}
                className="bg-white hover:bg-slate-50 border border-gray-150 hover:border-amber-500 rounded-3xl p-6 text-center space-y-4 shadow-sm hover:shadow-lg transition duration-300 cursor-pointer group text-gray-800"
              >
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition duration-200">
                  <Tv className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800">Écran en Salle</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                    Kiosque de suivi pour les serveurs. Affichage en temps réel des plats prêts.
                  </p>
                </div>
                <div className="text-[10px] font-extrabold text-amber-650 uppercase tracking-widest group-hover:translate-x-1.5 transition duration-200 inline-flex items-center gap-1 font-mono">
                  Accéder &rarr;
                </div>
              </button>

              {/* Card 3: Gérant Admin */}
              <button
                type="button"
                onClick={() => setCurrentRoleView('admin')}
                className="bg-white hover:bg-slate-50 border border-gray-150 hover:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-sm hover:shadow-lg transition duration-300 cursor-pointer group text-gray-800"
              >
                <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition duration-200">
                  <Sliders className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800">Bureau Gérant</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                    Direction générale. Configuration du restaurant, menu, finances et personnel.
                  </p>
                </div>
                <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest group-hover:translate-x-1.5 transition duration-200 inline-flex items-center gap-1 font-mono">
                  Administrer &rarr;
                </div>
              </button>

            </div>
          </div>
        )}

        {/* View Landing: SaaS Vitrine Landing Page */}
        {currentRoleView === 'landing' && (
          <div className="space-y-4 animate-fadeIn">
            <SaaSLandingPage
              saasPricing={db.saasPricing}
              onNavigateView={(v) => setCurrentRoleView(v)}
              activeRestaurantName={activeRest.name}
            />
          </div>
        )}

        {/* View 0: SaaS Super Admin Dashboard */}
        {currentRoleView === 'saas' && (
          <div className="space-y-4 animate-fadeIn">
            {!loggedSuperAdmin ? (
              <div className="space-y-4">
                <LoginScreen
                  users={db.users}
                  requiredRole="SUPER_ADMIN"
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

        {/* View 1: Client digital menu */}
        {currentRoleView === 'client' && (
          <div className="space-y-4 animate-fadeIn">
            <ClientInterface db={db} />
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

        {/* View 3: Server Monitor Screen */}
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

      </main>

      {/* Supabase Cloud Synchronisation Modal */}
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

      {/* Footer Branding Area */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 mt-auto select-none">
        <div className="max-w-7xl mx-auto space-y-1">
          <p className="font-bold text-gray-500">© 2026 {activeRest.name} — Multi-Tenant SaaS Platform</p>
          <p className="text-[10px] text-gray-400">{activeRest.address} &bull; Contact: {activeRest.contacts}</p>
        </div>
      </footer>

    </div>
  );
}
