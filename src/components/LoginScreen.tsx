import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';
import { Shield, KeyRound, User as UserIcon, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  requiredRole: 'ADMIN' | 'EMPLOYE';
}

export default function LoginScreen({ users, onLoginSuccess, requiredRole }: LoginScreenProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-filtering active users for quick-login helpers - only cashiers for employees
  const activeStaff = users.filter(
    (u) =>
      u.role === requiredRole &&
      u.isActive &&
      (requiredRole !== 'EMPLOYE' || (u.poste && u.poste.toLowerCase().includes('caiss')))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedUser = usernameInput.trim().toLowerCase();
    const trimmedPass = passwordInput;

    const matchedUser = users.find(
      (u) =>
        u.role === requiredRole &&
        u.isActive &&
        (requiredRole !== 'EMPLOYE' || (u.poste && u.poste.toLowerCase().includes('caiss'))) &&
        u.username?.toLowerCase() === trimmedUser &&
        u.password === trimmedPass
    );

    if (matchedUser) {
      onLoginSuccess(matchedUser);
    } else {
      setErrorMsg('Identifiants incorrects ou compte inactif. Veuillez réessayer.');
    }
  };

  const handleQuickLogin = (user: User) => {
    setUsernameInput(user.username || '');
    setPasswordInput(user.password || '');
    setErrorMsg('');
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-fadeIn" id="yikeli-login-card">
      {/* Visual Header */}
      <div className="bg-slate-900 text-white p-8 text-center space-y-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-transparent pointer-events-none"></div>
        
        <div className="flex justify-center relative">
          <Logo size="lg" width={72} height={72} className="bg-white p-1.5 rounded-full shadow-lg" />
        </div>
        
        <div className="space-y-1 relative">
          <h2 className="text-xl font-extrabold uppercase tracking-wider font-sans">Restaurant Yikéli</h2>
          <p className="text-xs text-orange-450 font-mono tracking-widest uppercase">
            {requiredRole === 'ADMIN' ? 'Espace Administrateur' : 'Espace Caisse & POS'}
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {requiredRole === 'ADMIN' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Espace Restreint :</span> Seul le gérant ou l'administrateur peut se connecter pour consulter les finances et ajuster le menu.
            </div>
          </div>
        ) : (
          <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-orange-950">
            <LogIn className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Espace Serveur / Caissier :</span> Connectez-vous avec vos identifiants caissier pour prendre les commandes de la clientèle.
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-gray-450" />
              Nom d'utilisateur
            </label>
            <input
              type="text"
              required
              placeholder="Ex: salimata"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-gray-450" />
              Mot de passe
            </label>
            <input
              type="password"
              required
              placeholder="Votre mot de passe"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            Se connecter
          </button>
        </form>

        {/* Quick Credentials Prefill Section representing thoughtful assistance */}
        {activeStaff.length > 0 && (
          <div className="border-t border-gray-150 pt-4 space-y-2.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              Comptes Démo (Yikéli Abidjan)
            </span>
            <div className="flex flex-col gap-1.5">
              {activeStaff.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 hover:border-gray-300 rounded-xl border border-gray-200/80 text-left transition text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-gray-800">{u.name}</span>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      Login : {u.username} • Pass : {u.password}
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
