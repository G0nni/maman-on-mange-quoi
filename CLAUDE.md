# Maman, on mange quoi ?

PWA familiale : stock du frigo, idées de recettes, vote du soir en temps réel entre les téléphones de la famille (dont un iPhone, donc Safari iOS à tester).

## Stack

- React 19, Vite, TypeScript, Tailwind v4 (`@tailwindcss/vite`), `vite-plugin-pwa`
- Firebase : Auth anonyme + Firestore (cache IndexedDB persistant, voir `src/lib/firebase.ts`)
- Déploiement Vercel (`vercel.json`)
- Commandes : `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint` (oxlint), `npm test` (Vitest, tests à côté du fichier testé : `*.test.ts`), `npm run coverage`

## Conventions

- **Textes de l'interface en français.**
- **Pas de tiret cadratin (—) dans les textes** de l'interface. Utiliser deux-points, virgule, parenthèses ou une nouvelle phrase.
- **Couleurs** : uniquement via les tokens Tailwind définis dans `src/index.css` (bloc `@theme`, variante sombre dans le `@media (prefers-color-scheme: dark)`). Pas de couleur en dur dans les composants : ajouter un token si besoin (clair + sombre).
- **Firestore** : toute nouvelle collection ou sous-collection doit avoir ses règles dans `firestore.rules`, dans le même changement. Mettre aussi à jour la section « Modèle de données » du README.
- **Claim de profil entre membres : choix assumé.** La règle `members/{memberId}` update laisse tout membre rattacher sa session à n'importe quel profil du foyer. C'est le flux de récupération iOS (PWA réinstallée ou Safari qui purge le stockage, donc nouvel uid anonyme). Ne pas le restreindre.
- **Plan Spark (gratuit)** : pas de Cloud Functions, pas de service payant. Toute la logique tourne côté client, la sécurité repose sur les Security Rules.
- Variables Firebase dans `.env.local` (préfixe `VITE_FIREBASE_`), jamais commitées.
- **Plus de tests sur la base Firestore réelle.** Pas de foyers de test, pas d'écritures de vérification des rules en production. Les tests d'intégration et de rules passeront par l'émulateur Firebase (à mettre en place).

## Recettes (base statique, pas de LLM au runtime)

- Référentiel : `src/data/ingredients.ts` (ingrédients, groupes, basiques). `id` = `stockId(label)`, vérifié.
- Recettes : `src/data/recipes/*.json`, un fichier par thème. Schéma zod dans `src/data/recipe-schema.ts`, type `Recipe` déduit (`import type` côté app pour garder zod hors du bundle).
- `npm run validate:recipes` : validation + stats. Également exécuté par `npm test`. À lancer après chaque lot de recettes.
- Conventions : 4 personnes, étapes courtes, pas de tiret cadratin. `rapide` (time <= 25) et `vege` (aucune viande ni poisson, optionnels compris) sont vérifiés par le validateur. On ne liste pas sel et poivre ; les autres basiques (huile, beurre, farine…) oui, quand ils comptent dans la recette.
- Une ref peut viser un groupe (`fromage-rape`, `pates`…) : à préférer quand plusieurs ingrédients conviennent.
- **Statut d'une ref pour « il manque »** (`refStatus()` dans `src/data/ingredients.ts`) :
  - **basique** (`BASICS` : sel, poivre, huile, vinaigre, moutarde, beurre, farine, sucre, ail, oignon, bouillon cube, thym, laurier, herbes de Provence, muscade) : toujours considéré en stock ;
  - **non bloquant** (catégories `epice` et `herbe`) : affiché dans la recette, jamais compté comme manquant ;
  - **obligatoire** : tout le reste, doit être en stock.
  - Indépendamment du statut, `optional: true` dans une recette rend l'ingrédient facultatif pour ce plat-là.
- **Matching stock / recette optimiste** : un aliment du stock qui correspond à un groupe (« Poulet ») satisfait une recette qui demande un membre précis du groupe (blancs de poulet).
- **Suggestions** (`suggest()` dans `src/lib/suggest.ts`, fonction pure, hasard injectable via `rng`) :
  - faisable (0 manquant) avant « presque » (1 manquant), au-delà exclu ;
  - exclut les plats masqués (foyer) et déjà vus (session) ; du lundi au vendredi, 45 min maximum sauf « On a le temps ce soir » ; pas de limite le week-end ;
  - 3 plats de protéines toutes différentes (« aucune » compte comme une protéine), tirage pondéré : +1 équilibre P/L/F complet, +1 saison courante, +0,5 toute l'année.
- La logique du référentiel (statut d'une ref, résolution des ids du stock y compris alias, satisfaction optimiste) vit dans `src/lib/referential.ts` et sert à `refStatus()`, au validateur et à `suggest()`. Ne pas la dupliquer.
- Pas de desserts. Les fruits restent dans le référentiel pour l'autocomplétion du stock.

## Points connus

- **Collision pâtes / pâté sur `stockId`** : `norm()` retire accents et pluriel, donc « Pâtes » et « Pâté » donnent le même id `pate`. Le second ajout est refusé comme doublon (« Déjà dans le stock »). Tout changement de `norm()` change les ids existants : le traiter comme une migration, et garder `ingredients.test.ts` à jour.
- **Ajout au stock** : `setDoc` sans `await` pour l'UI (affichage instantané et hors ligne). Le refus d'un doublon par les rules (`permission-denied`) peut arriver bien plus tard, au retour du réseau. Tester l'erreur par son `code`, pas par `instanceof FirestoreError` (ne matche pas avec firebase 12).

## Repères

- `src/lib/household.ts` : création de foyer, codes d'invitation, join, membres
- `src/hooks/useHousehold.ts` : état temps réel du foyer (`loading` / `none` / `unclaimed` / `ready`). N'expose un foyer tout juste créé qu'après confirmation du serveur, pour que les listeners des sous-collections ne soient pas refusés par `isMember()`.
- `src/lib/ingredients.ts` : `norm`, `stockId`, `guessEmoji` (servira aussi au matching des recettes)
- `src/lib/stock.ts` + `src/hooks/useStock.ts` : stock du foyer
- `src/screens/` : Onboarding, WhoAreYou (« Qui es-tu ? »), AppShell, StockScreen
