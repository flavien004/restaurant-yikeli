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
  // Role simulation selection
  const [currentRoleView, setCurrentRoleView] = useState<'client' | 'employe' | 'admin' | 'salle_serveurs'>('admin');

  // Authenticated state persistence in current simulation sandbox
  const [loggedEmployee, setLoggedEmployee] = useState<User | null>(null);
  const [loggedAdmin, setLoggedAdmin] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="application-root">
      
      {/* Premium Simulator Role Swapper Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-white py-3.5 px-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Left Title branding */}
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping"></span>
            <div className="flex items-center gap-2">
              <Logo size="sm" width={24} height={24} className="bg-white rounded-full p-0.5 shadow-sm" />
              <span className="font-extrabold uppercase tracking-widest text-orange-450 font-mono text-[11px]">
                Restaurant Yikéli • Simulateur
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

      {/* Main Responsive Body with container bounds */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="layout-view-canvas">
        
        {/* Active view mounted conditionally based on Simulator state */}
        {currentRoleView === 'client' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Quick simulator help banner */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-blue-900 shadow-sm max-w-xl mx-auto">
              <Smartphone className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <span className="font-bold">Mode Simulation Client : </span>
                Simulez la commande d'un client à distance depuis son smartphone. Sélectionnez vos mets, validez votre commande et contactez le restaurant !
              </div>
            </div>

            <ClientInterface db={db} />
          </div>
        )}

        {currentRoleView === 'employe' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-yellow-900 shadow-sm">
              <Users className="w-5 h-5 text-yellow-600 shrink-0" />
              <div>
                <span className="font-bold">Mode Simulation Serveur / Caissier : </span>
                Prenez des commandes sur place, enregistrez des paiements multicanaux (espèces, Wave, Orange Money) et préparez les rôtis puis imprimez leur ticket client !
              </div>
            </div>

            {!loggedEmployee ? (
              <LoginScreen
                users={db.users}
                requiredRole="EMPLOYE"
                onLoginSuccess={(u) => setLoggedEmployee(u)}
              />
            ) : (
              <EmployeeInterface
                db={db}
                activeEmployee={loggedEmployee}
                onLogout={() => setLoggedEmployee(null)}
              />
            )}
          </div>
        )}

        {currentRoleView === 'salle_serveurs' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-orange-950 shadow-sm">
              <Tv className="w-5 h-5 text-orange-600 shrink-0" />
              <div>
                <span className="font-bold">Écran en Salle pour les Serveurs : </span>
                Affiche toutes les commandes prêtes et notifiées « Servi ». Les serveurs peuvent les apporter aux clients et valider leur service en cliquant sur le gros bouton vert !
              </div>
            </div>
            <ServerMonitorScreen db={db} />
          </div>
        )}

        {currentRoleView === 'admin' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3 text-xs text-orange-950 shadow-sm">
              <Sliders className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <span className="font-bold">Mode Simulation Gérant Administrateur : </span>
                Pilotez le restaurant. Ajustez les prix, planifiez le « Menu du Jour », visualisez les bénéfices nets et gérez les comptes du personnel !
              </div>
            </div>

            {!loggedAdmin ? (
              <LoginScreen
                users={db.users}
                requiredRole="ADMIN"
                onLoginSuccess={(u) => setLoggedAdmin(u)}
              />
            ) : (
              <AdminInterface
                db={db}
                activeAdmin={loggedAdmin}
                onLogout={() => setLoggedAdmin(null)}
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
