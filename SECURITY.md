# Politique de Sécurité & Architecture RestoChain / Yikéli

Ce document détaille les mesures de sécurité, l'architecture d'isolation multi-restaurants et les standards de données appliqués au sein de la plateforme.

---

## 1. Synthèse du Durcissement de Sécurité

Suite à la revue de sécurité et d'architecture, six vulnérabilités critiques ont été résolues :

| Vulnérabilité Initiale | Risque Associé | Mesure de Durcissement Appliquée |
| :--- | :--- | :--- |
| **RLS permissive `USING (true) WITH CHECK (true)`** | Tout détenteur de la clé publique `anon` pouvait lire, modifier et purger l'intégralité de la base de données. | Révocation de toutes les politiques globales. Implémentation de politiques RLS strictes et granulaires avec vérification d'appartenance au tenant (`current_restaurant_id()`). |
| **Absence d'isolation multi-restaurants dans RLS** | Fuite de données et interférence entre restaurants concurrents hébergés sur la même instance. | Définition d'un contexte de tenant via l'en-tête HTTP sécurisé `x-restaurant-id` et/ou métadonnées JWT, résolu dans PostgreSQL par la fonction `current_restaurant_id()`. |
| **Dates stockées en `TEXT`** | Tri lexical imprévisible, filtres temporels corrompus et agrégations financières erronées. | Migration de tous les champs temporels vers `TIMESTAMPTZ` (horodatage UTC précis) et `DATE` (calendriers et embauches). |
| **Mots de passe stockés en clair** | Compromission totale des comptes administrateurs et employés en cas d'accès direct à la table. | Implémentation de `pgcrypto`, hachage automatique en **Bcrypt** via triggers PostgreSQL (`trigger_auto_hash_password` et `trigger_auto_hash_admin_password`), création de vues sécurisées (`yikeli_users_safe`), et fonction RPC d'authentification (`verify_staff_credentials`). |
| **Absence de clés étrangères (FK)** | Orphelins de données, intégrité référentielle rompue en cas de suppression ou mise à jour. | Contraintes `FOREIGN KEY REFERENCES ... ON DELETE CASCADE` sur toutes les tables subordonnées (`yikeli_orders`, `yikeli_order_items`, `yikeli_paiements`, `yikeli_plats`, etc.). |
| **Usage exclusif de JSONB pour données relationnelles** | Impossibilité de requêter, d'indexer ou de joindre efficacement les plats et les lignes de commandes. | Création de tables relationnelles normalisées : `yikeli_plats` pour le catalogue et `yikeli_order_items` pour chaque article vendu, tout en conservant un cache JSONB pour hydratation locale rapide. |

---

## 2. Fonctionnement du Row Level Security (RLS)

Chaque requête vers Supabase transmet l'identifiant du restaurant actif via l'en-tête `x-restaurant-id`. La base de données évalue l'identité du tenant à chaque instruction SQL :

```sql
CREATE OR REPLACE FUNCTION public.current_restaurant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-restaurant-id',
    current_setting('app.current_restaurant_id', true),
    auth.jwt()->'app_metadata'->>'restaurant_id',
    auth.jwt()->'user_metadata'->>'restaurant_id'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### Règles d'accès :
- **Commandes & Lignes de commandes** : Insertion possible par les clients du restaurant (QR code ou caisse), lecture et mise à jour réservées au restaurant concerné (`restaurant_id = public.current_restaurant_id()`).
- **Paiements & Dépenses** : Strictement confinés au restaurant propriétaire.
- **Menu & Plats** : Les plats actifs sont lisibles publiquement par les clients du restaurant ; l'administration est restreinte au tenant.
- **Utilisateurs & Employés** : Les données du personnel ne peuvent être lues ou modifiées que par le tenant propriétaire.

---

## 3. Gestion des Identifiants et Mots de Passe

1. **Hachage Bcrypt** : Les colonnes `password_hash` et `admin_password_hash` stockent les empreintes salées via `gen_salt('bf', 10)`.
2. **Triggers d'inviolabilité** : Tout mot de passe injecté sans préfixe Bcrypt (`$2a$` ou `$2b$`) est automatiquement intercepté et haché avant l'écriture sur disque.
3. **Vérification d'authentification sans fuite** :
   ```sql
   SELECT * FROM verify_staff_credentials('rest-1', 'serveur1', 'mon_mot_de_passe');
   ```
   Cette fonction RPC compare le hash côté serveur et renvoie uniquement l'identifiant, le nom et le rôle si les identifiants correspondent, sans jamais renvoyer le hash.

---

## 4. Signalement d'une Vulnérabilité

Pour signaler un problème de sécurité ou une vulnérabilité potentielle :
- Envoyez un rapport détaillé décrivant les étapes de reproduction.
- Toute alerte de sécurité est traitée sous 24 à 48 heures ouvrées.

