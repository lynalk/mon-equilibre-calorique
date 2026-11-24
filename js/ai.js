/* Analyse par IA de photos (repas, étiquette nutritionnelle).
   - Dans Claude : passe par la capacité « sample » (compte Claude de la personne, aucune clé).
   - Partout ailleurs (site, iPhone) : passe par le relais IA défini dans js/config.js,
     qui garde la clé Anthropic secrète. Aucune clé n'est jamais dans ce code. */
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

  function relayUrl() {
    var u = window.APP_CONFIG && window.APP_CONFIG.RELAY_URL;
    return typeof u === "string" && /^https:\/\//.test(u) ? u.replace(/\/+$/, "") : "";
  }

  var modePromise = null;
  /* "sample" (dans Claude), "relay" (relais configuré) ou "" (rien) */
  function mode() {
    if (!modePromise) {
      modePromise = getSample().then(async function (s) {
        if (s) { try { var l = await s.limits(); if (l && l.images) return "sample"; } catch (e) { /* relais */ } }
        return relayUrl() ? "relay" : "";
      });
    }
    return modePromise;
  }

  /* true si l'appli peut analyser des photos */
  async function available() { return !!(await mode()); }

  /* Réduit la photo (souvent 12 Mpx) en JPEG ~1280 px : envoi rapide et coût IA plus bas. */
  function toJpegBase64(file, maxSide) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.85).split(",")[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject({ code: "image_rejected" }); };
      img.src = url;
    });
  }

  async function callRelay(kind, file, hint, signal) {
    var image = await toJpegBase64(file, 1280);
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, 90000);
    if (signal) {
      if (signal.aborted) ctl.abort();
      signal.addEventListener("abort", function () { ctl.abort(); });
    }
    var r;
    try {
      r = await fetch(relayUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: kind, image: image, media_type: "image/jpeg", hint: hint || "" }),
        signal: ctl.signal
      });
    } catch (e) {
      throw { code: signal && signal.aborted ? "cancelled" : "network" };
    } finally {
      clearTimeout(t);
    }
    var d = null;
    try { d = await r.json(); } catch (e) { /* réponse vide */ }
    if (!r.ok || !d || !d.result) throw { code: (d && d.error) || "network" };
    return d.result;
  }

  /* Envoie la photo à l'IA par le bon chemin et renvoie le JSON demandé. */
  async function ask(kind, prompt, file, hint, signal) {
    var m = await mode();
    if (m === "sample") {
      var s = await getSample();
      return s.json(prompt, { images: [file], signal: signal, cache: false });
    }
    if (m === "relay") return callRelay(kind, file, hint, signal);
    throw { code: "unavailable" };
  }

  function num(v) { var n = Number(v); return isFinite(n) && n >= 0 ? n : 0; }

  async function analyzeDish(file, hint, signal) {
    var prompt =
      "Tu es diététicien·ne. La photo montre un repas. Identifie chaque aliment visible, estime sa quantité en grammes " +
      "(ou en ml pour une boisson), puis les calories et les macronutriments de cette quantité, avec des valeurs de référence " +
      "proches des tables Ciqual. Compte l'huile, le beurre et les sauces visibles. Sois réaliste sur les portions d'un repas en France.\n" +
      (hint ? "Précisions de la personne : " + hint.slice(0, 300) + "\n" : "") +
      "Si la photo ne montre pas de nourriture, renvoie une liste vide.\n" +
      "Réponds uniquement avec ce JSON, noms d'aliments en français :\n" +
      '{"items":[{"name":"Riz basmati cuit","grams":180,"kcal":234,"p":4.9,"c":50.4,"f":0.5}],' +
      '"confidence":"faible|moyenne|bonne","note":"une phrase courte sur ce qui est incertain"}';
    var out = await ask("dish", prompt, file, hint, signal);
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
    var prompt =
      "La photo montre l'emballage d'un produit alimentaire, normalement son tableau des valeurs nutritionnelles. " +
      "Lis les valeurs pour 100 g (ou 100 ml). Si seules des valeurs par portion sont visibles, convertis-les pour 100 g " +
      "à partir de la taille de portion indiquée. N'invente rien : si le tableau est illisible, mets readable à false.\n" +
      "Réponds uniquement avec ce JSON :\n" +
      '{"readable":true,"name":"nom du produit s\'il est visible, sinon null","kcal":389,"p":13.5,"c":58.7,"f":7,"serving_g":40}';
    var out = await ask("label", prompt, file, "", signal);
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
        return "L'analyse photo par IA n'est pas encore activée sur cette version de l'appli. Utilise la recherche ou la saisie libre en attendant.";
      case "not_configured":
      case "forbidden":
        return "Le service d'analyse photo n'est pas encore prêt. Réessaie plus tard, ou utilise la recherche.";
      case "too_large":
        return "Cette photo est trop lourde. Essaie une autre photo.";
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
      case "upstream":
        return "La réponse de l'IA était incomplète. Réessaie.";
      case "cancelled":
        return "";
      default:
        return "L'analyse n'a pas abouti (problème de connexion). Réessaie.";
    }
  }

  return { available: available, analyzeDish: analyzeDish, readLabel: readLabel, errorText: errorText };
})();
