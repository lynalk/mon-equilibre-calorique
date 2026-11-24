/* Lecture de code-barres depuis une photo, puis recherche du produit dans Open Food Facts. */
window.Barcode = (function () {
  "use strict";
  var ZXING_URL = "https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js";
  var zxingPromise = null;

  function loadZXing() {
    if (window.ZXing) return Promise.resolve(window.ZXing);
    if (!zxingPromise) {
      zxingPromise = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = ZXING_URL;
        s.onload = function () { window.ZXing ? resolve(window.ZXing) : reject(new Error("zxing")); };
        s.onerror = function () { zxingPromise = null; reject(new Error("zxing")); };
        document.head.appendChild(s);
      });
    }
    return zxingPromise;
  }

  /* Réduit la photo (souvent 12 Mpx) pour que le décodage reste rapide. */
  function fileToCanvas(file, maxSide) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("image")); };
      img.src = url;
    });
  }

  async function decodeFile(file) {
    var canvas = await fileToCanvas(file, 1400);
    if ("BarcodeDetector" in window) {
      try {
        var det = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        var found = await det.detect(canvas);
        if (found && found.length) return found[0].rawValue;
      } catch (e) { /* on passe à ZXing */ }
    }
    var ZX = await loadZXing();
    var hints = new Map();
    hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [ZX.BarcodeFormat.EAN_13, ZX.BarcodeFormat.EAN_8, ZX.BarcodeFormat.UPC_A, ZX.BarcodeFormat.UPC_E]);
    hints.set(ZX.DecodeHintType.TRY_HARDER, true);
    var reader = new ZX.BrowserMultiFormatReader(hints);
    var tries = [canvas];
    if (Math.max(canvas.width, canvas.height) > 800) tries.push(await fileToCanvas(file, 800));
    for (var i = 0; i < tries.length; i++) {
      try {
        var res = await reader.decodeFromImageUrl(tries[i].toDataURL("image/jpeg", 0.92));
        if (res) return res.getText();
      } catch (e) { /* pas trouvé à cette taille */ }
    }
    return null;
  }

  function isValid(code) { return /^\d{8,14}$/.test(code); }

  /* Résultat : {status:"found", product} | {status:"unknown"} | {status:"offline"} */
  async function lookup(code) {
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, 7000);
    try {
      var r = await fetch("https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) +
        ".json?fields=product_name,product_name_fr,brands,nutriments,serving_quantity", { signal: ctl.signal });
      if (r.status === 404) return { status: "unknown" };
      if (!r.ok) return { status: "offline" };
      var d = await r.json();
      var p = d && d.product;
      var n = p && p.nutriments;
      if (!p || d.status === 0 || !n || n["energy-kcal_100g"] == null) return { status: "unknown" };
      var name = (p.product_name_fr || p.product_name || "Produit " + code).trim();
      var brand = (p.brands || "").split(",")[0].trim();
      return {
        status: "found",
        product: {
          name: brand && name.toLowerCase().indexOf(brand.toLowerCase()) < 0 ? name + " (" + brand + ")" : name,
          kcal: Number(n["energy-kcal_100g"]) || 0,
          p: Number(n.proteins_100g) || 0,
          c: Number(n.carbohydrates_100g) || 0,
          f: Number(n.fat_100g) || 0,
          serving: Number(p.serving_quantity) > 0 ? Number(p.serving_quantity) : null
        }
      };
    } catch (e) {
      return { status: "offline" };
    } finally {
      clearTimeout(t);
    }
  }

  function mapProduct(p, code) {
    var n = p && p.nutriments;
    if (!p || !n || n["energy-kcal_100g"] == null) return null;
    var name = (p.product_name_fr || p.product_name || "").trim();
    if (!name) return null;
    var brand = (p.brands || "").split(",")[0].trim();
    return {
      name: brand && name.toLowerCase().indexOf(brand.toLowerCase()) < 0 ? name + " (" + brand + ")" : name,
      kcal: Number(n["energy-kcal_100g"]) || 0,
      p: Number(n.proteins_100g) || 0,
      c: Number(n.carbohydrates_100g) || 0,
      f: Number(n.fat_100g) || 0,
      serving: Number(p.serving_quantity) > 0 ? Number(p.serving_quantity) : null,
      barcode: code || p.code || null
    };
  }

  /* Recherche par nom dans les produits du commerce vendus en France.
     Résultat : {status:"ok", products:[...]} | {status:"offline"} */
  async function search(query, signal) {
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, 9000);
    if (signal) signal.addEventListener("abort", function () { ctl.abort(); });
    try {
      var url = "https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=20" +
        "&tagtype_0=countries&tag_contains_0=contains&tag_0=france" +
        "&fields=code,product_name,product_name_fr,brands,nutriments,serving_quantity&search_terms=" + encodeURIComponent(query);
      var r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) return { status: "offline" };
      var d = await r.json();
      var products = (d.products || []).map(function (p) { return mapProduct(p); }).filter(Boolean);
      return { status: "ok", products: products };
    } catch (e) {
      return { status: signal && signal.aborted ? "cancelled" : "offline" };
    } finally {
      clearTimeout(t);
    }
  }

  return { decodeFile: decodeFile, lookup: lookup, search: search, isValid: isValid };
})();
