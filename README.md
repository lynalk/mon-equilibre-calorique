# Mon équilibre calorique

Compteur de calories précis et personnalisé. Premier prototype : une appli web autonome (un seul fichier `index.html`), utilisable sur téléphone, avec les données gardées dans le navigateur.

## Fonctions

- **Profil** : sexe, âge, taille, poids, masse grasse (facultative), niveau d'activité, objectif.
- **Besoins** : métabolisme de base par Mifflin-St Jeor, ou Katch-McArdle si la masse grasse est connue, multiplié par le coefficient d'activité puis ajusté selon l'objectif (de −500 à +500 kcal). Plancher de 1 200 kcal (femme) / 1 500 kcal (homme).
- **Macros** : protéines 1,6 à 1,8 g/kg, lipides 30 % des calories, glucides pour le reste.
- **Journal** : 4 repas, ~45 aliments courants avec portions, saisie libre, total du jour comparé à l'objectif, navigation entre les jours.

## Utiliser

Ouvrir `index.html` dans un navigateur. Aucune installation.

Les données sont enregistrées en `localStorage` (clé `mon-equilibre.v1`), uniquement sur l'appareil.

## Limites connues

- Valeurs nutritionnelles indicatives, saisies à la main dans l'ordre de grandeur des tables Ciqual : à remplacer par la base Ciqual officielle.
- Pas de synchronisation entre appareils.
