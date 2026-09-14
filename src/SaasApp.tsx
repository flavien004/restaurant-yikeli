import React, { useState, Suspense, lazy } from 'react';
import { useYikeliDb } from './db';
import { User } from './types';
import { ToastProvider } from './components/shared/ToastNotification';
import { ShieldCheck, Sparkles, LogOut, UtensilsCrossed, ExternalLink, Globe } from 'lucide-react';

const SuperAdminSaaS = lazy(() => import('./components/SuperAdminSaaS'));
const SaaSLandingPage = lazy(() => import('./components/SaaSLandingPage'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));

function SaasLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3 py-16">
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
        Chargement de la Console SaaS...
      </p>
    </div>
  );
}

export default function SaasApp() {
  const db = useYikeliDb();
  const [loggedSuperAdmin, setLoggedSuperAdmin] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'admin' | 'landing'>('admin');

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white" id="saas-admin-app">
        {/* Header Console Plateforme SaaS */}
        <header className="bg-slate-950 border-b border-indigo-950/80 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-black shadow-md shadow-indigo-900/30">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white tracking-tight">RestoChain SaaS</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">
                    Console Back-Office
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Administration des tenants, licences, abonnements et tarification
                </p>
              </div>
            </div>

            {/* Navigation & Actions */}
            {loggedSuperAdmin && (
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-900 border border-indigo-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('admin')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'admin'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Gestion Tenants
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('landing')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'landing'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    Vitrine & Tarifs
                  </button>
                </div>

                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-orange-300 bg-orange-950/60 hover:bg-orange-900/80 border border-orange-600/40 transition flex items-center gap-1.5 cursor-pointer"
                  title="Ouvrir l'application restaurant publique dans un nouvel onglet"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">App Restaurant</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={() => setLoggedSuperAdmin(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer border border-transparent hover:border-rose-900/40"
                  title="Déconnexion Super Admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Corps principal */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<SaasLoadingFallback />}>
            {!loggedSuperAdmin ? (
              <div className="max-w-md mx-auto py-12 space-y-6 animate-fadeIn">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mx-auto flex items-center justify-center shadow-lg shadow-indigo-950/50">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Accès Réservé Super Admin
                  </h1>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Console d'administration globale de la plateforme RestoChain. Veuillez vous identifier.
                  </p>
                </div>

                <LoginScreen
                  users={db.users}
                  requiredRole="SUPER_ADMIN"
                  restaurantId="platform"
                  restaurantName="RestoChain Platform"
                  onLoginSuccess={(u) => setLoggedSuperAdmin(u)}
                />

                <div className="text-center pt-2">
                  <a
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-400 transition font-medium"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    Aller vers l'application restaurant publique &rarr;
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {activeTab === 'admin' ? (
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
                      window.location.href = `/?view=client`;
                    }}
                    onLogoutSuperAdmin={() => setLoggedSuperAdmin(null)}
                  />
                ) : (
                  <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Aperçu Vitrine & Tarifs Publics</h2>
                        <p className="text-xs text-slate-500">Prévisualisation de la page de présentation commerciale de la plateforme</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('admin')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                      >
                        Retour Console Tenants
                      </button>
                    </div>
                    <div className="pt-6">
                      <SaaSLandingPage
                        saasPricing={db.saasPricing}
                        onSelectPlan={() => setActiveTab('admin')}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </Suspense>
        </main>

        {/* Footer Back-Office */}
        <footer className="bg-slate-950 border-t border-indigo-950/60 py-4 text-center text-xs text-slate-500 mt-auto select-none">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between px-4 gap-2">
            <span className="font-mono text-[11px] text-slate-400">
              RestoChain SaaS Platform &bull; Back-Office v2.4
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Console Sécurisée
              </span>
              <a href="/" className="text-slate-400 hover:text-orange-400 transition">
                Accès Restaurant Public
              </a>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
