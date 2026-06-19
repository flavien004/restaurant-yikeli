import React, { useState } from 'react';
import { useYikeliDb } from './db';
import AdminInterface from './components/AdminInterface';
import EmployeeInterface from './components/EmployeeInterface';
import ClientInterface from './components/ClientInterface';
import ServerMonitorScreen from './components/ServerMonitorScreen';
import LoginScreen from './components/LoginScreen';
import { User } from './types';
import Logo from './components/Logo';
import {
  ChefHat,
  Users,
  Smartphone,
  ShieldAlert,
  Sliders,
  Settings,
  HelpCircle,
  Activity,
  PhoneCall,
  RotateCw,
  Tv,
} from 'lucide-react';

export default function App() {
  const db = useYikeliDb();

  // 1. Detect if URL specifies client-only mode or simulator mode
  const getQueryParam = (key: string) => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  const isClientMode = getQueryParam('view') === 'client' || window.location.hash === '#/client' || window.location.hash === '#client';
  const isSimulatorModeEnabled = getQueryParam('simulator') === 'true' || getQueryParam('demo') === 'true';

  // Role simulation selection - if client is requested explicitly, force client view and completely seal/disable swapper
  const defaultRole = isClientMode ? 'client' : 'portal';
  const [currentRoleView, setCurrentRoleView] = useState<'client' | 'employe' | 'admin' | 'salle_serveurs' | 'portal'>(defaultRole);

  // Authenticated state persistence in current simulation sandbox
  const [loggedEmployee, setLoggedEmployee] = useState<User | null>(null);
  const [loggedAdmin, setLoggedAdmin] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="application-root">
      
      {/* Premium Simulator Role Swapper Header - Only visible if simulator URL query is enabled */}
      {isSimulatorModeEnabled && (
        <div className="bg-slate-900 border-b border-slate-800 text-white py-3.5 px-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Left Title branding */}
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping"></span>
              <div className="flex items-center gap-2">
                <Logo size="sm" width={24} height={24} className="bg-white rounded-full p-0.5 shadow-sm" />
                <span className="font-extrabold uppercase tracking-widest text-orange-450 font-mono text-[11px]">
                  Restaurant Yikéli 
                </span>
              </div>
            </div>

            {/* Core role selection buttons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700/60 shadow-inner">
              
              <button
                onClick={() => setCurrentRoleView('client')}
                id="switch-view-client"
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  currentRoleView === 'client'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                1. Vue Client
              </button>

              <button
                onClick={() => setCurrentRoleView('employe')}
                id="switch-view-employee"
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  currentRoleView === 'employe'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                2. Vue Caisse
              </button>

              <button
                onClick={() => setCurrentRoleView('salle_serveurs')}
                id="switch-view-salle-serveurs"
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  currentRoleView === 'salle_serveurs'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                3. Écran Serveurs
              </button>

              <button
                onClick={() => setCurrentRoleView('admin')}
                id="switch-view-admin"
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  currentRoleView === 'admin'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                4. Gérant Admin
              </button>

              <button
                onClick={() => setCurrentRoleView('portal')}
                id="switch-view-portal"
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  currentRoleView === 'portal'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Espace Portail
              </button>

            </div>

            {/* Right helper Actions */}
            <div className="flex items-center gap-3">
              {/* Database Safe-Save Visual Status Indicator */}
              <div className="flex items-center gap-2 bg-slate-800/85 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-[10px] text-gray-300 font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${db.isBackupSuccess ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`}></span>
                <span className="truncate">
                  {db.lastBackupTime ? `Sûr: ${db.lastBackupTime}` : 'Protection auto active'}
                </span>
                <button
                  onClick={() => db.forceManualBackup()}
                  className="ml-1 px-1.5 py-0.5 rounded bg-slate-700 hover:bg-orange-500 hover:text-white font-bold text-gray-200 transition text-[9px]"
                  title="Sauvegarder l'état complet de la session"
                >
                  Sauver
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm('Voulez-vous réinitialiser le simulateur aux valeurs d\'usine de Côte d\'Ivoire ? Les données enregistrées seront effacées.')) {
                    db.resetDatabaseToDefault();
                    window.location.reload();
                  }
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 hover:text-orange-400 border border-slate-700 text-xs font-semibold rounded-lg text-gray-400 transition flex items-center gap-1"
                title="Réinitialiser"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Responsive Body with container bounds */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="layout-view-canvas">
        
        {/* Portal landing view */}
        {currentRoleView === 'portal' && (
          <div className="max-w-3xl mx-auto my-8 space-y-8 animate-fadeIn animate-none" id="yikeli-restaurant-portal">
            {/* Header branding */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Logo size="lg" width={96} height={96} className="bg-white p-2 rounded-full shadow-lg border border-gray-100" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-extrabold uppercase tracking-widest text-slate-900 font-sans">
                  Restaurant Yikéli
                </h2>
                <p className="text-xs text-orange-650 font-mono tracking-widest uppercase font-black">
                  Portail Professionnel &bull; Abidjan, Côte d'Ivoire
                </p>
                <p className="text-xs text-gray-400 max-w-lg mx-auto font-medium">
                  Bienvenue sur le système d'exploitation du restaurant. Veuillez sélectionner votre espace de travail pour vous connecter de manière sécurisée.
                </p>
              </div>
            </div>

            {/* Grid of access cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
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
                    Caissiers, vendeurs &amp; gérants de service. Prise de commandes sur place et facturation.
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
                    Kiosque de suivi pour les serveurs. Affichage en temps réel des plats prêts à servir.
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
                    Direction générale. Contrôle des recettes nettes, réglages de la carte et du personnel.
                  </p>
                </div>
                <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest group-hover:translate-x-1.5 transition duration-200 inline-flex items-center gap-1 font-mono">
                  Administrer &rarr;
                </div>
              </button>

            </div>

            {/* Note de Sécurité */}
            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-center space-y-1">
              <span className="text-[9px] font-black text-orange-850 uppercase tracking-widest block font-mono">⚠️ Accès Client Restreint</span>
              <p className="text-[11px] text-orange-950 font-medium">
                Les clients doivent scanner le QR code de leur table physique ou utiliser l'adresse web client dédiée pour commander. L'accès à ce portail d'administration leur est strictement interdit.
              </p>
            </div>
          </div>
        )}

        {/* Active view mounted conditionally based on Simulator state */}
        {currentRoleView === 'client' && (
          <div className="space-y-4 animate-fadeIn">
            {isSimulatorModeEnabled && (
              /* Quick simulator help banner */
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-blue-900 shadow-sm max-w-xl mx-auto">
                <Smartphone className="w-5 h-5 text-blue-500 shrink-0" />
                <div>
                  <span className="font-bold">Mode Simulation Client : </span>
                  Simulez la commande d'un client à distance depuis son smartphone. Sélectionnez vos mets, validez votre commande et contactez le restaurant !
                </div>
              </div>
            )}

            <ClientInterface db={db} />
          </div>
        )}

        {currentRoleView === 'employe' && (
          <div className="space-y-4 animate-fadeIn">
            {isSimulatorModeEnabled && (
              <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-yellow-900 shadow-sm">
                <Users className="w-5 h-5 text-yellow-600 shrink-0" />
                <div>
                  <span className="font-bold">Mode Simulation Serveur / Caissier : </span>
                  Prenez des commandes sur place, enregistrez des paiements multicanaux (espèces, Wave, Orange Money) et préparez les rôtis puis imprimez leur ticket client !
                </div>
              </div>
            )}

            {!loggedEmployee ? (
              <div className="space-y-4">
                <LoginScreen
                  users={db.users}
                  requiredRole="EMPLOYE"
                  onLoginSuccess={(u) => setLoggedEmployee(u)}
                />
                {!isSimulatorModeEnabled && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setCurrentRoleView('portal')}
                      className="text-xs font-extrabold text-gray-400 hover:text-orange-600 transition tracking-wide uppercase font-mono cursor-pointer"
                    >
                      &larr; Retour au Portail Personnel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <EmployeeInterface
                db={db}
                activeEmployee={loggedEmployee}
                onLogout={() => {
                  setLoggedEmployee(null);
                  if (!isSimulatorModeEnabled) {
                    setCurrentRoleView('portal');
                  }
                }}
              />
            )}
          </div>
        )}

        {currentRoleView === 'salle_serveurs' && (
          <div className="space-y-4 animate-fadeIn">
            {isSimulatorModeEnabled ? (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-orange-950 shadow-sm">
                <Tv className="w-5 h-5 text-orange-600 shrink-0" />
                <div>
                  <span className="font-bold">Écran en Salle pour les Serveurs : </span>
                  Affiche toutes les commandes prêtes et notifiées « Servi ». Les serveurs peuvent les apporter aux clients et valider leur service en cliquant sur le gros bouton vert !
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => setCurrentRoleView('portal')}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] rounded-xl border border-gray-250 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wide"
                >
                  &larr; Retour au Portail Personnel
                </button>
              </div>
            )}
            <ServerMonitorScreen db={db} />
          </div>
        )}

        {currentRoleView === 'admin' && (
          <div className="space-y-4 animate-fadeIn">
            {isSimulatorModeEnabled && (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-orange-950 shadow-sm">
                <Sliders className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <span className="font-bold">Mode Simulation Gérant Administrateur : </span>
                  Pilotez le restaurant. Ajustez les prix, planifiez le « Menu du Jour », visualisez les bénéfices nets et gérez les comptes du personnel !
                </div>
              </div>
            )}

            {!loggedAdmin ? (
              <div className="space-y-4">
                <LoginScreen
                  users={db.users}
                  requiredRole="ADMIN"
                  onLoginSuccess={(u) => setLoggedAdmin(u)}
                />
                {!isSimulatorModeEnabled && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setCurrentRoleView('portal')}
                      className="text-xs font-extrabold text-gray-400 hover:text-orange-600 transition tracking-wide uppercase font-mono cursor-pointer"
                    >
                      &larr; Retour au Portail Personnel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <AdminInterface
                db={db}
                activeAdmin={loggedAdmin}
                onLogout={() => {
                  setLoggedAdmin(null);
                  if (!isSimulatorModeEnabled) {
                    setCurrentRoleView('portal');
                  }
                }}
              />
            )}
          </div>
        )}

      </main>

      {/* Footer Branding Area */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 mt-auto select-none">
        <div className="max-w-7xl mx-auto space-y-1">
          <p className="font-bold text-gray-500">© 2026 Restaurant Yikéli — Abidjan, Côte d'Ivoire</p>
          <p className="text-[10px] text-gray-400">Route d'Abatta, derrière la pharmacie • Yango Djorogobité 1 • Contact: +225 05 01 14 92 44</p>
        </div>
      </footer>

    </div>
  );
}
