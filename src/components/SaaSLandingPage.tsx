import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ChefHat,
  Smartphone,
  Sliders,
  Tv,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  WifiOff,
  DollarSign,
  TrendingUp,
  BarChart3,
  Package,
  QrCode,
  Layers,
  CreditCard,
  Users,
  Building2,
  Check,
  HelpCircle,
  PhoneCall,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle,
  Receipt,
  ShoppingCart,
  Clock,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import Logo from './Logo';
import { SaaSPricingConfig, SaaSPlanKey } from '../types';
import SubscriptionRenewalModal from './SubscriptionRenewalModal';

interface SaaSLandingPageProps {
  saasPricing: SaaSPricingConfig;
  onNavigateView: (view: 'portal' | 'admin' | 'employe' | 'salle_serveurs' | 'client' | 'saas') => void;
  activeRestaurantName?: string;
}

export default function SaaSLandingPage({
  saasPricing,
  onNavigateView,
  activeRestaurantName = 'RestoChain'
}: SaaSLandingPageProps) {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'pos' | 'qr' | 'stock' | 'finances' | 'salle' | 'offline'>('pos');
  const [selectedPricingPeriod, setSelectedPricingPeriod] = useState<'mensuel' | 'annuel'>('annuel');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoRestaurantName, setDemoRestaurantName] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Modal subscription trial trigger
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const features = [
    {
      id: 'pos',
      title: 'Caisse Tactile POS & Vente Rapide',
      icon: ChefHat,
      badge: 'Point de Vente 100% Ergonomique',
      color: 'from-orange-500 to-amber-500',
      tagColor: 'bg-orange-50 text-orange-600 border-orange-200',
      image: '/src/assets/images/saas_pos_feature_1785171006508.jpg',
      description: 'Gagnez un temps précieux lors des coups de feu. Interface tactile ultra-rapide conçue pour les serveurs et caissiers avec enregistrement immédiat des commandes.',
      bullets: [
        'Sélection rapide par catégories (Entrées, Plats, Boissons, Desserts)',
        'Encaissement multi-modes : Espèces, Wave 🌊, Orange Money 🍊, MTN 💛, Moov 💚, Carte & Crédit',
        'Gestion automatique des réductions, offres spéciales et divisions d\'additions',
        'Impression thermique directe du ticket de caisse et reçu client'
      ],
      mockupType: 'pos'
    },
    {
      id: 'qr',
      title: 'Menu QR Code & Commande à Table',
      icon: QrCode,
      badge: 'Zéro Attente pour vos Clients',
      color: 'from-indigo-500 to-purple-600',
      tagColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      description: 'Permettez à vos clients de scanner le QR code posé sur leur table avec leur smartphone pour consulter la carte enrichie de photos et passer commande en toute autonomie.',
      bullets: [
        'Génération automatique de cartes QR uniques par numéro de table',
        'Carte digitale dynamique synchronisée en temps réel avec le menu du jour',
        'Passage de commande directement en cuisine sans télécharger d\'application',
        'Support multi-langues et affichage haute définition des suggestions du Chef'
      ],
      mockupType: 'qr'
    },
    {
      id: 'finances',
      title: 'Pilote Financier & Calculateur du Point Mort',
      icon: TrendingUp,
      badge: 'Contrôle Total des Marges & P&L',
      color: 'from-emerald-500 to-teal-600',
      tagColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      description: 'Ne pilotez plus votre restaurant à aveugle. Analysez votre chiffre d\'affaires brut/net, ventilez vos charges fixes et calculez précisément votre Seuil de Rentabilité.',
      bullets: [
        'Suivi du Chiffre d\'Affaires brut et net en temps réel avec graphiques interactifs',
        'Catégorisation claire des dépenses : Charges Fixes (Loyer, Salaire) vs Charges d\'Exploitation',
        'Calculateur automatique du Point Mort (Seuil de Rentabilité minimal en FCFA/mois)',
        'Rapports consolidés exportables pour comptabilité et bilan mensuel'
      ],
      mockupType: 'finances'
    },
    {
      id: 'stock',
      title: 'Gestion des Stocks, Matières & Alertes',
      icon: Package,
      badge: 'Anti-Gaspillage & Suivi Ingrédients',
      color: 'from-blue-500 to-cyan-600',
      tagColor: 'bg-blue-50 text-blue-600 border-blue-200',
      description: 'Gardez un œil constant sur vos réserves de boissons et d\'ingrédients. Recevez des notifications dès qu\'un niveau critique est atteint.',
      bullets: [
        'Déduction automatique des ingrédients à chaque commande validée',
        'Saisie facile des nouveaux arrivages et entrées en réserve',
        'Alertes visuelles en rouge dès qu\'un produit atteint le stock minimum',
        'Annuaire des fournisseurs avec historiques des prix d\'achat'
      ],
      mockupType: 'stock'
    },
    {
      id: 'salle',
      title: 'Écran Kiosque Salle & Suivi Serveurs',
      icon: Tv,
      badge: 'Fluidité Cuisine & Service',
      color: 'from-amber-500 to-orange-600',
      tagColor: 'bg-amber-50 text-amber-600 border-amber-200',
      description: 'Un écran géant dédié en salle ou au comptoir de passe pour visualiser en direct l\'état de préparation des plats et informer immédiatement les serveurs.',
      bullets: [
        'Affichage temps réel des commandes envoyées depuis la caisse ou le QR table',
        'Codes couleurs intuitifs : En Attente (Jaune), En Préparation (Bleu), Prêt à Servir (Vert)',
        'Validation d\'un simple clic pour marquer un plat comme servi',
        'Minuteur d\'attente par table pour éviter tout retard en cuisine'
      ],
      mockupType: 'salle'
    },
    {
      id: 'offline',
      title: 'Mode Hors-Ligne & Cloud Sécurisé',
      icon: WifiOff,
      badge: 'Continuité d\'Activité 100% Garantie',
      color: 'from-rose-500 to-pink-600',
      tagColor: 'bg-rose-50 text-rose-600 border-rose-200',
      description: 'Les coupures d\'Internet ne stopperont plus votre service. La caisse continue de fonctionner en local et synchronise tout dans le Cloud dès le retour du réseau.',
      bullets: [
        'Stockage local chiffré sur l\'appareil (IndexedDB & LocalStorage)',
        'Prise de commande, encaissement et impression fonctionnels sans réseau',
        'Synchronisation automatique et transparente dès le rétablissement d\'Internet',
        'Sauvegarde Cloud multi-restaurants sécurisée avec historique complet'
      ],
      mockupType: 'offline'
    }
  ];

  const currentFeature = features.find(f => f.id === activeFeatureTab) || features[0];

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-500 selection:text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 my-2">
      
      {/* SaaS Landing Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" width={34} height={34} className="bg-white p-1 rounded-full shadow-md" />
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none font-sans">
                RestoChain <span className="text-orange-500">SaaS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">
                OS Restauration Afrique
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#features" className="hover:text-orange-400 transition">Fonctionnalités</a>
            <a href="#captures" className="hover:text-orange-400 transition">Captures &amp; Démos</a>
            <a href="#pricing" className="hover:text-orange-400 transition">Tarifs FCFA</a>
            <a href="#faq" className="hover:text-orange-400 transition">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateView('portal')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs py-2 px-4 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Espace Client
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg hover:shadow-orange-500/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Essai Gratuit
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-12 pb-16 px-4 sm:px-8 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-orange-400 text-xs font-mono font-bold shadow-inner">
            <Zap className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>Logiciel SaaS N°1 pour Restaurants, Maquis &amp; Fast-Foods en Côte d'Ivoire</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none max-w-4xl mx-auto">
            La Solution Tout-en-Un pour <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Gérer, Casser &amp; Propulser
            </span> votre Restaurant.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Combinez <strong className="text-white">Caisse Tactile POS</strong>, <strong className="text-white">Menu QR Code Table</strong>, <strong className="text-white">Suivi des Stocks</strong>, <strong className="text-white">Pilotage Financier</strong> et <strong className="text-white">Mode Hors-Ligne</strong> dans une seule application fluide et sécurisée.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateView('portal')}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-sm py-3.5 px-7 rounded-2xl shadow-xl shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2 group"
            >
              <Play className="w-4 h-4 fill-white" />
              Tester la Démo En Direct
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => setShowDemoModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm py-3.5 px-7 rounded-2xl border border-slate-700 transition cursor-pointer flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-orange-400" />
              Demander une Démo Personnalisée
            </button>
          </div>

          {/* Quick stats pills */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto font-mono text-xs">
            <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="block text-lg font-black text-orange-400">100%</span>
              <span className="text-slate-400 font-sans text-[11px] font-bold">Fonctionne Sans Internet</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="block text-lg font-black text-emerald-400">&lt; 3 sec</span>
              <span className="text-slate-400 font-sans text-[11px] font-bold">Prise de Commande Caisse</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="block text-lg font-black text-indigo-400">Mobile Money</span>
              <span className="text-slate-400 font-sans text-[11px] font-bold">Wave, OM, MTN, Moov</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="block text-lg font-black text-amber-400">Multi-Caisse</span>
              <span className="text-slate-400 font-sans text-[11px] font-bold">Synchro Cloud Directe</span>
            </div>
          </div>

          {/* Hero Banner Showcase Frame */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="p-2 bg-slate-800/80 rounded-3xl border border-slate-700/80 shadow-2xl relative overflow-hidden group">
              <div className="bg-slate-950 rounded-2xl overflow-hidden relative">
                <img
                  src="/src/assets/images/saas_hero_banner_1785170990931.jpg"
                  alt="RestoChain SaaS Hero Banner"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[420px] object-cover rounded-2xl opacity-90 group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-6">
                  <div className="text-left space-y-1 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 max-w-md">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400">
                      Aperçu RestoChain OS
                    </span>
                    <h4 className="text-sm font-extrabold text-white">Écosystème Restauration Intégré</h4>
                    <p className="text-[11px] text-slate-300 font-medium">
                      Tablette Caisse POS, QR Code Table Smartphone, Tableau de bord Gérant et Écran Salle Serveurs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Feature Navigation Tabs & Deep Dive */}
      <section id="features" className="py-16 px-4 sm:px-8 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full font-mono">
              Module par Module
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Des Fonctionnalités Conçues pour la Vérité du Terrain
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Découvrez en détail comment chaque composant de RestoChain résout un problème précis dans la gestion quotidienne de votre restaurant.
            </p>
          </div>

          {/* Interactive Feature Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            {features.map((f) => {
              const Icon = f.icon;
              const isSelected = activeFeatureTab === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeatureTab(f.id as any)}
                  className={`p-3 rounded-xl transition-all cursor-pointer text-center flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-lg font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold line-clamp-1">{f.title.split('&')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active Feature Detail Showcase Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-md border inline-block ${currentFeature.tagColor}`}>
                  {currentFeature.badge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentFeature.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  {currentFeature.description}
                </p>
              </div>

              {/* Bullet Points */}
              <div className="space-y-3 pt-2">
                {currentFeature.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-slate-200 font-semibold leading-snug">{b}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateView('portal')}
                  className="bg-slate-800 hover:bg-slate-700 text-orange-400 font-extrabold text-xs py-3 px-6 rounded-xl border border-slate-700 transition cursor-pointer inline-flex items-center gap-2 uppercase tracking-wider font-mono"
                >
                  Tester ce module en démo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Screen Mockup Visualization ("Capture d'écran correspondant") */}
            <div className="lg:col-span-6">
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                    <span className="ml-2 font-bold text-slate-200">RestoChain &mdash; {currentFeature.title}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    SaaS LIVE
                  </span>
                </div>

                {/* Mockup Renderer based on type */}
                {currentFeature.mockupType === 'pos' && (
                  <div className="space-y-3 font-sans text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[9px] text-slate-400 font-mono uppercase">Plats &amp; Boissons</span>
                        <div className="font-extrabold text-white text-xs">Acheke Poisson Grillé</div>
                        <div className="text-orange-400 font-mono font-bold">4 500 FCFA</div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[9px] text-slate-400 font-mono uppercase">Plats &amp; Boissons</span>
                        <div className="font-extrabold text-white text-xs">Jus de Bissap Glacé</div>
                        <div className="text-orange-400 font-mono font-bold">1 000 FCFA</div>
                      </div>
                    </div>
                    <div className="bg-orange-950/40 border border-orange-500/30 p-3 rounded-xl flex justify-between items-center text-white">
                      <div>
                        <div className="text-[10px] text-orange-300 font-mono uppercase">Total Commande Table #4</div>
                        <div className="font-black text-base text-orange-400">5 500 FCFA</div>
                      </div>
                      <div className="flex gap-1">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-[9px] font-bold rounded border border-cyan-500/30">Wave</span>
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-[9px] font-bold rounded border border-orange-500/30">Orange</span>
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded border border-emerald-500/30">Cash</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentFeature.mockupType === 'qr' && (
                  <div className="space-y-3 font-sans text-xs text-center p-2">
                    <div className="w-12 h-12 bg-white text-slate-900 rounded-xl flex items-center justify-center mx-auto shadow-md">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-indigo-400 font-mono uppercase font-bold">Scan QR Code Table #12</span>
                      <h5 className="font-extrabold text-white text-sm">Carte Digitale Interactive</h5>
                      <p className="text-[10px] text-slate-400">Le client parcourt la carte avec photos et commande directement.</p>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-left">
                      <div>
                        <span className="font-bold text-white text-xs block">Poulet Kedjenou + Alloco</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Ajouté au panier &bull; 5 000 FCFA</span>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-600 text-white font-extrabold text-[10px] rounded-lg">Commander &rarr;</span>
                    </div>
                  </div>
                )}

                {currentFeature.mockupType === 'finances' && (
                  <div className="space-y-3 font-sans text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">CA Réalisé ce mois</span>
                        <span className="font-black text-emerald-400 text-sm font-mono">2 450 000 FCFA</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block">Point Mort Minimal</span>
                        <span className="font-black text-amber-400 text-sm font-mono">1 200 000 FCFA</span>
                      </div>
                    </div>
                    <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-emerald-300 space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span>Statut Seuil de Rentabilité :</span>
                        <span className="font-black text-emerald-400">ATTEINT (+104%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[100%]"></div>
                      </div>
                    </div>
                  </div>
                )}

                {currentFeature.mockupType === 'stock' && (
                  <div className="space-y-2 font-sans text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white text-xs block">Sac de Riz Parfumé (50kg)</span>
                        <span className="text-[10px] text-slate-400">Stock restant : 12 sacs</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">Normal</span>
                    </div>
                    <div className="bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/30 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-rose-200 text-xs block">Jus de Gingembre Frais</span>
                        <span className="text-[10px] text-rose-300">Stock restant : 3 Litres</span>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-500/30 text-rose-300 text-[9px] font-black rounded animate-pulse">Alerte Critique</span>
                    </div>
                  </div>
                )}

                {currentFeature.mockupType === 'salle' && (
                  <div className="space-y-2 font-sans text-xs">
                    <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-amber-300 font-mono font-bold block">Table #3 &bull; Commande #104</span>
                        <span className="font-extrabold text-white">Choukouya de Mouton x2</span>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-lg">En Préparation</span>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-emerald-300 font-mono font-bold block">Table #7 &bull; Commande #103</span>
                        <span className="font-extrabold text-white">Capitaine Braisé + Frites</span>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-lg">Prêt à Servir</span>
                    </div>
                  </div>
                )}

                {currentFeature.mockupType === 'offline' && (
                  <div className="space-y-3 font-sans text-xs text-center p-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full font-mono text-[10px] font-bold">
                      <WifiOff className="w-3.5 h-3.5" />
                      Coupure Réseau Détectée &bull; Mode Hors-Ligne Actif
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Toutes les commandes sont enregistrées instantanément en local sur le terminal.
                    </p>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-left">
                      <span className="text-slate-400 text-[10px]">Commandes en attente de synchro :</span>
                      <span className="font-mono font-bold text-amber-400">4 commandes enregistrées</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Pricing Section ("Tarification Transparente FCFA") */}
      <section id="pricing" className="py-16 px-4 sm:px-8 bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
              Abonnement Sans Engagement
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Abonnements SaaS Révolutionnaires en FCFA
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Payez directement par Mobile Money (Wave, Orange Money, MTN, Moov) sans carte bancaire requise.
            </p>

            {/* Billing period switcher */}
            <div className="pt-4 flex justify-center">
              <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 inline-flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => setSelectedPricingPeriod('mensuel')}
                  className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                    selectedPricingPeriod === 'mensuel'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paiement Mensuel
                </button>
                <button
                  onClick={() => setSelectedPricingPeriod('annuel')}
                  className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedPricingPeriod === 'annuel'
                      ? 'bg-orange-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paiement Annuel
                  <span className="bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                    2 Mois Offerts !
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Plan Standard */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 relative hover:border-slate-700 transition">
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                  Formule Standard
                </span>
                <h3 className="text-2xl font-black text-white">Standard POS</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Idéal pour les maquis, restaurants individuels et fast-foods.
                </p>
              </div>

              <div className="font-mono">
                {selectedPricingPeriod === 'mensuel' ? (
                  <div>
                    <span className="text-3xl font-black text-white">
                      {(saasPricing.standardMensuel || 25000).toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs text-slate-400"> FCFA / mois</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-black text-emerald-400">
                      {(saasPricing.standardAnnuel || 250000).toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs text-slate-400"> FCFA / an</span>
                    <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Soit ~20 800 FCFA / mois (2 mois gratuits)</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-300 font-medium border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Caisse Tactile POS complète</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prise de commande &amp; impression reçu</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Suivi de caisse &amp; clôture journalière</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mode 100% Hors-Ligne garanti</span>
                </div>
              </div>

              <button
                onClick={() => setSubscriptionModalOpen(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl border border-slate-700 transition cursor-pointer uppercase tracking-wider font-mono"
              >
                Choisir la formule Standard
              </button>
            </div>

            {/* Plan Premium */}
            <div className="bg-slate-950 border-2 border-orange-500/80 rounded-3xl p-8 space-y-6 relative shadow-2xl shadow-orange-500/10">
              <div className="absolute -top-3.5 right-6 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full font-mono shadow-md">
                Meilleure Valeur !
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded border border-orange-500/30">
                  Formule Premium Multi-Espaces
                </span>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  Premium Multi-Espaces
                  <Sparkles className="w-5 h-5 text-orange-400" />
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Pour les établissements à fort volume, salons VIP &amp; chaînes.
                </p>
              </div>

              <div className="font-mono">
                {selectedPricingPeriod === 'mensuel' ? (
                  <div>
                    <span className="text-3xl font-black text-orange-400">
                      {(saasPricing.premiumMensuel || 50000).toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs text-slate-400"> FCFA / mois</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-black text-orange-400">
                      {(saasPricing.premiumAnnuel || 500000).toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs text-slate-400"> FCFA / an</span>
                    <p className="text-[10px] text-orange-400 font-bold mt-0.5">Soit ~41 600 FCFA / mois (2 mois gratuits)</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-200 font-medium border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span><strong>Multi-Caisses simultanées</strong> (Nombre illimité)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span><strong>Menu QR Code à Table Client</strong> interactif</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span><strong>Écran Kiosque Salle Serveurs</strong> en direct</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span><strong>Analyse financière avancée</strong> &amp; Point Mort</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Sauvegarde Cloud auto &amp; Support Prioritaire VIP</span>
                </div>
              </div>

              <button
                onClick={() => setSubscriptionModalOpen(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-xl shadow-orange-500/20 transition cursor-pointer uppercase tracking-wider font-mono"
              >
                Souscrire la formule Premium
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4 sm:px-8 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Foire Aux Questions (FAQ)</h2>
            <p className="text-xs text-slate-400">Tout ce que vous devez savoir avant de démarrer avec RestoChain SaaS.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-400 shrink-0" />
                Est-ce que l'application fonctionne vraiment en cas de coupure Internet ?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                <strong>Oui, absolument.</strong> L'application stocke les données localement sur votre tablette ou ordinateur. Votre caissier continue d'encaisser les commandes normalement. Dès que le réseau Internet est rétabli, les ventes sont synchronisées de façon transparente vers votre espace Cloud gérant.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-400 shrink-0" />
                Comment s'effectue le règlement de l'abonnement SaaS ?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Vous pouvez régler directement votre abonnement via Mobile Money (Wave, Orange Money, MTN Mobile Money, Moov Money) ou par Carte Bancaire. Aucune démarche complexe n'est requise et la réactivation est instantanée.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-400 shrink-0" />
                Combien de temps prend la mise en place pour mon restaurant ?
              </h4>
              <p className="text-slate-300 leading-relaxed">
                La prise en main prend moins de 15 minutes. Vous pouvez configurer votre carte et vos prix en quelques clics ou nous confier l'importation initiale de votre menu. Vos serveurs n'ont besoin que de 5 minutes de formation tant l'interface est intuitive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-12 px-4 sm:px-8 bg-slate-900 border-t border-slate-800 text-center space-y-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <Logo size="md" width={48} height={48} className="bg-white p-1 rounded-full shadow-lg mx-auto" />
          <h3 className="text-xl sm:text-2xl font-black text-white">Modernisez votre restaurant dès aujourd'hui</h3>
          <p className="text-xs text-slate-400">
            Rejoignez les dizaines de restaurateurs qui simplifient leur gestion quotidienne avec RestoChain.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigateView('portal')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 px-6 rounded-xl shadow-lg transition cursor-pointer uppercase tracking-wider font-mono"
            >
              Lancer l'Application Démo &rarr;
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-6 border-t border-slate-800 font-mono">
          © 2026 RestoChain SaaS Platform &bull; Fait avec passion pour la Restauration en Afrique
        </div>
      </footer>

      {/* Demo Custom Request Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative text-slate-100"
            >
              <button
                onClick={() => {
                  setShowDemoModal(false);
                  setDemoSubmitted(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full cursor-pointer"
              >
                ✕
              </button>

              {!demoSubmitted ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-orange-400 uppercase">
                      Accompagnement Sur Mesure
                    </span>
                    <h3 className="text-xl font-black text-white">Demander un Essai Personnalisé</h3>
                    <p className="text-xs text-slate-400">
                      Entrez les coordonnées de votre établissement pour recevoir un accès démo configuré avec votre carte.
                    </p>
                  </div>

                  <form onSubmit={handleDemoSubmit} className="space-y-4 text-xs font-bold">
                    <div>
                      <label className="block text-slate-300 uppercase tracking-wider mb-1">
                        Nom de votre restaurant *
                      </label>
                      <input
                        type="text"
                        required
                        value={demoRestaurantName}
                        onChange={(e) => setDemoRestaurantName(e.target.value)}
                        placeholder="Ex: Le Jardin Gourmand"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 uppercase tracking-wider mb-1">
                        Numéro de Téléphone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={demoPhone}
                        onChange={(e) => setDemoPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg transition cursor-pointer uppercase tracking-wider font-mono text-xs"
                    >
                      Envoyer la demande d'essai
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-white">Demande Bien Reçue !</h4>
                    <p className="text-xs text-slate-300">
                      Un conseiller RestoChain contactera le <span className="font-mono text-orange-400">{demoPhone}</span> sous 15 minutes pour activer votre espace démo.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDemoModal(false);
                      setDemoSubmitted(false);
                    }}
                    className="bg-slate-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Renewal/Trial Modal */}
      {subscriptionModalOpen && (
        <SubscriptionRenewalModal
          isOpen={subscriptionModalOpen}
          onClose={() => setSubscriptionModalOpen(false)}
          activeRestaurant={{
            id: 'demo-rest',
            name: activeRestaurantName,
            status: 'ACTIF',
            subscriptionPlan: 'PREMIUM_ANNUEL',
            subscriptionStartDate: '2026-01-01',
            subscriptionEndDate: '2026-12-31',
            managerName: 'Gérant RestoChain',
            managerPhone: '+2250700000000',
            managerEmail: 'gerant@restochain.ci',
            address: 'Abidjan, Côte d\'Ivoire',
            contacts: '+225 07 00 00 00 00',
            logo: '',
            slogan: 'L\'excellence culinaire',
            whatsapp: '+2250700000000',
            adminUsername: 'admin',
            adminPassword: 'password',
            createdAt: '2026-01-01'
          }}
          saasPricing={saasPricing}
          onRenew={() => {
            setSubscriptionModalOpen(false);
            onNavigateView('portal');
          }}
        />
      )}

    </div>
  );
}
