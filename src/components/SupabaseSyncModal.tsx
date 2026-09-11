import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  UploadCloud,
  DownloadCloud,
  X,
  Radio,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
  ConnectionTestResult,
  getSupabaseClient
} from '../lib/supabase';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  supabaseRealtimeActive: boolean;
  lastSyncTime: string | null;
  onForceSync: () => Promise<void>;
  onPushLocalToRemote: () => Promise<{ success: boolean; message: string }>;
  localStats: {
    commandesCount: number;
    platsCount: number;
    paiementsCount: number;
    depensesCount: number;
    clientsCount: number;
    stockEntriesCount: number;
  };
  onConfigChanged: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  supabaseStatus,
  supabaseRealtimeActive,
  lastSyncTime,
  onForceSync,
  onPushLocalToRemote,
  localStats,
  onConfigChanged
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'sync' | 'sql'>('config');
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [configSource, setConfigSource] = useState<'env' | 'localStorage' | 'none'>('none');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getSupabaseConfig();
      setUrlInput(currentConfig.url);
      setKeyInput(currentConfig.anonKey);
      setConfigSource(currentConfig.source);
      setSaveFeedback(null);
      setPushResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveSupabaseConfig(urlInput, keyInput);
    const updated = getSupabaseConfig();
    setConfigSource(updated.source);
    setSaveFeedback('Configuration enregistrée avec succès !');
    onConfigChanged();
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  const handleClearConfig = () => {
    saveSupabaseConfig('', '');
    const updated = getSupabaseConfig();
    setUrlInput(updated.url);
    setKeyInput(updated.anonKey);
    setConfigSource(updated.source);
    setTestResult(null);
    setSaveFeedback('Configuration locale réinitialisée.');
    onConfigChanged();
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleTestConnection = async () => {
    // Si l'utilisateur a modifié les champs sans sauvegarder, sauvegarder d'abord
    saveSupabaseConfig(urlInput, keyInput);
    onConfigChanged();

    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Échec du test de connexion.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await onForceSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSupabase = async () => {
    if (!window.confirm(`Confirmez-vous le transfert de vos ${localStats.commandesCount} commandes, ${localStats.platsCount} plats et autres données locales vers Supabase ?`)) {
      return;
    }
    setIsPushing(true);
    setPushResult(null);
    try {
      const res = await onPushLocalToRemote();
      setPushResult(res);
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-150 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Synchronisation Supabase Cloud
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Multi-Postes Netlify
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Synchronisation en temps réel de tous vos terminaux (Caisses, Serveurs, Cuisine & Clients)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar banner */}
        <div className="px-6 py-3 bg-slate-850 text-xs border-b border-slate-750 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Statut de liaison :</span>
            {supabaseStatus === 'CONNECTED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connecté à Supabase
              </span>
            ) : supabaseStatus === 'CONNECTING' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Connexion en cours...
              </span>
            ) : supabaseStatus === 'NOT_CONFIGURED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-600/30 text-gray-300 font-bold border border-gray-600/50">
                <WifiOff className="w-3 h-3" />
                Non configuré (Stockage local actif)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                <AlertTriangle className="w-3 h-3" />
                Hors-ligne / Clés requises
              </span>
            )}

            {supabaseRealtimeActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
                <Radio className="w-3 h-3 text-indigo-400 animate-ping" />
                WebSocket Realtime Actif
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-gray-400 text-[11px]">
            {lastSyncTime && (
              <span>Dernière synchro : <strong className="text-gray-200">{lastSyncTime}</strong></span>
            )}
            <span className="text-gray-500">•</span>
            <span>Source : <strong className="text-gray-200 uppercase">{configSource === 'env' ? 'Netlify Env' : configSource === 'localStorage' ? 'Local Browser' : 'Aucune'}</strong></span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-150 bg-gray-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'config'
                ? 'bg-white text-slate-900 border-gray-200 border-b-white -mb-px shadow-sm'
                : 'bg-transparent text-gray-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 inline mr-1.5" />
            Configuration des Clés
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'sync'
                ? 'bg-white text-slate-900 border-gray-200 border-b-white -mb-px shadow-sm'
                : 'bg-transparent text-gray-500 border-transparent hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
            Synchronisation & Migration ({localStats.commandesCount} cmds)
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'sql'
                ? 'bg-white text-slate-900 border-gray-200 border-b-white -mb-px shadow-sm'
                : 'bg-transparent text-gray-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
            Script SQL Supabase & Guide
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <Info className="w-4 h-4 text-amber-600" />
                  Comment fonctionne la synchronisation avec Supabase ?
                </div>
                <p className="leading-relaxed">
                  L'application hébergée sur Netlify communique directement avec votre base de données Supabase.
                  Les commandes créées par le client via QR code, la caisse et les tablettes serveurs se propagent en temps réel (<strong className="font-semibold">&lt; 100 ms</strong>) grâce aux WebSockets Supabase Realtime.
                </p>
                <p className="text-[11px] text-amber-800">
                  💡 <strong>Astuce Netlify :</strong> Vous pouvez renseigner ces deux clés soit directement dans ce formulaire (enregistré sur ce navigateur), soit dans les variables d'environnement de votre site Netlify : <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> et <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code>.
                </p>
              </div>

              <div className="space-y-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-200/70">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                    <span>1. URL du Projet Supabase (Project URL)</span>
                    <span className="text-[10px] text-gray-400 font-mono">Ex: https://xyzcompany.supabase.co</span>
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                    <span>2. Clé Publique Supabase (Anon / Public Key)</span>
                    <span className="text-[10px] text-gray-400 font-mono">eyJhbGciOiJIUzI1NiIsIn...</span>
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-inner"
                  />
                  <p className="text-[10px] text-gray-500">
                    Trouvez cette clé dans votre tableau de bord Supabase : <strong>Project Settings &gt; API &gt; Project API keys &gt; anon / public</strong>.
                  </p>
                </div>

                {saveFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {saveFeedback}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !urlInput || !keyInput}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Test de liaison en cours...
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                        Tester la connexion
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Enregistrer la configuration
                  </button>

                  {configSource === 'localStorage' && (
                    <button
                      onClick={handleClearConfig}
                      className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition"
                    >
                      Effacer la clé locale
                    </button>
                  )}
                </div>
              </div>

              {/* Test Result card */}
              {testResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-3 animate-fadeIn ${
                    testResult.success
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Test réussi ! {testResult.latencyMs ? `(Latence : ${testResult.latencyMs} ms)` : ''}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Échec du test de connexion
                      </>
                    )}
                  </div>

                  <p className="leading-relaxed">{testResult.message}</p>

                  {testResult.tablesFound && testResult.tablesFound.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-[11px] text-emerald-950">Tables détectées et synchronisables :</span>
                      <div className="flex flex-wrap gap-1.5">
                        {testResult.tablesFound.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded font-mono text-[10px] font-bold">
                            ✓ {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {testResult.tablesMissing && testResult.tablesMissing.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="font-bold text-[11px] text-amber-950">Tables non trouvées (à créer via l'onglet Script SQL) :</span>
                      <div className="flex flex-wrap gap-1.5">
                        {testResult.tablesMissing.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-amber-200/70 text-amber-950 rounded font-mono text-[10px]">
                            ✗ {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-800 pt-1">
                        👉 Ouvrez l'onglet <strong>Script SQL Supabase &amp; Guide</strong> ci-dessus pour copier le script et créer toutes les tables en 1 clic dans Supabase.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SYNCHRONISATION & MIGRATION */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              
              {/* Local state overview card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Données locales actuelles sur cet appareil</h4>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">Stockage IndexedDB &amp; LocalStorage</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="block text-xl font-black text-white">{localStats.commandesCount}</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Commandes</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="block text-xl font-black text-white">{localStats.platsCount}</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Plats menu</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="block text-xl font-black text-white">{localStats.paiementsCount}</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Paiements</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="block text-xl font-black text-white">{localStats.depensesCount}</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Dépenses</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="block text-xl font-black text-white">{localStats.clientsCount}</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Clients</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="block text-xl font-black text-white">{localStats.stockEntriesCount}</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Stocks</span>
                  </div>
                </div>
              </div>

              {/* Action 1: Push local data to Supabase */}
              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  Initialiser Supabase avec mes données locales (Transfert montant)
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Si vous venez de créer votre base de données Supabase, utilisez ce bouton pour envoyer toutes vos commandes, plats, paiements et configurations actuels vers Supabase. Tous les autres postes connectés recevront automatiquement ces données !
                </p>
                <button
                  onClick={handlePushToSupabase}
                  disabled={isPushing}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-2 shadow"
                >
                  {isPushing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Transfert des données vers Supabase en cours...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Transférer toutes les données locales vers Supabase
                    </>
                  )}
                </button>

                {pushResult && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    pushResult.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                  }`}>
                    {pushResult.message}
                  </div>
                )}
              </div>

              {/* Action 2: Pull remote data from Supabase */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/80 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <DownloadCloud className="w-4 h-4 text-slate-700" />
                  Télécharger les données les plus récentes depuis Supabase
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Forcer la récupération de toutes les commandes et paramètres hébergés sur Supabase pour rafraîchir l'écran instantanément.
                </p>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-2 shadow"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Synchronisation en cours...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      Synchroniser maintenant
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: SQL SCHEMA SCRIPT & NETLIFY GUIDE */}
          {activeTab === 'sql' && (
            <div className="space-y-5">
              
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">Guide d'installation rapide Supabase (3 minutes)</h4>
                  </div>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                  >
                    Ouvrir Supabase <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Connectez-vous sur <strong>Supabase.com</strong> et sélectionnez votre projet.
                  </li>
                  <li>
                    Dans le menu de gauche, cliquez sur <strong>SQL Editor</strong> &gt; <strong>New Query</strong>.
                  </li>
                  <li>
                    Cliquez sur le bouton vert <strong>&quot;Copier le Script SQL&quot;</strong> ci-dessous, collez-le dans l&apos;éditeur Supabase, puis cliquez sur <strong>RUN</strong>.
                  </li>
                  <li>
                    Allez dans <strong>Project Settings &gt; API</strong>, copiez l&apos;URL et la clé <code>anon public</code>, puis renseignez-les dans l&apos;onglet <strong>Configuration</strong> ou sur Netlify !
                  </li>
                </ol>
              </div>

              {/* Security & Architecture Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Sécurité RLS Renforcée
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-snug">
                    Politiques RLS isolées par tenant (<code className="bg-white/60 px-1 py-0.5 rounded">x-restaurant-id</code>). Aucune politique permissive ouverte.
                  </p>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 mb-1">
                    <Database className="w-4 h-4 text-sky-600" />
                    Intégrité Référentielle
                  </div>
                  <p className="text-[11px] text-sky-700 leading-snug">
                    Clés étrangères FK strictes (<code className="bg-white/60 px-1 py-0.5 rounded">ON DELETE CASCADE</code>) et tables normalisées pour les articles et plats.
                  </p>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Bcrypt &amp; Dates Typées
                  </div>
                  <p className="text-[11px] text-indigo-700 leading-snug">
                    Hachage Bcrypt pgcrypto anti-mots de passe en clair et champs temporels en <code className="bg-white/60 px-1 py-0.5 rounded">TIMESTAMPTZ</code>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span>Script SQL de création des tables et réplication temps réel</span>
                  </label>
                  <button
                    onClick={handleCopySql}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copié dans le presse-papier !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copier le Script SQL
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed select-all">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">
            Hébergement Netlify + Base Supabase temps réel &bull; Compatible tous navigateurs et tablettes
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};

export default SupabaseSyncModal;
