import React, { useState, useMemo } from 'react';
import { RestaurantTenant, SaaSPlanKey, SaaSPricingConfig } from '../types';
import { RestaurantTenantValidationSchema, formatZodError } from '../validation';
import {
  Building2,
  Users,
  CreditCard,
  Clock,
  Award,
  Plus,
  Search,
  Edit,
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Lock,
  UserCheck
} from 'lucide-react';

interface SuperAdminSaaSProps {
  restaurants: RestaurantTenant[];
  saasPricing: SaaSPricingConfig;
  activeRestaurantId: string;
  onCreateRestaurant: (data: Omit<RestaurantTenant, 'id' | 'createdAt'>) => void;
  onUpdateRestaurant: (id: string, data: Partial<RestaurantTenant>) => void;
  onDeleteRestaurant: (id: string) => void;
  onRenewSubscription: (id: string, plan: SaaSPlanKey, endDateStr: string) => void;
  onUpdatePricing: (pricing: SaaSPricingConfig) => void;
  onSelectActiveRestaurant: (id: string) => void;
  onLogoutSuperAdmin?: () => void;
}

export const PLAN_LABELS: Record<SaaSPlanKey, { name: string; type: 'Standard' | 'Premium'; cycle: 'Mensuel' | 'Annuel'; color: string }> = {
  STANDARD_MENSUEL: { name: 'Standard Mensuel', type: 'Standard', cycle: 'Mensuel', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  STANDARD_ANNUEL: { name: 'Standard Annuel', type: 'Standard', cycle: 'Annuel', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PREMIUM_MENSUEL: { name: 'Premium Mensuel', type: 'Premium', cycle: 'Mensuel', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  PREMIUM_ANNUEL: { name: 'Premium Annuel', type: 'Premium', cycle: 'Annuel', color: 'bg-orange-50 text-orange-800 border-orange-200' },
};

export const formatFCFA = (amount: number) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export const getDaysRemaining = (endDateStr: string) => {
  if (!endDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function SuperAdminSaaS({
  restaurants,
  saasPricing,
  activeRestaurantId,
  onCreateRestaurant,
  onUpdateRestaurant,
  onDeleteRestaurant,
  onRenewSubscription,
  onUpdatePricing,
  onSelectActiveRestaurant,
  onLogoutSuperAdmin
}: SuperAdminSaaSProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TOUS' | 'ACTIF' | 'EXPIRE' | 'SUSPENDU'>('TOUS');
  const [planFilter, setPlanFilter] = useState<string>('TOUS');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantTenant | null>(null);
  const [renewingRestaurant, setRenewingRestaurant] = useState<RestaurantTenant | null>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Form states for Create/Edit Restaurant
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    slogan: '',
    address: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    contacts: '',
    whatsapp: '',
    subscriptionPlan: 'PREMIUM_ANNUEL' as SaaSPlanKey,
    subscriptionStartDate: new Date().toISOString().split('T')[0],
    subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    adminUsername: '',
    adminPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Renewal Form
  const [renewalPlan, setRenewalPlan] = useState<SaaSPlanKey>('PREMIUM_ANNUEL');
  const [renewalEndDate, setRenewalEndDate] = useState<string>('');

  // Editable Prices Form
  const [pricingForm, setPricingForm] = useState<SaaSPricingConfig>(saasPricing);

  // Compute KPIs
  const kpis = useMemo(() => {
    const totalCount = restaurants.length;
    const activeCount = restaurants.filter((r) => r.status === 'ACTIF' && getDaysRemaining(r.subscriptionEndDate) >= 0).length;
    const expiredCount = restaurants.filter((r) => r.status === 'EXPIRE' || getDaysRemaining(r.subscriptionEndDate) < 0).length;
    const suspendedCount = restaurants.filter((r) => r.status === 'SUSPENDU').length;

    // Plans breakdown
    const standardCount = restaurants.filter((r) => r.subscriptionPlan.startsWith('STANDARD')).length;
    const premiumCount = restaurants.filter((r) => r.subscriptionPlan.startsWith('PREMIUM')).length;
    const mensuelCount = restaurants.filter((r) => r.subscriptionPlan.endsWith('MENSUEL')).length;
    const annuelCount = restaurants.filter((r) => r.subscriptionPlan.endsWith('ANNUEL')).length;

    // Subscriptions expiring within 30 days
    const expiringSoonCount = restaurants.filter((r) => {
      const days = getDaysRemaining(r.subscriptionEndDate);
      return days >= 0 && days <= 30 && r.status === 'ACTIF';
    }).length;

    // Loyal subscribers (created over 180 days ago or active annual plan)
    const loyalSubscribersCount = restaurants.filter((r) => {
      if (r.subscriptionPlan.endsWith('ANNUEL')) return true;
      const createdDate = new Date(r.createdAt);
      const diffDays = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 180;
    }).length;

    // Estimated total SaaS ARR (Annual Recurring Revenue equivalent)
    let totalARR = 0;
    restaurants.forEach((r) => {
      if (r.subscriptionPlan === 'STANDARD_MENSUEL') totalARR += saasPricing.standardMensuel * 12;
      if (r.subscriptionPlan === 'STANDARD_ANNUEL') totalARR += saasPricing.standardAnnuel;
      if (r.subscriptionPlan === 'PREMIUM_MENSUEL') totalARR += saasPricing.premiumMensuel * 12;
      if (r.subscriptionPlan === 'PREMIUM_ANNUEL') totalARR += saasPricing.premiumAnnuel;
    });

    return {
      totalCount,
      activeCount,
      expiredCount,
      suspendedCount,
      standardCount,
      premiumCount,
      mensuelCount,
      annuelCount,
      expiringSoonCount,
      loyalSubscribersCount,
      totalARR,
    };
  }, [restaurants, saasPricing]);

  // Filtered restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.managerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contacts.toLowerCase().includes(searchTerm.toLowerCase());

      const daysLeft = getDaysRemaining(r.subscriptionEndDate);
      const effectiveStatus = r.status === 'SUSPENDU' ? 'SUSPENDU' : daysLeft < 0 ? 'EXPIRE' : r.status;

      const matchesStatus = statusFilter === 'TOUS' || effectiveStatus === statusFilter;
      const matchesPlan = planFilter === 'TOUS' || r.subscriptionPlan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [restaurants, searchTerm, statusFilter, planFilter]);

  const openCreateModal = () => {
    setFormData({
      name: '',
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
      slogan: 'L\'excellence culinaire',
      address: 'Abidjan, Côte d\'Ivoire',
      managerName: '',
      managerPhone: '+225 ',
      managerEmail: '',
      contacts: '+225 ',
      whatsapp: '+225 ',
      subscriptionPlan: 'PREMIUM_ANNUEL',
      subscriptionStartDate: new Date().toISOString().split('T')[0],
      subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      adminUsername: '',
      adminPassword: '',
    });
    setFormErrors({});
    setEditingRestaurant(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (r: RestaurantTenant) => {
    setEditingRestaurant(r);
    setFormData({
      name: r.name,
      logo: r.logo,
      slogan: r.slogan,
      address: r.address,
      managerName: r.managerName,
      managerPhone: r.managerPhone,
      managerEmail: r.managerEmail,
      contacts: r.contacts,
      whatsapp: r.whatsapp,
      subscriptionPlan: r.subscriptionPlan,
      subscriptionStartDate: r.subscriptionStartDate,
      subscriptionEndDate: r.subscriptionEndDate,
      adminUsername: r.adminUsername,
      adminPassword: r.adminPassword,
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handlePlanChangeInForm = (plan: SaaSPlanKey) => {
    const today = new Date(formData.subscriptionStartDate || new Date());
    let end = new Date(today);
    if (plan.endsWith('ANNUEL')) {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    setFormData((prev) => ({
      ...prev,
      subscriptionPlan: plan,
      subscriptionEndDate: end.toISOString().split('T')[0],
    }));
  };

  const handleSaveRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = RestaurantTenantValidationSchema.parse(formData);
      setFormErrors({});

      if (editingRestaurant) {
        onUpdateRestaurant(editingRestaurant.id, {
          name: validated.name,
          logo: validated.logo || editingRestaurant.logo,
          slogan: validated.slogan || '',
          address: validated.address,
          managerName: validated.managerName,
          managerPhone: validated.managerPhone,
          managerEmail: validated.managerEmail,
          contacts: validated.contacts,
          whatsapp: validated.whatsapp,
          subscriptionPlan: validated.subscriptionPlan,
          subscriptionStartDate: validated.subscriptionStartDate,
          subscriptionEndDate: validated.subscriptionEndDate,
          adminUsername: validated.adminUsername,
          adminPassword: validated.adminPassword,
          status: getDaysRemaining(validated.subscriptionEndDate) < 0 ? 'EXPIRE' : editingRestaurant.status,
        });
      } else {
        onCreateRestaurant({
          name: validated.name,
          logo: validated.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
          slogan: validated.slogan || '',
          address: validated.address,
          managerName: validated.managerName,
          managerPhone: validated.managerPhone,
          managerEmail: validated.managerEmail,
          contacts: validated.contacts,
          whatsapp: validated.whatsapp,
          subscriptionPlan: validated.subscriptionPlan,
          subscriptionStartDate: validated.subscriptionStartDate,
          subscriptionEndDate: validated.subscriptionEndDate,
          adminUsername: validated.adminUsername,
          adminPassword: validated.adminPassword,
          status: 'ACTIF',
        });
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        setFormErrors(formatZodError(err));
      } else {
        alert('Erreur lors de l\'enregistrement : ' + err.message);
      }
    }
  };

  const openRenewModal = (r: RestaurantTenant) => {
    setRenewingRestaurant(r);
    setRenewalPlan(r.subscriptionPlan);
    const startDate = new Date();
    if (r.subscriptionPlan.endsWith('ANNUEL')) {
      startDate.setFullYear(startDate.getFullYear() + 1);
    } else {
      startDate.setMonth(startDate.getMonth() + 1);
    }
    setRenewalEndDate(startDate.toISOString().split('T')[0]);
  };

  const handleConfirmRenew = () => {
    if (!renewingRestaurant) return;
    onRenewSubscription(renewingRestaurant.id, renewalPlan, renewalEndDate);
    setRenewingRestaurant(null);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePricing(pricingForm);
    setIsPricingModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      
      {/* SaaS Platform Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-black uppercase tracking-widest rounded-full font-mono shadow-sm">
                RestoChain SaaS Super Admin
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Plateforme Multi-Restaurants RestoChain
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
              Tableau de Bord de Gestion des Abonnés
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Superviser les abonnements souscrits, configurer les accès des gérants, paramétrer les offres tarifaires et suivre les délais de validité des établissements clients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setPricingForm(saasPricing);
                setIsPricingModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl border border-slate-700 shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-orange-400" />
              Tarifs Abonnements
            </button>

            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nouveau Restaurant
            </button>

            {onLogoutSuperAdmin && (
              <button
                onClick={onLogoutSuperAdmin}
                className="px-3 py-2.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold text-xs rounded-xl border border-rose-700/50 transition cursor-pointer"
                title="Déconnexion Super Admin"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Abonnés */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Nombre d'Abonnés
            </span>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {kpis.totalCount} <span className="text-xs font-normal text-slate-500">restaurants</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold mt-1">
              <span className="text-emerald-600">{kpis.activeCount} Actifs</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-600">{kpis.expiredCount} Expirés</span>
              {kpis.suspendedCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-600">{kpis.suspendedCount} Suspendus</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Abonnements Souscrits & Revenus */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Formules Souscrites
            </span>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 font-mono truncate">
              {formatFCFA(kpis.totalARR)} <span className="text-[10px] font-semibold text-slate-400">/an (estimé)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-semibold">
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                Std: {kpis.standardCount}
              </span>
              <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px]">
                Prem: {kpis.premiumCount}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                ({kpis.annuelCount} annuels / {kpis.mensuelCount} mensuels)
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Délais Restants & Renouvellements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Délais &amp; Alertes
            </span>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {kpis.expiringSoonCount} <span className="text-xs font-normal text-amber-600 font-sans">à renouveler &lt; 30j</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {kpis.expiredCount > 0 ? (
                <span className="text-rose-600 font-bold">{kpis.expiredCount} abonnement(s) actuellement expiré(s)</span>
              ) : (
                <span className="text-emerald-600 font-bold">Tous les abonnements sont à jour !</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Abonnés Fidèles */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Abonnés Fidèles
            </span>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {kpis.loyalSubscribersCount} <span className="text-xs font-normal text-emerald-600 font-sans">restaurants fidèles</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Abonnés annuels ou présents depuis &gt; 6 mois
            </div>
          </div>
        </div>

      </div>

      {/* SaaS Pricing Preview Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900">Grille Tarifaire SaaS Actuelle : </span>
            <span className="text-slate-600 font-mono">
              Standard ({formatFCFA(saasPricing.standardMensuel)}/m • {formatFCFA(saasPricing.standardAnnuel)}/an) | Premium ({formatFCFA(saasPricing.premiumMensuel)}/m • {formatFCFA(saasPricing.premiumAnnuel)}/an)
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setPricingForm(saasPricing);
            setIsPricingModalOpen(true);
          }}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-250 transition shrink-0 cursor-pointer"
        >
          ⚙️ Modifier les prix
        </button>
      </div>

      {/* Main Filter & Restaurants List Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Search & Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Établissements &amp; Restaurants Client
            </h2>
            <p className="text-xs text-slate-500">
              Affichage de {filteredRestaurants.length} sur {restaurants.length} restaurant(s) abonné(s)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher nom, gérant, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="TOUS">Tous les Statuts</option>
              <option value="ACTIF">🟢 Actifs</option>
              <option value="EXPIRE">🔴 Expirés</option>
              <option value="SUSPENDU">🟡 Suspendus</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="TOUS">Toutes les Offres</option>
              <option value="STANDARD_MENSUEL">Standard Mensuel</option>
              <option value="STANDARD_ANNUEL">Standard Annuel</option>
              <option value="PREMIUM_MENSUEL">Premium Mensuel</option>
              <option value="PREMIUM_ANNUEL">Premium Annuel</option>
            </select>
          </div>
        </div>

        {/* Restaurant Cards List */}
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">Aucun restaurant ne correspond aux critères</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Essayez de modifier votre recherche ou ajoutez un nouvel établissement abonné.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" /> Créer un restaurant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRestaurants.map((r) => {
              const daysLeft = getDaysRemaining(r.subscriptionEndDate);
              const isExpired = daysLeft < 0 || r.status === 'EXPIRE';
              const isSuspended = r.status === 'SUSPENDU';
              const isExpiringSoon = !isExpired && !isSuspended && daysLeft <= 30;
              const isCurrentlyActiveTenant = r.id === activeRestaurantId;

              const planInfo = PLAN_LABELS[r.subscriptionPlan] || PLAN_LABELS.PREMIUM_ANNUEL;

              return (
                <div
                  key={r.id}
                  className={`bg-white border rounded-2xl p-6 transition duration-200 shadow-sm hover:shadow-md flex flex-col justify-between space-y-5 relative ${
                    isCurrentlyActiveTenant
                      ? 'border-orange-500 ring-2 ring-orange-500/20'
                      : isExpired
                      ? 'border-rose-200 bg-rose-50/20'
                      : isSuspended
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Badge bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&auto=format&fit=crop&q=80'}
                        alt={r.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0 bg-slate-100"
                        onError={(e: any) => {
                          e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                            {r.name}
                          </h3>
                          {isCurrentlyActiveTenant && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white font-mono text-[9px] font-black uppercase rounded-full">
                              Espace en cours
                            </span>
                          )}
                        </div>
                        {r.slogan && (
                          <p className="text-xs text-slate-500 font-medium italic">
                            « {r.slogan} »
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider font-mono border ${
                          isSuspended
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : isExpired
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isExpiringSoon
                            ? 'bg-orange-100 text-orange-800 border-orange-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <Ban className="w-3.5 h-3.5" /> Suspendu
                          </>
                        ) : isExpired ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" /> Expiré ({Math.abs(daysLeft)}j)
                          </>
                        ) : isExpiringSoon ? (
                          <>
                            <Clock className="w-3.5 h-3.5" /> Expire dans {daysLeft}j
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valide ({daysLeft}j)
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Information Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-150">
                    
                    {/* Gérant & Access */}
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        Gérant : {r.managerName}
                      </div>
                      <div className="text-slate-600 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        {r.managerEmail}
                      </div>
                      <div className="text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        {r.managerPhone}
                      </div>
                      <div className="pt-1 text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center justify-between">
                        <span>Identifiant: <strong>{r.adminUsername}</strong></span>
                        <span className="text-slate-400">Pswd: ••••</span>
                      </div>
                    </div>

                    {/* Contacts & Subscription Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${planInfo.color}`}>
                          {planInfo.name}
                        </span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{r.address}</span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-emerald-500 shrink-0" />
                        WhatsApp: {r.whatsapp}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono pt-1">
                        Période : {new Date(r.subscriptionStartDate).toLocaleDateString('fr-FR')} &rarr; {new Date(r.subscriptionEndDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(r)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                        title="Modifier l'établissement et les accès"
                      >
                        <Edit className="w-3.5 h-3.5" /> Configurer Profil
                      </button>

                      <button
                        onClick={() => openRenewModal(r)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                        title="Prolonger ou renouveler l'abonnement"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Renouveler
                      </button>

                      <button
                        onClick={() => {
                          const nextStatus = r.status === 'SUSPENDU' ? 'ACTIF' : 'SUSPENDU';
                          if (confirm(`Voulez-vous vraiment passer ${r.name} en statut "${nextStatus}" ?`)) {
                            onUpdateRestaurant(r.id, { status: nextStatus });
                          }
                        }}
                        className={`px-2.5 py-1.5 font-bold text-xs rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                          r.status === 'SUSPENDU'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        {r.status === 'SUSPENDU' ? 'Activer' : 'Suspendre'}
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectActiveRestaurant(r.id)}
                      className={`px-4 py-1.5 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer ${
                        isCurrentlyActiveTenant
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>Espace Établissement</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL 1: Create or Edit Restaurant Tenant */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingRestaurant ? `Configuration : ${editingRestaurant.name}` : 'Nouveau Restaurant Abonné'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Saisissez les coordonnées de l'établissement et l'accès d'administration du gérant.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRestaurant} className="space-y-6">
              
              {/* Section A: Informations du Restaurant */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 font-mono border-b border-orange-100 pb-1">
                  1. Informations Générales de l'Établissement
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom du Restaurant <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Restaurant Yikéli"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {formErrors.name && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Slogan
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Le goût authentique des saveurs ivoiriennes"
                      value={formData.slogan}
                      onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL / Image du Logo
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adresse physique <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Abidjan, Route d'Abatta derrière pharmacie"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {formErrors.address && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.address}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contacts Téléphone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+225 05 01 14 92 44"
                      value={formData.contacts}
                      onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {formErrors.contacts && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.contacts}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Numéro WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+225 05 01 14 92 44"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {formErrors.whatsapp && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.whatsapp}</p>}
                  </div>
                </div>
              </div>

              {/* Section B: Coordonnées du Gérant */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 font-mono border-b border-orange-100 pb-1">
                  2. Coordonnées du Gérant &amp; Identifiants d'Accès
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom du gérant <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Flavien Kouassi"
                      value={formData.managerName}
                      onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {formErrors.managerName && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.managerName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact du gérant <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+225 05 01 14 92 44"
                      value={formData.managerPhone}
                      onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {formErrors.managerPhone && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.managerPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mail du gérant <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="gerant@yikeli.ci"
                      value={formData.managerEmail}
                      onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    {formErrors.managerEmail && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.managerEmail}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1">
                      Identifiant (Login Gérant) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="admin"
                      value={formData.adminUsername}
                      onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {formErrors.adminUsername && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.adminUsername}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 mb-1">
                      Mot de passe d'accès <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="••••••••"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {formErrors.adminPassword && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.adminPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Section C: Abonnement choisi */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 font-mono border-b border-orange-100 pb-1">
                  3. Offre d'Abonnement SaaS &amp; Validité
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      L'Abonnement Choisi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.subscriptionPlan}
                      onChange={(e) => handlePlanChangeInForm(e.target.value as SaaSPlanKey)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="STANDARD_MENSUEL">Standard Mensuel ({formatFCFA(saasPricing.standardMensuel)}/m)</option>
                      <option value="STANDARD_ANNUEL">Standard Annuel ({formatFCFA(saasPricing.standardAnnuel)}/an)</option>
                      <option value="PREMIUM_MENSUEL">Premium Mensuel ({formatFCFA(saasPricing.premiumMensuel)}/m)</option>
                      <option value="PREMIUM_ANNUEL">Premium Annuel ({formatFCFA(saasPricing.premiumAnnuel)}/an)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date de début <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.subscriptionStartDate}
                      onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date de fin <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.subscriptionEndDate}
                      onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingRestaurant ? 'Enregistrer les modifications' : 'Créer l\'Établissement Abonné'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Renew Subscription Modal */}
      {renewingRestaurant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Renouvellement d'Abonnement
                </h3>
              </div>
              <button
                onClick={() => setRenewingRestaurant(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Établissement : <strong className="text-slate-900 font-bold">{renewingRestaurant.name}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sélectionner la Formule d'Abonnement
                </label>
                <select
                  value={renewalPlan}
                  onChange={(e) => {
                    const plan = e.target.value as SaaSPlanKey;
                    setRenewalPlan(plan);
                    const startDate = new Date();
                    if (plan.endsWith('ANNUEL')) {
                      startDate.setFullYear(startDate.getFullYear() + 1);
                    } else {
                      startDate.setMonth(startDate.getMonth() + 1);
                    }
                    setRenewalEndDate(startDate.toISOString().split('T')[0]);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="STANDARD_MENSUEL">Standard Mensuel ({formatFCFA(saasPricing.standardMensuel)})</option>
                  <option value="STANDARD_ANNUEL">Standard Annuel ({formatFCFA(saasPricing.standardAnnuel)})</option>
                  <option value="PREMIUM_MENSUEL">Premium Mensuel ({formatFCFA(saasPricing.premiumMensuel)})</option>
                  <option value="PREMIUM_ANNUEL">Premium Annuel ({formatFCFA(saasPricing.premiumAnnuel)})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nouvelle Date de Fin de Validité
                </label>
                <input
                  type="date"
                  required
                  value={renewalEndDate}
                  onChange={(e) => setRenewalEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRenewingRestaurant(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRenew}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Valider le Renouvellement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SaaS Pricing Settings Modal */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Paramètres des Prix d'Abonnement SaaS
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifiez les tarifs mensuels et annuels pour les formules Standard et Premium.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-5">
              
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-700 font-mono">
                  1. Offre Standard
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Standard Mensuel (FCFA/mois)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pricingForm.standardMensuel}
                      onChange={(e) => setPricingForm({ ...pricingForm, standardMensuel: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Standard Annuel (FCFA/an)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pricingForm.standardAnnuel}
                      onChange={(e) => setPricingForm({ ...pricingForm, standardAnnuel: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black uppercase text-orange-600 font-mono">
                  2. Offre Premium
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Premium Mensuel (FCFA/mois)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pricingForm.premiumMensuel}
                      onChange={(e) => setPricingForm({ ...pricingForm, premiumMensuel: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Premium Annuel (FCFA/an)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pricingForm.premiumAnnuel}
                      onChange={(e) => setPricingForm({ ...pricingForm, premiumAnnuel: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Enregistrer les Tarifs
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
