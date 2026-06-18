export type UserRole = 'ADMIN' | 'EMPLOYE';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  poste?: string;
  salaireNet?: number;   // Salaire mensuel net
  dateEmbauche?: string; // YYYY-MM-DD
  dateFinContrat?: string; // YYYY-MM-DD
  username?: string;     // Unique username for sign in
  password?: string;     // Secure login password
  points?: number;       // Cumulative points for cashier
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  createdAt: string;
}

export type PlatCategory = string;

export interface Plat {
  id: string;
  name: string;
  price: number;
  category: PlatCategory;
  isActive: boolean; // Managed by Admin globally
  isStocked?: boolean; // If true, stock is enforced
  stock?: number;      // Current quantity in stock
  lowStockAlert?: number; // Alert threshold
  expirationDelay?: string; // Délai avant péremption
  image?: string; // URL de l'image du plat
  buyingCost?: number; // Coût d'achat unitaire pour les calculs de bénéfice
}

// Supplier (Fournisseur) details for stocks and market expenses
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

// In-system daily menu structure
export interface MenuJour {
  id: string;
  date: string; // YYYY-MM-DD
  platIds: string[]; // List of active plat IDs for this date
}

export type CommandeType = 'SUR_PLACE' | 'EN_LIGNE';
export type CommandeStatus = 
  | 'EN_COURS'          // en cours de commande
  | 'ATTENTE_PAIEMENT'  // en attente de paiement
  | 'SERVIE'            // servie
  | 'PRET_A_LIVRER'     // prêt à livrer
  | 'EN_LIVRAISON'      // en cours de livraison
  | 'LIVREE'            // livrée
  | 'PAYEE'             // payée (historic or final status)
  | 'DEMANDE_ANNULATION' // demande d'annulation déposée par le client
  | 'REFUS_ANNULATION'  // demande d'annulation refusée par l'administrateur
  | 'ANNULEE';          // annulée et remboursée (gérée par administrateur)

export interface CommandeItem {
  id: string;
  commandeId: string;
  platId: string;
  platName: string; // snapshots for historical safety
  quantity: number;
  unitPrice: number;
}

export interface ClientFeedback {
  repas: number;       // Note entre 1 et 5
  delai: number;       // Note entre 1 et 5
  courtoisie: number;  // Note entre 1 et 5
  comment?: string;    // Commentaire libre facultatif
  createdAt: string;
}

export interface Commande {
  id: string;
  clientId: string; // linked to a client
  userId?: string;  // if logged-in employee took it on-site
  type: CommandeType;
  tableNumber?: number; // Numéro de table pour SUR_PLACE (1 à 20)
  total: number;
  status: CommandeStatus;
  createdAt: string;
  items: CommandeItem[];
  comment?: string; // Client specifications and/or allergies notes
  cancelReason?: string; // Motif d'annulation de la commande
  refusalReason?: string; // Motif de refus d'annulation par l'administrateur
  paymentMethod?: PaymentMethod; // Mode de paiement spécifié
  takenChargeAt?: string; // Date/heure de la prise en charge par le caissier
  feedback?: ClientFeedback; // Évaluation client
}

export type PaymentMethod = string;

export interface Paiement {
  id: string;
  commandeId: string;
  method: PaymentMethod;
  amount: number;
  createdAt: string;
  userId?: string; // Cache the cashier / employee who registered this payment
}

export type DepenseCategory = string;

export interface Depense {
  id: string;
  category: DepenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status?: 'PAYEE' | 'EN_ATTENTE' | 'REJETEE'; // Propriété d'autorisation/validation de dépense
  submittedBy?: string; // Nom du caissier à l'origine de la saisie
}

export interface StockEntry {
  id: string;
  platId: string;
  platName: string;
  quantity: number;
  date: string; // YYYY-MM-DD THH:mm:ss
  comment?: string;
  buyingPrice?: number; // Prix d'achat unitaire pour cet approvisionnement spécifique
  supplierId?: string;  // ID du fournisseur de ce produit
  supplierName?: string; // Nom du fournisseur mis en cache
}

export const getExpenseTypeForCategory = (category: string): 'Charge fixe' | 'Charge variable' | 'Charge d\'exploitation' => {
  const cat = category.toLowerCase().trim();
  
  // Charge fixe (loyer, salaire, facture, Electricité, taxe)
  if ([
    'loyer', 'loyers', 
    'salaire', 'salaires', 
    'facture', 'factures', 'factures d\'électricité', 'factures eau',
    'electricite', 'électricité', 'electricité', 
    'taxe', 'taxes'
  ].some(kw => cat.includes(kw))) {
    return 'Charge fixe';
  }
  
  // Charge variable (réparation, entretien...)
  if ([
    'réparation', 'reparation', 'réparations', 'reparations', 
    'entretien', 'entretiens', 'maintenance'
  ].some(kw => cat.includes(kw))) {
    return 'Charge variable';
  }
  
  // Charge d'exploitation (achat de marchandise stockable, provision, transport, gaz ...)
  return 'Charge d\'exploitation';
};
