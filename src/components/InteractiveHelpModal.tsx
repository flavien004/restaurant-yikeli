import React, { useState } from 'react';
import { X, HelpCircle, CheckCircle2, ArrowRight, BookOpen, Sparkles, Smartphone, ShieldCheck, ShoppingCart, MessageSquare, ListFilter, ClipboardCheck, DollarSign } from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
  interactiveDemo?: {
    question: string;
    options: {
      label: string;
      response: string;
    }[];
  };
}

interface InteractiveHelpModalProps {
  type: 'client' | 'caisse' | 'admin';
  onClose: () => void;
}

export default function InteractiveHelpModal({ type, onClose }: InteractiveHelpModalProps) {
  const [activeTopicId, setActiveTopicId] = useState<string>('');
  const [demoSelection, setDemoSelection] = useState<number | null>(null);

  // Define help topics based on the interface type
  const clientTopics: HelpTopic[] = [
    {
      id: 'cmd-process',
      title: 'Commander en Ligne',
      icon: <ShoppingCart className="w-4 h-4 text-orange-500" />,
      description: 'Voici comment passer votre commande rapidement en quelques clics.',
      steps: [
        {
          title: 'Sélectionner vos plats',
          description: 'Parcourez le menu du jour et cliquez sur le prix d\'un plat disponible pour l\'ajouter à votre panier.',
          tip: 'Vous pouvez modifier la quantité directement dans le récapitulatif du panier.'
        },
        {
          title: 'Renseigner vos coordonnées',
          description: 'Saisissez votre nom et votre numéro de téléphone (obligatoire pour valider l\'envoi vers notre cuisine).',
        },
        {
          title: 'Choisir le mode de service',
          description: 'Sélectionnez "À emporter / En livraison" ou spécifiez une "Table" sur place.',
          tip: 'Vous pouvez scanner directement le QR code présent sur votre table pour l\'assigner à votre commande !'
        },
        {
          title: 'Valider et notifier via WhatsApp',
          description: 'Cliquez sur le bouton de soumission. Votre commande sera enregistrée et vous serez redirigé pour envoyer un résumé rapide sur WhatsApp.',
        }
      ],
      interactiveDemo: {
        question: "Que préférez-vous faire si vous êtes installé en salle ?",
        options: [
          {
            label: "Scanner le QR Code de ma table",
            response: "Excellent choix ! Le numéro de votre table est instantanément lié au panier. Vos plats seront servis directement à votre place sans risque d'erreur."
          },
          {
            label: "Sélectionner la table manuellement",
            response: "C'est tout à fait possible ! Utilisez le menu déroulant 'Table (Manuel)' lors de l'étape de validation pour renseigner le numéro écrit sur votre table."
          }
        ]
      }
    },
    {
      id: 'qr-scan',
      title: 'Scanner/Saisir une Table',
      icon: <Smartphone className="w-4 h-4 text-orange-500" />,
      description: 'Optimisez votre service sur place grâce à l\'attribution de table par QR Code.',
      steps: [
        {
          title: 'Cliquer sur "Scanner ma Table"',
          description: 'Le bouton est disponible en haut de l\'écran d\'accueil ou dans le récapitulatif de votre panier.',
        },
        {
          title: 'Autoriser la caméra',
          description: 'Accordez l\'accès à votre appareil photo lorsqu\'il vous est demandé par votre navigateur mobile.',
        },
        {
          title: 'Scanner le QR Code physique',
          description: 'Cadrez le sticker QR Code collé sur votre table physique. L\'application l\'identifiera automatiquement de la Table 1 à 20.',
          tip: 'Si le scanner ne marche pas, vous pouvez toujours choisir votre table manuellement dans le menu déroulant !'
        }
      ],
      interactiveDemo: {
        question: "Que faire si l'autorisation de la caméra est bloquée ?",
        options: [
          {
            label: "Sélectionner manuellement la table",
            response: "Dans l'onglet validation, utilisez le sélecteur manuel de table (1 à 20). C'est ultra rapide et ne nécessite aucun capteur !"
          },
          {
            label: "Activer la caméra avant",
            response: "Le scanner dispose d'un bouton de bascule 'Caméra : Arrière/Avant' pour s'adapter à tous les smart devices ou tablettes de clients."
          }
        ]
      }
    },
    {
      id: 'live-tracker',
      title: 'Suivre mes Commandes',
      icon: <ClipboardCheck className="w-4 h-4 text-orange-500" />,
      description: 'Ne restez pas dans l\'inconnu ! Suivez l\'état de préparation de votre commande en temps réel.',
      steps: [
        {
          title: 'Ouvrir l\'outil "Suivre en Direct"',
          description: 'Cliquez sur le bouton de suivi présent au sommet de l\'écran pour ouvrir le panneau de recherche.',
        },
        {
          title: 'Saisir votre numéro de téléphone',
          description: 'Entrez le numéro de téléphone utilisé lors de votre commande pour récupérer tout l\'historique.',
        },
        {
          title: 'Consulter l\'état d\'avancement',
          description: 'Visualisez directement la jauge d\'état : En attente, En préparation, Prêt à servir, En cours de livraison ou Clôturée.',
        }
      ],
      interactiveDemo: {
        question: "Qu'indique le statut 'Prêt à livrer' ?",
        options: [
          {
            label: "Que mon repas m'attend en cuisine",
            response: "Exactement ! Votre commande est cuisinée et dressée, prête à être emportée ou assignée directement au personnel de service."
          },
          {
            label: "Qu'elle est déjà en cours de route",
            response: "Pas tout à fait ! Pour la route, le statut passera à 'En Livraison' dès que le livreur l'aura récupérée avec lui."
          }
        ]
      }
    }
  ];

  const caisseTopics: HelpTopic[] = [
    {
      id: 'pos-sale',
      title: 'Prendre une Commande (POS)',
      icon: <ShoppingCart className="w-4 h-4 text-orange-500" />,
      description: 'Prenez rapidement les commandes des clients sur place directement depuis la caisse.',
      steps: [
        {
          title: 'Sélectionner un produit',
          description: 'Cliquez sur l\'un des plats du Menu du Jour affichés à l\'écran pour enrichir le panier actif.',
          tip: 'Note : Désormais, seuls les produits du Menu du Jour configuré s\'affichent pour vous éviter toute erreur de vente !'
        },
        {
          title: 'Attribuer à un client',
          description: 'Sélectionnez un client existant dans la liste déroulante ou cochez "Créer un nouveau client" pour saisir son nom & téléphone.',
        },
        {
          title: 'Définir la table (si applicable)',
          description: 'Renseignez la table occupée par le client pour que les serveurs sachent où livrer le repas.',
        },
        {
          title: 'Encaisser la commande',
          description: 'Cliquez sur "Valider & Encaisser", choisissez le mode de règlement (Espèces, Wave, Orange Money, Djamo) et validez.',
        }
      ],
      interactiveDemo: {
        question: "Peut-on commander un produit hors Menu du Jour ?",
        options: [
          {
            label: "Non, pour éviter les erreurs de cuisine",
            response: "Exact ! Par souci d'optimisation et pour éviter les malentendus de stock, l'interface affiche maintenant uniquement le menu du jour."
          },
          {
            label: "Oui, en demandant à l'administrateur",
            response: "Tout à fait, l'Administrateur peut activer ou désactiver les plats dans le Menu du Jour depuis sa console en 2 secondes."
          }
        ]
      }
    },
    {
      id: 'cmd-workflow',
      title: 'Suivi & Préparation Cuisine',
      icon: <ClipboardCheck className="w-4 h-4 text-orange-500" />,
      description: 'Accompagnez l\'avancement des plats depuis la commande jusqu\'au service.',
      steps: [
        {
          title: 'Visualiser les commandes actives',
          description: 'Consultez les onglets de progression : "Payé Non Servi" (Nouvelles commandes), "Attente Paiement", ou "En cours".',
        },
        {
          title: 'Mettre à jour le statut',
          description: 'Modifiez l\'état via le contrôle déroulant. Par exemple, basculez vers "🍽️ Prêt à livrer" dès que le chef a fini de cuisiner.',
          tip: 'En changeant l\'état à Prêt à livrer, le serveur reçoit instantanément un signal sonore léger sur l\'écran Serveur !'
        },
        {
          title: 'Valider le service physique',
          description: 'Marquez le plat comme "Servi" dès qu\'il est déposé en table, ou "Livré/Vendu" pour clôturer définitivement la transaction.',
        }
      ],
      interactiveDemo: {
        question: "À quoi sert le statut 'Attente Paiement' ?",
        options: [
          {
            label: "Pour les commandes prises avant d'avoir réglé",
            response: "Tout à fait ! Utile pour les clients sur place qui règlent à la fin du repas. La cuisine commence, et l'encaissement se fera plus tard."
          },
          {
            label: "Pour les commandes annulées",
            response: "Non, les commandes annulées disposent d'un flux d'annulation sécurisé avec motif pour la transparence financière."
          }
        ]
      }
    },
    {
      id: 'cash-expenses',
      title: 'Caisse & Dépenses du Jour',
      icon: <DollarSign className="w-4 h-4 text-orange-500" />,
      description: 'Suivez le solde théorique de la caisse et consignez les retraits de petite monnaie.',
      steps: [
        {
          title: 'Consulter le rapport de session',
          description: 'Regardez le bandeau gris en haut pour voir vos ventes cumulées du jour par moyen de paiement.',
        },
        {
          title: 'Enregistrer une dépense',
          description: 'Si vous piochez dans la caisse pour acheter des ingrédients ou payer un fournisseur direct, cliquez sur "Ajouter une Dépense".',
        },
        {
          title: 'Préciser le motif et le montant',
          description: 'Indiquez le montant précis, la catégorie (Marché, Gaz, Transport, Divers) et une description claire pour l\'Administrateur.',
        }
      ],
      interactiveDemo: {
        question: "Pourquoi est-il obligatoire de saisir un libellé de dépense ?",
        options: [
          {
            label: "Pour justifier l'écart de caisse en fin de journée",
            response: "Exact ! L'administrateur verra immédiatement la dépense déduite de la caisse théorique, évitant ainsi les malentendus."
          },
          {
            label: "Pour faire une facture automatique",
            response: "C'est principalement pour le livre de compte analytique consultable par le gérant en fin de service !"
          }
        ]
      }
    }
  ];

  const adminTopics: HelpTopic[] = [
    {
      id: 'admin-dashboard',
      title: 'Tableau de Bord & Analyses',
      icon: <DollarSign className="w-4 h-4 text-orange-500" />,
      description: 'Visualisez instantanément la santé financière de votre établissement.',
      steps: [
        {
          title: 'Indicateurs clés de performance',
          description: 'Analysez en direct : Chiffre d\'Affaires brut, total des encaissements physiques, volume des dépenses et bénéfice net du jour.',
        },
        {
          title: 'Graphique d\'activité horaire',
          description: 'Observez les heures d\'affluence de pointe pour ajuster l\'équipe de service.',
        },
        {
          title: 'Répartition des paiements',
          description: 'Comparez l\'usage de l\'Espèce par rapport aux solutions Mobile Money (Wave, Orange Money) pour anticiper vos besoins en monnaie.',
        }
      ],
      interactiveDemo: {
        question: "Comment est calculé le Bénéfice Net ?",
        options: [
          {
            label: "Chiffre d'Affaires moins les Dépenses du jour",
            response: "Exactement ! C'est la balance nette des encaissements diminuée de toutes les sorties d'argent immédiates du jour."
          },
          {
            label: "La somme des commandes payées uniquement",
            response: "Non, car cela oublierait de décompter les dépenses (marché, gaz, emballages) de votre solde réel."
          }
        ]
      }
    },
    {
      id: 'admin-catalog',
      title: 'Menu du Jour & Gestion des Stocks',
      icon: <BookOpen className="w-4 h-4 text-orange-500" />,
      description: 'Gérez la carte d\'ingrédients et définissez l\'offre commerciale disponible.',
      steps: [
        {
          title: 'Créer/Modifier un Plat',
          description: 'Ajouter des produits au catalogue principal avec prix unitaire, catégorie et statut de stock.',
        },
        {
          title: 'Activer le "Menu du Jour"',
          description: 'Cochez ou décochez les plats pour composer l\'offre disponible aux clients et à la caisse aujourd\'hui.',
          tip: 'Cette action met à jour instantanément la vue client pour s\'adapter aux stocks de la cuisine du matin !'
        },
        {
          title: 'Suivre les alertes de bas stock',
          description: 'Définissez un seuil d\'alerte. Si le stock descend sous cette valeur, le plat passera en alerte orange/rouge.',
        }
      ],
      interactiveDemo: {
        question: "Quel est l'impact d'activer un plat dans le Menu du Jour ?",
        options: [
          {
            label: "Il apparaît immédiatement sur l'interface de commande",
            response: "Tout à fait ! C'est instantané. Les clients et les caissiers voient uniquement ces plats, limitant ainsi la surcharge visuelle."
          },
          {
            label: "Il modifie la recette de cuisine",
            response: "Non, cela contrôle uniquement sa visibilité commerciale pour le service actif."
          }
        ]
      }
    },
    {
      id: 'admin-qrcodes',
      title: 'Génération de QR de Tables',
      icon: <Smartphone className="w-4 h-4 text-orange-500" />,
      description: 'Préparez l\'installation physique de vos chevalets de table en salle.',
      steps: [
        {
          title: 'Sélectionner le mode d\'export',
          description: 'Choisissez entre l\'exportation individuelle d\'une table ou la planche d\'impression complète.',
        },
        {
          title: 'Personnaliser la teinte',
          description: 'Ajustez la couleur du QR code (Orange Yikéli, Slate Sombre, Vert) pour correspondre à votre identité.',
        },
        {
          title: 'Télécharger ou Imprimer',
          description: 'Récupérez l\'image PNG haute résolution ou cliquez sur "Lancer l\'impression" pour éditer des badges pré-formatés.',
        }
      ],
      interactiveDemo: {
        question: "Pourquoi privilégier les QR Codes individuels par table ?",
        options: [
          {
            label: "Pour accélérer la prise de commande automatisée",
            response: "Absolument ! Le client est autonome, commande en toute liberté et la caisse sait immédiatement vers quelle table acheminer le plat !"
          },
          {
            label: "Pour faire de la publicité extérieure",
            response: "Non, ces QR codes sont optimisés pour le service sur place (Table 1 à 20)."
          }
        ]
      }
    }
  ];

  const topics = type === 'client' ? clientTopics : type === 'caisse' ? caisseTopics : adminTopics;

  // Set default active topic
  if (!activeTopicId && topics.length > 0) {
    setActiveTopicId(topics[0].id);
  }

  const selectedTopic = topics.find(t => t.id === activeTopicId) || topics[0];

  const handleTopicChange = (id: string) => {
    setActiveTopicId(id);
    setDemoSelection(null); // Reset interactive demo state
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
      <div className="bg-white text-slate-900 border border-slate-100 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-xl shadow-md text-white animate-pulse">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm lg:text-base flex items-center gap-2">
                Documentation Interactive &amp; Aide
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/10 px-2 py-0.5 rounded-full font-bold">
                  {type.toUpperCase()}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Découvrez comment utiliser efficacement toutes les fonctionnalités à votre disposition.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white transition focus:outline-none bg-slate-800 hover:bg-slate-700 p-2 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Layout with sidebar and detail pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
          {/* Sidebar Menu */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-4 shrink-0 space-y-2">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase block mb-2 px-2">Sujets d'aide</span>
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleTopicChange(topic.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer ${
                  activeTopicId === topic.id
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-900 shadow-xs'
                    : 'bg-transparent border border-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                {topic.icon}
                <span className="truncate">{topic.title}</span>
              </button>
            ))}
          </div>

          {/* Details Content Box */}
          {selectedTopic && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  {selectedTopic.title}
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h4>
                <p className="text-xs text-slate-500">{selectedTopic.description}</p>
              </div>

              {/* Main Step List */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Étapes pas à pas</span>
                <div className="relative border-l border-slate-200 ml-3 pl-5 space-y-5">
                  {selectedTopic.steps.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Step marker bubble */}
                      <span className="absolute -left-[29px] top-0 w-4 h-4 bg-orange-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white shadow-xs">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-xs text-slate-850">{step.title}</h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{step.description}</p>
                        {step.tip && (
                          <div className="bg-amber-50 border border-amber-200/40 p-2 rounded-xl text-[10px] text-amber-850 font-semibold max-w-fit flex items-center gap-1.5 mt-1 animate-none">
                            <span className="text-amber-600 font-extrabold">💡 Conseil :</span>
                            <span>{step.tip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Simulator Section */}
              {selectedTopic.interactiveDemo && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Simulateur d'aide Interactive</span>
                  </div>
                  
                  <p className="text-xs font-bold text-slate-800 bg-white p-3 rounded-xl border border-slate-150 shadow-xs leading-normal">
                    ❓ {selectedTopic.interactiveDemo.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTopic.interactiveDemo.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDemoSelection(idx)}
                        className={`p-3 rounded-xl border text-left text-xs transition duration-200 cursor-pointer ${
                          demoSelection === idx
                            ? 'bg-orange-500 border-orange-500 text-white font-extrabold shadow-md'
                            : 'bg-white border-slate-200 hover:border-orange-200 text-slate-700 hover:bg-orange-50/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {demoSelection !== null && (
                    <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-emerald-950 text-xs font-semibold leading-relaxed flex gap-2.5 animate-fadeIn">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-emerald-800 font-extrabold mb-0.5">Explication interactive :</strong>
                        {selectedTopic.interactiveDemo.options[demoSelection].response}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-150 p-4 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Yikéli Guide Pro • 2026</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
          >
            J'ai compris !
          </button>
        </div>
      </div>
    </div>
  );
}
