import React, { useState, useMemo } from 'react';
import { useYikeliDb } from '../db';
import { Plat, User, Client, Commande, Paiement, PaymentMethod, CommandeStatus } from '../types';
import Logo from './Logo';
import InteractiveHelpModal from './InteractiveHelpModal';
import { HelpCircle } from 'lucide-react';
import {
  ShoppingBag,
  CreditCard,
  UserPlus,
  Coins,
  Check,
  Smartphone,
  ChevronRight,
  ClipboardList,
  Search,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  FileText,
  BadgeAlert,
  Loader2,
  CalendarDays,
  X,
  PhoneCall,
  Activity,
  Printer,
  MessageSquare,
  LogOut,
  Sun,
  Moon,
  Key,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeInterfaceProps {
  db: ReturnType<typeof useYikeliDb>;
  activeEmployee?: User;
  onLogout?: () => void;
}

export default function EmployeeInterface({ db, activeEmployee: passedEmployee, onLogout }: EmployeeInterfaceProps) {
  // Caisse active user simulation
  const [activeEmployee, setActiveEmployee] = useState<User>(() => {
    return passedEmployee || db.users.find((u) => u.role === 'EMPLOYE' && u.isActive) || db.users[1];
  });

  React.useEffect(() => {
    if (passedEmployee) {
      setActiveEmployee(passedEmployee);
    }
  }, [passedEmployee]);

  // Flow State
  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'historique' | 'caisse-bilan'>('pos');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Comfort Dark Mode state for night shifts
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('yikeli_pos_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    try {
      localStorage.setItem('yikeli_pos_dark_mode', String(newVal));
    } catch (e) {
      console.warn('Failed to write dark mode preference to localStorage:', e);
    }
  };

  // Search filter
  const [searchPlatQuery, setSearchPlatQuery] = useState('');

  // Cart State (platId -> Quantity)
  const [cart, setCart] = useState<Record<string, number>>({});

  // Client Selection / Registration Mode
  const [selectedClientId, setSelectedClientId] = useState<string>('c1');
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(1);

  // Payment popup state
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Commande | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECE');

  // Dine-in order live-editing state
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Commande | null>(null);
  const [editOrderCart, setEditOrderCart] = useState<Record<string, number>>({});
  const [editSearchQuery, setEditSearchQuery] = useState('');

  // Receipt popup state
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Commande | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');

  // Password change states
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Auto-fill client phone when thermal receipt opens
  React.useEffect(() => {
    if (selectedOrderForReceipt) {
      const clientObj = db.clients.find(c => c.id === selectedOrderForReceipt.clientId);
      if (clientObj) {
        setRecipientPhone(clientObj.phone || '');
      } else {
        setRecipientPhone('');
      }
    }
  }, [selectedOrderForReceipt, db.clients]);

  // Computed Cart Items
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, quantity]) => {
        const plat = db.plats.find((p) => p.id === id);
        return {
          plat,
          quantity,
        };
      })
      .filter((item) => item.plat !== undefined) as { plat: Plat; quantity: number }[];
  }, [cart, db.plats]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.plat.price * item.quantity, 0);
  }, [cartItems]);

  // Command Search / Filter in History
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'EN_COURS' | 'ATTENTE_PAIEMENT' | 'SERVIE' | 'PRET_A_LIVRER' | 'EN_LIVRAISON' | 'LIVREE' | 'PAYEE'>('ALL');

  // Order history filtered for today
  const orderHistoryToday = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const hasTodayCmds = db.commandes.some(c => (c.createdAt || '').startsWith(todayStr));
    const targetDate = hasTodayCmds ? todayStr : '2026-05-23';
    return db.commandes.filter((cmd) => {
      const isToday = (cmd.createdAt || '').startsWith(targetDate);
      if (!isToday) return false;
      if (historyFilter === 'ALL') return true;
      return cmd.status === historyFilter;
    });
  }, [db.commandes, historyFilter]);

  // Caisse Daily Cashier accounting metrics (Shift stats)
  const shiftMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const hasTodayCmds = db.commandes.some(c => (c.createdAt || '').startsWith(todayStr));
    const targetDate = hasTodayCmds ? todayStr : '2026-05-23';

    // Filter payments specifically recorded by this active employee today
    const todayPayments = db.paiements.filter((p) => 
      (p.createdAt || '').startsWith(targetDate) && p.userId === activeEmployee?.id
    );

    const esps = todayPayments.filter((p) => p.method === 'ESPECE').reduce((s, p) => s + p.amount, 0);
    const waves = todayPayments.filter((p) => p.method === 'WAVE').reduce((s, p) => s + p.amount, 0);
    const oms = todayPayments.filter((p) => p.method === 'ORANGE_MONEY').reduce((s, p) => s + p.amount, 0);
    const djs = todayPayments.filter((p) => p.method === 'DJAMO').reduce((s, p) => s + p.amount, 0);

    const grandTotal = esps + waves + oms + djs;

    return {
      esps,
      waves,
      oms,
      djs,
      grandTotal,
      ordersCount: db.commandes.filter((c) => (c.createdAt || '').startsWith(targetDate) && c.userId === activeEmployee?.id).length,
    };
  }, [db.commandes, db.paiements, activeEmployee]);

  // Cart operations
  const addToCart = (platId: string) => {
    // Only permit adding if the plat is in the menu du jour
    if (!db.menuJour.includes(platId)) return;

    // Check stock rules
    const plat = db.plats.find((p) => p.id === platId);
    if (plat && plat.isStocked && plat.stock !== undefined) {
      const currentInCart = cart[platId] || 0;
      if (currentInCart >= plat.stock) {
        alert(`Impossible d'ajouter plus de portions de "${plat.name}". Le stock disponible est épuisé (${plat.stock} restants).`);
        return;
      }
    }

    setCart((prev) => ({
      ...prev,
      [platId]: (prev[platId] || 0) + 1,
    }));
  };

  const removeFromCart = (platId: string) => {
    setCart((prev) => {
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

  const clearCart = () => setCart({});

  // Get total payments made on a single order
  const getAmountPaidForOrder = (orderId: string) => {
    return db.paiements
      .filter((p) => p.commandeId === orderId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  // Submit on-site order from staff panel
  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;

    if (isNewClientMode) {
      if (!newClientPhone.trim() || !newClientName.trim()) {
        alert("Veuillez renseigner le nom et le numéro de téléphone pour créer le nouveau client !");
        return;
      }
    }

    const orderPlats = cartItems.map((item) => ({
      platId: item.plat.id,
      quantity: item.quantity,
    }));

    // Submit order to database
    const submittedOrder = db.submitCommande(
      isNewClientMode ? newClientName.trim() : (db.clients.find(c => c.id === selectedClientId)?.name || 'Client'),
      isNewClientMode ? newClientPhone.trim() : (db.clients.find(c => c.id === selectedClientId)?.phone || '000000'),
      orderPlats,
      'SUR_PLACE',
      activeEmployee?.id,
      '',
      undefined,
      selectedTableNumber
    );

    // Clear cart and customer selection states
    clearCart();
    setNewClientName('');
    setNewClientPhone('');
    setIsNewClientMode(false);

    // Trigger instant payment option for cashiers
    setSelectedOrderForPayment(submittedOrder);
    setPaymentAmount(submittedOrder.total); // prefilled with entire order cost
  };

  // Build and share WhatsApp ecology receipt text
  const handleSendWhatsAppReceipt = () => {
    if (!selectedOrderForReceipt) return;

    const clientName = db.clients.find(c => c.id === selectedOrderForReceipt.clientId)?.name || 'Client';
    
    // Format receipt items
    const itemsLines = selectedOrderForReceipt.items
      .map(it => `- ${it.quantity}x ${it.platName.split(' ')[0]} : ${formatFCFA(it.quantity * it.unitPrice)}`)
      .join('\n');

    const totalPaid = getAmountPaidForOrder(selectedOrderForReceipt.id);
    const restToPay = selectedOrderForReceipt.total - totalPaid;

    // Stylized WhatsApp bold text layout
    const textMsg = `*RESTAURANT YIKÉLI* 👨‍🍳🍗\n` +
      `_Les délicieuses saveurs locales d'Abidjan_\n` +
      `------------------------------------------\n` +
      `🧾 *REÇU DE PAYE — TICKET DE CAISSE*\n\n` +
      `📄 *Ticket ID :* #${selectedOrderForReceipt.id}\n` +
      `📅 *Date :* ${new Date(selectedOrderForReceipt.createdAt).toLocaleString('fr-FR')}\n` +
      `👤 *Client :* ${clientName}\n` +
      `💁‍♀️ *Caissier :* ${activeEmployee?.name || 'Caisse'}\n` +
      `------------------------------------------\n` +
      `🛒 *Détails des plats :*\n` +
      `${itemsLines}\n` +
      `------------------------------------------\n` +
      `💰 *MONTANT TOTAL :* ${formatFCFA(selectedOrderForReceipt.total)}\n` +
      `✅ *SOMME REÇUE :* ${formatFCFA(totalPaid)}\n` +
      `⚠️ *RESTE À PAYER :* ${formatFCFA(restToPay)}\n` +
      `------------------------------------------\n` +
      `✨ Merci pour votre confiance et bon appétit ! 🎉\n` +
      `📍 Route d'Abatta, près de Djorogobité 1 • N° 206\n` +
      `📞 Contact: +225 05 01 14 92 44`;

    // Strip out non-numeric characters from the WhatsApp phone
    let formattedPhone = recipientPhone.replace(/\D/g, '');
    
    // Auto-add country prefix for Côte d'Ivoire (225) if it starts with standard 10-digit formats
    if (formattedPhone.length === 10 && (formattedPhone.startsWith('05') || formattedPhone.startsWith('07') || formattedPhone.startsWith('01'))) {
      formattedPhone = '225' + formattedPhone;
    } else if (formattedPhone.length === 8) {
      formattedPhone = '225' + formattedPhone;
    }

    const encodedText = encodeURIComponent(textMsg);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
    
    const win = window.open(whatsappUrl, '_blank');
    if (win) {
      win.focus();
    } else {
      // Fallback fallback standard click
      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Process receipt / payment submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment || paymentAmount === '') return;

    if (selectedOrderForPayment.status === 'DEMANDE_ANNULATION') {
      alert(`⚠️ Action suspendue : Cette commande fait l'objet d'une demande d'annulation par le client. Toute action d'encaissement est suspendue jusqu'à ce que la gérance ait statué sur cette demande.`);
      return;
    }

    const amount = Number(paymentAmount);
    if (amount <= 0) return;

    // RULE: aucune commande ne doit avoir de solde payé supérieur au montant total de la commande
    const paid = db.paiements
      .filter((p) => p.commandeId === selectedOrderForPayment.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const remaining = selectedOrderForPayment.total - paid;

    if (amount > remaining) {
      alert(`⚠️ Règle de caisse : Le montant saisi d'encaissement (${formatFCFA(amount)}) dépasse le solde restant dû de la commande (${formatFCFA(remaining)}). Veuillez saisir un montant inférieur ou égal à ${formatFCFA(remaining)} afin d'éviter le double paiement !`);
      return;
    }

    db.registerPaiement(selectedOrderForPayment.id, paymentMethod, amount, activeEmployee?.id);

    setSelectedOrderForPayment(null);
    setPaymentAmount('');
    setActiveSubTab('historique'); // view history queue
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  // Sound chime notification for incoming online orders (Web Audio API)
  const playNotificationSound = (toneType: 'new' | 'ready' = 'new') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (time: number, freq: number, duration: number, oscType: 'sine' | 'triangle' = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      if (toneType === 'new') {
        // Joyous double ascending chime for incoming orders
        playTone(now, 587.33, 0.4); // D5 (Re)
        playTone(now + 0.15, 880, 0.5); // A5 (La)
      } else {
        // Double fast pip-pip chime for ready to serve orders
        playTone(now, 880, 0.12, 'sine'); // High A5
        playTone(now + 0.12, 1174.66, 0.35, 'sine'); // High D6
      }
    } catch (e) {
      console.warn('Audio Context sound play blocked or failed:', e);
    }
  };

  // Find all online orders that are still EN_COURS (pending in queue)
  const pendingOnlineOrders = useMemo(() => {
    return db.commandes.filter((c) => c.type === 'EN_LIGNE' && c.status === 'EN_COUR' || (c.type === 'EN_LIGNE' && c.status === 'EN_COURS'));
  }, [db.commandes]);

  const [notification, setNotification] = useState<{ id: string; message: string; orderId: string; type: 'new' | 'ready' } | null>(null);
  const [knownOrderStates, setKnownOrderStates] = useState<{ [id: string]: string }>({});

  React.useEffect(() => {
    // Diff-tracker for real-time order states
    const newStates: { [id: string]: string } = {};
    let isInitialized = Object.keys(knownOrderStates).length > 0;
    
    db.commandes.forEach(c => {
      newStates[c.id] = c.status;
    });

    if (!isInitialized) {
      setKnownOrderStates(newStates);
      return;
    }

    db.commandes.forEach(c => {
      const prevStatus = knownOrderStates[c.id];
      if (prevStatus === undefined) {
        // 1. A new order is submitted (either online or taken by waitstaff)
        playNotificationSound('new');
        const clientObj = db.clients.find(cl => cl.id === c.clientId);
        setNotification({
          id: c.id + '-new',
          message: `🔔 Nouvelle commande lancée (${c.type === 'EN_LIGNE' ? 'En ligne' : 'Table num.' + (c.tableNumber || '#')}) : ${clientObj?.name || 'Client'} (${formatFCFA(c.total)}) !`,
          orderId: c.id,
          type: 'new'
        });
      } else if (prevStatus !== c.status && c.status === 'PRET_A_LIVRER') {
        // 2. An order has transition status to PRET_A_LIVRER
        playNotificationSound('ready');
        const clientObj = db.clients.find(cl => cl.id === c.clientId);
        setNotification({
          id: c.id + '-ready',
          message: `🍽️ Plat prêt à servir ! La commande de ${clientObj?.name || 'Client'} (Table ${c.tableNumber || '#'}) est prête, passez en cuisine !`,
          orderId: c.id,
          type: 'ready'
        });
      }
    });

    setKnownOrderStates(newStates);
  }, [db.commandes]);

  return (
    <div className={`space-y-6 transition-colors duration-305 ${isDarkMode ? 'yikeli-dark-mode' : ''}`} id="staff-pos-module">
      {/* Dynamic Iframe Notice Banner */}
      {typeof window !== 'undefined' && window.self !== window.top && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-2xl p-4 shadow-md text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-orange-400/20 print:hidden animate-none">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💡</span>
            <div>
              <p className="font-bold">Mode Aperçu Détecté (Cadre Intégré)</p>
              <p className="text-white/85 font-medium">L'impression en direct des reçus clients demande d'accéder au matériel d'impression via un onglet isolé.</p>
            </div>
          </div>
          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="bg-white text-orange-700 hover:bg-orange-50 rounded-xl px-4 py-2 transition shrink-0 text-[11px] font-bold shadow-sm"
          >
            Ouvrir dans un nouvel onglet ↗
          </button>
        </div>
      )}

      {/* Top Banner & Shift Simulation Selection */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-orange-500 rounded-2xl p-6 text-white shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <Logo size="sm" width={52} height={52} className="bg-white p-1 rounded-full shadow-md" />
            <h2 className="text-xl font-bold tracking-tight">Point de Vente Tactile (POS) - Yikéli</h2>
          </div>
          <p className="text-orange-100 text-xs mt-1">
            Opérations de service • Prise d'ordres sur-place & encaissements multiples.
          </p>
        </div>

        {/* Logged in Cashier profile and Logout action */}
        <div className="flex items-center gap-3.5 bg-orange-650/80 px-4 py-2 rounded-xl border border-white/20 shadow-inner">
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 hover:bg-orange-700/50 rounded-lg text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1 shrink-0 text-xs font-bold"
            title="Aide interactive"
          >
            <HelpCircle className="w-4 h-4 text-yellow-300" />
            <span>Aide</span>
          </button>
          
          <div className="h-5 w-px bg-white/20" />

          <button
            onClick={toggleDarkMode}
            className="p-1.5 hover:bg-orange-700/50 rounded-lg text-white/90 hover:text-white transition cursor-pointer flex items-center justify-center shrink-0"
            title={isDarkMode ? "Passer en mode Jour ☀️" : "Passer en mode Nuit 🌙"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-300 animate-pulse" />
            ) : (
              <Moon className="w-4 h-4 text-orange-100" />
            )}
          </button>
          
          <div className="h-5 w-px bg-white/20" />

          <div className="space-y-0.5 text-left">
            <span className="text-[10px] uppercase tracking-wider text-orange-200 block font-bold">Caissier Connecté :</span>
            <span className="text-xs font-extrabold text-white block">{activeEmployee?.name}</span>
          </div>
          <div className="h-5 w-px bg-white/20" />
          <button
            onClick={() => {
              setChangePasswordModalOpen(true);
              setCurrentPasswordInput('');
              setNewPasswordInput('');
              setConfirmPasswordInput('');
              setPasswordChangeError('');
              setPasswordChangeSuccess(false);
            }}
            className="p-1.5 hover:bg-orange-700/60 rounded-lg text-white/90 hover:text-white transition cursor-pointer"
            title="Changer mon mot de passe"
          >
            <Key className="w-4 h-4" />
          </button>
          {onLogout && (
            <>
              <div className="h-5 w-px bg-white/20" />
              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-orange-700/60 rounded-lg text-white/90 hover:text-white transition cursor-pointer"
                title="Se déconnecter de la caisse"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Real-time Cashier Performance & Scoring Banner */}
      {activeEmployee && (() => {
        const dbEmployee = db.users.find(u => u.id === activeEmployee.id) || activeEmployee;
        const pts = dbEmployee.points !== undefined ? dbEmployee.points : 0;
        return (
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-teal-400/20">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏆</span>
              <div>
                <p className="font-extrabold text-[12px] uppercase tracking-wider text-teal-100">Bannière de Performance Caissier</p>
                <p className="text-white/90 text-xs font-semibold">
                  Félicitations <span className="underline font-black">{dbEmployee.name}</span>, vos points de satisfaction clients sont actualisés en temps réel.
                </p>
              </div>
            </div>
            <div className="bg-white text-teal-800 rounded-xl px-4 py-1.5 font-black text-center shrink-0 shadow-xs border border-teal-100 flex items-center gap-1.5">
              <span className="text-xs uppercase font-extrabold">Cumul :</span>
              <span className="text-sm font-mono">{pts} pts</span>
            </div>
          </div>
        );
      })()}

      {/* Real-time online/on-site order toast notification bar */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg font-sans border-2 ${
              notification.type === 'ready'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-55 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`flex h-2.5 w-2.5 rounded-full animate-pulse ${notification.type === 'ready' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className="font-bold">{notification.message}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                onClick={() => {
                  setActiveSubTab('historique'); // Open order queue
                  setNotification(null); // Dismiss notification
                }}
                className={`text-white font-extrabold px-3.5 py-2 rounded-xl hover:scale-[1.02] transform transition cursor-pointer text-[11px] uppercase tracking-wider shadow-sm ${
                  notification.type === 'ready' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {notification.type === 'ready' ? 'Voir Service 🍽️' : 'Traiter l\'Ordre ⚙️'}
              </button>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POS Sub-Navigation Tabs */}
      <div className="flex border-b border-gray-150 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('pos')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition ${
            activeSubTab === 'pos'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Prendre Commande
        </button>

        <button
          onClick={() => setActiveSubTab('historique')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition relative ${
            activeSubTab === 'historique'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Commandes du Jour (Côte d'Ivoire)</span>
          {pendingOnlineOrders.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white animate-pulse">
              {pendingOnlineOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('caisse-bilan')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition ${
            activeSubTab === 'caisse-bilan'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Bilan de Caisse
        </button>

        <button
          onClick={() => setActiveSubTab('depenses')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition ${
            activeSubTab === 'depenses'
              ? 'border-purple-500 text-purple-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Coins className="w-4 h-4 text-purple-500" />
          <span>Saisir Dépense</span>
        </button>
      </div>

      {/* SUB-SECTION 1: ORDER ENTRY SYSTEM (POS TERMINAL) */}
      {activeSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Active Dishes Grid Selector (Col: 7/12) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search Bar & Instructions */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-gray-150">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchPlatQuery}
                onChange={(e) => setSearchPlatQuery(e.target.value)}
                placeholder="Filtrer parmi les plats et boissons..."
                className="w-full text-xs text-gray-850 bg-transparent focus:outline-none"
              />
            </div>

            <div className="bg-orange-50 border border-orange-150 p-3.5 rounded-xl text-orange-900 text-xs flex gap-2 items-center shadow-sm">
              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Seuls les produits programmés au <strong>Menu du Jour</strong> par l'administrateur s'affichent ci-dessous pour optimiser la vue de saisie.</span>
            </div>

            {/* Menu Items Categories Blocks */}
            <div className="space-y-6">
              {/* Category 1: Traditional Meals */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Plats traditionnels Ivoiriens</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {db.plats
                    .filter((p) => p.category === 'PLATS_IVOIRIENS' && db.menuJour.includes(p.id) && p.name.toLowerCase().includes(searchPlatQuery.toLowerCase()))
                    .map((plat) => {
                      const isMenuJour = db.menuJour.includes(plat.id);
                      return (
                        <div
                          key={plat.id}
                          onClick={() => isMenuJour && addToCart(plat.id)}
                          className={`p-4 bg-white rounded-2xl border transition-all duration-200 select-none ${
                            isMenuJour
                              ? 'border-gray-200 hover:border-orange-400 hover:shadow-md cursor-pointer active:scale-[0.98]'
                              : 'opacity-50 border-gray-150 bg-gray-50/50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-gray-850 block">{plat.name}</span>
                              <span className="text-[10px] text-gray-450 block mt-0.5">ID: {plat.id}</span>
                            </div>
                            <span className="text-xs font-bold font-mono text-orange-600 whitespace-nowrap bg-orange-50 px-2 py-0.5 rounded-lg">
                              {formatFCFA(plat.price)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            {isMenuJour ? (
                              <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                DISPONIBLE
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                INDISPONIBLE
                              </span>
                            )}

                            {isMenuJour && cart[plat.id] && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono font-bold bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                                  {cart[plat.id]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Category 2: Softs / Beverages */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Boissons fraîches</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {db.plats
                    .filter((p) => p.category === 'BOISSONS' && db.menuJour.includes(p.id) && p.name.toLowerCase().includes(searchPlatQuery.toLowerCase()))
                    .map((plat) => {
                      const isMenuJour = db.menuJour.includes(plat.id);
                      const isOutOfStock = plat.isStocked && (plat.stock ?? 0) <= 0;
                      return (
                        <div
                          key={plat.id}
                          onClick={() => isMenuJour && !isOutOfStock && addToCart(plat.id)}
                          className={`p-4 bg-white rounded-2xl border transition-all duration-200 select-none ${
                            isMenuJour && !isOutOfStock
                              ? 'border-gray-200 hover:border-orange-400 hover:shadow-md cursor-pointer active:scale-[0.98]'
                              : 'opacity-50 border-gray-150 bg-gray-50/50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-gray-855 block">{plat.name}</span>
                              <span className="text-[10px] text-gray-450 block mt-0.5">ID: {plat.id}</span>
                            </div>
                            <span className="text-xs font-bold font-mono text-orange-600 whitespace-nowrap bg-orange-50 px-2 py-0.5 rounded-lg">
                              {formatFCFA(plat.price)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <div className="flex flex-col gap-0.5">
                              {isMenuJour ? (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  isOutOfStock ? 'text-red-655 bg-red-50 border border-red-100' : 'text-green-600 bg-green-50'
                                }`}>
                                  {isOutOfStock ? 'RUPTURE' : 'DISPONIBLE'}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                  INDISPONIBLE
                                </span>
                              )}
                              {plat.isStocked && (
                                <span className={`text-[9px] font-semibold ${
                                  (plat.stock ?? 0) < (plat.lowStockAlert ?? 5) ? 'text-amber-600' : 'text-slate-400'
                                }`}>
                                  Stock: {plat.stock ?? 0} un.
                                </span>
                              )}
                            </div>

                            {isMenuJour && !isOutOfStock && cart[plat.id] && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono font-bold bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                                  {cart[plat.id]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Category 3: Emballages / Sacs */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-purple-650 uppercase tracking-widest mb-3">Emballages et Conditionnements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {db.plats
                    .filter((p) => p.category === 'EMBALLAGES' && db.menuJour.includes(p.id) && p.name.toLowerCase().includes(searchPlatQuery.toLowerCase()))
                    .map((plat) => {
                      const isMenuJour = db.menuJour.includes(plat.id);
                      const isOutOfStock = plat.isStocked && (plat.stock ?? 0) <= 0;
                      return (
                        <div
                          key={plat.id}
                          onClick={() => isMenuJour && !isOutOfStock && addToCart(plat.id)}
                          className={`p-4 bg-white rounded-2xl border transition-all duration-200 select-none ${
                            isMenuJour && !isOutOfStock
                              ? 'border-gray-200 hover:border-orange-400 hover:shadow-md cursor-pointer active:scale-[0.98]'
                              : 'opacity-50 border-gray-150 bg-gray-50/50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-gray-855 block">{plat.name}</span>
                              <span className="text-[10px] text-gray-450 block mt-0.5">ID: {plat.id}</span>
                            </div>
                            <span className="text-xs font-bold font-mono text-orange-600 whitespace-nowrap bg-orange-50 px-2 py-0.5 rounded-lg">
                              {formatFCFA(plat.price)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <div className="flex flex-col gap-0.5">
                              {isMenuJour ? (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  isOutOfStock ? 'text-red-655 bg-red-50 border border-red-100' : 'text-green-600 bg-green-50'
                                }`}>
                                  {isOutOfStock ? 'RUPTURE' : 'DISPONIBLE'}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                  INDISPONIBLE
                                </span>
                              )}
                              {plat.isStocked && (
                                <span className={`text-[9px] font-semibold ${
                                  (plat.stock ?? 0) < (plat.lowStockAlert ?? 5) ? 'text-amber-600' : 'text-slate-400'
                                }`}>
                                  Stock: {plat.stock ?? 0} un.
                                </span>
                              )}
                            </div>

                            {isMenuJour && !isOutOfStock && cart[plat.id] && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono font-bold bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                                  {cart[plat.id]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          </div>

          {/* POS SIDEBAR: CLIENT SELECTION & ACTIVE CART PANEL (Col: 5/12) */}
          <div className="lg:col-span-12 xl:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm sticky top-4 space-y-5">
            
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800">Panier de Commande Active</h3>
              <button
                onClick={clearCart}
                disabled={cartItems.length === 0}
                className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                Vider
              </button>
            </div>

            {/* Cart Contents list */}
            {cartItems.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center text-gray-400 space-y-2">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
                <span className="text-xs">Le panier est vierge. Touchez un produit disponible pour l'ajouter.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.plat.id} className="flex justify-between items-center text-xs p-2 bg-slate-50/80 rounded-xl">
                    <div className="space-y-0.5 max-w-[200px]">
                      <span className="font-bold text-gray-800 block line-clamp-1">{item.plat.name}</span>
                      <span className="text-[10px] text-gray-450 font-mono font-semibold">{formatFCFA(item.plat.price)} portion</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                        <button
                          onClick={() => removeFromCart(item.plat.id)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-600 active:scale-95"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 font-mono font-bold text-center text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item.plat.id)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-600 active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-gray-700 whitespace-nowrap">
                        {formatFCFA(item.plat.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CLIENT DETAILED SYSTEM */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-3.5 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">Client Lié à la Vente</span>
                <button
                  onClick={() => setIsNewClientMode(!isNewClientMode)}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  {isNewClientMode ? (
                    <>Annuler le nouveau profil</>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Créer un client caisse
                    </>
                  )}
                </button>
              </div>

              {!isNewClientMode ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-505 block">Sélectionner un Client Existant</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none"
                  >
                    {db.clients.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name} (Tél: {cl.phone})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-gray-500 block">Nom du Client</label>
                    <input
                      type="text"
                      placeholder="Ex: Christian Kouamé"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-gray-500 block">Téléphone mobile (sans prefixe +225)</label>
                    <input
                      type="text"
                      placeholder="Ex: 0501234567"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Table Selection for SUR_PLACE orders */}
            <div className="bg-orange-50/40 p-3.5 rounded-xl border border-orange-100/60 mt-2 space-y-2">
              <span className="text-[11px] font-extrabold text-orange-950 uppercase tracking-wider block">
                🪑 Table Assignée (1 à 20)
              </span>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setSelectedTableNumber(tbl)}
                    className={`py-1 rounded text-[10px] font-black font-mono transition-all ${
                      selectedTableNumber === tbl
                        ? 'bg-orange-500 border border-orange-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-orange-50/50'
                    }`}
                  >
                    T-{tbl}
                  </button>
                ))}
              </div>
            </div>

            {/* TOTALS & PLACE BUTTON */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-500">Sous-total :</span>
                <span className="font-mono text-gray-700">{formatFCFA(cartTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold select-none border-t border-gray-100 pt-2.5">
                <span className="text-gray-900">Montant Total :</span>
                <span className="font-mono text-orange-600 text-lg">{formatFCFA(cartTotal)}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={cartItems.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg transition disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
              >
                <Check className="w-4 h-4" />
                Valider et Émettre Facture
              </button>
            </div>

          </div>

        </div>
      )}

      {/* SUB-SECTION 2: COMMAND DE QUEUE / HISTORY LOG TRACKER */}
      {activeSubTab === 'historique' && (
        <motion.div
          key="history-sub-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">File d'Attente des Commandes d'Aujourd'hui</h3>
              <p className="text-xs text-gray-400">Gérez le service en salle ou encaissez des clients</p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl self-start">
              {(['ALL', 'EN_COURS', 'ATTENTE_PAIEMENT', 'SERVIE', 'PRET_A_LIVRER', 'EN_LIVRAISON', 'LIVREE', 'PAYEE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setHistoryFilter(st)}
                  className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition ${
                    historyFilter === st
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-250'
                  }`}
                >
                  {st === 'ALL' ? 'Toutes' :
                   st === 'EN_COURS' ? 'Payée Non Servie / À Servir' :
                   st === 'ATTENTE_PAIEMENT' ? 'Attente Paiement' :
                   st === 'SERVIE' ? 'Servies' :
                   st === 'PRET_A_LIVRER' ? 'Prêtes' :
                   st === 'EN_LIVRAISON' ? 'En Livraison' :
                   st === 'LIVREE' ? 'Livrées' :
                   'Payées'}
                </button>
              ))}
            </div>
          </div>

          {/* Table log of orders */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold text-[10px] border-b border-gray-100">
                  <th className="p-3">ID Commande / Type</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Détails des plats commandés</th>
                  <th className="p-3">Montant Total</th>
                  <th className="p-3">Solde Payé</th>
                  <th className="p-3">Statut Service</th>
                  <th className="p-3 text-center">Frictionless Cashier Panel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {orderHistoryToday.map((cmd, idx) => {
                  const paid = getAmountPaidForOrder(cmd.id);
                  const debt = cmd.total - paid;
                  const clientObj = db.clients.find((c) => c.id === cmd.clientId);

                  return (
                    <tr key={`${cmd.id}-${idx}`} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-gray-850 font-mono">{cmd.id}</div>
                        <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold mt-1 ${
                          cmd.type === 'SUR_PLACE' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {cmd.type === 'SUR_PLACE' ? 'SUR PLACE' : 'EN LIGNE'}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-gray-800">{clientObj?.name || 'Client Externe'}</div>
                        <div className="text-[10px] text-gray-450 font-mono">Tél: {clientObj?.phone || 'Inconnu'}</div>
                        {cmd.comment && (
                          <div className="mt-1.5 p-2 bg-amber-50 text-amber-900 rounded-xl text-[10px] border border-amber-200 font-medium max-w-[200px] shadow-sm leading-tight text-left">
                            <strong className="text-amber-700 block font-bold">⚠️ Instructions :</strong>
                            {cmd.comment}
                          </div>
                        )}
                      </td>

                      <td className="p-3 max-w-[240px]">
                        <div className="space-y-1">
                          {cmd.items.map((it, idx) => (
                            <div key={`${it.id}-${idx}`} className="text-[11px] text-gray-700">
                              <span className="font-bold">{it.quantity}x</span> {it.platName}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 font-bold font-mono text-gray-900">
                        {formatFCFA(cmd.total)}
                      </td>

                      <td className="p-3">
                        <div className="font-mono font-bold text-green-600">{formatFCFA(paid)}</div>
                        {debt > 0 ? (
                          <div className="text-[10px] font-semibold text-red-650 font-mono">Reste : {formatFCFA(debt)}</div>
                        ) : (
                          <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded">RÉGLÉ</span>
                        )}
                      </td>

                      <td className="p-3">
                        {cmd.status === 'DEMANDE_ANNULATION' ? (
                          <div className="text-[10px] font-extrabold text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-lg text-center animate-pulse flex items-center justify-center gap-1">
                            ⚠️ ANNULATION EN EXAMEN
                          </div>
                        ) : cmd.status === 'ANNULEE' ? (
                          <div className="text-[10px] font-extrabold text-red-650 bg-red-50 border border-red-150 px-2 py-1 rounded-lg text-center flex items-center justify-center gap-1 font-mono uppercase">
                            ❌ ANNULÉE
                          </div>
                        ) : (
                          <select
                            value={cmd.status}
                            onChange={(e) => {
                              const res = db.updateCommandeStatus(cmd.id, e.target.value as any, false, undefined, activeEmployee?.id);
                              if (!res.success) {
                                alert(res.error);
                              }
                            }}
                            className={`text-[10px] font-bold border rounded-lg py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono transition outline-none cursor-pointer ${
                              cmd.status === 'PAYEE' ? 'bg-green-50 border-green-200 text-green-700 font-bold' :
                              cmd.status === 'LIVREE' ? 'bg-emerald-50 border-emerald-255 text-emerald-700' :
                              cmd.status === 'EN_LIVRAISON' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                              cmd.status === 'PRET_A_LIVRER' ? 'bg-blue-50 border-blue-200 text-blue-750' :
                              cmd.status === 'SERVIE' ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' :
                              cmd.status === 'ATTENTE_PAIEMENT' ? 'bg-rose-50 border-rose-220 text-rose-700' :
                              (cmd.type === 'SUR_PLACE' && cmd.status === 'EN_COURS' && paid === 0) ? 'bg-red-50 border-red-200 text-red-700 font-bold' :
                              'bg-yellow-50 border-yellow-250 text-yellow-750'
                            }`}
                          >
                            {cmd.type === 'SUR_PLACE' ? (
                              <>
                                <option value="EN_COURS">{paid === 0 ? '🍽️ À servir (Non payé)' : '💵 Payé non servi'}</option>
                                <option value="SERVIE">🍽️ Servie (Table)</option>
                                <option value="PAYEE">✓ Payée / Clôturée</option>
                              </>
                            ) : (
                              <>
                                <option value="EN_COURS">💵 Payé non servi</option>
                                <option value="ATTENTE_PAIEMENT">⏳ Attente Paiement</option>
                                <option value="SERVIE">🍽️ Servie (Table)</option>
                                <option value="PRET_A_LIVRER">📦 Prêt à livrer</option>
                                <option value="EN_LIVRAISON">🛵 En Livraison</option>
                                <option value="LIVREE">🎉 Livrée</option>
                                <option value="PAYEE">✓ Payée / Clôturée</option>
                              </>
                            )}
                          </select>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Payment action */}
                          {cmd.status !== 'PAYEE' && (
                            <button
                              onClick={() => {
                                if (cmd.status === 'DEMANDE_ANNULATION') {
                                  alert("⚠️ Fin d'opération interdite : Cette commande fait l'objet d'une demande d'annulation par le client. Toute transaction ou encaissement est suspendu !");
                                  return;
                                }
                                if (cmd.status === 'ANNULEE') {
                                  alert("⚠️ Cette commande est annulée.");
                                  return;
                                }
                                setSelectedOrderForPayment(cmd);
                                setPaymentAmount(debt); // prefill actual remaining debt
                              }}
                              disabled={cmd.status === 'ANNULEE'}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer ${
                                cmd.status === 'DEMANDE_ANNULATION' || cmd.status === 'ANNULEE'
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                  : 'bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200'
                              }`}
                            >
                              <CreditCard className="w-3 h-3" />
                              Encaissement
                            </button>
                          )}

                          {/* Print Virtual Ticket */}
                          <button
                            onClick={() => setSelectedOrderForReceipt(cmd)}
                            className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-lg shadow-sm transition flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            Ticket
                          </button>

                          {/* Live Edit Order for dine-in / on-site clients prior to payment */}
                          {cmd.type === 'SUR_PLACE' && cmd.status !== 'PAYEE' && cmd.status !== 'ANNULEE' && cmd.status !== 'DEMANDE_ANNULATION' && (
                            <button
                              onClick={() => {
                                setSelectedOrderForEdit(cmd);
                                const initialCart: Record<string, number> = {};
                                cmd.items.forEach((it) => {
                                  initialCart[it.platId] = it.quantity;
                                });
                                setEditOrderCart(initialCart);
                                setEditSearchQuery('');
                              }}
                              className="px-2.5 py-1 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                              title="Ajouter des plats supplémenaires, boissons ou modifier la commande de la table"
                            >
                              <span>➕ Ajouter / Modifier</span>
                            </button>
                          )}

                          {/* Cashier Request Cancellation / Refund of paid order */}
                          {(paid > 0 && cmd.status !== 'DEMANDE_ANNULATION' && cmd.status !== 'ANNULEE') && (
                            <button
                              onClick={() => {
                                const reason = prompt("Saisir le motif détaillé de la demande de remboursement pour cette commande déjà réglée :");
                                if (reason === null) return;
                                if (!reason.trim()) {
                                  alert("Erreur: Le motif de remboursement de commande est obligatoire !");
                                  return;
                                }
                                const res = db.updateCommandeStatus(cmd.id, 'DEMANDE_ANNULATION', false, reason.trim());
                                if (res.success) {
                                  alert("Demande de remboursement et d'annulation transmise avec succès à l'administration !");
                                } else {
                                  alert(res.error);
                                }
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
                            >
                              💰 Demander Remboursement
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {orderHistoryToday.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">
                      Rien à signaler. Aucune commande enregistrée aujourd'hui sous ce filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* SUB-SECTION 3: DAILY REGISTER BILAN DE CAISSE */}
      {activeSubTab === 'caisse-bilan' && (
        <motion.div
          key="shift-sub-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Cash accounting values */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 md:col-span-2">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Clôture & Contrôle Shunt de Caisse Direct</h3>
              <p className="text-xs text-gray-400">Ventilation des encaissements par canal pour la journée d'aujourd'hui (23 Mai 2026)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-green-100 bg-green-50/20 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Espèces (Coffre)</span>
                  <span className="text-base font-bold text-gray-800 block font-mono">{formatFCFA(shiftMetrics.esps)}</span>
                </div>
                <div className="p-2 bg-green-50 rounded-lg text-green-600 font-bold text-xs font-mono">CASH</div>
              </div>

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Wave Money</span>
                  <span className="text-base font-bold text-gray-800 block font-mono">{formatFCFA(shiftMetrics.waves)}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 font-bold text-xs font-mono">WAVE</div>
              </div>

              <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/20 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orange Money</span>
                  <span className="text-base font-bold text-gray-800 block font-mono">{formatFCFA(shiftMetrics.oms)}</span>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-650 font-bold text-xs font-mono">OM</div>
              </div>

              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Djamo Card</span>
                  <span className="text-base font-bold text-gray-800 block font-mono">{formatFCFA(shiftMetrics.djs)}</span>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600 font-bold text-xs font-mono">DJAMO</div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center font-bold text-sm">
              <span className="text-gray-600">Total Encaissé en Shunt de Trésorerie :</span>
              <span className="font-mono text-orange-600 text-lg">{formatFCFA(shiftMetrics.grandTotal)}</span>
            </div>
          </div>

          {/* Quick instructions and print */}
          <div className="bg-slate-55 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Notes de fin de journée</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Vérifiez la concordance des soldes et encaissements mobile money (Wave, Orange Money) directement sur les smartphones de caisse avec les numéros officiels Yikéli : 
              <span className="font-semibold text-gray-700 block mt-1">+225 05 01 14 92 44</span>
              <span className="font-semibold text-gray-700 block">+225 07 16 61 46 69</span>
            </p>
            <div className="bg-white p-3 rounded-xl border flex items-center gap-3">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <span className="text-xs font-bold text-gray-800 block">Commandes prises aujourd'hui :</span>
                <span className="text-xs text-gray-500">{shiftMetrics.ordersCount} fiches enregistrées</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUB-SECTION 4: COUPE DE CAISSE / DEPOSE DE DEPENSES */}
      {activeSubTab === 'depenses' && (
        <motion.div
          key="caisse-depenses-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
            <div className="border-b border-gray-150 pb-4">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-600" />
                <span>Enregistrement d'une Nouvelle Dépense</span>
              </h3>
              <p className="text-xs text-gray-500">
                Saisissez les détails de vos achats de provisions, transport ou fournitures. Toute dépense saisie doit être validée par la direction (Gérant) avant d'être prise en compte dans la comptabilité globale.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const category = formData.get('category') as string;
                const desc = formData.get('description') as string;
                const amount = Number(formData.get('amount'));
                const date = formData.get('date') as string;

                if (!desc.trim() || !amount || amount <= 0) {
                  alert('Veuillez remplir correctement la description et le montant.');
                  return;
                }

                // Call addDepense but strictly as EN_ATTENTE
                db.addDepense(category, desc.trim(), amount, date, 'EN_ATTENTE', activeEmployee?.name || 'Caissier');
                form.reset();
                alert('⏳ Dépense enregistrée avec succès ! Elle est désormais en attente de validation par le gérant.');
              }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs"
            >
              <div className="space-y-1.5 col-span-1">
                <label className="font-extrabold text-slate-700">Catégorie</label>
                <select
                  name="category"
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 border border-gray-250 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  {Array.from(new Set(db.depenseCategories || ['Loyer', 'Factures', 'Provisions', 'Transport', 'Livraison', 'Taxes', 'Salaires', 'Réparations', 'Autre'])).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="font-extrabold text-slate-700">Description / Justification de l'Achat</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Ex: Achat charbon, transport marché d'Abatta..."
                  className="w-full bg-slate-50 text-slate-800 border border-gray-250 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1.5 col-span-1 font-sans">
                <label className="font-extrabold text-slate-700">Montant (FCFA)</label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  placeholder="Montant FCFA..."
                  className="w-full bg-slate-50 text-slate-800 border border-gray-250 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-1">
                <label className="font-extrabold text-slate-700">Date d'engagement</label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().substring(0, 10)}
                  className="w-full bg-slate-50 text-slate-800 border border-gray-250 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div className="col-span-1 md:col-span-3">
                {/* empty spacer */}
              </div>

              <div className="col-span-1">
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer text-center text-[11px] uppercase tracking-wider"
                >
                  Déposer la demande
                </button>
              </div>
            </form>
          </div>

          {/* List of expenses with statuses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Historique Récent de Vos Saisies de Caisse</h4>
              <p className="text-xs text-gray-400">Voici les dépenses soumises à la direction. Les montants ne sont comptabilisés qu'une fois validés par le gérant.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-gray-150">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3">Saisie par</th>
                    <th className="p-3 text-right">Statut de validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 font-medium">
                  {db.depenses.filter(d => d.submittedBy || d.status === 'EN_ATTENTE').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-normal">
                        Aucune demande de dépense saisie à afficher.
                      </td>
                    </tr>
                  ) : (
                    db.depenses.filter(d => d.submittedBy || d.status === 'EN_ATTENTE').map((dep, idx) => {
                      const finalStatus = dep.status || 'PAYEE';
                      return (
                        <tr key={`${dep.id}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-gray-500">{dep.date}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-705 font-bold px-2 py-0.5 rounded-md">
                              {dep.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-800">{dep.description}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {new Intl.NumberFormat('fr-FR').format(dep.amount)} FCFA
                          </td>
                          <td className="p-3 text-gray-500">{dep.submittedBy || 'Gérant'}</td>
                          <td className="p-3 text-right">
                            {finalStatus === 'EN_ATTENTE' && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-2.5 py-1 rounded-xl text-[10px]">
                                ⏳ En Attente du Gérant
                              </span>
                            )}
                            {finalStatus === 'PAYEE' && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold px-2.5 py-1 rounded-xl text-[10px]">
                                ✅ Validée &amp; Payée
                              </span>
                            )}
                            {finalStatus === 'REJETEE' && (
                              <span className="bg-red-50 text-red-600 border border-red-200 font-extrabold px-2.5 py-1 rounded-xl text-[10px]">
                                ❌ Rejetée
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* POPUP MODAL 1: MULTI-PAYMENT TERMINAL ENGINE */}
      <AnimatePresence>
        {selectedOrderForPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedOrderForPayment(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Coins className="w-5 h-5" />
                <h4 className="text-sm font-bold">Terminal d'Encaissement Tactile</h4>
              </div>

              {/* Order Sum Info */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Commande ID :</span>
                  <span className="font-mono font-bold text-gray-800">{selectedOrderForPayment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coût total commande :</span>
                  <span className="font-mono font-bold text-gray-800">{formatFCFA(selectedOrderForPayment.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Déjà payé :</span>
                  <span className="font-mono font-bold text-green-600">{formatFCFA(getAmountPaidForOrder(selectedOrderForPayment.id))}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold">
                  <span className="text-gray-900">Reste dû à percevoir :</span>
                  <span className="font-mono text-red-650">{formatFCFA(selectedOrderForPayment.total - getAmountPaidForOrder(selectedOrderForPayment.id))}</span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-650">Kilo / Moyen de Paiement</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-850"
                    >
                      {Array.from(new Set(db.paymentMethods || ['ESPECE', 'WAVE', 'ORANGE_MONEY', 'DJAMO'])).map((m, idx) => (
                        <option key={`${m}-${idx}`} value={m}>
                          {m === 'ESPECE' ? 'Espèces (Cash)' : m === 'WAVE' ? 'Wave Money' : m === 'ORANGE_MONEY' ? 'Orange Money' : m === 'DJAMO' ? 'Djamo Card' : m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-650">Montant versé (FCFA)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 5000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 text-blue-800 border border-blue-105 rounded-xl text-[10px] flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Si la somme des paiements atteint le montant total, le statut passera automatiquement à <strong>PAYEE</strong>. Des paiements partiels multiples sont acceptés.</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl shadow transition"
                >
                  Enregistrer l'Encaissement
                </button>

                {getAmountPaidForOrder(selectedOrderForPayment.id) > 0 && (
                  <div className="pt-2 border-t border-gray-150 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const reason = prompt("Saisir le motif détaillé de la demande de remboursement pour cette commande déjà réglée :");
                        if (reason === null) return;
                        if (!reason.trim()) {
                          alert("Erreur: Le motif de remboursement de commande est obligatoire !");
                          return;
                        }
                        const res = db.updateCommandeStatus(selectedOrderForPayment.id, 'DEMANDE_ANNULATION', false, reason.trim());
                        if (res.success) {
                          alert("Demande de remboursement et d'annulation transmise avec succès à l'administration !");
                          setSelectedOrderForPayment(null);
                        } else {
                          alert(res.error);
                        }
                      }}
                      className="w-full bg-rose-50 hover:bg-rose-100/90 text-rose-700 hover:text-rose-800 font-extrabold text-[11px] py-2.5 rounded-xl transition border border-rose-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      💰 Demander un Remboursement / Annuler
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL 2: PRINT THERMAL RECEIPT PREVIEW */}
      <AnimatePresence>
        {selectedOrderForReceipt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-gray-800"
            >
              <button
                onClick={() => setSelectedOrderForReceipt(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 print:hidden"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Thermal Ticket simulation paper aspect-ratio */}
              <div 
                id="printable-receipt"
                className="border border-dashed border-gray-300 p-4 bg-slate-50 rounded-xl font-mono text-[11px] leading-relaxed space-y-4 shadow-inner printable-ticket-element"
              >
                
                {/* Header Restaurant */}
                <div className="text-center space-y-0.5">
                  <Logo size="sm" width={64} height={64} className="mx-auto mb-1.5" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Restaurant Yikéli</h4>
                  <p className="text-[10px] text-gray-400">Abidjan Route d'Abatta</p>
                  <p className="text-[10px] text-gray-400">Djorogobité 1 • Adr Yango: 206</p>
                  <p className="text-[10px] text-gray-400">Tél: +225 05 01 14 92 44</p>
                  <p className="text-[10px] text-gray-400">--------------------------------</p>
                </div>

                {/* Ticket Metadata */}
                <div>
                  <div>Ticket: {selectedOrderForReceipt.id}</div>
                  <div>Date: {new Date(selectedOrderForReceipt.createdAt).toLocaleString('fr-FR')}</div>
                  <div>Auteur caissier: {activeEmployee?.name || 'Salimata Caisse'}</div>
                  <div>Type: {selectedOrderForReceipt.type === 'SUR_PLACE' ? 'SUR PLACE' : 'LIVRAISON EN LIGNE'}</div>
                  <div>Client: {db.clients.find(c => c.id === selectedOrderForReceipt.clientId)?.name}</div>
                  {selectedOrderForReceipt.comment && (
                    <div className="mt-1.5 p-1 bg-amber-50 text-[10px] text-amber-950 border border-amber-250 rounded font-bold uppercase leading-snug">
                      ⚠️ NOTE CLIENT : {selectedOrderForReceipt.comment}
                    </div>
                  )}
                  <div className="text-[9px] text-gray-400">--------------------------------</div>
                </div>

                {/* Ticket Items */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-gray-800 border-b border-gray-200 pb-1">
                    <span>Désignation</span>
                    <span>Total</span>
                  </div>
                  {selectedOrderForReceipt.items.map((it, idx) => (
                    <div key={`${it.id}-${idx}`} className="flex justify-between text-gray-700">
                      <span>{it.quantity}x {it.platName.split(' ')[0]}</span>
                      <span>{formatFCFA(it.quantity * it.unitPrice)}</span>
                    </div>
                  ))}
                  <div className="text-[9px] text-gray-400 border-t border-gray-200 pt-1">--------------------------------</div>
                </div>

                {/* Balance accounting details */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>MONTANT TOTAL :</span>
                    <span>{formatFCFA(selectedOrderForReceipt.total)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>SOMME PERÇUE :</span>
                    <span>{formatFCFA(getAmountPaidForOrder(selectedOrderForReceipt.id))}</span>
                  </div>
                  <div className="flex justify-between text-red-650 font-bold border-t border-dashed border-gray-300 pt-1">
                    <span>RESTE À PAYER :</span>
                    <span>{formatFCFA(selectedOrderForReceipt.total - getAmountPaidForOrder(selectedOrderForReceipt.id))}</span>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="text-center space-y-1 pt-2">
                  <p className="text-[9px] text-gray-450 uppercase font-semibold">Merci de votre fidélité !</p>
                  <p className="text-[8px] text-gray-400">Yikéli, les excellentes saveurs locales.</p>
                </div>

              </div>

              {/* Action options */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3.5 print:hidden">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                    📲 Envoi Écologique par WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Numéro du client (Ex: +225...)"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      onClick={handleSendWhatsAppReceipt}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                      title="Partager par WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Envoyer
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-gray-50">
                  <button
                    onClick={() => {
                      document.body.classList.add('print-ticket-only');
                      window.print();
                      document.body.classList.remove('print-ticket-only');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimer Ticket (Vrai)
                  </button>
                  <button
                    onClick={() => setSelectedOrderForReceipt(null)}
                    className="w-full bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>

                {typeof window !== 'undefined' && window.self !== window.top && (
                  <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-xl p-3 text-[11px] leading-relaxed text-left space-y-1 mt-2">
                    <p className="font-bold flex items-center gap-1 text-amber-950">
                      <span>⚠️ Note d'Impression (iFrame)</span>
                    </p>
                    <p className="text-gray-600 font-medium">
                      Votre navigateur bloque l'impression directe d'un reçu au sein d'une iframe d'aperçu.
                    </p>
                    <p className="font-bold text-amber-950">
                      💡 Pour utiliser l'impression physique sans restriction, veuillez ouvrir l'application dans un nouvel onglet grâce au bouton d'agrandissement en haut à droite.
                    </p>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL 3: LIVE ORDER EDIT / ITEM ADDITION FOR DINE-IN ORDERS */}
      <AnimatePresence>
        {selectedOrderForEdit && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto w-full h-full">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative text-gray-800 flex flex-col md:flex-row gap-6 max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedOrderForEdit(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Panel: Current Live Cart for Selected Order */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="mb-3.5 flex-shrink-0">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest block">Modifications en cours</span>
                  <h4 className="text-sm font-extrabold text-slate-850">
                    Menu - Table N° {selectedOrderForEdit.tableNumber || '?'}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Commande ID: <span className="font-mono font-bold">{selectedOrderForEdit.id}</span>
                  </p>
                </div>

                {/* List of elements in editOrderCart */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px] max-h-[350px]">
                  {(Object.entries(editOrderCart) as [string, number][]).filter(([_, qty]) => qty > 0).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      Aucun plat sélectionné. Utilisez la liste à droite pour en ajouter.
                    </div>
                  ) : (
                    (Object.entries(editOrderCart) as [string, number][]).map(([pid, qty]) => {
                      const plat = db.plats.find((p) => p.id === pid);
                      if (!plat) return null;
                      const originalItem = selectedOrderForEdit.items.find((it) => it.platId === pid);
                      const originalQty = originalItem ? originalItem.quantity : 0;
                      const diff = qty - originalQty;

                      return (
                        <div key={pid} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-150 shadow-sm">
                          <div className="flex-1">
                            <span className="text-xs font-bold text-gray-800 block">{plat.name}</span>
                            <span className="text-[10px] font-bold text-gray-450 font-mono">
                              {formatFCFA(plat.price)} x {qty} = {formatFCFA(plat.price * qty)}
                            </span>
                            {diff !== 0 && (
                              <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold ml-2 ${
                                diff > 0 ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {diff > 0 ? `+${diff} supp.` : `${diff} annul.`}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditOrderCart((prev) => {
                                  const updated = { ...prev };
                                  const currentVal = updated[pid] || 0;
                                  if (currentVal > 1) {
                                    updated[pid] = currentVal - 1;
                                  } else {
                                    delete updated[pid];
                                  }
                                  return updated;
                                });
                              }}
                              className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 hover:bg-slate-200 transition font-bold flex items-center justify-center cursor-pointer text-sm"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-bold font-mono">{qty}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (plat.isStocked && plat.stock !== undefined) {
                                  const nextDiff = (qty + 1) - originalQty;
                                  if (nextDiff > plat.stock) {
                                    alert(`Désolé, stock insuffisant pour ${plat.name}. Seulement ${plat.stock} portions supplémentaires disponibles en réserve !`);
                                    return;
                                  }
                                }
                                setEditOrderCart((prev) => ({
                                  ...prev,
                                  [pid]: (prev[pid] || 0) + 1,
                                }));
                              }}
                              className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition font-bold flex items-center justify-center cursor-pointer text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Calculated updated total */}
                <div className="border-t border-slate-200 pt-3 mt-auto space-y-1.5 text-xs flex-shrink-0">
                  <div className="flex justify-between text-gray-500 font-semibold">
                    <span>Total Initial :</span>
                    <span className="font-mono">{formatFCFA(selectedOrderForEdit.total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-extrabold text-sm border-t border-dashed border-gray-200 pt-1.5">
                    <span>Nouveau Total Estimé :</span>
                    <span className="font-mono text-orange-600 font-bold text-sm">
                      {formatFCFA(
                        (Object.entries(editOrderCart) as [string, number][]).reduce((sum, [pid, qty]) => {
                          const plat = db.plats.find((p) => p.id === pid);
                          return sum + (plat ? plat.price * qty : 0);
                        }, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Panel: Search and Add New Plates to Edit Cart */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Ajouter des plats de la cuisine</span>
                  <h4 className="text-sm font-extrabold text-slate-800">Catalogue des Plats</h4>
                  
                  {/* Search box inside modal */}
                  <div className="mt-2.5 relative">
                    <input
                      type="text"
                      placeholder="Rechercher une portion de braise / boisson..."
                      value={editSearchQuery}
                      onChange={(e) => setEditSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                    />
                  </div>
                </div>

                {/* Filter and display match items */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px] max-h-[350px]">
                  {db.plats
                    .filter((p) => p.name.toLowerCase().includes(editSearchQuery.toLowerCase()))
                    .map((plat) => {
                      const isOutOfStock = plat.isStocked && (plat.stock === undefined || plat.stock <= 0);
                      const originalItem = selectedOrderForEdit.items.find((it) => it.platId === plat.id);
                      const originalQty = originalItem ? originalItem.quantity : 0;
                      const hasCurrentEditQty = editOrderCart[plat.id] || 0;
                      const currentDiff = hasCurrentEditQty - originalQty;

                      return (
                        <div 
                          key={plat.id}
                          className={`p-2.5 rounded-xl border transition flex items-center justify-between text-left ${
                            isOutOfStock && hasCurrentEditQty === 0
                              ? 'bg-gray-50 border-gray-100 opacity-60'
                              : 'bg-white hover:bg-slate-50/50 border-gray-200'
                          }`}
                        >
                          <div className="flex-1">
                            <span className="text-xs font-extrabold text-slate-800 block">{plat.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-orange-600 font-bold font-mono">{formatFCFA(plat.price)}</span>
                              {plat.isStocked && (
                                <span className={`text-[9px] font-extrabold uppercase px-1 rounded ${
                                  plat.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  Stock: {plat.stock} rest.
                                </span>
                              )}
                              {originalQty > 0 && (
                                <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1 rounded">
                                  Déjà commandé: {originalQty}x
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock && currentDiff >= (plat.stock || 0)}
                            onClick={() => {
                              if (plat.isStocked && plat.stock !== undefined) {
                                const nextDiff = (hasCurrentEditQty + 1) - originalQty;
                                if (nextDiff > plat.stock) {
                                  alert(`Stock insuffisant pour ${plat.name}. Seulement ${plat.stock} supplémentaires dispo !`);
                                  return;
                                }
                              }
                              setEditOrderCart((prev) => ({
                                ...prev,
                                [plat.id]: (prev[plat.id] || 0) + 1,
                              }));
                            }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer ${
                              isOutOfStock && currentDiff >= (plat.stock || 0)
                                ? 'bg-gray-100 text-gray-400 border border-gray-150 cursor-not-allowed'
                                : 'bg-orange-500 hover:bg-orange-600 text-white font-extrabold'
                            }`}
                          >
                            ➕ Ajouter
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Bottom interactive action button section */}
                <div className="flex gap-2.5 pt-4 mt-4 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const finalizedItemsArr = (Object.entries(editOrderCart) as [string, number][])
                        .map(([pid, qty]) => ({ platId: pid, quantity: qty }))
                        .filter((it) => it.quantity > 0);

                      const res = db.updateCommandeItems(selectedOrderForEdit.id, finalizedItemsArr, activeEmployee?.role === 'gerant');
                      if (res.success) {
                        alert("La commande a été mise à jour avec succès ! Les portions supplémentaires ont été ajoutées et les stocks ont été mis à jour.");
                        setSelectedOrderForEdit(null);
                      } else {
                        alert(res.error);
                      }
                    }}
                    className="flex-1 bg-[#10b981] hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-emerald-950/10 text-center"
                  >
                    💾 Enregistrer l'Ajout de Plats
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForEdit(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer"
                  >
                    Fermer / Annuler
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL 4: CHANGER MON MOT DE PASSE (SELF-SERVICE) */}
      <AnimatePresence>
        {changePasswordModalOpen && activeEmployee && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto w-full h-full">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-gray-800"
            >
              <button
                onClick={() => setChangePasswordModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Key className="w-6 h-6 text-orange-650" />
                </div>
                <h3 className="text-base font-extrabold text-slate-805">
                  Changer mon mot de passe
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Sécurisez l'accès à votre compte de caisse Yikéli.
                </p>
              </div>

              {passwordChangeSuccess ? (
                <div className="space-y-4 text-center py-4">
                  <div className="text-emerald-500 text-sm font-bold bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    🎉 Mot de passe modifié avec succès !
                  </div>
                  <p className="text-xs text-gray-500">
                    Votre nouveau mot de passe est maintenant actif. Pensez à l'utiliser lors de votre prochaine connexion.
                  </p>
                  <button
                    onClick={() => setChangePasswordModalOpen(false)}
                    className="w-full bg-slate-800 hover:bg-slate-705 text-white font-bold text-xs py-2.5 rounded-lg transition"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPasswordChangeError('');

                    const dbUser = db.users.find(u => u.id === activeEmployee.id);
                    const currentPasswordActual = dbUser?.password || activeEmployee.password || '';

                    if (currentPasswordInput !== currentPasswordActual) {
                      setPasswordChangeError("⚠️ L'ancien mot de passe saisi est incorrect.");
                      return;
                    }

                    if (!newPasswordInput || newPasswordInput.trim() === '') {
                      setPasswordChangeError("⚠️ Le nouveau mot de passe ne peut pas être vide.");
                      return;
                    }

                    if (newPasswordInput.length < 3) {
                      setPasswordChangeError("⚠️ Le nouveau mot de passe doit faire au moins 3 caractères.");
                      return;
                    }

                    if (newPasswordInput === currentPasswordInput) {
                      setPasswordChangeError("⚠️ Le nouveau mot de passe doit être différent de l'ancien.");
                      return;
                    }

                    if (newPasswordInput !== confirmPasswordInput) {
                      setPasswordChangeError("⚠️ Les nouveaux mots de passe ne correspondent pas.");
                      return;
                    }

                    const res = db.changeUserPassword(activeEmployee.id, newPasswordInput);
                    if (res.success) {
                      setPasswordChangeSuccess(true);
                    } else {
                      setPasswordChangeError(res.error || "Une erreur est survenue.");
                    }
                  }}
                  className="space-y-4"
                >
                  {passwordChangeError && (
                    <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-xl font-medium animate-shake">
                      {passwordChangeError}
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Ancien mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Saisissez votre mot de passe actuel"
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Choisissez un nouveau mot de passe"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Retapez le nouveau mot de passe"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setChangePasswordModalOpen(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showHelpModal && (
        <InteractiveHelpModal
          type="caisse"
          onClose={() => setShowHelpModal(false)}
        />
      )}
    </div>
  );
}
