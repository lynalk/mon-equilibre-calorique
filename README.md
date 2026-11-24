# Mon équilibre calorique

Compteur de calories précis et personnalisé, en français, pensé pour le téléphone. Appli web sans installation ni serveur : les données restent dans le navigateur de l'appareil.

## Fonctions

- **Profil et besoins** : métabolisme de base par Mifflin-St Jeor, ou Katch-McArdle si la masse grasse est connue, multiplié par le coefficient d'activité puis ajusté selon l'objectif (de −500 à +500 kcal). Plancher de 1 200 kcal (femme) / 1 500 kcal (homme). Macros : protéines 1,6 à 1,8 g/kg, lipides 30 % des calories, glucides pour le reste.
- **Journal** : 4 repas, total du jour comparé à l'objectif, navigation entre les jours, reprise d'un repas de la veille en un geste.
- **Ajout d'aliments**, quatre façons :
  - **Chercher** : 333 aliments de base (fruits, légumes, féculents, viandes, poissons, laitages, boulangerie et pâtisserie, plats, boissons) avec portions, les récents, « Mes aliments », et les produits du commerce via Open Food Facts (version web).
  - **Code-barres** : photo du code-barres (appareil photo ou galerie) ou saisie des chiffres. Le produit est cherché dans tes aliments enregistrés, puis dans [Open Food Facts](https://world.openfoodfacts.org). S'il est introuvable, l'IA lit la photo de l'étiquette nutritionnelle. Chaque fiche est vérifiable avant d'être enregistrée.
  - **Photo IA** : photo de l'assiette, l'IA liste les aliments avec quantités et calories. Tout est modifiable (nom, grammes, kcal) avant l'ajout.
  - **Libre** : nom et calories, macros facultatives.
- **Pas et eau** : pas du jour (saisie ou +1 000), calories de la marche estimées, objectif de pas ; verres d'eau avec un objectif de 35 ml par kg.
- **Bilan du jour** : métabolisme de base, dépense estimée et déficit ou surplus en direct ; déficit ou surplus visé selon l'objectif, avec la perte ou la prise de poids attendue par semaine (7 700 kcal ≈ 1 kg).
- **Quantités** : en grammes ou en portions (1 pomme, 1 tranche, 2 croissants…).
- **Progrès** : pesées avec courbe et évolution sur 7 jours, calories des 7 derniers jours par rapport à l'objectif. La dernière pesée met à jour le poids du profil.

## Où l'utiliser

| | Dans Claude (page publiée) | Ouvert ailleurs (fichier, hébergement web) |
|---|---|---|
| Journal, profil, progrès | oui | oui |
| Lecture du code-barres | oui | oui |
| Base Open Food Facts (code-barres et recherche par nom) | non, le réseau de la page est bloqué : l'étiquette prend le relais | oui |
| Analyse photo par IA | oui, sur le compte Claude de la personne, sans clé d'API | oui, une fois le relais IA en ligne (voir [RELAIS-IA.md](RELAIS-IA.md)) |

Dans Claude, l'analyse IA passe par la capacité `sample` (`js/ai.js`), la page étant publiée avec `capabilities: {sample: {images: true}}`. Ailleurs, elle passe par le relais `relay/` (Cloudflare Worker) dont l'adresse se règle dans `js/config.js`. La clé Anthropic reste un secret Cloudflare et n'est jamais dans le dépôt.

Pour publier en site web et l'installer sur le téléphone, voir [PUBLIER.md](PUBLIER.md).

## Structure

- `index.html` : écrans et formulaires
- `css/app.css` : thème clair/sombre
- `js/foods.js` : base d'aliments intégrée (333 aliments)
- `img/` : logo Le Reformer by LK et icônes
- `manifest.webmanifest` : installation sur l'écran d'accueil
- `js/barcode.js` : décodage (BarcodeDetector, sinon ZXing chargé depuis unpkg) et recherche Open Food Facts
- `js/config.js` : adresse du relais IA
- `js/ai.js` : analyse photo du plat et lecture d'étiquette (Claude ou relais)
- `relay/` : relais IA (Cloudflare Worker) qui garde la clé Anthropic secrète
- `js/app.js` : état, calculs et rendu

Les données sont en `localStorage` (clé `mon-equilibre.v1`).

## Limites connues

- Valeurs de la base intégrée indicatives (ordre de grandeur Ciqual), à remplacer par la base Ciqual officielle.
- Estimations photo approximatives : elles se corrigent avant l'ajout.
- Pas de synchronisation entre appareils.
