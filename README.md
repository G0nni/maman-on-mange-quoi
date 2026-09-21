# Maman, on mange quoi ?

PWA familiale : stock du frigo, idées de recettes, vote du soir en temps réel.

Stack : React 19, Vite, TypeScript, Tailwind v4, Firebase (Auth anonyme + Firestore), déployée sur Vercel.

## Démarrer

    cp .env.example .env.local   # puis coller la firebaseConfig
    npm install
    npm run dev
    npm test                     # tests unitaires (Vitest)

## Émulateur Firebase (Java 21 requis)

    npm run test:rules       # tests des Security Rules sur l'émulateur
    npm run emulators        # émulateurs Auth + Firestore (projet fictif demo-mmq)
    npm run dev:emu          # l'app en dev, branchée sur les émulateurs

## Security Rules

Toujours lancer `npm run test:rules` avant de déployer. Puis coller `firestore.rules` dans la console (Firestore > Règles > Publier), ou :

    npm i -g firebase-tools
    firebase login
    firebase use --add            # choisir le projet
    firebase deploy --only firestore:rules

## Modèle de données

    joinCodes/{code}                         { householdId }
    households/{hid}                         { name, joinCode, memberUids[], createdAt }
    households/{hid}/members/{memberId}      { name, emoji, color, uid }
    households/{hid}/stock/{itemId}          { name, zone: 'frigo'|'placard'|'congel', emoji, addedBy: memberId, createdAt }
                                             itemId = nom normalisé (stockId), ex. "pomme-de-terre"
    households/{hid}/prefs/recipes           { hidden: recipeId[] }   plats masqués (« On n'aime pas »)
    households/{hid}/polls/{date}            { status: open|closed, options: recipeId[] (4 max), createdBy: memberId, winner, closedAt }
                                             date = AAAA-MM-JJ en heure de Paris (un vote par jour)
    households/{hid}/polls/{date}/votes/{memberId}   { recipeId, updatedAt }   un vote par personne

## Recettes

Base statique dans `src/data/recipes/*.json` (pas de LLM au runtime), validée par `npm run validate:recipes` (aussi lancé par `npm test`). Chargée par l'écran Idées en `import()` dynamique, hors du bundle principal.
