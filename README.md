# Mon équilibre calorique

Compteur de calories précis et personnalisé, en français, pensé pour le téléphone. Appli web sans installation ni serveur : les données restent dans le navigateur de l'appareil.

## Fonctions

- **Profil et besoins** : métabolisme de base par Mifflin-St Jeor, ou Katch-McArdle si la masse grasse est connue, multiplié par le coefficient d'activité puis ajusté selon l'objectif (de −500 à +500 kcal). Plancher de 1 200 kcal (femme) / 1 500 kcal (homme). Macros : protéines 1,6 à 1,8 g/kg, lipides 30 % des calories, glucides pour le reste.
- **Journal** : 4 repas, total du jour comparé à l'objectif, navigation entre les jours, reprise d'un repas de la veille en un geste.
- **Ajout d'aliments**, quatre façons :
  - **Chercher** : ~45 aliments courants avec portions, plus les récents et « Mes aliments ».
  - **Code-barres** : photo du code-barres (appareil photo ou galerie) ou saisie des chiffres. Le produit est cherché dans tes aliments enregistrés, puis dans [Open Food Facts](https://world.openfoodfacts.org). S'il est introuvable, l'IA lit la photo de l'étiquette nutritionnelle. Chaque fiche est vérifiable avant d'être enregistrée.
  - **Photo IA** : photo de l'assiette, l'IA liste les aliments avec quantités et calories. Tout est modifiable (nom, grammes, kcal) avant l'ajout.
  - **Libre** : nom et calories, macros facultatives.
- **Progrès** : pesées avec courbe et évolution sur 7 jours, calories des 7 derniers jours par rapport à l'objectif. La dernière pesée met à jour le poids du profil.

## Où l'utiliser

| | Dans Claude (page publiée) | Ouvert ailleurs (fichier, hébergement web) |
|---|---|---|
| Journal, profil, progrès | oui | oui |
| Lecture du code-barres | oui | oui |
| Base Open Food Facts | non, le réseau de la page est bloqué : l'étiquette prend le relais | oui |
| Analyse photo par IA | oui, sur le compte Claude de la personne, sans clé d'API | non |

L'analyse IA passe par la capacité `sample` des pages Claude (`js/ai.js`). La page doit être publiée avec `capabilities: {sample: {images: true}}`.

## Structure

- `index.html` : écrans et formulaires
- `css/app.css` : thème clair/sombre
- `js/foods.js` : base d'aliments intégrée
- `js/barcode.js` : décodage (BarcodeDetector, sinon ZXing chargé depuis unpkg) et recherche Open Food Facts
- `js/ai.js` : analyse photo du plat et lecture d'étiquette
- `js/app.js` : état, calculs et rendu

Les données sont en `localStorage` (clé `mon-equilibre.v1`).

## Limites connues

- Valeurs de la base intégrée indicatives (ordre de grandeur Ciqual), à remplacer par la base Ciqual officielle.
- Estimations photo approximatives : elles se corrigent avant l'ajout.
- Pas de synchronisation entre appareils.
