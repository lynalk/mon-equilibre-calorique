/* Analyse par IA : passe par la capacité « sample » de Claude quand l'appli est ouverte dans Claude.
   Aucune clé d'API : chaque analyse utilise le compte Claude de la personne qui regarde la page. */
window.AI = (function () {
  "use strict";
  var samplePromise = null;

  function getSample() {
    if (!samplePromise) {
      samplePromise = (window.claude && typeof window.claude.use === "function")
        ? window.claude.use("sample").catch(function () { return null; })
        : Promise.resolve(null);
    }
    return samplePromise;
  }

  /* true si cette vue peut envoyer des images à Claude */
  async function available() {
    var s = await getSample();
    if (!s) return false;
    try { var l = await s.limits(); return !!(l && l.images); } catch (e) { return false; }
  }

  function num(v) { var n = Number(v); return isFinite(n) && n >= 0 ? n : 0; }

  async function analyzeDish(file, hint, signal) {
    var s = await getSample();
    if (!s) throw { code: "unavailable" };
    var prompt =
      "Tu es diététicien·ne. La photo montre un repas. Identifie chaque aliment visible, estime sa quantité en grammes " +
      "(ou en ml pour une boisson), puis les calories et les macronutriments de cette quantité, avec des valeurs de référence " +
      "proches des tables Ciqual. Compte l'huile, le beurre et les sauces visibles. Sois réaliste sur les portions d'un repas en France.\n" +
      (hint ? "Précisions de la personne : " + hint.slice(0, 300) + "\n" : "") +
      "Si la photo ne montre pas de nourriture, renvoie une liste vide.\n" +
      "Réponds uniquement avec ce JSON, noms d'aliments en français :\n" +
      '{"items":[{"name":"Riz basmati cuit","grams":180,"kcal":234,"p":4.9,"c":50.4,"f":0.5}],' +
      '"confidence":"faible|moyenne|bonne","note":"une phrase courte sur ce qui est incertain"}';
    var out = await s.json(prompt, { images: [file], signal: signal, cache: false });
    var items = (out && Array.isArray(out.items) ? out.items : []).map(function (it) {
      return {
        name: String(it && it.name || "Aliment").slice(0, 80),
        grams: num(it.grams), kcal: num(it.kcal), p: num(it.p), c: num(it.c), f: num(it.f)
      };
    }).filter(function (it) { return it.kcal > 0 || it.grams > 0; });
    var conf = String(out && out.confidence || "").toLowerCase();
    if (["faible", "moyenne", "bonne"].indexOf(conf) < 0) conf = "moyenne";
    return { items: items, confidence: conf, note: String(out && out.note || "").slice(0, 300) };
  }

  async function readLabel(file, signal) {
    var s = await getSample();
    if (!s) throw { code: "unavailable" };
    var prompt =
      "La photo montre l'emballage d'un produit alimentaire, normalement son tableau des valeurs nutritionnelles. " +
      "Lis les valeurs pour 100 g (ou 100 ml). Si seules des valeurs par portion sont visibles, convertis-les pour 100 g " +
      "à partir de la taille de portion indiquée. N'invente rien : si le tableau est illisible, mets readable à false.\n" +
      "Réponds uniquement avec ce JSON :\n" +
      '{"readable":true,"name":"nom du produit s\'il est visible, sinon null","kcal":389,"p":13.5,"c":58.7,"f":7,"serving_g":40}';
    var out = await s.json(prompt, { images: [file], signal: signal, cache: false });
    return {
      readable: !!(out && out.readable !== false && Number(out.kcal) > 0),
      name: out && out.name ? String(out.name).slice(0, 80) : "",
      kcal: num(out && out.kcal), p: num(out && out.p), c: num(out && out.c), f: num(out && out.f),
      serving: out && Number(out.serving_g) > 0 ? Number(out.serving_g) : null
    };
  }

  function errorText(e) {
    var c = e && e.code;
    switch (c) {
      case "unavailable":
      case "images_unavailable":
      case "capability_disabled":
      case "capability_removed":
      case "not_declared":
        return "L'analyse par IA fonctionne quand l'appli est ouverte dans Claude.";
      case "not_granted":
        return "Tu n'as pas autorisé l'appli à utiliser Claude. Recharge la page pour qu'elle te le redemande.";
      case "sampling_disabled":
        return "Claude n'est pas disponible pour ce compte.";
      case "rate_limited":
        return "Trop d'analyses d'un coup, ou limite d'utilisation atteinte. Réessaie dans un moment.";
      case "session_expired":
        return "Ta session Claude a expiré. Reconnecte-toi puis réessaie.";
      case "image_rejected":
        return "Cette image n'a pas pu être lue. Essaie une autre photo (JPEG ou PNG).";
      case "refused":
        return "L'IA n'a pas voulu analyser cette image. Essaie une autre photo.";
      case "invalid_json":
      case "empty_completion":
        return "La réponse de l'IA était incomplète. Réessaie.";
      case "cancelled":
        return "";
      default:
        return "L'analyse n'a pas abouti (problème de connexion). Réessaie.";
    }
  }

  return { available: available, analyzeDish: analyzeDish, readLabel: readLabel, errorText: errorText };
})();
