import { useState, useEffect } from 'react';
import { Plat, User, Client, Commande, Paiement, Depense, CommandeItem, PaymentMethod, CommandeStatus, DepenseCategory, PlatCategory, StockEntry, Supplier } from './types';
import {
  INITIAL_PLATS,
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_DEPENSES,
  INITIAL_PLAT_IDS_DE_JOUR,
  INITIAL_COMMANDES,
  INITIAL_PAIEMENTS,
  INITIAL_STOCK_ENTRIES,
} from './mockData';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function useYikeliDb() {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [menuJour, setMenuJour] = useState<string[]>([]); // list of active plat IDs for today
  const [platCategories, setPlatCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [depenseCategories, setDepenseCategories] = useState<string[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    // 1. Plats
    const storedPlats = localStorage.getItem('yikeli_plats');
    if (storedPlats) {
      setPlats(JSON.parse(storedPlats));
    } else {
      localStorage.setItem('yikeli_plats', JSON.stringify(INITIAL_PLATS));
      setPlats(INITIAL_PLATS);
    }

    // 2. Users
    const storedUsers = localStorage.getItem('yikeli_users');
    if (storedUsers) {
      try {
        const parsed: User[] = JSON.parse(storedUsers);
        let migrated = false;
        const updated = parsed.map((u) => {
          const seed = INITIAL_USERS.find((su) => su.id === u.id);
          const nextUser = { ...u };
          if (!nextUser.username) {
            nextUser.username = seed?.username || u.name.toLowerCase().replace(/\s+/g, '');
            migrated = true;
          }
          if (!nextUser.password) {
            nextUser.password = seed?.password || '12345';
            migrated = true;
          }
          return nextUser;
        });
        
        if (migrated) {
          localStorage.setItem('yikeli_users', JSON.stringify(updated));
          setUsers(updated);
        } else {
          setUsers(parsed);
        }
      } catch (e) {
        localStorage.setItem('yikeli_users', JSON.stringify(INITIAL_USERS));
        setUsers(INITIAL_USERS);
      }
    } else {
      localStorage.setItem('yikeli_users', JSON.stringify(INITIAL_USERS));
      setUsers(INITIAL_USERS);
    }

    // 3. Clients
    const storedClients = localStorage.getItem('yikeli_clients');
    if (storedClients) {
      setClients(JSON.parse(storedClients));
    } else {
      localStorage.setItem('yikeli_clients', JSON.stringify(INITIAL_CLIENTS));
      setClients(INITIAL_CLIENTS);
    }

    // 4. Commandes
    const storedCommandes = localStorage.getItem('yikeli_commandes');
    if (storedCommandes) {
      setCommandes(JSON.parse(storedCommandes));
    } else {
      localStorage.setItem('yikeli_commandes', JSON.stringify(INITIAL_COMMANDES));
      setCommandes(INITIAL_COMMANDES);
    }

    // 5. Paiements
    const storedPaiements = localStorage.getItem('yikeli_paiements');
    if (storedPaiements) {
      setPaiements(JSON.parse(storedPaiements));
    } else {
      localStorage.setItem('yikeli_paiements', JSON.stringify(INITIAL_PAIEMENTS));
      setPaiements(INITIAL_PAIEMENTS);
    }

    // 6. Depenses
    const storedDepenses = localStorage.getItem('yikeli_depenses');
    if (storedDepenses) {
      setDepenses(JSON.parse(storedDepenses));
    } else {
      localStorage.setItem('yikeli_depenses', JSON.stringify(INITIAL_DEPENSES));
      setDepenses(INITIAL_DEPENSES);
    }

    // 7. Menu du Jour (Active Plat IDs)
    const storedMenuJour = localStorage.getItem('yikeli_menujour');
    if (storedMenuJour) {
      setMenuJour(JSON.parse(storedMenuJour));
    } else {
      localStorage.setItem('yikeli_menujour', JSON.stringify(INITIAL_PLAT_IDS_DE_JOUR));
      setMenuJour(INITIAL_PLAT_IDS_DE_JOUR);
    }

    // 8. Categories
    const storedPlatCat = localStorage.getItem('yikeli_plat_categories');
    if (storedPlatCat) {
      setPlatCategories(JSON.parse(storedPlatCat));
    } else {
      const initial = ['PLATS_IVOIRIENS', 'BOISSONS'];
      localStorage.setItem('yikeli_plat_categories', JSON.stringify(initial));
      setPlatCategories(initial);
    }

    const storedPayMethods = localStorage.getItem('yikeli_payment_methods');
    if (storedPayMethods) {
      setPaymentMethods(JSON.parse(storedPayMethods));
    } else {
      const initial = ['ESPECE', 'WAVE', 'ORANGE_MONEY', 'DJAMO'];
      localStorage.setItem('yikeli_payment_methods', JSON.stringify(initial));
      setPaymentMethods(initial);
    }

    const storedDepenseCat = localStorage.getItem('yikeli_depense_categories');
    if (storedDepenseCat) {
      setDepenseCategories(JSON.parse(storedDepenseCat));
    } else {
      const initial = ['Loyer', 'Factures', 'Provisions', 'Transport', 'Livraison', 'Taxes', 'Salaires', 'Réparations', 'Autre'];
      localStorage.setItem('yikeli_depense_categories', JSON.stringify(initial));
      setDepenseCategories(initial);
    }

    // 9. Stock entries
    const storedStockEntries = localStorage.getItem('yikeli_stock_entries');
    if (storedStockEntries) {
      setStockEntries(JSON.parse(storedStockEntries));
    } else {
      localStorage.setItem('yikeli_stock_entries', JSON.stringify(INITIAL_STOCK_ENTRIES));
      setStockEntries(INITIAL_STOCK_ENTRIES);
    }

    // 10. Suppliers (Fournisseurs)
    const storedSuppliers = localStorage.getItem('yikeli_suppliers');
    if (storedSuppliers) {
      setSuppliers(JSON.parse(storedSuppliers));
    } else {
      const initialSuppliers: Supplier[] = [
        { id: 'sup-1', name: 'Marché de Cocody - Grossiste Viande', phone: '+225 07 12 34 56 78', address: 'Cocody, Abidjan', createdAt: '2026-05-10T11:00:00Z' },
        { id: 'sup-2', name: 'Alimentation Générale Djorogobité', phone: '+225 05 88 22 34 12', address: 'Abatta Carrefour Sodepalm', createdAt: '2026-05-11T14:30:00Z' },
        { id: 'sup-3', name: 'Sococe Abidjan - Boissons S.A.', phone: '+225 01 01 56 78 99', address: 'Boulevard de Marseille', createdAt: '2026-05-11T16:00:00Z' }
      ];
      localStorage.setItem('yikeli_suppliers', JSON.stringify(initialSuppliers));
      setSuppliers(initialSuppliers);
    }
  }, []);

  // Dynamic cross-tab state synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (e.key === 'yikeli_plats') {
          setPlats(parsed);
        } else if (e.key === 'yikeli_users') {
          setUsers(parsed);
        } else if (e.key === 'yikeli_clients') {
          setClients(parsed);
        } else if (e.key === 'yikeli_commandes') {
          setCommandes(parsed);
        } else if (e.key === 'yikeli_paiements') {
          setPaiements(parsed);
        } else if (e.key === 'yikeli_depenses') {
          setDepenses(parsed);
        } else if (e.key === 'yikeli_menujour') {
          setMenuJour(parsed);
        } else if (e.key === 'yikeli_plat_categories') {
          setPlatCategories(parsed);
        } else if (e.key === 'yikeli_payment_methods') {
          setPaymentMethods(parsed);
        } else if (e.key === 'yikeli_depense_categories') {
          setDepenseCategories(parsed);
        } else if (e.key === 'yikeli_stock_entries') {
          setStockEntries(parsed);
        } else if (e.key === 'yikeli_suppliers') {
          setSuppliers(parsed);
        }
      } catch (err) {
        console.error('Error synchronizing cross-tab data:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper helper helpers
  const saveAndSetPlatCategories = (newCats: string[]) => {
    localStorage.setItem('yikeli_plat_categories', JSON.stringify(newCats));
    setPlatCategories(newCats);
  };

  const saveAndSetPaymentMethods = (newMethods: string[]) => {
    localStorage.setItem('yikeli_payment_methods', JSON.stringify(newMethods));
    setPaymentMethods(newMethods);
  };

  const saveAndSetDepenseCategories = (newCats: string[]) => {
    localStorage.setItem('yikeli_depense_categories', JSON.stringify(newCats));
    setDepenseCategories(newCats);
  };

  const saveAndSetStockEntries = (newEntries: StockEntry[]) => {
    localStorage.setItem('yikeli_stock_entries', JSON.stringify(newEntries));
    setStockEntries(newEntries);
  };

  const saveAndSetSuppliers = (newSups: Supplier[]) => {
    localStorage.setItem('yikeli_suppliers', JSON.stringify(newSups));
    setSuppliers(newSups);
  };

  const createSupplier = (name: string, phone: string, email?: string, address?: string) => {
    const newSup: Supplier = {
      id: 'sup-' + generateUUID(),
      name,
      phone,
      email,
      address,
      createdAt: new Date().toISOString()
    };
    const updated = [...suppliers, newSup];
    saveAndSetSuppliers(updated);
    return newSup;
  };

  const updateSupplier = (id: string, name: string, phone: string, email?: string, address?: string) => {
    const updated = suppliers.map((s) =>
      s.id === id ? { ...s, name, phone, email, address } : s
    );
    saveAndSetSuppliers(updated);
  };

  const deleteSupplier = (id: string) => {
    const updated = suppliers.filter((s) => s.id !== id);
    saveAndSetSuppliers(updated);
  };

  const addPlatCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!platCategories.includes(trimmed)) {
      const updated = [...platCategories, trimmed];
      saveAndSetPlatCategories(updated);
    }
  };

  const addPaymentMethod = (methodName: string) => {
    const trimmed = methodName.trim().toUpperCase();
    if (!trimmed) return;
    if (!paymentMethods.includes(trimmed)) {
      const updated = [...paymentMethods, trimmed];
      saveAndSetPaymentMethods(updated);
    }
  };

  const addDepenseCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!depenseCategories.includes(trimmed)) {
      const updated = [...depenseCategories, trimmed];
      saveAndSetDepenseCategories(updated);
    }
  };

  // Helper helper helpers
  const saveAndSetPlats = (newPlats: Plat[]) => {
    localStorage.setItem('yikeli_plats', JSON.stringify(newPlats));
    setPlats(newPlats);
  };

  const saveAndSetUsers = (newUsers: User[]) => {
    localStorage.setItem('yikeli_users', JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const saveAndSetClients = (newClients: Client[]) => {
    localStorage.setItem('yikeli_clients', JSON.stringify(newClients));
    setClients(newClients);
  };

  const saveAndSetCommandes = (newCommandes: Commande[]) => {
    localStorage.setItem('yikeli_commandes', JSON.stringify(newCommandes));
    setCommandes(newCommandes);
  };

  const saveAndSetPaiements = (newPaiements: Paiement[]) => {
    localStorage.setItem('yikeli_paiements', JSON.stringify(newPaiements));
    setPaiements(newPaiements);
  };

  const saveAndSetDepenses = (newDepenses: Depense[]) => {
    localStorage.setItem('yikeli_depenses', JSON.stringify(newDepenses));
    setDepenses(newDepenses);
  };

  const saveAndSetMenuJour = (newMenu: string[]) => {
    localStorage.setItem('yikeli_menujour', JSON.stringify(newMenu));
    setMenuJour(newMenu);
  };

  // --- CRUD Operations ---

  // 1. Plats du Menu
  const createPlat = (
    name: string,
    price: number,
    category: PlatCategory,
    isStocked?: boolean,
    stock?: number,
    lowStockAlert?: number,
    expirationDelay?: string,
    image?: string,
    buyingCost?: number
  ) => {
    const finalStock = isStocked ? (stock ?? 0) : undefined;
    const newPlat: Plat = {
      id: 'plat-' + generateUUID(),
      name,
      price,
      category,
      isActive: true,
      isStocked: isStocked ?? false,
      stock: finalStock,
      lowStockAlert,
      expirationDelay,
      image: image || '',
      buyingCost: buyingCost ? Number(buyingCost) : undefined
    };
    const updated = [...plats, newPlat];
    saveAndSetPlats(updated);

    // Create automatic stock entry for the initial stock amount so history perfectly balances!
    if (isStocked && finalStock && finalStock > 0) {
      const autoEntry: StockEntry = {
        id: 'se-' + generateUUID(),
        platId: newPlat.id,
        platName: newPlat.name,
        quantity: finalStock,
        date: new Date().toISOString(),
        comment: 'Ajustement initial de stock lors de la création',
        buyingPrice: buyingCost ? Number(buyingCost) : undefined
      };
      saveAndSetStockEntries([autoEntry, ...stockEntries]);
    }

    return newPlat;
  };

  const updatePlat = (
    id: string,
    name: string,
    price: number,
    category: PlatCategory,
    isActive: boolean,
    isStocked?: boolean,
    lowStockAlert?: number,
    expirationDelay?: string,
    image?: string,
    buyingCost?: number
  ) => {
    const updated = plats.map((p) =>
      p.id === id
        ? {
            ...p,
            name,
            price,
            category,
            isActive,
            isStocked: isStocked ?? p.isStocked,
            lowStockAlert: isStocked ? lowStockAlert : undefined,
            expirationDelay,
            image: image !== undefined ? image : p.image,
            buyingCost: buyingCost ? Number(buyingCost) : undefined,
            // stock direct edit is blocked - quantity only changes via stock entries!
          }
        : p
    );
    saveAndSetPlats(updated);

    // If a plat becomes inactive globally, ensure it is removed from the active menu du jour
    if (!isActive) {
      const filteredMenu = menuJour.filter((mId) => mId !== id);
      saveAndSetMenuJour(filteredMenu);
    }
  };

  const deletePlat = (id: string) => {
    const updated = plats.filter((p) => p.id !== id);
    saveAndSetPlats(updated);
    // clean menu jour too
    const filteredMenu = menuJour.filter((mId) => mId !== id);
    saveAndSetMenuJour(filteredMenu);
  };

  // Set selected plats for the daily menu
  const toggleMenuJourPlat = (platId: string) => {
    let newMenu: string[];
    if (menuJour.includes(platId)) {
      newMenu = menuJour.filter((id) => id !== platId);
    } else {
      newMenu = [...menuJour, platId];
    }
    saveAndSetMenuJour(newMenu);
  };

  // 2. Employees (Utilisateurs)
  const createEmployee = (
    name: string,
    phone: string,
    email: string,
    poste?: string,
    dateEmbauche?: string,
    dateFinContrat?: string,
    username?: string,
    password?: string,
    salaireNet?: number
  ) => {
    const newEmp: User = {
      id: 'user-' + generateUUID(),
      name,
      phone,
      email,
      role: 'EMPLOYE',
      isActive: true,
      createdAt: new Date().toISOString(),
      poste: poste || '',
      dateEmbauche: dateEmbauche || '',
      dateFinContrat: dateFinContrat || '',
      username: username || name.toLowerCase().replace(/\s+/g, ''),
      password: password || '12345',
      salaireNet: salaireNet !== undefined ? Number(salaireNet) : 0,
    };
    saveAndSetUsers([...users, newEmp]);
    return newEmp;
  };

  const updateEmployee = (
    id: string,
    name: string,
    phone: string,
    email: string,
    poste?: string,
    dateEmbauche?: string,
    dateFinContrat?: string,
    isActive?: boolean,
    username?: string,
    password?: string,
    salaireNet?: number
  ) => {
    const updated = users.map((u) =>
      u.id === id
        ? {
            ...u,
            name,
            phone,
            email,
            poste: poste !== undefined ? poste : u.poste,
            dateEmbauche: dateEmbauche !== undefined ? dateEmbauche : u.dateEmbauche,
            dateFinContrat: dateFinContrat !== undefined ? dateFinContrat : u.dateFinContrat,
            isActive: isActive !== undefined ? isActive : u.isActive,
            username: username !== undefined ? username : u.username,
            password: password !== undefined ? password : u.password,
            salaireNet: salaireNet !== undefined ? Number(salaireNet) : u.salaireNet,
          }
        : u
    );
    saveAndSetUsers(updated);
  };

  const toggleUserStatus = (id: string) => {
    const updated = users.map((u) =>
      u.id === id ? { ...u, isActive: !u.isActive } : u
    );
    saveAndSetUsers(updated);
  };

  const deleteUserLogically = (id: string) => {
    // Only delete non-admin accounts
    const updated = users.map((u) =>
      u.id === id && u.role !== 'ADMIN' ? { ...u, isActive: false } : u
    );
    saveAndSetUsers(updated);
  };

  const changeUserPassword = (
    id: string,
    newPassword: string
  ): { success: boolean; error?: string } => {
    if (!newPassword || newPassword.trim() === '') {
      return { success: false, error: '⚠️ Le mot de passe ne peut pas être vide.' };
    }
    const updated = users.map((u) =>
      u.id === id ? { ...u, password: newPassword.trim() } : u
    );
    saveAndSetUsers(updated);
    return { success: true };
  };

  // 3. Clients
  const getOrCreateClientByPhone = (name: string, phone: string) => {
    const normalizedPhone = phone.trim();
    const existing = clients.find((c) => c.phone === normalizedPhone);
    if (existing) {
      if (name && existing.name === '') {
        // Update name if it was empty
        const updated = clients.map((c) =>
          c.id === existing.id ? { ...c, name } : c
        );
        saveAndSetClients(updated);
        return { ...existing, name };
      }
      return existing;
    }

    const newClient: Client = {
      id: 'client-' + generateUUID(),
      name: name || `Client +225 ${normalizedPhone}`,
      phone: normalizedPhone,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    saveAndSetClients([...clients, newClient]);
    return newClient;
  };

  // helper to manually update spent
  const recalculateClientTotals = (cmds: Commande[], pays: Paiement[], cls: Client[]) => {
    return cls.map((c) => {
      // Get all orders of this client
      const clientCmds = cmds.filter((cmd) => cmd.clientId === c.id);
      // Sum of all validated payments for these orders
      let totalSpent = 0;
      clientCmds.forEach((cmd) => {
        const cmdPays = pays.filter((p) => p.commandeId === cmd.id);
        totalSpent += cmdPays.reduce((acc, p) => acc + p.amount, 0);
      });
      return { ...c, totalSpent };
    });
  };

  // 4. Commandes (Orders)
  const submitCommande = (
    clientName: string,
    clientPhone: string,
    items: { platId: string; quantity: number }[],
    type: 'SUR_PLACE' | 'EN_LIGNE',
    employeeId?: string,
    comment?: string,
    paymentMethod?: string,
    tableNumber?: number
  ) => {
    const client = getOrCreateClientByPhone(clientName, clientPhone);

    const commandeItems: CommandeItem[] = items.map((it) => {
      const originalPlat = plats.find((p) => p.id === it.platId);
      return {
        id: `ci-${generateUUID()}`,
        commandeId: '', // set in parent
        platId: it.platId,
        platName: originalPlat?.name || 'Plat inconnu',
        quantity: it.quantity,
        unitPrice: originalPlat?.price || 0,
      };
    });

    const total = commandeItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const commandeId = 'cmd-' + generateUUID();

    const finalizedItems = commandeItems.map((item) => ({ ...item, commandeId }));

    const newCmd: Commande = {
      id: commandeId,
      clientId: client.id,
      userId: employeeId,
      type,
      tableNumber,
      total,
      status: 'EN_COURS',
      createdAt: new Date().toISOString(),
      items: finalizedItems,
      comment: comment || '',
      paymentMethod,
    };

    // Deduct stock for stocked items when ordering
    const updatedPlats = plats.map((p) => {
      const orderItem = items.find((it) => it.platId === p.id);
      if (orderItem && p.isStocked && p.stock !== undefined) {
        const remainingStock = Math.max(0, p.stock - orderItem.quantity);
        return {
          ...p,
          stock: remainingStock,
        };
      }
      return p;
    });
    saveAndSetPlats(updatedPlats);

    const updatedCmds = [newCmd, ...commandes];
    saveAndSetCommandes(updatedCmds);

    return newCmd;
  };

  const updateCommandeStatus = (
    id: string,
    status: CommandeStatus,
    isAdmin = false,
    cancelReason?: string,
    userId?: string
  ): { success: boolean; error?: string } => {
    const cmd = commandes.find((c) => c.id === id);
    if (!cmd) return { success: false, error: 'Commande non trouvée.' };

    // Find registered payments
    const totalPaid = paiements
      .filter((p) => p.commandeId === id)
      .reduce((sum, p) => sum + p.amount, 0);

    // Rule 1: "Le client / ou le caissier pour une demande d'annulation ne peut demander remboursement sans avoir effectué de paiement au préalable."
    if (status === 'DEMANDE_ANNULATION' && totalPaid <= 0) {
      return {
        success: false,
        error: `⚠️ Règle de gestion : Impossible de soumettre une demande d'annulation et remboursement pour la commande "${id}" car aucun paiement n'a encore été enregistré pour celle-ci !`,
      };
    }

    // RULE: une fois la commande est au statut payée/cloturée, plus de modification ne doit être possible sauf avec le compte administrateur.
    // MODIFICATION RULE 1: Allow a cashier to put status as DEMANDE_ANNULATION even if already PAYEE, so they can request cancellation of paid orders!
    const isClosed = ['PAYEE', 'LIVREE', 'ANNULEE'].includes(cmd.status);
    if (isClosed && !isAdmin && status !== 'DEMANDE_ANNULATION') {
      return {
        success: false,
        error: `⚠️ Règle de caisse : La commande "${id}" est déjà payée, clôturée, ou annulée. Seul un gérant administrateur est autorisé à modifier une commande clôturée !`,
      };
    }

    // RULE SPECIFIQUE : Commande en cours d'examen pour annulation
    if (cmd.status === 'DEMANDE_ANNULATION' && !isAdmin && status !== 'DEMANDE_ANNULATION') {
      return {
        success: false,
        error: `⚠️ Commande suspendue : Cette commande fait l'objet d'une demande d'annulation par le client. Toute modification de son statut au niveau de la caisse ou de la cuisine est suspendue jusqu'à ce que la gérance (administrateur) ait statué sur la demande !`,
      };
    }

    // RULE: aucune commande en ligne ne doit être servie sans paiement préalable
    if (cmd.type === 'EN_LIGNE') {
      const isServedStatus = ['SERVIE', 'PRET_A_LIVRER', 'EN_LIVRAISON', 'LIVREE', 'PAYEE'].includes(status);
      if (isServedStatus) {
        const paidAmt = paiements
          .filter((p) => p.commandeId === id)
          .reduce((sum, p) => sum + p.amount, 0);

        if (paidAmt < cmd.total) {
          return {
            success: false,
            error: `⚠️ Règle de caisse : La commande en ligne "${id}" n'a pas été entièrement réglée (Seulement ${new Intl.NumberFormat('fr-FR').format(paidAmt)} FCFA payés sur un total de ${new Intl.NumberFormat('fr-FR').format(cmd.total)} FCFA). Veuillez enregistrer le paiement complet avant de la marquer comme servie ou de la livrer !`,
          };
        }
      }
    }

    const updated = commandes.map((c) =>
      c.id === id ? { 
        ...c, 
        status, 
        ...(cancelReason ? { cancelReason } : {}), 
        takenChargeAt: c.takenChargeAt || new Date().toISOString(),
        userId: userId || c.userId
      } : c
    );
    saveAndSetCommandes(updated);
    return { success: true };
  };

  const cancelAndRefundCommande = (
    commandeId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    const cmd = commandes.find((c) => c.id === commandeId);
    if (!cmd) return { success: false, error: 'Commande non trouvée.' };

    // Calculate total payments made for this order
    const paidAmt = paiements
      .filter((p) => p.commandeId === commandeId)
      .reduce((sum, p) => sum + p.amount, 0);

    // Mark status as ANNULEE and insert reason
    const updatedCmds = commandes.map((c) =>
      c.id === commandeId
        ? { ...c, status: 'ANNULEE' as CommandeStatus, cancelReason: reason }
        : c
    );
    saveAndSetCommandes(updatedCmds);

    // Keep payments in system but log an expense offset
    if (paidAmt > 0) {
      const refundDepense: Depense = {
        id: 'depense-' + generateUUID() + '-reimb',
        category: 'Remboursement client',
        description: `Remboursement de la commande ${commandeId}`,
        amount: paidAmt,
        date: new Date().toISOString().split('T')[0]
      };
      
      const newDepensesList = [refundDepense, ...depenses];
      saveAndSetDepenses(newDepensesList);
    }

    // Restock quantities
    const updatedPlats = plats.map((p) => {
      const orderItem = cmd.items.find((it) => it.platId === p.id);
      if (orderItem && p.isStocked && p.stock !== undefined) {
        return {
          ...p,
          stock: p.stock + orderItem.quantity,
        };
      }
      return p;
    });
    saveAndSetPlats(updatedPlats);

    // Recalculate client spent totals (cancelled orders are excluded in recalculateClientTotals)
    const updatedClients = recalculateClientTotals(updatedCmds, paiements, clients);
    saveAndSetClients(updatedClients);

    return { success: true };
  };

  const updateCommandeItems = (
    commandeId: string,
    newItems: { platId: string; quantity: number }[],
    isAdmin = false
  ): { success: boolean; error?: string } => {
    const cmd = commandes.find((c) => c.id === commandeId);
    if (!cmd) return { success: false, error: 'Commande non trouvée.' };

    const isClosed = ['PAYEE', 'ANNULEE'].includes(cmd.status);
    if (isClosed && !isAdmin) {
      return {
        success: false,
        error: `⚠️ Règle de caisse : La commande "${commandeId}" est déjà payée ou annulée. Impossible de la modifier !`,
      };
    }

    // Step 1: calculate difference in quantities per plat to check stock & adjust
    const diffQuantities: Record<string, number> = {};
    
    const oldItemsMap: Record<string, number> = {};
    cmd.items.forEach((it) => {
      oldItemsMap[it.platId] = (oldItemsMap[it.platId] || 0) + it.quantity;
    });

    const newItemsMap: Record<string, number> = {};
    newItems.forEach((it) => {
      newItemsMap[it.platId] = (newItemsMap[it.platId] || 0) + it.quantity;
    });

    const allPlatIds = new Set([...Object.keys(oldItemsMap), ...Object.keys(newItemsMap)]);

    for (const pid of allPlatIds) {
      const oldQty = oldItemsMap[pid] || 0;
      const newQty = newItemsMap[pid] || 0;
      diffQuantities[pid] = newQty - oldQty;
    }

    // Step 2: verify stock constraints
    for (const pid of Object.keys(diffQuantities)) {
      const diff = diffQuantities[pid];
      if (diff > 0) {
        const plat = plats.find((p) => p.id === pid);
        if (plat && plat.isStocked && plat.stock !== undefined) {
          if (plat.stock < diff) {
            return {
              success: false,
              error: `⚠️ Stock insuffisant pour le plat "${plat.name}". Stock disponible: ${plat.stock}, demandé: ${diff} portions supplémentaires.`,
            };
          }
        }
      }
    }

    // Step 3: adjust stock
    const updatedPlats = plats.map((p) => {
      const diff = diffQuantities[p.id] || 0;
      if (diff !== 0 && p.isStocked && p.stock !== undefined) {
        return {
          ...p,
          stock: Math.max(0, p.stock - diff),
        };
      }
      return p;
    });

    // Step 4: build custom CommandeItem entities
    const updatedItems: CommandeItem[] = [];
    newItems.forEach((it) => {
      if (it.quantity <= 0) return;
      const originalPlat = plats.find((p) => p.id === it.platId);
      const existingItem = cmd.items.find((oldIt) => oldIt.platId === it.platId);
      updatedItems.push({
        id: existingItem?.id || `ci-${generateUUID()}`,
        commandeId: cmd.id,
        platId: it.platId,
        platName: originalPlat?.name || 'Plat inconnu',
        quantity: it.quantity,
        unitPrice: originalPlat?.price || 0,
      });
    });

    // Step 5: update total
    const total = updatedItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    const updatedCmds = commandes.map((c) =>
      c.id === commandeId
        ? {
            ...c,
            items: updatedItems,
            total,
          }
        : c
    );

    saveAndSetPlats(updatedPlats);
    saveAndSetCommandes(updatedCmds);

    const recalculateClients = recalculateClientTotals(updatedCmds, paiements, clients);
    saveAndSetClients(recalculateClients);

    return { success: true };
  };

  const refuseCancellationRequest = (
    commandeId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    const cmd = commandes.find((c) => c.id === commandeId);
    if (!cmd) return { success: false, error: 'Commande non trouvée.' };

    const updatedCmds = commandes.map((c) =>
      c.id === commandeId
        ? { ...c, status: 'REFUS_ANNULATION' as CommandeStatus, refusalReason: reason }
        : c
    );
    saveAndSetCommandes(updatedCmds);
    return { success: true };
  };

  const cloturerDemandeAnnulation = (
    commandeId: string
  ): { success: boolean; error?: string } => {
    const cmd = commandes.find((c) => c.id === commandeId);
    if (!cmd) return { success: false, error: 'Commande non trouvée.' };

    const updatedCmds = commandes.map((c) =>
      c.id === commandeId
        ? { ...c, status: 'LIVREE' as CommandeStatus }
        : c
    );
    saveAndSetCommandes(updatedCmds);
    return { success: true };
  };

  const generateHistoricalData = () => {
    const newDepenses: Depense[] = [];
    const newCommandes: Commande[] = [];
    const newPaiements: Paiement[] = [];

    const months = [
      { year: 2026, month: 0, prefix: 'jan', days: 31, avgDailySales: 22000 },
      { year: 2026, month: 1, prefix: 'feb', days: 28, avgDailySales: 24000 },
      { year: 2026, month: 2, prefix: 'mar', days: 31, avgDailySales: 27500 },
      { year: 2026, month: 3, prefix: 'apr', days: 30, avgDailySales: 31000 },
    ];

    const menuPlats = plats.filter(p => p.isActive);

    months.forEach((m) => {
      const monthStr = String(m.month + 1).padStart(2, '0');
      
      newDepenses.push({
        id: `dep-hist-${m.prefix}-loyer`,
        category: 'Loyer',
        description: `Loyer local Yikéli - Mois ${monthStr}`,
        amount: 150000,
        date: `2026-${monthStr}-01`
      });

      newDepenses.push({
        id: `dep-hist-${m.prefix}-cie`,
        category: 'Factures',
        description: `Facture CIE Électricité - Mois ${monthStr}`,
        amount: Math.floor(30000 + Math.random() * 8000),
        date: `2026-${monthStr}-05`
      });

      newDepenses.push({
        id: `dep-hist-${m.prefix}-sodeci`,
        category: 'Factures',
        description: `Facture SODECI Eau - Mois ${monthStr}`,
        amount: Math.floor(10000 + Math.random() * 4000),
        date: `2026-${monthStr}-06`
      });

      newDepenses.push({
        id: `dep-hist-${m.prefix}-salaires`,
        category: 'Salaires',
        description: `Salaires nets du personnel - Mois ${monthStr}`,
        amount: 320000,
        date: `2026-${monthStr}-28`
      });

      newDepenses.push({
        id: `dep-hist-${m.prefix}-taxe`,
        category: 'Taxes',
        description: `Impôt synthétique & taxes communales - Mois ${monthStr}`,
        amount: 15000,
        date: `2026-${monthStr}-10`
      });

      newDepenses.push({
        id: `dep-hist-${m.prefix}-maint`,
        category: 'Réparations',
        description: `Entretien ustensiles & maintenance de la salle`,
        amount: Math.floor(12000 + Math.random() * 10000),
        date: `2026-${monthStr}-18`
      });

      for (let w = 1; w <= 4; w++) {
        const dayProv = w * 7 - 3;
        newDepenses.push({
          id: `dep-hist-${m.prefix}-prov-${w}`,
          category: 'Provisions',
          description: `Achat d'intrants (Poisson, Poulet, charbon, Alloco) Semaine ${w}`,
          amount: Math.floor(65000 + Math.random() * 15000),
          date: `2026-${monthStr}-${String(dayProv).padStart(2, '0')}`
        });

        const dayTrans = w * 7 - 1;
        newDepenses.push({
          id: `dep-hist-${m.prefix}-trans-${w}`,
          category: 'Transport',
          description: `Carburant approvisionnement Semaine ${w}`,
          amount: Math.floor(10000 + Math.random() * 5000),
          date: `2026-${monthStr}-${String(dayTrans).padStart(2, '0')}`
        });
      }

      for (let day = 1; day <= m.days; day++) {
        const dateObj = new Date(2026, m.month, day);
        if (dateObj.getDay() === 1) continue;

        const dailySalesTarget = Math.floor(m.avgDailySales * (0.8 + Math.random() * 0.4));
        const numOrders = Math.floor(3 + Math.random() * 4);

        let residualSales = dailySalesTarget;
        for (let o = 1; o <= numOrders; o++) {
          const orderAmt = o === numOrders ? residualSales : Math.floor((dailySalesTarget / numOrders) * (0.7 + Math.random() * 0.6));
          if (orderAmt < 1000) continue;
          residualSales -= orderAmt;

          const cmdId = `cmd-hist-${m.prefix}-${day}-${o}`;
          const chosenPlat = menuPlats[Math.floor(Math.random() * menuPlats.length)] || plats[0];
          const qty = Math.max(1, Math.floor(orderAmt / chosenPlat.price));
          const actualTotal = qty * chosenPlat.price;

          const randomizedClient = clients[Math.floor(Math.random() * clients.length)] || clients[0];

          const histCmd: Commande = {
            id: cmdId,
            clientId: randomizedClient.id,
            userId: 'u1',
            type: Math.random() > 0.3 ? 'SUR_PLACE' : 'EN_LIGNE',
            total: actualTotal,
            status: 'PAYEE',
            createdAt: `2026-${monthStr}-${String(day).padStart(2, '0')}T13:00:00Z`,
            items: [{
              id: `ci-hist-${cmdId}`,
              commandeId: cmdId,
              platId: chosenPlat.id,
              platName: chosenPlat.name,
              quantity: qty,
              unitPrice: chosenPlat.price
            }]
          };

          const histPay: Paiement = {
            id: `pay-hist-${cmdId}`,
            commandeId: cmdId,
            method: Math.random() > 0.4 ? 'WAVE' : (Math.random() > 0.5 ? 'ESPECE' : 'ORANGE_MONEY'),
            amount: actualTotal,
            createdAt: `2026-${monthStr}-${String(day).padStart(2, '0')}T13:05:00Z`,
            userId: 'u1'
          };

          newCommandes.push(histCmd);
          newPaiements.push(histPay);
        }
      }
    });

    const mergedDepenses = [...depenses.filter(d => !d.id.startsWith('dep-hist-')), ...newDepenses];
    const mergedCommandes = [...commandes.filter(c => !c.id.startsWith('cmd-hist-')), ...newCommandes];
    const mergedPaiements = [...paiements.filter(p => !p.id.startsWith('pay-hist-')), ...newPaiements];

    saveAndSetDepenses(mergedDepenses);
    saveAndSetCommandes(mergedCommandes);
    saveAndSetPaiements(mergedPaiements);

    return { success: true, countDepenses: newDepenses.length, countCommandes: newCommandes.length };
  };

  // 5. Paiements (Payments)
  const registerPaiement = (commandeId: string, method: PaymentMethod, amount: number, userId?: string) => {
    let currentCmds = commandes;
    let order = currentCmds.find((c) => c.id === commandeId);

    // Fallback: if not found in current state (due to React asynchronous serialization/updates), load directly from localStorage
    if (!order) {
      const stored = localStorage.getItem('yikeli_commandes');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Commande[];
          currentCmds = parsed;
          order = parsed.find((c) => c.id === commandeId);
        } catch (e) {
          console.error('Error reading orders from localStorage inside registerPaiement sync:', e);
        }
      }
    }

    if (!order) return null;

    // RULE SPECIFIQUE : Commande en cours d'examen pour annulation
    if (order.status === 'DEMANDE_ANNULATION') {
      console.warn('Cannot register payment on a command pending cancellation');
      return null;
    }

    // RULE: aucune commande ne doit avoir de solde payé supérieur au montant total de la commande
    const currentPaid = paiements
      .filter((p) => p.commandeId === commandeId)
      .reduce((acc, p) => acc + p.amount, 0);

    const remaining = order.total - currentPaid;
    if (remaining <= 0) {
      // already fully paid, prevent double payment
      return null;
    }

    // Clamp payment in case it slightly exceeds remaining due to UI entry or rounding
    const finalAmount = Math.min(amount, remaining);

    const newPay: Paiement = {
      id: 'pay-' + generateUUID(),
      commandeId,
      method,
      amount: finalAmount,
      createdAt: new Date().toISOString(),
      userId,
    };

    const updatedPaiements = [...paiements, newPay];
    saveAndSetPaiements(updatedPaiements);

    // Business rule: Verify if the cumulative payments total >= the order total.
    // If so, status changes to PAYEE for standard walk-in orders.
    // For online client orders (EN_LIGNE), we preserve their culinary prep stages (EN_COURS, PRET_A_LIVRER, etc.) managed by staff.
    const allOrderPays = updatedPaiements.filter((p) => p.commandeId === commandeId);
    const totalPaid = allOrderPays.reduce((acc, p) => acc + p.amount, 0);

    const updatedCmds = currentCmds.map((cmd) => {
      if (cmd.id === commandeId) {
        let newStatus: CommandeStatus = cmd.status;
        if (cmd.type !== 'EN_LIGNE') {
          if (totalPaid >= cmd.total) {
            newStatus = 'PAYEE';
          } else if (cmd.status === 'EN_COURS') {
            // If a payment was added on site, maybe it has progressed or was served
            newStatus = 'SERVIE';
          }
        }
        return { 
          ...cmd, 
          status: newStatus,
          takenChargeAt: cmd.takenChargeAt || new Date().toISOString(),
          userId: cmd.userId || userId
        };
      }
      return cmd;
    });

    saveAndSetCommandes(updatedCmds);

    // Recalculate client spent totals
    const updatedClients = recalculateClientTotals(updatedCmds, updatedPaiements, clients);
    saveAndSetClients(updatedClients);

    return newPay;
  };

  // Submit client feedback and update cashier and cook points
  const submitCommandeFeedback = (
    commandeId: string,
    feedback: { repas: number; delai: number; courtoisie: number; comment?: string }
  ) => {
    // 1. Save feedback to order
    const updatedCmds = commandes.map((c) => {
      if (c.id === commandeId) {
        return {
          ...c,
          feedback: {
            ...feedback,
            createdAt: new Date().toISOString()
          }
        };
      }
      return c;
    });
    saveAndSetCommandes(updatedCmds);

    // 2. Identify the cashier and cooks and assign points
    const targetCmd = commandes.find((c) => c.id === commandeId);
    const cashierId = targetCmd?.userId || paiements.find(p => p.commandeId === commandeId)?.userId;
    
    // Cashier is evaluated on: délai de prise en charge et courtoisie
    // Note is between 1 and 5. Average < 5 -> -1 point, Average === 5 -> +2 points
    const cashierAvg = (feedback.delai + feedback.courtoisie) / 2;
    const isCashierSatisfied = cashierAvg >= 4.5; // equivalent to both 5s or close
    const cashierPointsDiff = isCashierSatisfied ? 2 : -1;

    // Cook is evaluated on: repas
    // Note < 5 -> -1 point, Note === 5 -> +2 points
    const isCookSatisfied = feedback.repas >= 4.5;
    const cookPointsDiff = isCookSatisfied ? 2 : -1;

    const updatedUsers = users.map((u) => {
      let pts = u.points !== undefined ? u.points : 0;
      let modified = false;

      if (cashierId && u.id === cashierId) {
        pts += cashierPointsDiff;
        modified = true;
      }

      if (u.poste && u.poste.toLowerCase().includes('cuisin')) {
        pts += cookPointsDiff;
        modified = true;
      }

      if (modified) {
        return { ...u, points: pts };
      }
      return u;
    });
    saveAndSetUsers(updatedUsers);
  };

  // 6. Expenses (Dépenses)
  const addDepense = (category: DepenseCategory, description: string, amount: number, date: string) => {
    const newDep: Depense = {
      id: 'depense-' + generateUUID(),
      category,
      description,
      amount,
      date: date || new Date().toISOString().substring(0, 10),
    };
    saveAndSetDepenses([newDep, ...depenses]);
    return newDep;
  };

  const updateDepense = (id: string, category: DepenseCategory, description: string, amount: number, date: string) => {
    const updated = depenses.map((d) =>
      d.id === id ? { ...d, category, description, amount, date } : d
    );
    saveAndSetDepenses(updated);
  };

  const deleteDepense = (id: string) => {
    const updated = depenses.filter((d) => d.id !== id);
    saveAndSetDepenses(updated);
  };

  // 6.5 Stock entry logging
  const addStockEntry = (
    platId: string,
    quantity: number,
    comment?: string,
    customDate?: string,
    buyingPrice?: number,
    supplierId?: string
  ) => {
    const plat = plats.find((p) => p.id === platId);
    if (!plat) return null;

    const supplier = suppliers.find((s) => s.id === supplierId);

    const newEntry: StockEntry = {
      id: 'se-' + generateUUID(),
      platId,
      platName: plat.name,
      quantity,
      date: customDate || new Date().toISOString(),
      comment: comment || 'Entrée en stock manuelle',
      buyingPrice: buyingPrice !== undefined ? Number(buyingPrice) : undefined,
      supplierId,
      supplierName: supplier?.name
    };

    const newEntries = [newEntry, ...stockEntries];
    saveAndSetStockEntries(newEntries);

    // Update real-time Plat quantity and buyingCost!
    const updatedPlats = plats.map((p) => {
      if (p.id === platId) {
        return {
          ...p,
          stock: (p.stock || 0) + quantity,
          buyingCost: buyingPrice !== undefined ? Number(buyingPrice) : p.buyingCost
        };
      }
      return p;
    });
    saveAndSetPlats(updatedPlats);

    // Update expenses dynamically for stock procurement!
    if (buyingPrice !== undefined) {
      const parsedCost = Number(buyingPrice);
      const totalCost = parsedCost * quantity;
      const autoDepense: Depense = {
        id: 'depense-' + generateUUID() + '-auto-stock',
        category: 'Provisions',
        description: `Approvisionnement ${plat.name} (Qté: ${quantity} x ${parsedCost} FCFA)${supplier ? ` chez FRS: ${supplier.name}` : ''}`,
        amount: totalCost,
        date: (customDate || new Date().toISOString()).split('T')[0]
      };
      saveAndSetDepenses([autoDepense, ...depenses]);
    }

    return newEntry;
  };

  const getStockAtDate = (platId: string, targetDateStr: string): number => {
    const plat = plats.find((p) => p.id === platId);
    if (!plat) return 0;
    if (!plat.isStocked) return 9999; // Non suivi

    const targetDate = new Date(targetDateStr);
    if (isNaN(targetDate.getTime())) return plat.stock || 0;

    // 1. Sum of all stock entries up to targetDate
    const entriesSum = stockEntries
      .filter((se) => se.platId === platId && new Date(se.date) <= targetDate)
      .reduce((sum, se) => sum + se.quantity, 0);

    // 2. Decreased by sales up to targetDate
    let soldSum = 0;
    commandes.forEach((cmd) => {
      const cmdDate = new Date(cmd.createdAt);
      if (cmdDate <= targetDate && cmd.status !== 'ANNULEE') {
        cmd.items.forEach((it) => {
          if (it.platId === platId) {
            soldSum += it.quantity;
          }
        });
      }
    });

    const calculated = entriesSum - soldSum;
    return calculated < 0 ? 0 : calculated;
  };

  // Reset to initial seeds if database is empty/messed up
  const resetDatabaseToDefault = () => {
    localStorage.clear();
    setPlats(INITIAL_PLATS);
    setUsers(INITIAL_USERS);
    setClients(INITIAL_CLIENTS);
    setCommandes(INITIAL_COMMANDES);
    setPaiements(INITIAL_PAIEMENTS);
    setDepenses(INITIAL_DEPENSES);
    setMenuJour(INITIAL_PLAT_IDS_DE_JOUR);
    
    const initialPlatCats = ['PLATS_IVOIRIENS', 'BOISSONS'];
    const initialPayMethods = ['ESPECE', 'WAVE', 'ORANGE_MONEY', 'DJAMO'];
    const initialDepenseCats = ['Loyer', 'Factures', 'Provisions', 'Transport', 'Livraison', 'Taxes', 'Salaires', 'Réparations', 'Autre'];
    const initialSuppliers: Supplier[] = [
      { id: 'sup-1', name: 'Marché de Cocody - Grossiste Viande', phone: '+225 07 12 34 56 78', address: 'Cocody, Abidjan', createdAt: '2026-05-10T11:00:00Z' },
      { id: 'sup-2', name: 'Alimentation Générale Djorogobité', phone: '+225 05 88 22 34 12', address: 'Abatta Carrefour Sodepalm', createdAt: '2026-05-11T14:30:00Z' },
      { id: 'sup-3', name: 'Sococe Abidjan - Boissons S.A.', phone: '+225 01 01 56 78 99', address: 'Boulevard de Marseille', createdAt: '2026-05-11T16:00:00Z' }
    ];
    
    setPlatCategories(initialPlatCats);
    setPaymentMethods(initialPayMethods);
    setDepenseCategories(initialDepenseCats);
    setStockEntries(INITIAL_STOCK_ENTRIES);
    setSuppliers(initialSuppliers);

    localStorage.setItem('yikeli_plats', JSON.stringify(INITIAL_PLATS));
    localStorage.setItem('yikeli_users', JSON.stringify(INITIAL_USERS));
    localStorage.setItem('yikeli_clients', JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem('yikeli_commandes', JSON.stringify(INITIAL_COMMANDES));
    localStorage.setItem('yikeli_paiements', JSON.stringify(INITIAL_PAIEMENTS));
    localStorage.setItem('yikeli_depenses', JSON.stringify(INITIAL_DEPENSES));
    localStorage.setItem('yikeli_menujour', JSON.stringify(INITIAL_PLAT_IDS_DE_JOUR));
    localStorage.setItem('yikeli_plat_categories', JSON.stringify(initialPlatCats));
    localStorage.setItem('yikeli_payment_methods', JSON.stringify(initialPayMethods));
    localStorage.setItem('yikeli_depense_categories', JSON.stringify(initialDepenseCats));
    localStorage.setItem('yikeli_stock_entries', JSON.stringify(INITIAL_STOCK_ENTRIES));
    localStorage.setItem('yikeli_suppliers', JSON.stringify(initialSuppliers));
  };

  const [lastBackupTime, setLastBackupTime] = useState<string>('');
  const [isBackupSuccess, setIsBackupSuccess] = useState<boolean>(false);

  // Auto-sauvegarde automatique périodique complète de tous les états (toutes les 15 secondes)
  useEffect(() => {
    if (plats.length === 0 && commandes.length === 0) return;

    const runPeriodicBackupState = () => {
      try {
        const fullDatabaseSnapshot = {
          plats,
          users,
          clients,
          commandes,
          paiements,
          depenses,
          menuJour,
          platCategories,
          paymentMethods,
          depenseCategories,
          stockEntries,
          backupAt: new Date().toISOString()
        };

        // Sauvegarde de secours principale
        localStorage.setItem('yikeli_full_backup_system', JSON.stringify(fullDatabaseSnapshot));

        // Sauvegardes de secours granulaires sous-jacentes
        localStorage.setItem('yikeli_plats_backup', JSON.stringify(plats));
        localStorage.setItem('yikeli_users_backup', JSON.stringify(users));
        localStorage.setItem('yikeli_clients_backup', JSON.stringify(clients));
        localStorage.setItem('yikeli_commandes_backup', JSON.stringify(commandes));
        localStorage.setItem('yikeli_paiements_backup', JSON.stringify(paiements));
        localStorage.setItem('yikeli_depenses_backup', JSON.stringify(depenses));
        localStorage.setItem('yikeli_menujour_backup', JSON.stringify(menuJour));
        localStorage.setItem('yikeli_stock_entries_backup', JSON.stringify(stockEntries));

        setLastBackupTime(new Date().toLocaleTimeString('fr-FR'));
        setIsBackupSuccess(true);
        setTimeout(() => setIsBackupSuccess(false), 3000);
      } catch (err) {
        console.error('Échec de la sauvegarde automatique périodique dans le localStorage:', err);
      }
    };

    const interval = setInterval(runPeriodicBackupState, 15000);
    return () => clearInterval(interval);
  }, [plats, users, clients, commandes, paiements, depenses, menuJour, platCategories, paymentMethods, depenseCategories, stockEntries]);

  // Manuel Backup Trigger
  const forceManualBackup = () => {
    try {
      const fullDatabaseSnapshot = {
        plats,
        users,
        clients,
        commandes,
        paiements,
        depenses,
        menuJour,
        platCategories,
        paymentMethods,
        depenseCategories,
        stockEntries,
        backupAt: new Date().toISOString()
      };
      localStorage.setItem('yikeli_full_backup_system', JSON.stringify(fullDatabaseSnapshot));
      setLastBackupTime(new Date().toLocaleTimeString('fr-FR'));
      setIsBackupSuccess(true);
      setTimeout(() => setIsBackupSuccess(false), 3000);
      return true;
    } catch (err) {
      console.error('Échec de la sauvegarde manuelle forcée:', err);
      return false;
    }
  };

  return {
    plats,
    users,
    clients,
    commandes,
    paiements,
    depenses,
    menuJour,
    platCategories,
    paymentMethods,
    depenseCategories,
    stockEntries,
    suppliers,
    // Operations
    createPlat,
    updatePlat,
    deletePlat,
    toggleMenuJourPlat,
    createEmployee,
    updateEmployee,
    changeUserPassword,
    toggleUserStatus,
    deleteUserLogically,
    submitCommande,
    updateCommandeStatus,
    updateCommandeItems,
    cancelAndRefundCommande,
    refuseCancellationRequest,
    cloturerDemandeAnnulation,
    generateHistoricalData,
    registerPaiement,
    submitCommandeFeedback,
    addDepense,
    updateDepense,
    deleteDepense,
    addPlatCategory,
    addPaymentMethod,
    addDepenseCategory,
    addStockEntry,
    getStockAtDate,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    resetDatabaseToDefault,
    lastBackupTime,
    isBackupSuccess,
    forceManualBackup,
  };
}
