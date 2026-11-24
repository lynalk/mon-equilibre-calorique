# Publier l'appli et l'essayer sur ton téléphone

Deux façons d'utiliser l'appli, avec le même code.

## 1. Dans Claude (déjà prête)

Ouvre le lien de l'appli depuis Claude, sur ton téléphone ou ton ordinateur. L'analyse photo par IA marche ici. La recherche des produits du commerce par leur nom ne marche pas dans Claude : scanne leur code-barres.

## 2. En site web gratuit avec GitHub Pages

Ici, la recherche des produits du commerce (Open Food Facts) marche. L'analyse photo par IA ne marche pas en dehors de Claude.

1. **Valider les changements.** Sur GitHub, ouvre l'onglet *Pull requests* du dépôt `mon-equilibre-calorique`, ouvre la demande en attente, clique sur **Merge pull request**, puis **Confirm merge**.
2. **Rendre le dépôt public.** GitHub Pages est gratuit seulement pour les dépôts publics. Va dans **Settings** (en haut du dépôt), descends tout en bas jusqu'à *Danger Zone*, clique sur **Change visibility**, choisis **Public** et confirme. Le code devient visible par tous, mais tes données restent sur ton téléphone : elles ne sont jamais dans le dépôt.
3. **Activer Pages.** Toujours dans **Settings**, ouvre **Pages** dans le menu de gauche. Sous *Build and deployment*, *Source* : **Deploy from a branch**. *Branch* : **main**, dossier **/ (root)**, puis **Save**.
4. **Attendre 1 à 2 minutes.** L'adresse s'affiche en haut de la page Pages : `https://lynalk.github.io/mon-equilibre-calorique/`.
5. **L'ouvrir sur ton téléphone** avec cette adresse.
6. **L'ajouter à l'écran d'accueil**, pour l'ouvrir comme une vraie appli :
   - iPhone (Safari) : bouton **Partager** (carré avec une flèche), puis **Sur l'écran d'accueil**.
   - Android (Chrome) : menu **⋮**, puis **Ajouter à l'écran d'accueil**.

Chaque fois qu'un changement est validé sur `main`, le site se met à jour tout seul en une ou deux minutes.

## Bon à savoir

- Les données (profil, repas, pas, eau, pesées) sont enregistrées dans le navigateur de l'appareil. La version Claude et la version site ont chacune leurs propres données, et elles ne se synchronisent pas entre téléphone et ordinateur.
- Vider les données du navigateur efface aussi les données de l'appli.
