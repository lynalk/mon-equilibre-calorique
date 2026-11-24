/* Réglages de l'appli.
   RELAY_URL : adresse du relais IA (Cloudflare Worker) qui permet la photo IA hors de Claude.
   Laisse vide tant que le relais n'est pas en ligne. Exemple :
   RELAY_URL: "https://mon-equilibre-ia.ton-compte.workers.dev" */
window.APP_CONFIG = {
  RELAY_URL: ""
};
