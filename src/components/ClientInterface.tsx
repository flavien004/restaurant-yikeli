import React, { useState, useMemo } from 'react';
import { useYikeliDb } from '../db';
import { Plat, PaymentMethod, Commande } from '../types';
import Logo from './Logo';
import {
  ShoppingBag,
  MessageSquare,
  Phone,
  Check,
  CreditCard,
  Plus,
  Minus,
  MapPin,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
  Receipt,
  X,
  Search,
  ChefHat,
  Package,
  Truck,
  Smile,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientInterfaceProps {
  db: ReturnType<typeof useYikeliDb>;
}

export default function ClientInterface({ db }: ClientInterfaceProps) {
  // Client Form Details
  const [clientName, setClientName] = useState(() => {
    try {
      return localStorage.getItem('yikeli_client_name') || '';
    } catch {
      return '';
    }
  });
  const [clientPhone, setClientPhone] = useState(() => {
    try {
      return localStorage.getItem('yikeli_client_phone') || '';
    } catch {
      return '';
    }
  });
  const [saveDetails, setSaveDetails] = useState(() => {
    try {
      const saved = localStorage.getItem('yikeli_save_details');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const handleClearSavedDetails = () => {
    try {
      localStorage.removeItem('yikeli_client_name');
      localStorage.removeItem('yikeli_client_phone');
      localStorage.setItem('yikeli_save_details', 'false');
      setClientName('');
      setClientPhone('');
      setSaveDetails(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Cart State (platId -> Quantity)
  const [clientCart, setClientCart] = useState<Record<string, number>>({});

  // Active Checkout state
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [paymentType, setPaymentType] = useState<'total' | 'partiel'>('total');
  const [partialAmountInput, setPartialAmountInput] = useState<number | ''>('');
  const [clientPaymentMethod, setClientPaymentMethod] = useState<PaymentMethod>('ESPECE');

  // Success summary popup
  const [placedOrderInfo, setPlacedOrderInfo] = useState<Commande | null>(null);
  const [orderComment, setOrderComment] = useState('');

  // Live order tracker states
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReasonValue, setCancelReasonValue] = useState<string>("temps d'attente trop longue");
  const [trackerPhoneInput, setTrackerPhoneInput] = useState(() => {
    try {
      return localStorage.getItem('yikeli_client_phone') || '';
    } catch {
      return '';
    }
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Client Evaluations / Feedback Form State
  const [feedbacks, setFeedbacks] = useState<Record<string, { repas: number; delai: number; courtoisie: number; comment?: string }>>({});

  // Menu Search and Category Filter States
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('ALL');

  // Helper to translate categories to friendly names
  const getCategoryLabel = (category: string) => {
    if (category === 'PLATS_IVOIRIENS') return 'Ivoirien';
    if (category === 'BOISSONS') return 'Boissons';
    if (category === 'EMBALLAGES') return 'Emballages';
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  // Get all unique categories dynamically from db.plats
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    db.plats.forEach((plat) => {
      if (plat.category) {
        cats.add(plat.category);
      }
    });
    return Array.from(cats);
  }, [db.plats]);

  // Dynamic Confetti Particle Generation on Order Success
  const confettiPieces = useMemo(() => {
    if (!placedOrderInfo) return [];
    const colors = ['#f97316', '#fb923c', '#3b82f6', '#10b981', '#eab308', '#ec4899', '#8b5cf6'];
    return Array.from({ length: 50 }).map((_, i) => {
      const angle = Math.random() * 2 * Math.PI;
      const distance = 80 + Math.random() * 220;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 80, // push upwards
        scale: 0.5 + Math.random() * 0.8,
        color: colors[i % colors.length],
        rotation: Math.random() * 720,
        borderRadius: Math.random() > 0.4 ? (Math.random() > 0.5 ? '50%' : '0px') : '30%',
        delay: Math.random() * 0.15,
        duration: 1.2 + Math.random() * 1.8,
      };
    });
  }, [placedOrderInfo?.id]);

  // Cart derivation
  const cartItems = useMemo(() => {
    return Object.entries(clientCart)
      .map(([id, quantity]) => {
        const plat = db.plats.find((p) => p.id === id);
        return {
          plat,
          quantity,
        };
      })
      .filter((item) => item.plat !== undefined) as { plat: Plat; quantity: number }[];
  }, [clientCart, db.plats]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.plat.price * item.quantity, 0);
  }, [cartItems]);

  // Derived filtered dishes list
  const filteredPlats = useMemo(() => {
    return db.plats.filter((plat) => {
      // 1. Filter by category
      if (selectedMenuCategory !== 'ALL' && plat.category !== selectedMenuCategory) {
        return false;
      }
      // 2. Filter by search query (name or category label match)
      if (menuSearchQuery.trim() !== '') {
        const query = menuSearchQuery.toLowerCase().trim();
        const nameMatches = plat.name.toLowerCase().includes(query);
        const categoryLabel = getCategoryLabel(plat.category).toLowerCase();
        const categoryMatches = plat.category.toLowerCase().includes(query) || categoryLabel.includes(query);
        return nameMatches || categoryMatches;
      }
      return true;
    });
  }, [db.plats, selectedMenuCategory, menuSearchQuery]);

  const addToCart = (platId: string) => {
    // Only allow if dish is featured in Today's Menu du Jour
    if (!db.menuJour.includes(platId)) return;

    // Check stock rules
    const plat = db.plats.find((p) => p.id === platId);
    if (plat && plat.isStocked && plat.stock !== undefined) {
      const currentInCart = clientCart[platId] || 0;
      if (currentInCart >= plat.stock) {
        // Enforce stock bounds
        return;
      }
    }

    setClientCart((prev) => ({
      ...prev,
      [platId]: (prev[platId] || 0) + 1,
    }));
  };

  const removeFromCart = (platId: string) => {
    setClientCart((prev) => {
      const current = prev[platId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[platId];
        return next;
      }
      return {
        ...prev,
        [platId]: current - 1,
      };
    });
  };

  const clearCart = () => {
    setClientCart({});
  };

  // Submit web order
  const handleClientOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || !clientName.trim() || !clientPhone.trim()) return;

    const itemsForSubmit = cartItems.map((item) => ({
      platId: item.plat.id,
      quantity: item.quantity,
    }));

    // Register Order online with the desired payment specifier (without validating payment client-side)
    const order = db.submitCommande(
      clientName.trim(),
      clientPhone.trim(),
      itemsForSubmit,
      'EN_LIGNE',
      undefined,
      orderComment.trim(),
      clientPaymentMethod
    );

    // Save details to localStorage if selected, or clear otherwise
    if (saveDetails) {
      try {
        localStorage.setItem('yikeli_client_name', clientName.trim());
        localStorage.setItem('yikeli_client_phone', clientPhone.trim());
        localStorage.setItem('yikeli_save_details', 'true');
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        localStorage.removeItem('yikeli_client_name');
        localStorage.removeItem('yikeli_client_phone');
        localStorage.setItem('yikeli_save_details', 'false');
      } catch (e) {
        console.error(e);
      }
    }

    // Snapshot complete info to show modal
    setPlacedOrderInfo(order);

    // Reset workflow states
    clearCart();
    if (!saveDetails) {
      setClientName('');
      setClientPhone('');
    }
    setOrderComment('');
    setIsCheckoutStep(false);
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  // Generate premade whatsapp link text
  const getWhatsAppLink = (order: Commande, number: string) => {
    const dishesStr = order.items.map(it => `- ${it.quantity}x ${it.platName}`).join('%0A');
    const clientObj = db.clients.find(c => c.id === order.clientId);
    const clientNameStr = clientObj?.name || 'Client';
    const clientPhoneStr = clientObj?.phone || '';

    const paymentReport = order.paymentMethod ? `${order.paymentMethod} (à régler à la gérance / livraison)` : 'À valider à la caisse';

    let commentLine = '';
    if (order.comment) {
      commentLine = `%0A⚠️ *Spécifications / Allergies :* ${order.comment}%0A`;
    }

    const textMsg = `Bonjour *Restaurant Yikéli*,%0A%0AJe viens de valider une commande en ligne !%0A%0A*ID Commande:* ${order.id}%0A*Nom:* ${clientNameStr}%0A*Téléphone:* ${clientPhoneStr}%0A*Plats commandés:*%0A${dishesStr}${commentLine}%0A%0A*Total:* ${formatFCFA(order.total)}%0A*Mode de règlement :* ${paymentReport}%0A%0AMerci de préparer ma commande !`;
    return `https://wa.me/${number.replace(/[^0-9]/g, '')}?text=${textMsg}`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20" id="client-view-parent">
      
      {/* Front Hero banner */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
        
        {/* Absolute decorative circle pattern */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

        <div className="flex justify-center relative z-10">
          <div className="flex flex-col items-center gap-2">
            <Logo size="md" className="bg-white p-2 rounded-2xl shadow-lg max-w-[125px]" />
            <button
              onClick={() => setShowTrackerModal(true)}
              className="mt-1 bg-white/20 hover:bg-white/30 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <Receipt className="w-3.5 h-3.5 text-yellow-300" />
              Suivre mes Commandes en Direct 🛵
            </button>
          </div>
        </div>

        <div className="space-y-1 relative">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-yellow-450/40 text-yellow-100 px-3 py-1 rounded-full border border-yellow-200/20">
            Abidjan • Route d'Abatta
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Restaurant Yikéli</h1>
          <p className="text-orange-50 text-xs font-medium">Commandez nos spécialités en prêt-à-servir de Côte d'Ivoire !</p>
        </div>

        <div className="bg-orange-600/50 rounded-2xl p-3.5 border border-orange-400/30 grid grid-cols-2 text-left gap-2 text-xs divide-x divide-orange-400/20">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-200" />
            <div>
              <span className="text-orange-200 block text-[9px] font-bold uppercase tracking-wider">Service disponible</span>
              <span className="font-semibold block text-[11px]">Tous les jours d'Abatta</span>
            </div>
          </div>
          <div className="pl-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-200" />
            <div>
              <span className="text-orange-200 block text-[9px] font-bold uppercase tracking-wider">Adresse Yango</span>
              <span className="font-semibold block text-[11px]">Djorogobité 1 • N° 206</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dépôt Menu du Jour Grid Listing */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">À la Carte Aujourd'hui</h2>
          <span className="text-[10px] font-bold font-mono text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
            Fraîchement cuisiné
          </span>
        </div>

        {/* Barre de recherche et filtres de catégorie */}
        <div className="space-y-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm" id="client-menu-filters">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Rechercher un plat (ex: Garba, Alloco, Boisson...)"
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 hover:border-gray-300 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 transition font-medium"
            />
            {menuSearchQuery && (
              <button
                onClick={() => setMenuSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setSelectedMenuCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedMenuCategory === 'ALL'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-50 text-gray-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              Tout le menu
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedMenuCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedMenuCategory === cat
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-50 text-gray-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {filteredPlats.map((plat, idx) => {
            const isFeaturedToday = db.menuJour.includes(plat.id);
            const inCartCount = clientCart[plat.id] || 0;
            const isStocked = plat.isStocked;
            const currentStock = plat.stock ?? 999999;
            const isOutOfStock = isStocked && currentStock <= 0;
            const isLowStock = isStocked && currentStock > 0 && currentStock <= (plat.lowStockAlert || 10);

            return (
              <div
                key={`${plat.id}-${idx}`}
                className={`p-3 bg-white rounded-3xl border transition duration-200 flex flex-col justify-between gap-3 select-none relative overflow-hidden ${
                  isFeaturedToday && !isOutOfStock
                    ? 'border-gray-150 hover:border-orange-200 md:shadow-sm hover:shadow-md'
                    : 'opacity-55 border-gray-100 bg-gray-50/50 cursor-not-allowed'
                }`}
              >
                {/* Square Image container with rounded corners */}
                <div className="w-full aspect-square relative rounded-2xl overflow-hidden bg-slate-100 border border-gray-100 shrink-0">
                  {plat.image ? (
                    <img
                      src={plat.image}
                      alt={plat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-gray-400 bg-slate-50">
                      <UtensilsCrossed className="w-5 h-5 mb-1 text-gray-300" />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">Yikéli</span>
                    </div>
                  )}
                  
                  {/* Category label badge on image */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[8px] font-extrabold tracking-wide uppercase shadow-sm ${
                      plat.category === 'PLATS_IVOIRIENS' ? 'bg-orange-500 text-white' :
                      plat.category === 'BOISSONS' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                    }`}>
                      {plat.category === 'PLATS_IVOIRIENS' ? 'Ivoirien' :
                       plat.category === 'BOISSONS' ? 'Boisson' : 'Emballage'}
                    </span>
                  </div>

                  {/* Stock label status overlay */}
                  {isStocked && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-lg block text-center truncate shadow-md ${
                        isOutOfStock 
                          ? 'text-white bg-red-650' 
                          : isLowStock 
                          ? 'text-amber-900 bg-amber-100' 
                          : 'text-emerald-950 bg-emerald-100/90'
                      }`}>
                        {isOutOfStock ? 'Rupture' : isLowStock ? `Reste ${currentStock}` : `${currentStock} portions`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Textual Details and Call to Actions */}
                <div className="flex-1 flex flex-col justify-between min-h-[70px]">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-gray-855 line-clamp-2 leading-tight min-h-[32px]">
                      {plat.name}
                    </h3>
                    <span className="text-xs font-black font-mono text-orange-600 block">
                      {formatFCFA(plat.price)}
                    </span>
                  </div>

                  <div className="pt-2">
                    {isFeaturedToday && !isOutOfStock ? (
                      <div className="flex items-center justify-between">
                        {inCartCount === 0 ? (
                          <button
                            onClick={() => addToCart(plat.id)}
                            className="w-full flex items-center justify-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-155 font-bold text-[10px] py-1.5 rounded-xl transition active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Ajouter
                          </button>
                        ) : (
                          <div className="w-full flex items-center justify-between bg-orange-50 px-1 py-0.5 rounded-xl border border-orange-150">
                            <button
                              onClick={() => removeFromCart(plat.id)}
                              className="p-1 hover:bg-orange-200 rounded text-orange-600 font-bold transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold text-orange-950 text-xs text-center shrink-0">
                              {inCartCount}
                            </span>
                            <button
                              disabled={inCartCount >= currentStock}
                              onClick={() => addToCart(plat.id)}
                              className={`p-1 hover:bg-orange-200 rounded text-orange-600 font-bold transition cursor-pointer ${
                                inCartCount >= currentStock ? 'opacity-30 cursor-not-allowed' : ''
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-center text-gray-400 bg-gray-100 border border-gray-150 py-1 rounded-lg uppercase tracking-wider block">
                        Hors ligne
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPlats.length === 0 && (
            <div className="col-span-full py-12 px-4 text-center bg-white border border-gray-100 rounded-3xl space-y-3" id="no-filtered-plats-empty">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-600">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-800">Aucun plat ne correspond à votre recherche</h3>
                <p className="text-[11px] text-gray-400 font-medium">Essayez de saisir un autre mot-clé ou changez de catégorie.</p>
              </div>
              <button
                onClick={() => {
                  setMenuSearchQuery('');
                  setSelectedMenuCategory('ALL');
                }}
                className="text-[11px] font-extrabold text-orange-650 hover:text-orange-700 bg-orange-150 hover:bg-orange-200 px-4 py-2 rounded-xl transition inline-block cursor-pointer shadow-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FLOAT BOTTOM BASKET STATUS BAR / DIRECT TRIGGER CHECKOUT */}
      <AnimatePresence>
        {cartItems.length > 0 && !isCheckoutStep && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:max-w-xl md:mx-auto bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl z-40 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center relative">
                <ShoppingBag className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-650 text-white font-bold text-[10px] font-mono flex items-center justify-center shadow">
                  {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Votre Panier Yikéli</span>
                <span className="text-sm font-extrabold font-mono text-orange-400 block">{formatFCFA(cartTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutStep(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95"
            >
              Commander
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT SECTION SUB-FLOW WINDOW POPUP overlay or inside screen */}
      <AnimatePresence>
        {isCheckoutStep && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5 my-8 text-gray-850"
            >
              <button
                onClick={() => setIsCheckoutStep(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm lg:text-base font-bold">Formulaire de Commande Yikéli</h3>
              </div>

              <form onSubmit={handleClientOrderSubmit} className="space-y-4">
                
                {/* Cart Sums details summary */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border space-y-1.5 text-xs">
                  <div className="font-bold text-gray-750 pb-1 border-b border-gray-150 flex justify-between">
                    <span>Articles programmés :</span>
                    <span>{cartItems.reduce((acc, it) => acc + it.quantity, 0)} portions</span>
                  </div>
                  {cartItems.map((it, idx) => (
                    <div key={`${it.plat.id}-${idx}`} className="flex justify-between text-gray-700">
                      <span>{it.quantity}x {it.plat.name.split(' ')[0]}</span>
                      <span className="font-semibold font-mono">{formatFCFA(it.quantity * it.plat.price)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-300 pt-2 text-gray-900">
                    <span>Somme Totale :</span>
                    <span className="font-mono text-orange-600">{formatFCFA(cartTotal)}</span>
                  </div>
                </div>

                {/* Cliente identity fields */}
                <div className="space-y-3">
                  {/* Prefill status notification */}
                  {(localStorage.getItem('yikeli_client_name') && localStorage.getItem('yikeli_client_phone')) ? (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs text-orange-950 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                        <div>
                          <span className="font-bold block">Coordonnées récupérées !</span>
                          <span className="text-[10px] text-gray-500">Nom et numéro pré-remplis automatiquement.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSavedDetails}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline bg-white px-2.5 py-1.5 rounded-xl border border-gray-150 transition shadow-sm shrink-0"
                      >
                        Effacer
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl flex items-center gap-2 text-xs text-gray-500">
                      <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-[10px]">
                        Vos coordonnées pourront être retenues sur cet appareil pour vos futures commandes chez Yikéli.
                      </span>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-550 block">Votre Nom / Prénom</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: David Sylla"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-550 block">Votre Téléphone (Côte d'Ivoire)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 0716614669"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-gray-550 block">Spécifications ou Allergies (Optionnel)</label>
                    <textarea
                      placeholder="Ex: Pas de piment / Allergique aux herbes / Sauce à part..."
                      value={orderComment}
                      onChange={(e) => setOrderComment(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    />
                  </div>

                  {/* Save contacts checkbox */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveDetails}
                        onChange={(e) => {
                          setSaveDetails(e.target.checked);
                          if (!e.target.checked) {
                            try {
                              localStorage.removeItem('yikeli_client_name');
                              localStorage.removeItem('yikeli_client_phone');
                              localStorage.setItem('yikeli_save_details', 'false');
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-550 focus:ring-offset-0 focus:outline-none transition w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[11px] text-gray-650 font-medium">
                        Garder mes coordonnées en mémoire pour de futures commandes
                      </span>
                    </label>
                  </div>
                </div>

                {/* Mode de règlement selection */}
                <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-orange-850 block">Spécifier le mode de paiement souhaité 💳</label>
                    <select
                      value={clientPaymentMethod}
                      onChange={(e) => setClientPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold"
                    >
                      <option value="ESPECE">Espèces (En direct à la caisse / Livraison)</option>
                      <option value="WAVE">Wave App</option>
                      <option value="ORANGE_MONEY">Orange Money Mobile</option>
                      <option value="DJAMO">Djamo Card / Wallet</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-gray-450 leading-relaxed italic">
                    Note : Le règlement effectif de l'addition sera validé et enregistré par le caissier lors de la prise en charge physique de votre commande !
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition active:scale-98"
                  >
                    Valider ma Commande
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutStep(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs px-4 rounded-xl transition"
                  >
                    Retour
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS ORDER PRE-MADE WHATSAPP INTEGRATION DIALOG MODAL */}
      <AnimatePresence>
        {placedOrderInfo && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-center space-y-5 my-8 text-gray-800 overflow-hidden"
            >
              {/* Confetti Particle Explosion */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                {confettiPieces.map((piece) => (
                  <motion.div
                    key={piece.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                    animate={{
                      x: piece.x,
                      y: piece.y,
                      scale: [0, piece.scale, piece.scale, 0],
                      opacity: [1, 1, 0.8, 0],
                      rotate: piece.rotation,
                    }}
                    transition={{
                      duration: piece.duration,
                      delay: piece.delay,
                      ease: "easeOut",
                    }}
                    className="absolute left-1/2 top-[12%]"
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: piece.color,
                      borderRadius: piece.borderRadius,
                    }}
                  />
                ))}
              </div>

              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-md relative z-10">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-orange-600">Félicitations, Commande Enregistrée !</h3>
                <p className="text-xs text-gray-500">
                  Votre commande <strong>{placedOrderInfo.id}</strong> d'un montant de <span className="font-bold">{formatFCFA(placedOrderInfo.total)}</span> a été enregistrée avec succès en temps réel.
                </p>
              </div>

              {/* Action Buttons to contact on WhatsApp directly */}
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block">Confirmer d'Abatta via WhatsApp</span>
                <p className="text-xs text-gray-505 leading-relaxed">
                  Pour obtenir une confirmation cuite immédiate ou renseigner votre ruelle de livraison préférée, touchez l'un de nos numéros Yikéli ci-dessous. Le message de votre panier sera pré-rempli !
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  <a
                    href={getWhatsAppLink(placedOrderInfo, '+225 05 01 14 92 44')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition font-bold text-xs text-green-750"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600 shrink-0" />
                      <span>WhatsApp N°1 (Allo 1)</span>
                    </div>
                    <span className="font-mono text-[10px]">+225 05 01 14 92 44</span>
                  </a>

                  <a
                    href={getWhatsAppLink(placedOrderInfo, '+225 07 16 61 46 69')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition font-bold text-xs text-green-750"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600 shrink-0" />
                      <span>WhatsApp N°2 (Allo 2)</span>
                    </div>
                    <span className="font-mono text-[10px]">+225 07 16 61 46 69</span>
                  </a>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPlacedOrderInfo(null)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl transition"
                >
                  Retourner au Menu Journalier
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIVE PROGRESS STATUS TRACKER MODAL */}
      <AnimatePresence>
        {showTrackerModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4 my-8 text-gray-850"
            >
              <button
                onClick={() => setShowTrackerModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-orange-600 border-b border-gray-100 pb-3">
                <ChefHat className="w-5 h-5" />
                <h3 className="text-base font-extrabold">Suivi de Commande en Direct</h3>
              </div>

              {/* Lookup form */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Rechercher par Numéro de Téléphone</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 0716614669"
                    value={trackerPhoneInput}
                    onChange={(e) => setTrackerPhoneInput(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Query Results */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {(() => {
                  const sanitizedPhone = trackerPhoneInput.trim();
                  if (!sanitizedPhone) {
                    return (
                      <div className="py-8 text-center text-gray-450 text-xs">
                        Veuillez renseigner votre ruelle/téléphone ci-dessus pour surveiller vos commandes.
                      </div>
                    );
                  }

                  // Find clients matching phone
                  const matchingClients = db.clients.filter(c => c.phone.replace(/\s+/g, '') === sanitizedPhone.replace(/\s+/g, ''));
                  if (matchingClients.length === 0) {
                    return (
                      <div className="py-8 text-center text-gray-450 text-xs">
                        Aucun client enregistré avec ce numéro de téléphone.
                      </div>
                    );
                  }

                  // Get matching orders
                  const clientIds = matchingClients.map(c => c.id);
                  const matchingOrders = db.commandes.filter(cmd => clientIds.includes(cmd.clientId));

                  if (matchingOrders.length === 0) {
                    return (
                      <div className="py-8 text-center text-gray-450 text-xs">
                        Aucune commande n'a encore été passée aujourd'hui avec ce numéro.
                      </div>
                    );
                  }

                  return matchingOrders.map((order, idx) => {
                    const isExpanded = expandedOrderId === order.id;
                    const hasPayments = (db.paiements || []).some(p => p.commandeId === order.id && p.amount > 0);
                    const initialStepLabel = order.type === 'SUR_PLACE' && !hasPayments ? 'À servir 🍽️' : 'Payé non servi 💵';
                    const initialStepDesc = order.type === 'SUR_PLACE' && !hasPayments ? 'Attente de service à votre table' : 'Portion chaude prête pour service';
                    const steps = [
                      { label: initialStepLabel, desc: initialStepDesc, active: true, matching: ['EN_COURS', 'ATTENTE_PAIEMENT'] },
                      { label: 'Prêt / Servi 🍽️', desc: 'Prêt sur table ou emballé', active: ['SERVIE', 'PRET_A_LIVRER', 'EN_LIVRAISON', 'LIVREE', 'PAYEE', 'REFUS_ANNULATION'].includes(order.status), matching: ['SERVIE', 'PRET_A_LIVRER'] },
                      { label: 'En Route 🛵', desc: 'Remis au livreur de Djorogobité/Yango', active: ['EN_LIVRAISON', 'LIVREE', 'PAYEE', 'REFUS_ANNULATION'].includes(order.status), matching: ['EN_LIVRAISON'] },
                      { label: 'Livrée avec succès 🎉', desc: 'Régalez-vous !', active: ['LIVREE', 'PAYEE', 'REFUS_ANNULATION'].includes(order.status), matching: ['LIVREE', 'PAYEE', 'REFUS_ANNULATION'] }
                    ];

                    // Helper to get active step index
                    let activeStepIndex = 0;
                    if (['SERVIE', 'PRET_A_LIVRER'].includes(order.status)) activeStepIndex = 1;
                    else if (order.status === 'EN_LIVRAISON') activeStepIndex = 2;
                    else if (['LIVREE', 'PAYEE', 'REFUS_ANNULATION'].includes(order.status)) activeStepIndex = 3;

                    return (
                      <div key={`${order.id}-${idx}`} className="border border-gray-150 rounded-2xl p-4 space-y-3.5 hover:shadow-sm transition bg-white text-left">
                        <div 
                          className="flex justify-between items-center cursor-pointer select-none"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        >
                          <div>
                            <span className="text-[10px] font-mono font-bold text-orange-600 block">ID: {order.id}</span>
                            <span className="text-[10px] text-gray-400 block">{new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-gray-950 block">{formatFCFA(order.total)}</span>
                            <span className="text-[9px] text-orange-500 font-bold underline">
                              {isExpanded ? 'Masquer détails' : 'Voir détails'}
                            </span>
                          </div>
                        </div>

                        {/* Order items if expanded */}
                        {isExpanded && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs animate-fadeIn">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-gray-650">
                                <span>{it.quantity}x {it.platName}</span>
                                <span className="font-semibold font-mono">{formatFCFA(it.quantity * it.price)}</span>
                              </div>
                            ))}
                            {order.comment && (
                              <div className="pt-1.5 border-t border-slate-200 mt-1 text-[10px] text-orange-850 italic">
                                Note : "{order.comment}"
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Vertical Progress Stepper or Cancellation State */}
                        <div className="space-y-3 pt-2 border-t border-dashed border-gray-100">
                          {order.status === 'DEMANDE_ANNULATION' ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-amber-800">
                              <div className="flex items-center gap-2 font-extrabold text-amber-900">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                                Demande d'annulation transmise ⏳
                              </div>
                              <p className="text-[11px] text-amber-700 leading-normal">
                                Votre demande d'annulation est en cours d'examen par la gérance pour remboursement.
                              </p>
                              <div className="text-[10px] bg-amber-100/55 p-2 rounded-xl font-medium mt-1">
                                Motif choisi : <span className="italic font-bold">"{order.cancelReason}"</span>
                              </div>
                            </div>
                          ) : order.status === 'ANNULEE' ? (
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-rose-850">
                              <div className="flex items-center gap-2 font-extrabold text-rose-900">
                                <X className="w-4 h-4 text-rose-600" />
                                Commande Annulée & Remboursée 💸
                              </div>
                              <p className="text-[11px] text-rose-700 leading-normal">
                                Cette commande a été annulée. La gérance administrative a retiré vos paiements et procédé à votre remboursement complet.
                              </p>
                              <div className="text-[10px] bg-rose-100/55 p-2 rounded-xl font-medium mt-1">
                                Motif d'annulation : <span className="italic font-bold">"{order.cancelReason}"</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              {order.status === 'ATTENTE_PAIEMENT' && (
                                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-rose-900 mb-3 text-left">
                                  <div className="flex items-center gap-2 font-extrabold text-rose-950">
                                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                                    En attente de paiement 💳
                                  </div>
                                  <p className="text-[11px] font-bold text-rose-800 leading-normal">
                                    ⚠️ Votre commande a bien été enregistrée mais attention : <span className="underline">sans paiement aucun plat n'est servi</span>.
                                  </p>
                                  <p className="text-[10px] text-gray-500 leading-normal">
                                    Veuillez procéder au règlement intégral ou partiel à la caisse du restaurant pour passer votre commande à l'état payé non servi !
                                  </p>
                                </div>
                              )}

                              {order.status === 'REFUS_ANNULATION' && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-red-900 mb-3 text-left">
                                  <div className="flex items-center gap-2 font-extrabold text-red-950">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    Demande d'annulation refusée par la gérance ❌
                                  </div>
                                  <p className="text-[11px] text-red-700 leading-normal">
                                    L'administration a examiné votre demande et ne peut pas annuler cette commande.
                                  </p>
                                  <div className="text-[10px] bg-red-100/55 p-2.5 rounded-xl font-medium mt-1">
                                    Motif communiqué : <span className="font-bold italic text-red-950">"{order.refusalReason || 'Non spécifié'}"</span>
                                  </div>
                                  <p className="text-[11px] text-red-800 font-bold mt-1.5">
                                    Votre commande reste active et suit son cours :
                                  </p>
                                </div>
                              )}

                              <span className="text-[9px] font-extrabold text-gray-450 uppercase tracking-widest block">Suivi de votre commande :</span>
                              
                              <div className="relative pl-6 space-y-4">
                                {/* Line connecting steps */}
                                <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-gray-150"></div>

                                {steps.map((st, sidx) => {
                                  const isCurrent = sidx === activeStepIndex;
                                  const isPassed = sidx < activeStepIndex;
                                  
                                  return (
                                    <div key={sidx} className="relative transition duration-200">
                                      {/* Dot indicator */}
                                      <div className={`absolute -left-6 top-1 w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 transition ${
                                        isCurrent ? 'bg-orange-500 border-orange-500 text-white shadow-md animate-pulse scale-105' :
                                        isPassed ? 'bg-green-500 border-green-500 text-white' :
                                        'bg-white border-gray-200 text-gray-300'
                                      }`}>
                                        <Check className={`w-3 h-3 ${isCurrent || isPassed ? 'opacity-100' : 'opacity-0'}`} />
                                      </div>

                                      <div className="pl-3.5">
                                        <span className={`text-[11px] font-extrabold block transition ${
                                          isCurrent ? 'text-orange-600' : 
                                          isPassed ? 'text-gray-700' : 'text-gray-450 font-medium'
                                        }`}>
                                          {st.label}
                                        </span>
                                        <span className="text-[9px] text-gray-400 block mt-0.5">{st.desc}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Cashier assigned display */}
                        {order.userId && (() => {
                          const cashier = db.users.find(u => u.id === order.userId);
                          if (!cashier) return null;
                          const firstName = cashier.name.split(' ')[0];
                          return (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs flex items-center justify-between text-orange-950 font-medium">
                              <span className="flex items-center gap-1.5">
                                💁‍♀️ <span className="font-semibold text-orange-850">Votre interlocuteur caisse :</span>
                              </span>
                              <span className="bg-orange-500 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] uppercase shadow-sm">
                                {firstName}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Interactive Client Evaluation Component */}
                        {['PAYEE', 'LIVREE', 'SERVIE'].includes(order.status) && (() => {
                          if (order.feedback) {
                            return (
                              <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 space-y-2 mt-2 text-xs">
                                <div className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                                  🎉 Merci pour votre évaluation !
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-[10px] font-medium pt-1">
                                  <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                                    <p className="text-gray-400">Le Repas</p>
                                    <p className="text-xs font-extrabold text-amber-500 mt-1 font-mono">
                                      {"★".repeat(order.feedback.repas)}{"☆".repeat(5 - order.feedback.repas)}
                                    </p>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                                    <p className="text-gray-400">Délai</p>
                                    <p className="text-xs font-extrabold text-amber-500 mt-1 font-mono">
                                      {"★".repeat(order.feedback.delai)}{"☆".repeat(5 - order.feedback.delai)}
                                    </p>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-emerald-100 text-center">
                                    <p className="text-gray-400">Courtoisie</p>
                                    <p className="text-xs font-extrabold text-amber-500 mt-1 font-mono">
                                      {"★".repeat(order.feedback.courtoisie)}{"☆".repeat(5 - order.feedback.courtoisie)}
                                    </p>
                                  </div>
                                </div>
                                {order.feedback.comment && (
                                  <p className="text-[10px] text-gray-500 italic mt-1 bg-white p-2 rounded-lg border border-emerald-50">
                                    "{order.feedback.comment}"
                                  </p>
                                )}
                              </div>
                            );
                          }

                          const currentRating = feedbacks[order.id] || { repas: 5, delai: 5, courtoisie: 5, comment: '' };

                          return (
                            <div className="bg-indigo-55/35 border border-indigo-150 rounded-2xl p-4 mt-2 space-y-3">
                              <div className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                                ⭐ Votre avis nous intéresse ! évaluez notre service :
                              </div>
                              
                              <div className="space-y-2.5 pt-1 text-xs">
                                {/* Criterion 1: Le Repas */}
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-700">1. Le Repas :</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => {
                                          setFeedbacks(prev => ({
                                            ...prev,
                                            [order.id]: { ...(prev[order.id] || { repas: 5, delai: 5, courtoisie: 5 }), repas: star }
                                          }));
                                        }}
                                        className="text-lg transition transform hover:scale-115 active:scale-95 leading-none focus:outline-none cursor-pointer"
                                      >
                                        <span className={star <= currentRating.repas ? 'text-amber-500 font-extrabold' : 'text-gray-300'}>
                                          ★
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Criterion 2: Le Délai */}
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-700">2. Le délai de prise en charge :</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => {
                                          setFeedbacks(prev => ({
                                            ...prev,
                                            [order.id]: { ...(prev[order.id] || { repas: 5, delai: 5, courtoisie: 5 }), delai: star }
                                          }));
                                        }}
                                        className="text-lg transition transform hover:scale-115 active:scale-95 leading-none focus:outline-none cursor-pointer"
                                      >
                                        <span className={star <= currentRating.delai ? 'text-amber-500 font-extrabold' : 'text-gray-300'}>
                                          ★
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Criterion 3: La Courtoisie */}
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-700">3. La courtoisie de l'interlocuteur :</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => {
                                          setFeedbacks(prev => ({
                                            ...prev,
                                            [order.id]: { ...(prev[order.id] || { repas: 5, delai: 5, courtoisie: 5 }), courtoisie: star }
                                          }));
                                        }}
                                        className="text-lg transition transform hover:scale-115 active:scale-95 leading-none focus:outline-none cursor-pointer"
                                      >
                                        <span className={star <= currentRating.courtoisie ? 'text-amber-500 font-extrabold' : 'text-gray-300'}>
                                          ★
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Comment input */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 block">Un commentaire libre ? (Facultatif)</label>
                                  <input
                                    type="text"
                                    placeholder="Ex: Repas délicieux et service souriant !"
                                    value={currentRating.comment || ''}
                                    onChange={(e) => {
                                      setFeedbacks(prev => ({
                                        ...prev,
                                        [order.id]: { ...(prev[order.id] || { repas: 5, delai: 5, courtoisie: 5 }), comment: e.target.value }
                                      }));
                                    }}
                                    className="w-full bg-white border border-gray-250 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>

                                {/* Submit action */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    db.submitCommandeFeedback(order.id, {
                                      repas: currentRating.repas,
                                      delai: currentRating.delai,
                                      courtoisie: currentRating.courtoisie,
                                      comment: currentRating.comment || ''
                                    });
                                  }}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] py-2 rounded-xl shadow-sm transition cursor-pointer"
                                >
                                  SOUMETTRE L'ÉVALUATION
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interactive Client Cancellation Handler Button & Form */}
                        {order.status !== 'DEMANDE_ANNULATION' && order.status !== 'ANNULEE' && (
                          <div className="pt-2.5 border-t border-dashed border-gray-100">
                            {cancellingOrderId === order.id ? (
                              <div className="bg-orange-50/40 p-3 rounded-2xl border border-orange-200/80 space-y-2 mt-1">
                                <label className="text-[10px] font-bold text-orange-950 block">
                                  Pourquoi désirez-vous annuler votre commande ?
                                </label>
                                <select
                                  value={cancelReasonValue}
                                  onChange={(e) => setCancelReasonValue(e.target.value)}
                                  className="w-full bg-white border border-orange-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-orange-550"
                                >
                                  <option value="temps d'attente trop longue">Temps d'attente trop longue</option>
                                  <option value="j'ai changé d'avis">J'ai changé d'avis</option>
                                  <option value="moyen de paiement indisponible">Moyen de paiement indisponible</option>
                                </select>
                                <div className="flex gap-1.5 pt-1">
                                  <button
                                    onClick={() => {
                                      const res = db.updateCommandeStatus(order.id, 'DEMANDE_ANNULATION', false, cancelReasonValue);
                                      if (res.success) {
                                        setCancellingOrderId(null);
                                      } else {
                                        alert(res.error);
                                      }
                                    }}
                                    className="bg-orange-500 hover:bg-orange-650 text-white font-bold text-[10px] py-1 px-3 rounded-lg transition"
                                  >
                                    Confirmer la demande d'annulation
                                  </button>
                                  <button
                                    onClick={() => setCancellingOrderId(null)}
                                    className="bg-white hover:bg-gray-100 border border-gray-350 text-gray-700 font-bold text-[10px] py-1 px-2.5 rounded-lg transition"
                                  >
                                    Fermer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setCancellingOrderId(order.id);
                                  setCancelReasonValue("temps d'attente trop longue");
                                }}
                                className="text-[10px] font-bold text-red-650 hover:text-red-750 flex items-center justify-center gap-1.5 py-1 px-2.5 bg-red-50 hover:bg-red-100/60 border border-red-150 rounded-lg transition-all w-full text-center"
                              >
                                🗑️ Demander l'annulation de ma commande
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <button
                onClick={() => setShowTrackerModal(false)}
                className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition"
              >
                Fermer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
