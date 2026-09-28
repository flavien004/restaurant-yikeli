import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Smartphone, Calendar, AlertCircle, Receipt, Download } from 'lucide-react';
import { RestaurantTenant, SaaSPricingConfig, SaaSPlanKey } from '../types';

interface SubscriptionRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRestaurant: RestaurantTenant;
  saasPricing: SaaSPricingConfig;
  onRenew: (plan: SaaSPlanKey, endDateStr: string, paymentMethod: string, amountPaid: number) => void;
  initialMode?: 'renew' | 'change';
}

export default function SubscriptionRenewalModal({
  isOpen,
  onClose,
  activeRestaurant,
  saasPricing,
  onRenew,
  initialMode = 'renew'
}: SubscriptionRenewalModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SaaSPlanKey>(activeRestaurant.subscriptionPlan || 'STANDARD_MENSUEL');
  const [paymentMethod, setPaymentMethod] = useState<'WAVE' | 'ORANGE_MONEY' | 'MTN' | 'MOOV' | 'CARTE'>('WAVE');
  const [phoneNumber, setPhoneNumber] = useState(activeRestaurant.managerPhone || '');
  const [durationMonths, setDurationMonths] = useState<number>(
    selectedPlan.includes('ANNUEL') ? 12 : 1
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<{
    txId: string;
    amount: number;
    newEndDate: string;
    planName: string;
    method: string;
  } | null>(null);

  if (!isOpen) return null;

  // Calculate pricing
  const getPriceForPlan = (plan: SaaSPlanKey) => {
    switch (plan) {
      case 'STANDARD_MENSUEL':
        return saasPricing.standardMensuel || 25000;
      case 'STANDARD_ANNUEL':
        return saasPricing.standardAnnuel || 250000;
      case 'PREMIUM_MENSUEL':
        return saasPricing.premiumMensuel || 50000;
      case 'PREMIUM_ANNUEL':
        return saasPricing.premiumAnnuel || 500000;
      default:
        return 25000;
    }
  };

  const currentPlanPrice = getPriceForPlan(selectedPlan);
  const isAnnual = selectedPlan.includes('ANNUEL');

  // Compute total cost and new expiry date
  const computeRenewal = () => {
    let baseAmount = currentPlanPrice;
    if (!isAnnual && durationMonths > 1) {
      baseAmount = currentPlanPrice * durationMonths;
    }

    const today = new Date();
    const currentEnd = activeRestaurant.subscriptionEndDate ? new Date(activeRestaurant.subscriptionEndDate) : today;
    const startDate = currentEnd > today ? currentEnd : today;

    const newEnd = new Date(startDate);
    if (isAnnual) {
      newEnd.setFullYear(newEnd.getFullYear() + (durationMonths >= 12 ? Math.floor(durationMonths / 12) : 1));
    } else {
      newEnd.setMonth(newEnd.getMonth() + durationMonths);
    }

    const formattedDate = newEnd.toISOString().split('T')[0];
    return { amount: baseAmount, newEndDate: formattedDate };
  };

  const { amount, newEndDate } = computeRenewal();

  const handlePlanSelect = (plan: SaaSPlanKey) => {
    setSelectedPlan(plan);
    if (plan.includes('ANNUEL')) {
      setDurationMonths(12);
    } else {
      setDurationMonths(1);
    }
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const txRef = 'TX-' + Math.floor(100000 + Math.random() * 900000);
    
    // Call parent update callback
    onRenew(selectedPlan, newEndDate, paymentMethod, amount);

    setReceiptDetails({
      txId: txRef,
      amount,
      newEndDate,
      planName: getPlanLabel(selectedPlan),
      method: paymentMethod,
    });
    setIsSuccess(true);
  };

  function getPlanLabel(planKey: SaaSPlanKey) {
    switch (planKey) {
      case 'STANDARD_MENSUEL':
        return 'Standard Mensuel (25 000 FCFA / mois)';
      case 'STANDARD_ANNUEL':
        return 'Standard Annuel (250 000 FCFA / an)';
      case 'PREMIUM_MENSUEL':
        return 'Premium Mensuel (50 000 FCFA / mois)';
      case 'PREMIUM_ANNUEL':
        return 'Premium Annuel (500 000 FCFA / an)';
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100 my-auto"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1 pr-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 inline-flex items-center gap-1 font-mono">
                <CreditCard className="w-3 h-3 text-orange-500" />
                {initialMode === 'change' ? 'Changement de Formule SaaS' : 'Renouvellement d\'Abonnement SaaS'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Abonnement {activeRestaurant.name}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Prolongez vos accès POS et gestion caisse multi-appareils sans interruption de service.
              </p>
            </div>

            {/* Current status overview card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Formule Actuelle en Cours
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-orange-400 font-sans">
                    {getPlanLabel(activeRestaurant.subscriptionPlan)}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
                    {activeRestaurant.status}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right font-mono text-xs text-slate-300 space-y-0.5 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 w-full sm:w-auto">
                <p className="text-[10px] text-slate-400 uppercase font-sans">Expiration Actuelle</p>
                <p className="font-black text-white text-sm">
                  {activeRestaurant.subscriptionEndDate ? activeRestaurant.subscriptionEndDate : 'N/A'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-6">
              {/* Plan Choice Grid */}
              <div className="space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Choisissez votre Formule d'Abonnement
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Standard Mensuel */}
                  <button
                    type="button"
                    onClick={() => handlePlanSelect('STANDARD_MENSUEL')}
                    className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                      selectedPlan === 'STANDARD_MENSUEL'
                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">Standard Mensuel</span>
                      <span className="text-xs font-black text-orange-600 font-mono">
                        {(saasPricing.standardMensuel || 25000).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      1 Caisse POS, gestion des stocks, impressions reçus &amp; rapports journaliers.
                    </p>
                  </button>

                  {/* Standard Annuel */}
                  <button
                    type="button"
                    onClick={() => handlePlanSelect('STANDARD_ANNUEL')}
                    className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                      selectedPlan === 'STANDARD_ANNUEL'
                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full font-mono shadow-xs">
                      2 Mois Offerts !
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">Standard Annuel</span>
                      <span className="text-xs font-black text-emerald-600 font-mono">
                        {(saasPricing.standardAnnuel || 250000).toLocaleString('fr-FR')} FCFA / an
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      Toutes les options Standard facturées à l'année. 2 mois gratuits offerts.
                    </p>
                  </button>

                  {/* Premium Mensuel */}
                  <button
                    type="button"
                    onClick={() => handlePlanSelect('PREMIUM_MENSUEL')}
                    className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                      selectedPlan === 'PREMIUM_MENSUEL'
                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        Premium Mensuel
                      </span>
                      <span className="text-xs font-black text-orange-600 font-mono">
                        {(saasPricing.premiumMensuel || 50000).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      Multi-Caisses simultanées, QR Code Table Client, Analyse prévisionnelle &amp; sauvegarde cloud auto.
                    </p>
                  </button>

                  {/* Premium Annuel */}
                  <button
                    type="button"
                    onClick={() => handlePlanSelect('PREMIUM_ANNUEL')}
                    className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                      selectedPlan === 'PREMIUM_ANNUEL'
                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full font-mono shadow-xs">
                      Meilleur Choix !
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        Premium Annuel
                      </span>
                      <span className="text-xs font-black text-orange-600 font-mono">
                        {(saasPricing.premiumAnnuel || 500000).toLocaleString('fr-FR')} FCFA / an
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      Inclus toutes les fonctionnalités avancées avec priorité support VIP et 2 mois gratuits.
                    </p>
                  </button>

                </div>
              </div>

              {/* Renewal Duration Selector (if monthly) */}
              {!isAnnual && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    2. Durée du renouvellement
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                    {[1, 3, 6, 12].map((m, idx) => (
                      <button
                        key={`sub-month-${m}-${idx}`}
                        type="button"
                        onClick={() => setDurationMonths(m)}
                        className={`py-2 px-3 rounded-xl border transition text-center cursor-pointer ${
                          durationMonths === m
                            ? 'bg-slate-900 text-white border-slate-900 font-black'
                            : 'bg-slate-50 text-slate-700 border-gray-200 hover:bg-slate-100'
                        }`}
                      >
                        {m} mois
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  {isAnnual ? '2. Mode de Paiement Sécurisé' : '3. Mode de Paiement Sécurisé'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: 'WAVE', label: 'Wave 🌊', color: 'border-cyan-400 bg-cyan-50/40' },
                    { key: 'ORANGE_MONEY', label: 'Orange 🍊', color: 'border-orange-400 bg-orange-50/40' },
                    { key: 'MTN', label: 'MTN 💛', color: 'border-amber-400 bg-amber-50/40' },
                    { key: 'MOOV', label: 'Moov 💚', color: 'border-emerald-400 bg-emerald-50/40' },
                    { key: 'CARTE', label: 'Carte 💳', color: 'border-indigo-400 bg-indigo-50/40' },
                  ].map((pm, idx) => (
                    <button
                      key={`sub-pm-${pm.key}-${idx}`}
                      type="button"
                      onClick={() => setPaymentMethod(pm.key as any)}
                      className={`py-2.5 px-2 rounded-xl border text-[11px] font-black transition text-center cursor-pointer ${
                        paymentMethod === pm.key
                          ? `${pm.color} ring-2 ring-orange-500 text-slate-900 shadow-xs`
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telephone input for Mobile Money prompt */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Numéro de téléphone pour la validation Mobile Money / Notification *
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-800 font-mono font-bold text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Nouvelle date d'expiration après validation :</span>
                  <span className="font-mono font-bold text-slate-900">{newEndDate}</span>
                </div>
                <div className="flex justify-between items-center border-t border-orange-200/60 pt-2">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                    Montant total à régler :
                  </span>
                  <span className="font-black text-lg text-orange-650 font-mono">
                    {amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <ShieldCheck className="w-5 h-5" />
                Confirmer &amp; Valider le Règlement ({amount.toLocaleString('fr-FR')} FCFA)
              </button>
            </form>
          </div>
        ) : (
          /* Success Receipt View */
          <div className="text-center space-y-6 py-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Paiement &amp; Renouvellement Confirmé !
              </h3>
              <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
                L'abonnement de votre restaurant <span className="font-bold text-slate-800">{activeRestaurant.name}</span> a été prolongé avec succès.
              </p>
            </div>

            {receiptDetails && (
              <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 text-left text-xs space-y-3 font-mono max-w-md mx-auto">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Réf. Transaction :</span>
                  <span className="font-bold text-slate-900">{receiptDetails.txId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Formule Souscrite :</span>
                  <span className="font-bold text-slate-900">{receiptDetails.planName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Montant Réglé :</span>
                  <span className="font-black text-orange-600">{receiptDetails.amount.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Moyen de paiement :</span>
                  <span className="font-bold text-slate-900">{receiptDetails.method}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500">Valide jusqu'au :</span>
                  <span className="font-black text-emerald-600">{receiptDetails.newEndDate}</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-8 rounded-xl shadow-md transition cursor-pointer uppercase tracking-wider"
              >
                Fermer &amp; Obtenir Reçu
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
