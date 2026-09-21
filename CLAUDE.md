# Maman, on mange quoi ?

PWA familiale : stock du frigo, idées de recettes, vote du soir en temps réel entre les téléphones de la famille (dont un iPhone, donc Safari iOS à tester).

## Stack

- React 19, Vite, TypeScript, Tailwind v4 (`@tailwindcss/vite`), `vite-plugin-pwa`
- Firebase : Auth anonyme + Firestore (cache IndexedDB persistant, voir `src/lib/firebase.ts`)
- Déploiement Vercel (`vercel.json`)
- Commandes : `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint` (oxlint)

## Conventions

- **Textes de l'interface en français.**
- **Pas de tiret cadratin (—) dans les textes** de l'interface. Utiliser deux-points, virgule, parenthèses ou une nouvelle phrase.
- **Couleurs** : uniquement via les tokens Tailwind définis dans `src/index.css` (bloc `@theme`, variante sombre dans le `@media (prefers-color-scheme: dark)`). Pas de couleur en dur dans les composants : ajouter un token si besoin (clair + sombre).
- **Firestore** : toute nouvelle collection ou sous-collection doit avoir ses règles dans `firestore.rules`, dans le même changement. Mettre aussi à jour la section « Modèle de données » du README.
- **Plan Spark (gratuit)** : pas de Cloud Functions, pas de service payant. Toute la logique tourne côté client, la sécurité repose sur les Security Rules.
- Variables Firebase dans `.env.local` (préfixe `VITE_FIREBASE_`), jamais commitées.

## Repères

- `src/lib/household.ts` : création de foyer, codes d'invitation, join, membres
- `src/hooks/useHousehold.ts` : état temps réel du foyer (`loading` / `none` / `unclaimed` / `ready`)
- `src/screens/` : Onboarding, WhoAreYou (« Qui es-tu ? »), AppShell
