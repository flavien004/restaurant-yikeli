import { z } from 'zod';

/**
 * Sans-Injection Sanitizer for clean inputs.
 * Removes HTML tags (<...>), script injection keyword traces, and trims excess whitespaces.
 */
export const sanitizeString = (val: string): string => {
  if (!val) return '';
  return val
    .replace(/<[^>]*>/gi, '') // Strips general HTML/XML tags
    .replace(/javascript:/gi, '') // Removes pseudo-protocols
    .replace(/on\w+\s*=/gi, '') // Removes event handlers like onload, onclick, onerror
    .trim();
};

// --- Pattern Helper for Phone Numbers (Ivory Coast & International) ---
// Accepts formats like +225 07 12 34 56 78, 0588223412 or 01-02-03-04-05
export const phonePattern = z
  .string()
  .transform(sanitizeString)
  .refine(
    (val) => {
      const clean = val.replace(/[\s\-\+\(\)]/g, '');
      return clean.length >= 8 && clean.length <= 15 && /^\d+$/.test(clean);
    },
    {
      message: 'Numéro de téléphone invalide (doit contenir entre 8 et 15 chiffres).',
    }
  );

// --- Custom Zod String for Clean Text Inputs ---
export const safeString = (minLength = 1, maxLength = 500) =>
  z
    .string()
    .transform(sanitizeString)
    .refine((val) => val.length >= minLength, {
      message: `Ce champ obligatoire doit contenir au moins ${minLength} caractère(s).`,
    })
    .refine((val) => val.length <= maxLength, {
      message: `Ce champ ne doit pas dépasser ${maxLength} caractères.`,
    });

// ----------------------------------------------------
// 1. Commande Validation Schema (Order Submission)
// ----------------------------------------------------
export const CommandeItemSchema = z.object({
  platId: z.string().min(1, 'L\'identifiant du plat est requis.'),
  quantity: z.number().int().min(1, 'La quantité minimale est de 1 portion.').max(100, 'La quantité maximale autorisée est de 100 portions.'),
});

export const CommandeValidationSchema = z.object({
  clientName: safeString(2, 60),
  clientPhone: phonePattern,
  items: z.array(CommandeItemSchema).min(1, 'Le panier ne peut pas être vide.'),
  type: z.enum(['SUR_PLACE', 'EN_LIGNE']),
  employeeId: z.string().optional().nullable(),
  comment: z.string().transform(sanitizeString).optional().nullable(),
  paymentMethod: z.string().transform(sanitizeString).optional().nullable(),
  tableNumber: z
    .number()
    .int()
    .min(1, 'Le numéro de table doit être compris entre 1 et 20.')
    .max(20, 'Le numéro de table doit être compris entre 1 et 20.')
    .optional()
    .nullable(),
});

// ----------------------------------------------------
// 2. Feedback Validation Schema
// ----------------------------------------------------
export const FeedbackValidationSchema = z.object({
  repas: z.number().int().min(1).max(5, 'La note du repas doit être entre 1 et 5.'),
  delai: z.number().int().min(1).max(5, 'La note du délai d\'attente doit être entre 1 et 5.'),
  courtoisie: z.number().int().min(1).max(5, 'La note de courtoisie doit être entre 1 et 5.'),
  comment: z.string().transform(sanitizeString).optional(),
});

// ----------------------------------------------------
// 3. Plat Validation Schema (Menu Dishes)
// ----------------------------------------------------
export const PlatValidationSchema = z.object({
  name: safeString(2, 100),
  price: z.number().min(0, 'Le prix du plat ne peut pas être négatif.').max(100000, 'Le prix maximal autorisé est de 100 000 FCFA.'),
  category: safeString(2, 50),
  isStocked: z.boolean().optional(),
  stock: z.number().nonnegative('Le stock ne peut pas être négatif.').optional().nullable(),
  lowStockAlert: z.number().nonnegative('L\'alerte de stock ne peut pas être négative.').optional().nullable(),
  expirationDelay: z.string().transform(sanitizeString).optional().nullable(),
  image: z.string().transform(sanitizeString).optional().nullable(),
  buyingCost: z.number().nonnegative('Le coût d\'achat ne peut pas être négatif.').optional().nullable(),
});

// ----------------------------------------------------
// 4. Employee/User Validation Schema
// ----------------------------------------------------
export const EmployeeValidationSchema = z.object({
  name: safeString(2, 80),
  phone: phonePattern,
  email: z.string().email('Format d\'adresse email invalide.').transform(sanitizeString),
  poste: z.string().transform(sanitizeString).optional().nullable(),
  dateEmbauche: z.string().transform(sanitizeString).optional().nullable(),
  dateFinContrat: z.string().transform(sanitizeString).optional().nullable(),
  username: z
    .string()
    .transform(sanitizeString)
    .refine((val) => val === '' || /^[a-z0-9_]{3,30}$/.test(val), {
      message: 'L\'identifiant doit être composé de 3 à 30 caractères minuscules, chiffres ou tirets du bas (_).',
    })
    .optional()
    .nullable(),
  password: z
    .string()
    .transform(sanitizeString)
    .refine((val) => val === '' || val.length >= 4, {
      message: 'Le mot de passe doit contenir au moins 4 caractères.',
    })
    .optional()
    .nullable(),
  salaireNet: z.number().nonnegative('Le salaire net ne peut pas être négatif.').optional().nullable(),
  isActive: z.boolean().optional(),
});

// ----------------------------------------------------
// 5. Supplier Validation Schema
// ----------------------------------------------------
export const SupplierValidationSchema = z.object({
  name: safeString(2, 100),
  phone: phonePattern,
  email: z
    .union([z.string().length(0), z.string().email('Format d\'adresse email invalide.')])
    .transform(sanitizeString)
    .optional()
    .nullable(),
  address: z.string().transform(sanitizeString).optional().nullable(),
});

// ----------------------------------------------------
// 6. Expense Validation Schema (Dépenses)
// ----------------------------------------------------
export const DepenseValidationSchema = z.object({
  category: safeString(1, 100),
  description: safeString(2, 300),
  amount: z.number().positive('Le montant de la dépense doit être strictement positif.').max(10000000, 'Le montant maximal autorisé est de 10 000 000 FCFA.'),
  date: z.string().transform(sanitizeString),
  submittedBy: z.string().transform(sanitizeString).optional().nullable(),
});

// ----------------------------------------------------
// 7. Stock Entry Validation Schema (Approvisionnement)
// ----------------------------------------------------
export const StockEntryValidationSchema = z.object({
  platId: z.string().min(1, 'L\'identifiant du plat est requis.'),
  quantity: z.number().int().positive('La quantité d\'approvisionnement doit être de 1 ou plus.'),
  comment: z.string().transform(sanitizeString).optional().nullable(),
  buyingPrice: z.number().nonnegative('Le prix d\'achat ne peut pas être négatif.').optional().nullable(),
  supplierId: z.string().transform(sanitizeString).optional().nullable(),
});

// ----------------------------------------------------
// Helper format error extractor
// ----------------------------------------------------
export const formatZodError = (err: z.ZodError): Record<string, string> => {
  const result: Record<string, string> = {};
  err.issues.forEach((e) => {
    const path = e.path.join('.');
    if (path) {
      result[path] = e.message;
    }
  });
  return result;
};
