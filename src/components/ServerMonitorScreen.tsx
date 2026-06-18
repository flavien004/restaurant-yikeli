import React, { useState, useEffect, useRef } from 'react';
import { Commande, Paiement } from '../types';
import { Tv, CheckCircle2, Clock, UtensilsCrossed, AlertCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface ServerMonitorScreenProps {
  db: {
    commandes: Commande[];
    paiements: Paiement[];
    updateCommandeStatus: (id: string, status: any) => any;
  };
}

export default function ServerMonitorScreen({ db }: ServerMonitorScreenProps) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [knownOrderStates, setKnownOrderStates] = useState<{ [id: string]: { status: string; type: string } }>({});
  
  const isSoundEnabledRef = useRef(isSoundEnabled);

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // High-fidelity light synthesizer using the Web Audio API (cross-browser compatible offline chime)
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
        gain.gain.setValueAtTime(0.08, time); // lightweight volume level
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      if (toneType === 'new') {
        // Light double chime for new online orders (E5 to A5)
        playTone(now, 659.25, 0.35); // E5
        playTone(now + 0.12, 880.00, 0.45); // A5
      } else {
        // Bright split chime for "Prêt à servir" ready orders (A5 key chime)
        playTone(now, 880.00, 0.12, 'sine');
        playTone(now + 0.10, 1046.50, 0.3, 'sine'); // C6
      }
    } catch (e) {
      console.warn("L'auto-play audio a été bloqué par le navigateur ou n'est pas supporté :", e);
    }
  };

  // Monitor real-time status transitions for new online orders and status changes
  useEffect(() => {
    const newStates: { [id: string]: { status: string; type: string } } = {};
    db.commandes.forEach((c) => {
      newStates[c.id] = { status: c.status, type: c.type };
    });

    const isInitialized = Object.keys(knownOrderStates).length > 0;

    if (!isInitialized) {
      setKnownOrderStates(newStates);
      return;
    }

    let shouldSoundNewOnline = false;
    let shouldSoundReady = false;

    db.commandes.forEach((c) => {
      const prev = knownOrderStates[c.id];
      if (prev === undefined) {
        // A brand new order just came in
        if (c.type === 'EN_LIGNE') {
          shouldSoundNewOnline = true;
        } else if (c.status === 'PRET_A_LIVRER' || c.status === 'SERVIE') {
          shouldSoundReady = true;
        }
      } else {
        // Existing order changed status to ready/to serve
        if (prev.status !== c.status && (c.status === 'PRET_A_LIVRER' || c.status === 'SERVIE')) {
          shouldSoundReady = true;
        }
      }
    });

    if (isSoundEnabledRef.current) {
      if (shouldSoundNewOnline) {
        playNotificationSound('new');
      } else if (shouldSoundReady) {
        playNotificationSound('ready');
      }
    }

    setKnownOrderStates(newStates);
  }, [db.commandes]);

  // Helper to calculate total payments made for a given order id
  const getAmountPaidForOrder = (orderId: string) => {
    return (db.paiements || [])
      .filter((p) => p.commandeId === orderId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  // Filter orders to display on Server Monitor Screen:
  // - Orders with status 'SERVIE'
  // - Unpaid SUR_PLACE orders which are 'EN_COURS' or 'ATTENTE_PAIEMENT'
  const servedOrders = db.commandes.filter((c) => {
    // 1. If already SERVIE (explicitly sent for service):
    if (c.status === 'SERVIE') return true;
    
    // 2. If SUR_PLACE and unpaid:
    if (c.type === 'SUR_PLACE' && (c.status === 'EN_COURS' || c.status === 'ATTENTE_PAIEMENT')) {
      return getAmountPaidForOrder(c.id) === 0;
    }
    
    return false;
  });

  const handleCompleteDelivery = (orderId: string) => {
    // Transition served order to LIVREE (marked as delivered to client)
    db.updateCommandeStatus(orderId, 'LIVREE');
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6" id="server-monitor-screen">
      {/* Screen Header styled as a genuine high-contrast kitchen TV display */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 text-orange-400 p-2.5 rounded-2xl border border-orange-500/20">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-orange-450 font-sans">
              📺 Écran de la Salle des Serveurs (POS Room)
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Liste en temps réel de toutes les commandes prêtes et notifiées <span className="text-orange-400 font-bold">« SERVI »</span> ou <span className="text-red-400 font-bold">« À SERVIR »</span>. À apporter aux tables des clients.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:shrink-0">
          <button
            type="button"
            onClick={() => {
              const nextVal = !isSoundEnabled;
              setIsSoundEnabled(nextVal);
              if (nextVal) {
                // Play a brief activation feed sound test
                setTimeout(() => playNotificationSound('ready'), 60);
              }
            }}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              isSoundEnabled
                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-4 h-4 text-orange-400 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span>Sons : {isSoundEnabled ? 'Activés 🔊' : 'Muets 🔇'}</span>
          </button>

          <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-xs font-black font-mono tracking-wider">
              {servedOrders.length} COMMANDES À DESSERVIR
            </span>
          </div>
        </div>
      </div>

      {servedOrders.length === 0 ? (
        <div className="py-24 text-center space-y-4 max-w-md mx-auto">
          <div className="bg-slate-900 p-6 rounded-full inline-block">
            <UtensilsCrossed className="w-12 h-12 text-slate-700 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-300">Aucun plat en attente d'envoi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Toutes les portions commandées ont été servies en salle ou les serveurs sont en attente de nouvelles commandes.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servedOrders.map((order) => {
            const parsedOrderId = order.id.includes('-') ? order.id.split('-')[1] : order.id;
            const isSurPlace = order.type === 'SUR_PLACE';
            const isUnpaidSurPlace = isSurPlace && getAmountPaidForOrder(order.id) === 0;
            
            // Format time elapsed
            let timeString = '';
            if (order.createdAt) {
              const minutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
              timeString = minutes > 0 ? `${minutes} min` : "Moins d'une minute";
            }

            return (
              <div 
                key={order.id} 
                className={`bg-[#0f172a] border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between ${
                  isUnpaidSurPlace ? 'border-red-500/80 hover:border-red-500 shadow-red-950/20 shadow-md animate-pulse' : 'border-orange-500/45 hover:border-orange-500'
                }`}
              >
                {/* Order card heading */}
                <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                  <div>
                    {isUnpaidSurPlace ? (
                      <span className="text-xs text-red-400 font-extrabold tracking-wide block uppercase">
                        Commande à servir à la table n° {order.tableNumber || '?'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-orange-400 font-extrabold tracking-widest font-mono block">COMMANDE #{parsedOrderId}</span>
                    )}
                    <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-600" /> Il y a : {timeString}
                    </span>
                  </div>
                  
                  {isSurPlace ? (
                    isUnpaidSurPlace ? (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        🍽️ À SERVIR
                      </div>
                    ) : (
                      <div className="bg-orange-500 text-slate-950 px-3 py-1 rounded-xl text-xs font-black font-mono">
                        🪑 TABLE {order.tableNumber || '?'}
                      </div>
                    )
                  ) : (
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-xl text-xs font-black font-mono">
                      🛵 LIGNE / EMPORTÉ
                    </div>
                  )}
                </div>

                {/* Plats list in detail */}
                <div className="p-4 flex-1 space-y-3">
                  {isUnpaidSurPlace ? (
                    <div className="bg-red-950/30 border border-red-500/20 text-red-300 p-2.5 rounded-xl text-[11px] font-extrabold text-center uppercase tracking-wide mb-1">
                      ⚠️ Commande à servir à la table n° {order.tableNumber || '?'}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Menu pour la table :</span>
                  )}
                  
                  <div className="space-y-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-800/40 pb-1.5 font-medium">
                        <span className="text-slate-200">
                          <span className="text-orange-400 font-extrabold text-sm mr-1.5">x{it.quantity}</span> 
                          {it.platName}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.comment && (
                    <div className="mt-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-amber-400 italic">
                      <span className="font-bold text-[9px] text-gray-500 uppercase not-italic block">Spécification client:</span>
                      "{order.comment}"
                    </div>
                  )}
                </div>

                {/* Call to action for delivery validation */}
                <div className="p-4 bg-slate-900/40 border-t border-slate-800/40">
                  <button
                    onClick={() => handleCompleteDelivery(order.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-250 shrink-0" />
                    Bouton Servi & Débarrassé
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
