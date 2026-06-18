import { Plat, User, Client, Commande, Paiement, Depense, StockEntry } from './types';

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

export const INITIAL_CLIENTS: Client[] = [];

// Seed some expenses spread out this month
export const INITIAL_DEPENSES: Depense[] = [];

// Active menu for 2026-05-23 (Today as per metadata context)
export const INITIAL_PLAT_IDS_DE_JOUR = ['p1', 'p2', 'p3', 'p5', 'p6', 'p8', 'p9', 'p10'];

// Seed some orders and payments
export const INITIAL_COMMANDES: Commande[] = [];

export const INITIAL_PAIEMENTS: Paiement[] = [];

export const INITIAL_STOCK_ENTRIES: StockEntry[] = [];

