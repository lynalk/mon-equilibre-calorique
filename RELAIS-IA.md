# Activer la photo IA en dehors de Claude

Dans Claude, la photo IA marche toute seule. Sur le site (GitHub Pages) et dans l'appli iPhone, elle a besoin d'un petit **relais** : un mini-serveur gratuit chez Cloudflare qui garde ta clé Anthropic en secret et envoie les photos à Claude.

```
Téléphone ── photo ──▶ Relais Cloudflare (clé secrète) ──▶ Claude ──▶ calories ──▶ Téléphone
```

La clé n'est **jamais** dans le code de l'appli ni sur GitHub. Elle reste rangée dans Cloudflare.

Compte environ 10 minutes, une seule fois.

## Version rapide (3 clics)

1. **Crée ta clé** : ouvre [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys), clique sur **Create Key**, nomme-la `mon-equilibre`, copie-la. Si on te demande un moyen de paiement, ajoute-le avec 5 € de crédit, et fixe une limite mensuelle sur [console.anthropic.com/settings/limits](https://console.anthropic.com/settings/limits) (par exemple 10 €).
2. **Mets le relais en ligne** : clique sur ce bouton, connecte-toi à Cloudflare (compte gratuit) et à GitHub si on te le demande, colle ta clé dans la case `ANTHROPIC_API_KEY`, puis clique sur **Déployer**.

   [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lynalk/mon-equilibre-calorique/tree/main/relay)

   Cloudflare crée au passage une copie du dossier du relais dans ton GitHub : c'est normal.
3. **Envoie l'adresse** affichée à la fin (`https://mon-equilibre-ia....workers.dev`) à Claude, ou colle-la toi-même dans `js/config.js` (étape 4 plus bas).

Le détail de chaque étape suit, si besoin.

---

## 1. Créer ta clé Anthropic (5 min)

1. Va sur **console.anthropic.com** et crée un compte (ou connecte-toi).
2. Ajoute un moyen de paiement et un peu de crédit (5 € suffisent pour commencer, voir les coûts plus bas).
3. **Fixe une limite de dépense mensuelle** (par exemple 10 €), dans les réglages de facturation et de limites. C'est ta vraie sécurité : même en cas d'abus, tu ne paieras jamais plus que cette somme.
4. Va dans **API Keys**, clique sur **Create Key**, nomme-la `mon-equilibre`, puis copie la clé (elle commence par `sk-ant-`).
   Garde-la pour l'étape 3 et ne la colle nulle part ailleurs (ni dans GitHub, ni dans un message).

## 2. Mettre le relais en ligne chez Cloudflare (10 min)

1. Crée un compte gratuit sur **dash.cloudflare.com**.
2. Dans le menu, ouvre **Workers & Pages**, puis **Créer** (Create).
3. Choisis **Importer un dépôt** (Import a repository) et connecte ton compte GitHub.
4. Sélectionne le dépôt `mon-equilibre-calorique`.
5. Dans les réglages de construction, mets **Répertoire racine** (Root directory) = `relay`. Laisse le reste par défaut.
6. Lance le déploiement. À la fin, Cloudflare affiche une adresse du type
   `https://mon-equilibre-ia.<ton-nom>.workers.dev`. Copie-la.

Si tu ouvres cette adresse dans ton navigateur, tu dois voir `{"ok":true,...}`.

## 3. Donner la clé au relais, en secret (2 min)

1. Dans Cloudflare, ouvre ton Worker `mon-equilibre-ia`, onglet **Paramètres** (Settings), puis **Variables et secrets**.
2. Clique sur **Ajouter** (Add), type **Secret**.
3. Nom : `ANTHROPIC_API_KEY`. Valeur : ta clé `sk-ant-...`.
4. Enregistre et redéploie si Cloudflare le propose.

## 4. Brancher l'appli sur le relais (2 min)

1. Sur GitHub, ouvre le fichier `js/config.js` et clique sur le crayon (modifier).
2. Colle l'adresse du relais entre les guillemets :
   ```js
   RELAY_URL: "https://mon-equilibre-ia.ton-nom.workers.dev"
   ```
3. Clique sur **Commit changes**. Une minute plus tard, le site est à jour.

Sur ton téléphone : **Ajouter au journal → Photo IA → Prendre une photo → Analyser**. C'est tout.

---

## Combien ça coûte ?

Cloudflare est gratuit (jusqu'à 100 000 demandes par jour). Seule l'IA est payante, à la photo :

| Modèle (réglage `MODEL`) | Prix par photo, environ | 100 photos par mois |
|---|---|---|
| `claude-opus-5-5` (le plus précis, réglage par défaut) | 2 à 3 centimes | 2 à 3 € |
| `claude-sonnet-5-5` (très bon, moins cher) | environ 1 centime | environ 1 € |
| `claude-haiku-5-5` (le plus économique, moins fin sur les portions) | moins d'un dixième de centime | moins de 10 centimes |

Ce sont des estimations : le prix exact dépend de la photo et de la longueur de la réponse. Tu vois la dépense réelle dans console.anthropic.com.

Pour changer de modèle : Cloudflare → ton Worker → Paramètres → Variables → `MODEL`, ou modifie `relay/wrangler.toml` sur GitHub.

## Protections contre les abus

- **Limite de dépense** sur console.anthropic.com (étape 1) : le plafond qui protège ton porte-monnaie.
- **Seuls ton site et l'appli iPhone** peuvent appeler le relais (`ALLOWED_ORIGINS` dans `relay/wrangler.toml`).
- **6 analyses par minute maximum** par personne (adresse IP).
- **Photos limitées** à environ 1,5 Mo (l'appli les réduit avant l'envoi, ce qui baisse aussi le coût).
- Le relais ne fait **que** deux choses : analyser un plat et lire une étiquette. Personne ne peut s'en servir pour discuter librement avec Claude à tes frais.

Si un jour tu veux tout couper : supprime le secret `ANTHROPIC_API_KEY` dans Cloudflare, ou désactive la clé sur console.anthropic.com.
