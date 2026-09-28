export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYE';

export type SaaSPlanType = 'STANDARD' | 'PREMIUM';
export type SaaSBillingCycle = 'MENSUEL' | 'ANNUEL';
export type SaaSPlanKey = 'STANDARD_MENSUEL' | 'STANDARD_ANNUEL' | 'PREMIUM_MENSUEL' | 'PREMIUM_ANNUEL';

export interface SaaSPricingConfig {
  standardMensuel: number;
  standardAnnuel: number;
  premiumMensuel: number;
  premiumAnnuel: number;
}

export interface RestaurantTenant {
  id: string;
  name: string;                  // Nom du restaurant
  logo: string;                  // Logo (URL ou Base64)
  slogan: string;                // Slogan
  address: string;               // Adresse physique
  managerName: string;           // Nom du gérant
  managerPhone: string;          // Contact du gérant
  managerEmail: string;          // Mail du gérant
  contacts: string;              // Contacts téléphone
  whatsapp: string;              // WhatsApp
  subscriptionPlan: SaaSPlanKey; // Abonnement choisi
  subscriptionStartDate: string; // Date de début YYYY-MM-DD
  subscriptionEndDate: string;   // Date de fin YYYY-MM-DD
  status: 'ACTIF' | 'EXPIRE' | 'SUSPENDU';
  adminUsername: string;         // Identifiant d'accès du gérant
  adminPassword: string;         // Mot de passe du gérant
  accessCode: string;            // Code unique et confidentiel d'accès équipe du restaurant
  createdAt: string;
}

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

// Statuts officiels demandés par l'utilisateur :
// "en attente de paiement, payée non servie, servie, remise au livreur, payée livrée et clôturée, annulée"
export type CommandeStatus = 
  | 'EN_ATTENTE_PAIEMENT'     // en attente de paiement
  | 'PAYEE_NON_SERVIE'        // payée non servie
  | 'SERVIE'                  // servie
  | 'REMISE_LIVREUR'          // remise au livreur
  | 'PAYEE_LIVREE_CLOTUREE'   // payée livrée et clôturée
  | 'ANNULEE'                 // annulée
  // Rétrocompatibilité avec les données historiques existantes
  | 'ATTENTE_PAIEMENT'
  | 'EN_COURS'
  | 'PRET_A_LIVRER'
  | 'EN_LIVRAISON'
  | 'LIVREE'
  | 'PAYEE'
  | 'DEMANDE_ANNULATION'
  | 'REFUS_ANNULATION';

export function formatCommandeStatusLabel(status: CommandeStatus | string): string {
  switch (status) {
    case 'EN_ATTENTE_PAIEMENT':
    case 'ATTENTE_PAIEMENT':
    case 'EN_COURS':
      return 'En attente de paiement';
    case 'PAYEE_NON_SERVIE':
    case 'PRET_A_LIVRER':
      return 'Payée non servie';
    case 'SERVIE':
      return 'Servie';
    case 'REMISE_LIVREUR':
    case 'EN_LIVRAISON':
      return 'Remise au livreur';
    case 'PAYEE_LIVREE_CLOTUREE':
    case 'LIVREE':
    case 'PAYEE':
      return 'Payée livrée et clôturée';
    case 'ANNULEE':
      return 'Annulée';
    case 'DEMANDE_ANNULATION':
      return 'Demande d\'annulation';
    case 'REFUS_ANNULATION':
      return 'Refus d\'annulation';
    default:
      return status;
  }
}

export function getCommandeStatusBadgeClass(status: CommandeStatus | string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (status) {
    case 'EN_ATTENTE_PAIEMENT':
    case 'ATTENTE_PAIEMENT':
    case 'EN_COURS':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'PAYEE_NON_SERVIE':
    case 'PRET_A_LIVRER':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    case 'SERVIE':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'REMISE_LIVREUR':
    case 'EN_LIVRAISON':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    case 'PAYEE_LIVREE_CLOTUREE':
    case 'LIVREE':
    case 'PAYEE':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        badge: 'bg-slate-200 text-slate-800 border-slate-300',
      };
    case 'ANNULEE':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-800 border-gray-300',
      };
  }
}

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
  restaurantId?: string; // ID du restaurant propriétaire de la commande
  clientId: string; // linked to a client
  clientName?: string; // Cache or sync client name for online tracking
  clientPhone?: string; // Cache or sync client phone for online tracking
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
  payments?: Paiement[]; // Embedded payment records synchronized
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
