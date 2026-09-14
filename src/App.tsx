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
  Database,
  UtensilsCrossed,
  ArrowLeft,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react';

// Code-splitting / Lazy loading des vues pour un chargement instantané du menu QR client
const AdminInterface = lazy(() => import('./components/AdminInterface'));
const EmployeeInterface = lazy(() => import('./components/EmployeeInterface'));
const ClientInterface = lazy(() => import('./components/ClientInterface'));
const ServerMonitorScreen = lazy(() => import('./components/ServerMonitorScreen'));
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

  // Détection des query params ou hash pour la vue initiale
  const getInitialView = (): 'admin' | 'employe' | 'salle_serveurs' | 'client' | 'portal' => {
    if (typeof window === 'undefined') return 'client';
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const hash = window.location.hash;

    if (viewParam === 'portal' || hash === '#/portal' || hash === '#portal' || hash === '#equipe') return 'portal';
    if (viewParam === 'admin' || hash === '#/admin' || hash === '#admin') return 'admin';
    if (viewParam === 'employe' || hash === '#/employe' || hash === '#employe') return 'employe';
    if (viewParam === 'salle_serveurs' || hash === '#/salle_serveurs' || hash === '#salle_serveurs') return 'salle_serveurs';

    // Par défaut : la page d'accueil de l'application restaurant est directement le menu client !
    return 'client';
  };

  const [currentRoleView, setCurrentRoleView] = useState<'admin' | 'employe' | 'salle_serveurs' | 'client' | 'portal'>(getInitialView);

  // État de déverrouillage de l'accès équipe via le code confidentiel du restaurant
  const [unlockedRestaurantId, setUnlockedRestaurantId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('yikeli_team_unlocked_rest');
  });

  const [isTeamAuthModalOpen, setIsTeamAuthModalOpen] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingTargetView, setPendingTargetView] = useState<'admin' | 'employe' | 'salle_serveurs' | 'portal' | null>(null);

  // États d'authentification du personnel du restaurant
  const [loggedEmployee, setLoggedEmployee] = useState<User | null>(null);
  const [loggedAdmin, setLoggedAdmin] = useState<User | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const activeRest = db.activeRestaurant;

  // L'accès équipe est considéré comme déverrouillé si l'utilisateur a entré le code pour ce restaurant ou s'il a déjà une session ouverte
  const isTeamAccessUnlocked = (unlockedRestaurantId === activeRest.id) || !!loggedEmployee || !!loggedAdmin;

  const handleRequestTeamAccess = (targetView: 'admin' | 'employe' | 'salle_serveurs' | 'portal' = 'portal') => {
    if (isTeamAccessUnlocked && unlockedRestaurantId === activeRest.id) {
      setCurrentRoleView(targetView);
    } else {
      setPendingTargetView(targetView);
      setAccessCodeInput('');
      setAuthError(null);
      setIsTeamAuthModalOpen(true);
    }
  };

  const handleVerifyAccessCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = accessCodeInput.trim();
    if (!cleanCode) {
      setAuthError('Veuillez saisir le code confidentiel.');
      return;
    }

    const matched = db.verifyRestaurantAccessCode(cleanCode);
    if (!matched) {
      setAuthError('Code confidentiel invalide. Vérifiez le code unique fourni par votre établissement.');
      return;
    }

    // Basculer directement sur le restaurant lié à ce code confidentiel
    if (matched.id !== db.activeRestaurantId) {
      db.setActiveRestaurantId(matched.id);
    }

    setUnlockedRestaurantId(matched.id);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('yikeli_team_unlocked_rest', matched.id);
    }

    setIsTeamAuthModalOpen(false);
    setAuthError(null);
    setAccessCodeInput('');
    setCurrentRoleView(pendingTargetView || 'portal');
    setPendingTargetView(null);
  };

  const handleLockTeamAccess = () => {
    setUnlockedRestaurantId(null);
    setLoggedEmployee(null);
    setLoggedAdmin(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('yikeli_team_unlocked_rest');
    }
    setCurrentRoleView('client');
  };

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
        
        {/* 1. Header épuré pour les clients (Page d'accueil par défaut) */}
        {isClientView ? (
          <header className="bg-slate-900 border-b border-slate-800 text-white py-2.5 px-4 sticky top-0 z-50 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo
                size="sm"
                width={36}
                height={36}
                logoUrl={activeRest.logo}
                restaurantName={activeRest.name}
                className="rounded-xl overflow-hidden shadow-xs shrink-0 border border-slate-700/70"
              />
              <div className="leading-tight">
                <span className="font-extrabold text-sm tracking-tight text-white block">{activeRest.name}</span>
                <span className="text-[10px] text-orange-400 font-medium">Menu digital &amp; Commande</span>
              </div>
            </div>

            {/* Bouton discret d'accès pour les employés du restaurant : Déclenche l'authentification par code */}
            <button
              type="button"
              onClick={() => handleRequestTeamAccess('portal')}
              id="btn-acces-equipe"
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 transition px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>Accès Équipe</span>
            </button>
          </header>
        ) : (
          /* 2. Header de travail de l'Équipe Restaurant (Caisse, Gérant, Cuisine, Portail) */
          <header className="bg-slate-900 border-b border-slate-800 text-white py-2.5 px-4 sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              
              {/* Tenant branding : Logo dynamique et nom du restaurant connecté (SANS liste déroulante) */}
              <div className="flex items-center gap-3">
                <Logo
                  size="sm"
                  width={36}
                  height={36}
                  logoUrl={activeRest.logo}
                  restaurantName={activeRest.name}
                  className="rounded-xl overflow-hidden shadow-xs shrink-0 border border-slate-700/70"
                />
                
                <div className="leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white tracking-tight">{activeRest.name}</span>
                    <span className="text-[9px] bg-orange-500/20 text-orange-300 font-mono font-bold px-1.5 py-0.5 rounded border border-orange-500/30 uppercase">
                      {activeRest.subscriptionPlan?.startsWith('PREMIUM') ? 'PRO' : 'STD'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[220px] block">{activeRest.address}</span>
                </div>
              </div>

              {/* Boutons de navigation du personnel restaurant */}
              <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
                <button
                  onClick={() => setCurrentRoleView('client')}
                  id="nav-client"
                  className="px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer text-orange-300 hover:text-white hover:bg-slate-700/60"
                  title="Retourner au menu digital client"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />
                  Menu Client
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
                  onClick={() => setCurrentRoleView('salle_serveurs')}
                  id="nav-salle-serveurs"
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoleView === 'salle_serveurs'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  Écran Cuisine
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

              {/* Statut Supabase & Bouton Verrouillage Équipe */}
              <div className="flex items-center gap-2">
                {loggedAdmin && (
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
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLockTeamAccess}
                  title="Verrouiller l'accès équipe et retourner au menu client"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-900/50 transition cursor-pointer font-bold active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Verrouiller</span>
                </button>
              </div>

            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="layout-view-canvas">
          <Suspense fallback={<ViewLoadingFallback />}>
            {/* Si l'utilisateur tente d'accéder à un espace personnel sans avoir validé le code d'accès */}
            {!isTeamAccessUnlocked && !isClientView ? (
              <div className="max-w-md mx-auto my-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl text-center space-y-5 animate-fadeIn">
                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-black text-slate-900">Espace Équipe Verrouillé</h2>
                  <p className="text-xs text-slate-600">
                    Veuillez saisir le code confidentiel de votre restaurant pour afficher votre portail et accéder aux postes de travail.
                  </p>
                </div>
                <form onSubmit={handleVerifyAccessCode} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                      Code Unique &amp; Confidentiel
                    </label>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={accessCodeInput}
                      onChange={(e) => {
                        setAccessCodeInput(e.target.value.toUpperCase());
                        if (authError) setAuthError(null);
                      }}
                      placeholder="Ex: YIK-7749"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 rounded-2xl text-center text-lg font-black font-mono tracking-widest text-slate-900 focus:outline-none uppercase"
                    />
                  </div>
                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    Déverrouiller le Portail
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentRoleView('client')}
                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    &larr; Retourner au Menu Client
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Portail d'accès Équipe */}
                {currentRoleView === 'portal' && (
                  <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-4">
                    {/* Header du portail avec Logo dynamique et informations du restaurant connecté */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center gap-4">
                        <Logo
                          size="sm"
                          width={52}
                          height={52}
                          logoUrl={activeRest.logo}
                          restaurantName={activeRest.name}
                          className="rounded-2xl shadow-sm border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                              {activeRest.name}
                            </h1>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Accès Authentifié
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {activeRest.slogan || activeRest.address}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-orange-50 text-orange-800 px-2.5 py-0.5 rounded-lg border border-orange-200">
                              <KeyRound className="w-3 h-3 text-orange-600" />
                              Code Établissement : {activeRest.accessCode || 'YIK-7749'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingTargetView('portal');
                            setAccessCodeInput('');
                            setAuthError(null);
                            setIsTeamAuthModalOpen(true);
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                          title="Changer d'établissement en saisissant son code unique"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          <span>Changer d'établissement</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCurrentRoleView('client')}
                          className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-xl border border-orange-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Retour au</span> Menu Client
                        </button>
                      </div>
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
                            Interface publique pour les clients à table ou en commande directe, sans mot de passe requis.
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
                        onLogout={() => {
                          setLoggedAdmin(null);
                          setCurrentRoleView('portal');
                        }}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </Suspense>
        </main>

        {/* MODAL : Authentification d'accès équipe par code confidentiel unique */}
        {isTeamAuthModalOpen && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
              {/* Header de la boîte de dialogue */}
              <div className="bg-slate-900 text-white p-6 relative">
                <div className="flex items-center gap-3">
                  <Logo
                    size="sm"
                    width={44}
                    height={44}
                    logoUrl={activeRest.logo}
                    restaurantName={activeRest.name}
                    className="rounded-xl overflow-hidden shadow-xs shrink-0 border border-slate-700"
                  />
                  <div>
                    <h3 className="font-extrabold text-base text-white tracking-tight">
                      Accès Équipe &bull; Authentification
                    </h3>
                    <p className="text-xs text-orange-400 font-medium">
                      {activeRest.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsTeamAuthModalOpen(false);
                    setAuthError(null);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corps de la modal */}
              <form onSubmit={handleVerifyAccessCode} className="p-6 space-y-5">
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cet espace est réservé au personnel du restaurant. Veuillez saisir le <strong>code unique et confidentiel</strong> de votre établissement pour afficher votre portail.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                    Code Confidentiel du Restaurant
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={accessCodeInput}
                    onChange={(e) => {
                      setAccessCodeInput(e.target.value.toUpperCase());
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Ex: YIK-7749"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-orange-500 rounded-2xl text-center text-lg font-black font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 uppercase transition"
                  />
                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}
                </div>

                {/* Codes d'accès d'aide / démonstration */}
                <div className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl space-y-1.5">
                  <p className="text-[11px] font-bold text-orange-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    Code confidentiel de démonstration :
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-orange-900 tracking-wider">
                      {activeRest.accessCode || 'YIK-7749'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAccessCodeInput(activeRest.accessCode || 'YIK-7749');
                        setAuthError(null);
                      }}
                      className="text-[10px] font-bold text-orange-700 hover:text-orange-950 underline cursor-pointer"
                    >
                      Utiliser ce code
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamAuthModalOpen(false);
                      setAuthError(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Unlock className="w-4 h-4" />
                    Valider et Déverrouiller &rarr;
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de synchronisation Supabase */}
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
