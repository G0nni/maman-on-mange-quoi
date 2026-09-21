# Maman, on mange quoi ?

PWA familiale : stock du frigo, idées de recettes, vote du soir en temps réel.

Stack : React 19, Vite, TypeScript, Tailwind v4, Firebase (Auth anonyme + Firestore), déployée sur Vercel.

## Démarrer

    cp .env.example .env.local   # puis coller la firebaseConfig
    npm install
    npm run dev

## Security Rules

Coller `firestore.rules` dans la console (Firestore > Règles > Publier), ou :

    npm i -g firebase-tools
    firebase login
    firebase use --add            # choisir le projet
    firebase deploy --only firestore:rules

## Modèle de données

    joinCodes/{code}                         { householdId }
    households/{hid}                         { name, joinCode, memberUids[], createdAt }
    households/{hid}/members/{memberId}      { name, emoji, color, uid }
    households/{hid}/stock/{itemId}          (à venir)
    households/{hid}/polls/{pollId}          (à venir)
    households/{hid}/polls/{pollId}/votes/{memberId}
