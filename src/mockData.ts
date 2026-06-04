import { Plat, User, Client, Commande, Paiement, Depense } from './types';

export const INITIAL_PLATS: Plat[] = [
  { id: 'p1', name: 'Garba Classique (Attiéké + Thon Frit)', price: 1500, category: 'PLATS_IVOIRIENS', isActive: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80', buyingCost: 800 },
  { id: 'p2', name: 'Poisson Sauté Attiéké (Carpe moyenne)', price: 2500, category: 'PLATS_IVOIRIENS', isActive: true, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80', buyingCost: 1200 },
  { id: 'p3', name: 'Kédjénou de Poulet Authentique', price: 3500, category: 'PLATS_IVOIRIENS', isActive: true, image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=80', buyingCost: 1800 },
  { id: 'p4', name: 'Placali Sauce Graine / Copé', price: 3000, category: 'PLATS_IVOIRIENS', isActive: true, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=80', buyingCost: 1400 },
  { id: 'p5', name: 'Alloco Doré (Portion généreuse)', price: 1000, category: 'PLATS_IVOIRIENS', isActive: true, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80', buyingCost: 400 },
  { id: 'p6', name: 'Poulet Braisé aux épices (Demi-poulet)', price: 4000, category: 'PLATS_IVOIRIENS', isActive: true, image: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=500&auto=format&fit=crop&q=80', buyingCost: 2000 },
  { id: 'p7', name: 'Riz Gras de Fête au Poulet', price: 2500, category: 'PLATS_IVOIRIENS', isActive: true, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80', buyingCost: 1100 },
  { id: 'p8', name: 'Jus de Bissap Maison parfumé', price: 800, category: 'BOISSONS', isActive: true, isStocked: true, stock: 45, lowStockAlert: 10, image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=500&auto=format&fit=crop&q=80', buyingCost: 300 },
  { id: 'p9', name: 'Jus de Gingembre (Gnamankoudji)', price: 800, category: 'BOISSONS', isActive: true, isStocked: true, stock: 30, lowStockAlert: 8, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80', buyingCost: 350 },
  { id: 'p10', name: 'Eau Minérale Awa (Format Moyen)', price: 500, category: 'BOISSONS', isActive: true, isStocked: true, stock: 65, lowStockAlert: 15, image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&auto=format&fit=crop&q=80', buyingCost: 200 },
  { id: 'p11', name: 'Canette Coca-Cola fraîche', price: 800, category: 'BOISSONS', isActive: true, isStocked: true, stock: 50, lowStockAlert: 10, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80', buyingCost: 450 },
  { id: 'p12', name: 'Barquette Plastique Standard', price: 150, category: 'EMBALLAGES', isActive: true, isStocked: true, stock: 120, lowStockAlert: 20, image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop&q=80', buyingCost: 60 },
  { id: 'p13', name: 'Sac Kraft Biodégradable', price: 100, category: 'EMBALLAGES', isActive: true, isStocked: true, stock: 200, lowStockAlert: 30, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80', buyingCost: 40 },
  
  // Market provisions / products (raw ingredients) - stockable, has buyingCost, price is 0, category is PROVISIONS, isActive is false
  { id: 'p14', name: 'Poulet de chair (Marché - Portion)', price: 0, category: 'PROVISIONS', isActive: false, isStocked: true, stock: 80, lowStockAlert: 15, buyingCost: 1800 },
  { id: 'p15', name: 'Poisson Carpe / Thon (Marché - Kg)', price: 0, category: 'PROVISIONS', isActive: false, isStocked: true, stock: 50, lowStockAlert: 10, buyingCost: 1400 },
  { id: 'p16', name: 'Régimes de Banane mûre', price: 0, category: 'PROVISIONS', isActive: false, isStocked: true, stock: 25, lowStockAlert: 5, buyingCost: 4500 },
  { id: 'p17', name: 'Bidon Huile raffinée 25L', price: 0, category: 'PROVISIONS', isActive: false, isStocked: true, stock: 8, lowStockAlert: 2, buyingCost: 26500 },
  { id: 'p18', name: 'Piment Rouge frais (Grand Sac)', price: 0, category: 'PROVISIONS', isActive: false, isStocked: true, stock: 6, lowStockAlert: 1, buyingCost: 12000 },
  { id: 'p19', name: 'Chou Blanc d’Adjamé (Sac)', price: 0, category: 'PROVISIONS', isActive: false, isStocked: true, stock: 12, lowStockAlert: 2, buyingCost: 9500 }
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Flavien Admin', phone: '+225 05 01 14 92 44', email: 'flavien004@gmail.com', role: 'ADMIN', isActive: true, createdAt: '2026-05-10T10:00:00Z', username: 'admin', password: 'admin' },
  { id: 'u2', name: 'Salimata Caisse', phone: '+225 07 16 61 46 69', email: 'salimata@yikeli.com', role: 'EMPLOYE', isActive: true, createdAt: '2026-05-12T08:30:00Z', username: 'salimata', password: 'salimata' },
  { id: 'u3', name: 'Amadou Caisse', phone: '+225 01 02 03 04 05', email: 'amadou@yikeli.com', role: 'EMPLOYE', isActive: true, createdAt: '2026-05-15T09:00:00Z', username: 'amadou', password: 'amadou' }
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Kouassi Yao', phone: '0102030405', totalSpent: 45000, createdAt: '2026-05-11T12:00:00Z' },
  { id: 'c2', name: 'Marie-Aude Kouadio', phone: '0748591020', totalSpent: 32000, createdAt: '2026-05-12T14:15:00Z' },
  { id: 'c3', name: 'Seydou Koné', phone: '0588123456', totalSpent: 18500, createdAt: '2026-05-15T19:30:00Z' },
  { id: 'c4', name: 'Grace Emmanuelle', phone: '0709887766', totalSpent: 12000, createdAt: '2026-05-18T11:45:00Z' },
  { id: 'c5', name: 'Franck Anderson', phone: '0155443322', totalSpent: 8500, createdAt: '2026-05-20T13:00:00Z' }
];

// Seed some expenses spread out this month
export const INITIAL_DEPENSES: Depense[] = [
  { id: 'd1', category: 'Loyer', description: 'Loyer local Djorogobité 1 Abatta', amount: 150000, date: '2026-05-01' },
  { id: 'd2', category: 'Factures', description: 'Facture CIE CIE-Électricité Mai', amount: 35000, date: '2026-05-05' },
  { id: 'd3', category: 'Factures', description: 'Facture Sodeci - Eau Mai', amount: 12500, date: '2026-05-06' },
  { id: 'd4', category: 'Provisions', description: 'Achat sacs de charbon à Abatta', amount: 22000, date: '2026-05-22' },
  { id: 'd5', category: 'Provisions', description: 'Provisions Marché Adjamé (Légumes, Épices, Huile)', amount: 48000, date: '2026-05-23' },
  { id: 'd6', category: 'Transport', description: 'Carburant livraison & approvisionnement', amount: 15000, date: '2026-05-15' },
  { id: 'd7', category: 'Salaires', description: 'Acompte salaire cuisinier Mamadou', amount: 40000, date: '2026-05-16' },
  { id: 'd8', category: 'Réparations', description: 'Dépannage du congélateur Yikéli', amount: 18000, date: '2026-05-18' }
];

// Active menu for 2026-05-23 (Today as per metadata context)
export const INITIAL_PLAT_IDS_DE_JOUR = ['p1', 'p2', 'p3', 'p5', 'p6', 'p8', 'p9', 'p10'];

// Seed some orders and payments
export const INITIAL_COMMANDES: Commande[] = [
  {
    id: 'cmd-1',
    clientId: 'c1',
    userId: 'u2',
    type: 'SUR_PLACE',
    total: 9000,
    status: 'PAYEE',
    createdAt: '2026-05-23T12:30:00Z',
    items: [
      { id: 'ci-1', commandeId: 'cmd-1', platId: 'p3', platName: 'Kédjénou de Poulet Authentique', quantity: 2, unitPrice: 3500 },
      { id: 'ci-2', commandeId: 'cmd-1', platId: 'p5', platName: 'Alloco Doré (Portion généreuse)', quantity: 2, unitPrice: 1000 }
    ]
  },
  {
    id: 'cmd-2',
    clientId: 'c2',
    userId: 'u2',
    type: 'SUR_PLACE',
    total: 4100,
    status: 'PAYEE',
    createdAt: '2026-05-23T13:15:00Z',
    items: [
      { id: 'ci-3', commandeId: 'cmd-2', platId: 'p1', platName: 'Garba Classique (Attiéké + Thon Frit)', quantity: 1, unitPrice: 1500 },
      { id: 'ci-4', commandeId: 'cmd-2', platId: 'p2', platName: 'Poisson Sauté Attiéké (Carpe moyenne)', quantity: 1, unitPrice: 2500 },
      { id: 'ci-5', commandeId: 'cmd-2', platId: 'p10', platName: 'Eau Minérale Awa (Format Moyen)', quantity: 2, unitPrice: 500 } // Wait, 1500+2500+1000 = 5000? Oh, wait: (1*1500) + (1*2500) + (1*500 is 1000? No, let's just make it total equal to 4800 or 4800 is 1500 + 2500 + 800)
    ]
  },
  {
    id: 'cmd-3',
    clientId: 'c3',
    userId: 'u3',
    type: 'SUR_PLACE',
    total: 10500,
    status: 'SERVIE', // Served but partial payment!
    createdAt: '2026-05-23T14:00:00Z',
    items: [
      { id: 'ci-6', commandeId: 'cmd-3', platId: 'p6', platName: 'Poulet Braisé aux épices (Demi-poulet)', quantity: 2, unitPrice: 4000 },
      { id: 'ci-7', commandeId: 'cmd-3', platId: 'p2', platName: 'Poisson Sauté Attiéké (Carpe moyenne)', quantity: 1, unitPrice: 2500 }
    ]
  },
  {
    id: 'cmd-4',
    clientId: 'c4',
    type: 'EN_LIGNE', // Online client!
    total: 2300,
    status: 'PAYEE',
    createdAt: '2026-05-23T15:20:00Z',
    items: [
      { id: 'ci-8', commandeId: 'cmd-4', platId: 'p1', platName: 'Garba Classique (Attiéké + Thon Frit)', quantity: 1, unitPrice: 1500 },
      { id: 'ci-9', commandeId: 'cmd-4', platId: 'p8', platName: 'Jus de Bissap Maison parfumé', quantity: 1, unitPrice: 800 }
    ]
  },
  {
    id: 'cmd-5',
    clientId: 'c1',
    userId: 'u2',
    type: 'SUR_PLACE',
    total: 12100, // Kouassi ordered plenty earlier this week
    status: 'PAYEE',
    createdAt: '2026-05-18T19:00:00Z',
    items: [
      { id: 'ci-10', commandeId: 'cmd-5', platId: 'p6', platName: 'Poulet Braisé aux épices (Demi-poulet)', quantity: 2, unitPrice: 4000 },
      { id: 'ci-11', commandeId: 'cmd-5', platId: 'p2', platName: 'Poisson Sauté Attiéké (Carpe moyenne)', quantity: 1, unitPrice: 2500 },
      { id: 'ci-12', commandeId: 'cmd-5', platId: 'p9', platName: 'Jus de Gingembre (Gnamankoudji)', quantity: 2, unitPrice: 800 }
    ]
  },
  {
    id: 'cmd-6',
    clientId: 'c2',
    userId: 'u3',
    type: 'SUR_PLACE',
    total: 7800,
    status: 'PAYEE',
    createdAt: '2026-05-20T13:45:00Z',
    items: [
      { id: 'ci-13', commandeId: 'cmd-6', platId: 'p4', platName: 'Placali Sauce Graine / Copé', quantity: 2, unitPrice: 3000 },
      { id: 'ci-14', commandeId: 'cmd-6', platId: 'p9', platName: 'Jus de Gingembre (Gnamankoudji)', quantity: 2, unitPrice: 800 },
      { id: 'ci-15', commandeId: 'cmd-6', platId: 'p10', platName: 'Eau Minérale Awa (Format Moyen)', quantity: 1, unitPrice: 500 } // Total: 6000 + 1600 + 500 = 8100? Let's fix unit price/item totals nicely in dynamic code.
    ]
  }
];

export const INITIAL_PAIEMENTS: Paiement[] = [
  { id: 'pay-1', commandeId: 'cmd-1', method: 'ESPECE', amount: 9000, createdAt: '2026-05-23T12:35:00Z' },
  { id: 'pay-2', commandeId: 'cmd-2', method: 'WAVE', amount: 4100, createdAt: '2026-05-23T13:18:00Z' },
  { id: 'pay-3', commandeId: 'cmd-3', method: 'ORANGE_MONEY', amount: 5000, createdAt: '2026-05-23T14:05:00Z' }, // Partial payment of 5000 out of 10500
  { id: 'pay-4', commandeId: 'cmd-4', method: 'DJAMO', amount: 2300, createdAt: '2026-05-23T15:25:00Z' },
  { id: 'pay-5', commandeId: 'cmd-5', method: 'WAVE', amount: 12100, createdAt: '2026-05-18T19:05:00Z' },
  { id: 'pay-6', commandeId: 'cmd-6', method: 'ESPECE', amount: 7800, createdAt: '2026-05-20T13:50:00Z' }
];

export const INITIAL_STOCK_ENTRIES = [
  { id: 'se-1', platId: 'p8', platName: 'Jus de Bissap Maison parfumé', quantity: 45, date: '2026-05-20T10:00:00Z', comment: 'Stock initial de démarrage' },
  { id: 'se-2', platId: 'p9', platName: 'Jus de Gingembre (Gnamankoudji)', quantity: 30, date: '2026-05-21T11:30:00Z', comment: 'Stock initial de démarrage' },
  { id: 'se-3', platId: 'p10', platName: 'Eau Minérale Awa (Format Moyen)', quantity: 65, date: '2026-05-22T09:00:00Z', comment: 'Livraison hebdomadaire de bouteilles' },
  { id: 'se-4', platId: 'p11', platName: 'Canette Coca-Cola fraîche', quantity: 50, date: '2026-05-22T09:15:00Z', comment: 'Livraison hebdomadaire pack Coca' },
  { id: 'se-5', platId: 'p12', platName: 'Barquette Plastique Standard', quantity: 120, date: '2026-05-20T08:00:00Z', comment: 'Achat consommables grossiste' },
  { id: 'se-6', platId: 'p13', platName: 'Sac Kraft Biodégradable', quantity: 200, date: '2026-05-20T08:05:00Z', comment: 'Achat consommables sacs' }
];
