(function () {
"use strict";
var KEY = "mon-equilibre.v1";
var MEALS = [
  { id: "pdj", label: "Petit-déjeuner" },
  { id: "dej", label: "Déjeuner" },
  { id: "col", label: "Collation" },
  { id: "din", label: "Dîner" }
];
var FOODS = window.FOODS;

/* ---------- Dates ---------- */
function keyOf(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function parseKey(k) { var p = k.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function todayKey() { return keyOf(new Date()); }
function shift(k, n) { var d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); }

/* ---------- État ---------- */
var uid = 0;
function newId() { uid++; return Date.now().toString(36) + uid.toString(36); }
function entryFrom(f, g, meal) {
  var r = g / 100;
  return { id: newId(), meal: meal, foodId: f.id, name: f.name, grams: g,
    kcal: Math.round(f.kcal * r), p: +(f.p * r).toFixed(1), c: +(f.c * r).toFixed(1), f: +(f.f * r).toFixed(1) };
}
function exampleState() {
  var t = todayKey();
  var mk = function (meal, name, g) { return entryFrom(FOODS.find(function (x) { return x.name === name; }), g, meal); };
  var w = {}; w[shift(t, -14)] = 63.4; w[shift(t, -7)] = 62.8; w[t] = 62.4;
  var days = {};
  days[t] = [mk("pdj", "Flocons d'avoine", 40), mk("pdj", "Lait demi-écrémé", 200), mk("pdj", "Banane", 120),
    mk("dej", "Blanc de poulet cuit", 120), mk("dej", "Riz blanc cuit", 180), mk("dej", "Brocoli cuit", 150), mk("dej", "Huile d'olive", 10),
    mk("col", "Skyr nature", 150)];
  return { example: true, profile: { sex: "f", age: 32, height: 165, weight: 62.4, bodyfat: "", activity: "1.55", goal: "-250" },
    days: days, myFoods: [], weights: w };
}
function load() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var s = JSON.parse(raw);
      if (s && s.profile && s.days) { s.myFoods = s.myFoods || []; s.weights = s.weights || {}; return s; }
    }
  } catch (e) {}
  return exampleState();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
var state = load();
var day = todayKey();

function allFoods() { return state.myFoods.concat(FOODS); }
function findFood(id) { return allFoods().find(function (f) { return f.id === id; }); }

/* ---------- Calculs ---------- */
function calc(p) {
  var age = +p.age, h = +p.height, w = +p.weight, bf = p.bodyfat === "" || p.bodyfat == null ? null : +p.bodyfat;
  var act = +p.activity, adj = +p.goal, errs = [];
  if (!(age >= 15 && age <= 100)) errs.push("l'âge (15 à 100 ans)");
  if (!(h >= 120 && h <= 230)) errs.push("la taille (120 à 230 cm)");
  if (!(w >= 30 && w <= 300)) errs.push("le poids (30 à 300 kg)");
  if (bf !== null && !(bf >= 3 && bf <= 60)) errs.push("la masse grasse (3 à 60 %)");
  if (errs.length) return { ok: false, errs: errs };
  var msj = 10 * w + 6.25 * h - 5 * age + (p.sex === "h" ? 5 : -161);
  var lbm = null, km = null;
  if (bf !== null) { lbm = w * (1 - bf / 100); km = 370 + 21.6 * lbm; }
  var bmr = km !== null ? km : msj;
  var tdee = bmr * act;
  var floor = p.sex === "h" ? 1500 : 1200;
  var target = Math.round((tdee + adj) / 10) * 10, floored = false;
  if (target < floor) { target = floor; floored = true; }
  var prot = Math.round(lbm ? Math.max(lbm * 2.2, w * 1.4) : w * (adj < 0 ? 1.8 : 1.6));
  var fat = Math.round(target * 0.30 / 9);
  var carb = Math.max(0, Math.round((target - prot * 4 - fat * 9) / 4));
  return { ok: true, msj: msj, km: km, lbm: lbm, tdee: tdee, target: target, floored: floored, floor: floor, adj: adj,
    prot: prot, fat: fat, carb: carb, usedKM: km !== null };
}

/* ---------- Utilitaires ---------- */
var $ = function (id) { return document.getElementById(id); };
var fmt = function (n) { return Math.round(n).toLocaleString("fr-FR"); };
var fmt1 = function (n) { return (Math.round(n * 10) / 10).toLocaleString("fr-FR"); };
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
var toastT;
function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2000); }
function entries(k) { return state.days[k || day] || []; }
function dayTotal(k) { return entries(k).reduce(function (a, e) { return a + e.kcal; }, 0); }
function statusBox(el, kind, text) {
  el.hidden = !text;
  el.className = "status" + (kind === "err" ? " err" : "");
  el.innerHTML = (kind === "busy" ? '<span class="spin" aria-hidden="true"></span>' : "") + "<span></span>";
  el.lastChild.textContent = text || "";
}
function leaveExample() { if (state.example) { state.days = {}; state.weights = {}; state.example = false; } }

/* ---------- Journal ---------- */
function dateLabel(k) {
  var t = todayKey();
  if (k === t) return "Aujourd'hui";
  if (k === shift(t, -1)) return "Hier";
  var s = parseKey(k).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function renderJournal() {
  $("dateLabel").textContent = dateLabel(day);
  $("nextDay").disabled = day >= todayKey();
  $("exampleBanner").hidden = !state.example;
  var r = calc(state.profile), list = entries();
  var tot = list.reduce(function (a, e) { return { k: a.k + e.kcal, p: a.p + e.p, c: a.c + e.c, f: a.f + e.f }; }, { k: 0, p: 0, c: 0, f: 0 });
  var target = r.ok ? r.target : 0;
  $("eaten").textContent = fmt(tot.k);
  $("ofTarget").textContent = target ? "/ " + fmt(target) + " kcal" : "kcal";
  var C = 326.7, pct = target ? Math.min(tot.k / target, 1) : 0;
  $("ringVal").style.strokeDashoffset = String(C * (1 - pct));
  var over = target && tot.k > target;
  $("ring").classList.toggle("over", !!over);
  var rem = $("remain");
  if (!target) { rem.textContent = "Profil à compléter"; rem.classList.remove("over"); $("remainLabel").textContent = "Objectif"; }
  else if (over) { rem.textContent = "+" + fmt(tot.k - target) + " kcal"; rem.classList.add("over"); $("remainLabel").textContent = "Au-dessus de l'objectif"; }
  else { rem.textContent = fmt(target - tot.k) + " kcal"; rem.classList.remove("over"); $("remainLabel").textContent = day === todayKey() ? "Reste aujourd'hui" : "Restait ce jour-là"; }
  var mac = [["Protéines", tot.p, r.ok ? r.prot : 0, "--prot"], ["Glucides", tot.c, r.ok ? r.carb : 0, "--gluc"], ["Lipides", tot.f, r.ok ? r.fat : 0, "--lip"]];
  $("macros").innerHTML = mac.map(function (m) {
    var w = m[2] ? Math.min(100, m[1] / m[2] * 100) : 0;
    return '<div class="macro"><span>' + m[0] + '</span><div class="bar"><span style="width:' + w + '%;background:var(' + m[3] + ')"></span></div><span class="num muted">' + fmt(m[1]) + (m[2] ? " / " + fmt(m[2]) : "") + ' g</span></div>';
  }).join("");
  var prev = entries(shift(day, -1));
  $("meals").innerHTML = MEALS.map(function (m) {
    var items = list.filter(function (e) { return e.meal === m.id; });
    var sum = items.reduce(function (a, e) { return a + e.kcal; }, 0);
    var lis = items.map(function (e) {
      return '<li class="item"><div style="min-width:0"><div class="name">' + esc(e.name) + '</div><div class="meta num">' +
        (e.grams ? fmt(e.grams) + " g · " : "") + "P " + fmt1(e.p) + " · G " + fmt1(e.c) + " · L " + fmt1(e.f) +
        '</div></div><span class="kcal num">' + fmt(e.kcal) + '</span><button class="icon-btn" data-del="' + e.id + '" aria-label="Supprimer ' + esc(e.name) +
        '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>';
    }).join("");
    var prevCount = prev.filter(function (e) { return e.meal === m.id; }).length;
    var copy = !items.length && prevCount ? '<button class="copy-btn" data-copy="' + m.id + '">Reprendre le ' + m.label.toLowerCase() + " de la veille (" + prevCount + " aliment" + (prevCount > 1 ? "s" : "") + ")</button>" : "";
    return '<div class="card"><div class="meal-head"><h2>' + m.label + '</h2><span class="muted num small">' + fmt(sum) + ' kcal</span></div>' +
      (items.length ? '<ul class="items">' + lis + "</ul>" : '<div class="empty">Rien de noté pour l\'instant.</div>') +
      '<button class="add-btn" data-add="' + m.id + '">+ Ajouter</button>' + copy + "</div>";
  }).join("");
}
$("prevDay").onclick = function () { day = shift(day, -1); renderJournal(); };
$("nextDay").onclick = function () { if (day < todayKey()) { day = shift(day, 1); renderJournal(); } };
$("clearExample").onclick = function () {
  state.days = {}; state.weights = {}; state.example = false; save(); renderJournal();
  location.hash = "#profil"; toast("Exemple effacé. Renseigne ton profil.");
};
$("meals").addEventListener("click", function (e) {
  var del = e.target.closest("[data-del]");
  if (del) {
    var id = del.dataset.del;
    state.days[day] = entries().filter(function (x) { return x.id !== id; });
    if (!state.days[day].length) delete state.days[day];
    save(); renderJournal(); toast("Supprimé"); return;
  }
  var cp = e.target.closest("[data-copy]");
  if (cp) {
    var meal = cp.dataset.copy;
    var src = entries(shift(day, -1)).filter(function (x) { return x.meal === meal; });
    leaveExample();
    state.days[day] = (state.days[day] || []).concat(src.map(function (x) { return Object.assign({}, x, { id: newId() }); }));
    save(); renderJournal(); toast("Repas repris de la veille"); return;
  }
  var add = e.target.closest("[data-add]");
  if (add) openSheet(add.dataset.add);
});

/* ---------- Progrès ---------- */
function weightKeys() { return Object.keys(state.weights).sort(); }
function renderProgress() {
  if (!$("wDate").value) $("wDate").value = todayKey();
  $("wDate").max = todayKey();
  var keys = weightKeys(), r = calc(state.profile);
  // Statistiques
  var last = keys.length ? state.weights[keys[keys.length - 1]] : null;
  var first = keys.length ? state.weights[keys[0]] : null;
  var weekAgo = shift(todayKey(), -7), past = keys.filter(function (k) { return k <= weekAgo; });
  var ref = past.length ? state.weights[past[past.length - 1]] : null;
  var sign = function (v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + fmt1(Math.abs(v)) + " kg"; };
  $("wStats").innerHTML =
    '<div class="stat"><span>Actuel</span><b class="num">' + (last != null ? fmt1(last) + " kg" : "–") + "</b></div>" +
    '<div class="stat"><span>Sur 7 jours</span><b class="num">' + (last != null && ref != null ? sign(last - ref) : "–") + "</b></div>" +
    '<div class="stat"><span>Depuis le début</span><b class="num">' + (keys.length > 1 ? sign(last - first) : "–") + "</b></div>";
  $("wChart").innerHTML = keys.length >= 2 ? weightChart(keys) : '<p class="empty">Note au moins deux pesées pour voir la courbe.</p>';
  $("wList").innerHTML = keys.slice().reverse().slice(0, 10).map(function (k) {
    return '<li><span>' + esc(dateLabel(k)) + '</span><span style="display:flex;align-items:center;gap:6px"><b class="num">' + fmt1(state.weights[k]) +
      ' kg</b><button class="icon-btn" data-wdel="' + k + '" aria-label="Supprimer la pesée"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span></li>';
  }).join("");
  // Semaine
  var days7 = []; for (var i = 6; i >= 0; i--) days7.push(shift(todayKey(), -i));
  var totals = days7.map(dayTotal);
  var logged = totals.filter(function (v) { return v > 0; });
  var avg = logged.length ? logged.reduce(function (a, b) { return a + b; }, 0) / logged.length : 0;
  $("weekSummary").textContent = logged.length
    ? "Moyenne " + fmt(avg) + " kcal sur " + logged.length + " jour" + (logged.length > 1 ? "s" : "") + " noté" + (logged.length > 1 ? "s" : "") + (r.ok ? ", pour un objectif de " + fmt(r.target) + " kcal." : ".")
    : "Aucun repas noté cette semaine.";
  $("weekChart").innerHTML = weekChart(days7, totals, r.ok ? r.target : 0);
}
function weightChart(keys) {
  var W = 340, H = 150, L = 34, R = 10, T = 10, B = 22;
  var t0 = parseKey(keys[0]).getTime(), t1 = parseKey(keys[keys.length - 1]).getTime();
  var vals = keys.map(function (k) { return state.weights[k]; });
  var lo = Math.floor(Math.min.apply(null, vals) - 0.5), hi = Math.ceil(Math.max.apply(null, vals) + 0.5);
  var x = function (k) { return L + (t1 === t0 ? 0.5 : (parseKey(k).getTime() - t0) / (t1 - t0)) * (W - L - R); };
  var y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
  var step = Math.max(1, Math.ceil((hi - lo) / 4));
  var grid = "";
  for (var v = lo; v <= hi; v += step) grid += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + v + "</text>";
  var pts = keys.map(function (k) { return x(k).toFixed(1) + "," + y(state.weights[k]).toFixed(1); });
  var area = "M" + x(keys[0]) + "," + (H - B) + " L" + pts.join(" L") + " L" + x(keys[keys.length - 1]) + "," + (H - B) + "Z";
  var lastK = keys[keys.length - 1];
  var fmtD = function (k) { return parseKey(k).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); };
  return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Courbe de poids">' + grid +
    '<path d="' + area + '" fill="var(--accent-soft)" stroke="none"/>' +
    '<polyline points="' + pts.join(" ") + '" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<circle cx="' + x(lastK) + '" cy="' + y(state.weights[lastK]) + '" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>' +
    '<text x="' + L + '" y="' + (H - 6) + '">' + esc(fmtD(keys[0])) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(fmtD(lastK)) + "</text></svg>";
}
function weekChart(days7, totals, target) {
  var W = 340, H = 150, L = 8, R = 8, T = 16, B = 22;
  var max = Math.max(target * 1.25, Math.max.apply(null, totals), 500);
  var bw = (W - L - R) / 7;
  var y = function (v) { return T + (1 - v / max) * (H - T - B); };
  var bars = days7.map(function (k, i) {
    var v = totals[i], bx = L + i * bw + bw * 0.18, w = bw * 0.64;
    var col = target && v > target ? "var(--warm)" : "var(--accent)";
    var lbl = parseKey(k).toLocaleDateString("fr-FR", { weekday: "narrow" }).toUpperCase();
    return (v ? '<rect x="' + bx.toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (H - B - y(v)).toFixed(1) + '" rx="4" fill="' + col + '"/>' +
      '<text x="' + (bx + w / 2).toFixed(1) + '" y="' + (y(v) - 4).toFixed(1) + '" text-anchor="middle">' + fmt(v) + "</text>" : "") +
      '<text x="' + (bx + w / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + lbl + "</text>";
  }).join("");
  var tl = target ? '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(target) + '" y2="' + y(target) + '" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 4"/>' : "";
  return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Calories des 7 derniers jours"><line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>' + bars + tl + "</svg>";
}
$("wAdd").onclick = function () {
  var k = $("wDate").value || todayKey(), kg = parseFloat(String($("wKg").value).replace(",", "."));
  if (!(kg >= 30 && kg <= 300)) { toast("Indique un poids entre 30 et 300 kg"); $("wKg").focus(); return; }
  if (k > todayKey()) k = todayKey();
  leaveExample();
  state.weights[k] = Math.round(kg * 10) / 10;
  var keys = weightKeys();
  if (k === keys[keys.length - 1]) state.profile.weight = state.weights[k];
  save(); $("wKg").value = ""; renderProgress(); toast("Pesée notée");
};
$("wList").addEventListener("click", function (e) {
  var b = e.target.closest("[data-wdel]");
  if (!b) return;
  delete state.weights[b.dataset.wdel]; save(); renderProgress();
});

/* ---------- Profil ---------- */
function fillProfileForm() {
  var p = state.profile;
  document.querySelectorAll("#sexSeg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === p.sex)); });
  $("age").value = p.age; $("height").value = p.height; $("weight").value = p.weight; $("bodyfat").value = p.bodyfat;
  $("activity").value = p.activity; $("goal").value = p.goal;
}
function renderResults() {
  var r = calc(state.profile), err = $("profileError");
  if (!r.ok) {
    err.hidden = false; err.textContent = "Vérifie " + r.errs.join(", ") + ".";
    $("rTarget").textContent = "–"; $("rRows").innerHTML = ""; $("rNote").hidden = true; $("rFormula").textContent = "";
  } else {
    err.hidden = true;
    $("rTarget").innerHTML = fmt(r.target) + ' <span style="font-size:1rem;color:var(--muted)">kcal / jour</span>';
    var rows = [["Métabolisme de base (Mifflin-St Jeor)", fmt(r.msj) + " kcal"]];
    if (r.usedKM) { rows.push(["Masse maigre", fmt1(r.lbm) + " kg"]); rows.push(["Métabolisme de base (Katch-McArdle)", fmt(r.km) + " kcal"]); }
    rows.push(["Dépense totale estimée", fmt(r.tdee) + " kcal"]);
    rows.push(["Ajustement objectif", (r.adj > 0 ? "+" : "") + fmt(r.adj) + " kcal"]);
    rows.push(["Protéines", fmt(r.prot) + " g"], ["Glucides", fmt(r.carb) + " g"], ["Lipides (30 % des calories)", fmt(r.fat) + " g"]);
    $("rRows").innerHTML = rows.map(function (x) { return '<div class="row"><span>' + x[0] + '</span><b class="num">' + x[1] + "</b></div>"; }).join("");
    var note = $("rNote");
    if (r.floored) { note.hidden = false; note.textContent = "L'objectif calculé passait sous " + fmt(r.floor) + " kcal. Il est ramené à ce plancher, car descendre plus bas sans suivi médical n'est pas recommandé."; }
    else note.hidden = true;
    $("rFormula").innerHTML = r.usedKM
      ? "Calcul retenu : <b>Katch-McArdle</b>, plus précis quand la masse grasse est connue. <code>370 + 21,6 × masse maigre</code>, puis × le coefficient d'activité."
      : "Calcul retenu : <b>Mifflin-St Jeor</b>. <code>10 × poids + 6,25 × taille − 5 × âge " + (state.profile.sex === "h" ? "+ 5" : "− 161") + "</code>, puis × le coefficient d'activité. Renseigne ta masse grasse pour passer en Katch-McArdle.";
  }
  $("myFoodsList").innerHTML = state.myFoods.length ? state.myFoods.map(function (f) {
    return '<li><span style="min-width:0"><b>' + esc(f.name) + '</b><br><span class="small muted num">' + fmt(f.kcal) + " kcal / 100 g" + (f.barcode ? " · " + esc(f.barcode) : "") +
      '</span></span><button class="icon-btn" data-mfdel="' + f.id + '" aria-label="Supprimer ' + esc(f.name) + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>';
  }).join("") : '<li class="empty">Aucun pour l\'instant. Scanne un code-barres pour en ajouter.</li>';
}
document.querySelectorAll("#sexSeg button").forEach(function (b) { b.onclick = function () { state.profile.sex = b.dataset.v; onProfile(); fillProfileForm(); }; });
["age", "height", "weight", "bodyfat", "activity", "goal"].forEach(function (id) {
  $(id).addEventListener("input", function () { state.profile[id] = $(id).value; onProfile(); });
});
function onProfile() { state.example = false; save(); renderResults(); }
$("myFoodsList").addEventListener("click", function (e) {
  var b = e.target.closest("[data-mfdel]");
  if (!b) return;
  state.myFoods = state.myFoods.filter(function (f) { return f.id !== b.dataset.mfdel; }); save(); renderResults();
});
function wipeHandler() {
  $("wipeArea").innerHTML = '<p class="small" style="margin:0 0 10px">Le profil, l\'historique des repas, les pesées et tes aliments enregistrés seront supprimés de cet appareil.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn danger" id="wipeYes">Oui, tout effacer</button><button class="btn ghost" id="wipeNo">Annuler</button></div>';
  $("wipeYes").onclick = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    state = { example: false, profile: { sex: "f", age: "", height: "", weight: "", bodyfat: "", activity: "1.375", goal: "0" }, days: {}, myFoods: [], weights: {} };
    save(); resetWipe(); fillProfileForm(); renderResults(); toast("Données effacées");
  };
  $("wipeNo").onclick = resetWipe;
}
function resetWipe() { $("wipeArea").innerHTML = '<button class="btn ghost" id="wipeBtn">Effacer toutes mes données</button>'; $("wipeBtn").onclick = wipeHandler; }
$("wipeBtn").onclick = wipeHandler;

/* ---------- Vues ---------- */
var VIEWS = ["journal", "progres", "profil"];
function route() {
  var v = location.hash.slice(1);
  if (VIEWS.indexOf(v) < 0) v = "journal";
  VIEWS.forEach(function (n) {
    $("view-" + n).hidden = n !== v;
    if (n === v) $("tab-" + n).setAttribute("aria-current", "page"); else $("tab-" + n).removeAttribute("aria-current");
  });
  $("datenav").style.visibility = v === "journal" ? "visible" : "hidden";
  if (v === "journal") renderJournal();
  else if (v === "progres") renderProgress();
  else { fillProfileForm(); renderResults(); }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* ---------- Feuille d'ajout ---------- */
var dlg = $("addDialog");
$("mealSel").innerHTML = MEALS.map(function (m) { return '<option value="' + m.id + '">' + m.label + "</option>"; }).join("");
var picked = null, mode = "search", aiCtl = null;

function setMode(m) {
  mode = m;
  document.querySelectorAll("#modeTabs button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === m)); });
  ["search", "barcode", "photo", "manual"].forEach(function (n) { $("mode-" + n).hidden = n !== m; });
  $("qtyStep").hidden = true;
  if (aiCtl) { aiCtl.abort(); aiCtl = null; }
  if (m === "barcode") resetBarcode();
  if (m === "photo") resetPhoto();
}
document.querySelectorAll("#modeTabs button").forEach(function (b) { b.onclick = function () { setMode(b.dataset.v); }; });

/* Chercher */
function norm(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function recentFoods() {
  var seen = {}, out = [];
  var keys = Object.keys(state.days).sort().reverse();
  for (var i = 0; i < keys.length; i++) {
    var list = state.days[keys[i]].slice().reverse();
    for (var j = 0; j < list.length; j++) {
      var f = list[j].foodId ? findFood(list[j].foodId) : allFoods().find(function (x) { return x.name === list[j].name; });
      if (f && !seen[f.id]) { seen[f.id] = 1; out.push(f); if (out.length >= 5) return out; }
    }
  }
  return out;
}
function foodBtn(f) { return '<li><button type="button" data-food="' + f.id + '"><span class="fname">' + esc(f.name) + '</span><span class="fk num">' + fmt(f.kcal) + " kcal / 100 g</span></button></li>"; }
function renderFoods() {
  var q = norm($("foodSearch").value.trim()), html = "";
  if (!q) {
    var rec = recentFoods();
    if (rec.length) html += '<li class="group">Récents</li>' + rec.map(foodBtn).join("");
    if (state.myFoods.length) html += '<li class="group">Mes aliments</li>' + state.myFoods.map(foodBtn).join("");
    var g = "";
    FOODS.forEach(function (f) { if (f.group !== g) { g = f.group; html += '<li class="group">' + esc(g) + "</li>"; } html += foodBtn(f); });
  } else {
    var res = allFoods().filter(function (f) { return norm(f.name).indexOf(q) > -1 || norm(f.group || "").indexOf(q) > -1; });
    html = res.length ? res.map(foodBtn).join("") : '<li class="group" style="text-transform:none;letter-spacing:0;font-weight:500;padding:12px">Aucun aliment trouvé. Essaie le code-barres, la photo ou la saisie libre.</li>';
  }
  $("foodList").innerHTML = html;
}
$("foodSearch").addEventListener("input", renderFoods);
$("foodList").addEventListener("click", function (e) { var b = e.target.closest("[data-food]"); if (b) pick(findFood(b.dataset.food)); });

/* Quantité */
function pick(f) {
  picked = f;
  ["search", "barcode"].forEach(function (n) { $("mode-" + n).hidden = true; });
  $("qtyStep").hidden = false;
  $("pickedName").textContent = f.name;
  var portions = (f.portions || []).slice();
  if (f.serving && !portions.length) portions.push(["1 portion", f.serving]);
  $("grams").value = portions.length ? portions[0][1] : 100;
  var chips = portions.concat([["100 g", 100]]);
  $("portionChips").innerHTML = chips.map(function (c) { return '<button type="button" class="chip" data-g="' + c[1] + '">' + esc(c[0]) + (c[0] === "100 g" ? "" : " · " + fmt(c[1]) + " g") + "</button>"; }).join("");
  updatePreview();
}
$("portionChips").addEventListener("click", function (e) { var c = e.target.closest("[data-g]"); if (c) { $("grams").value = c.dataset.g; updatePreview(); } });
$("grams").addEventListener("input", updatePreview);
function updatePreview() {
  var g = +$("grams").value || 0;
  document.querySelectorAll("#portionChips .chip").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.g === g)); });
  if (!picked) return;
  var r = g / 100;
  $("pvKcal").textContent = fmt(picked.kcal * r) + " kcal";
  $("pvMacros").textContent = "P " + fmt1(picked.p * r) + " g · G " + fmt1(picked.c * r) + " g · L " + fmt1(picked.f * r) + " g";
  $("addFood").disabled = !(g > 0 && g <= 3000);
}
$("changeFood").onclick = function () { picked = null; setMode(mode); if (mode === "search") $("foodSearch").focus(); };
function pushEntries(list) {
  leaveExample();
  state.days[day] = (state.days[day] || []).concat(list);
  save();
}
$("addFood").onclick = function () {
  var g = +$("grams").value; if (!picked || !(g > 0)) return;
  pushEntries([entryFrom(picked, g, $("mealSel").value)]);
  closeSheet(); renderJournal(); toast(picked.name + " ajouté");
};

/* Code-barres */
var currentCode = "";
function resetBarcode() {
  currentCode = ""; $("bcCode").value = "";
  statusBox($("bcStatus"), "", "");
  $("labelStep").hidden = true; $("productForm").hidden = true;
}
async function handleBarcodeFile(file) {
  if (!file) return;
  $("labelStep").hidden = true; $("productForm").hidden = true;
  statusBox($("bcStatus"), "busy", "Lecture du code-barres…");
  var code = null;
  try { code = await Barcode.decodeFile(file); } catch (e) { code = null; }
  if (!code) { statusBox($("bcStatus"), "err", "Code-barres illisible. Rapproche-toi, évite les reflets, ou tape les chiffres sous les barres."); return; }
  $("bcCode").value = code;
  lookupCode(code);
}
$("bcCamera").addEventListener("change", function () { handleBarcodeFile(this.files[0]); this.value = ""; });
$("bcGallery").addEventListener("change", function () { handleBarcodeFile(this.files[0]); this.value = ""; });
$("bcLookup").onclick = function () { lookupCode($("bcCode").value.replace(/\s/g, "")); };
$("bcCode").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("bcLookup").click(); } });
async function lookupCode(code) {
  $("labelStep").hidden = true; $("productForm").hidden = true;
  if (!Barcode.isValid(code)) { statusBox($("bcStatus"), "err", "Un code-barres compte 8 à 14 chiffres."); return; }
  currentCode = code;
  var mine = state.myFoods.find(function (f) { return f.barcode === code; });
  if (mine) { statusBox($("bcStatus"), "", ""); pick(mine); toast("Produit retrouvé dans tes aliments"); return; }
  statusBox($("bcStatus"), "busy", "Recherche du produit " + code + "…");
  var res = await Barcode.lookup(code);
  if (currentCode !== code) return;
  if (res.status === "found") {
    statusBox($("bcStatus"), "", "");
    showProductForm(res.product, "Source : Open Food Facts. Vérifie les valeurs avant d'enregistrer.");
    return;
  }
  statusBox($("bcStatus"), "", res.status === "unknown"
    ? "Produit " + code + " inconnu de la base Open Food Facts."
    : "Code " + code + " lu. La base produits n'est pas joignable d'ici, l'étiquette fera l'affaire.");
  $("labelStep").hidden = false;
  AI.available().then(function (ok) { $("lbCamera").closest("label").hidden = !ok; });
}
function showProductForm(p, source) {
  $("productForm").hidden = false;
  $("pfName").value = p.name || ""; $("pfKcal").value = p.kcal ? fmt1(p.kcal).replace(",", ".") : "";
  $("pfP").value = p.p != null ? String(Math.round(p.p * 10) / 10) : ""; $("pfC").value = p.c != null ? String(Math.round(p.c * 10) / 10) : "";
  $("pfF").value = p.f != null ? String(Math.round(p.f * 10) / 10) : ""; $("pfServing").value = p.serving || "";
  $("pfSource").textContent = source;
  $("pfName").focus();
}
$("lbManualBtn").onclick = function () { $("labelStep").hidden = true; showProductForm({}, "Recopie les valeurs pour 100 g indiquées sur l'emballage."); };
$("lbManualBtn").onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.click(); } };
$("lbCamera").addEventListener("change", async function () {
  var file = this.files[0]; this.value = "";
  if (!file) return;
  if (aiCtl) aiCtl.abort();
  var ctl = aiCtl = new AbortController();
  statusBox($("bcStatus"), "busy", "L'IA lit l'étiquette… (10 à 40 secondes)");
  try {
    var r = await AI.readLabel(file, ctl.signal);
    if (ctl !== aiCtl) return;
    if (!r.readable) { statusBox($("bcStatus"), "err", "Étiquette illisible. Reprends la photo bien à plat, ou saisis les valeurs toi-même."); return; }
    statusBox($("bcStatus"), "", "");
    $("labelStep").hidden = true;
    showProductForm(r, "Valeurs lues par l'IA sur l'étiquette. Vérifie-les avant d'enregistrer.");
  } catch (e) {
    if (ctl !== aiCtl) return;
    var msg = AI.errorText(e);
    if (msg) statusBox($("bcStatus"), "err", msg);
  } finally { if (ctl === aiCtl) aiCtl = null; }
});
$("pfSave").onclick = function () {
  var name = $("pfName").value.trim(), kcal = parseFloat($("pfKcal").value);
  if (!name) { $("pfName").focus(); toast("Donne un nom au produit"); return; }
  if (!(kcal >= 0) || $("pfKcal").value === "") { $("pfKcal").focus(); toast("Indique les calories pour 100 g"); return; }
  var serving = parseFloat($("pfServing").value);
  var f = { id: "m" + newId(), group: "Mes aliments", name: name, kcal: kcal,
    p: parseFloat($("pfP").value) || 0, c: parseFloat($("pfC").value) || 0, f: parseFloat($("pfF").value) || 0,
    barcode: currentCode || null, serving: serving > 0 ? serving : null, portions: serving > 0 ? [["1 portion", serving]] : [] };
  state.myFoods = state.myFoods.filter(function (x) { return !(f.barcode && x.barcode === f.barcode); });
  state.myFoods.unshift(f); save();
  $("productForm").hidden = true;
  pick(f); toast("Produit enregistré dans tes aliments");
};

/* Photo IA */
var photoFile = null, aiItems = [];
function resetPhoto() {
  photoFile = null; aiItems = [];
  $("phThumb").hidden = true; $("phThumb").removeAttribute("src");
  $("phHintField").hidden = true; $("phAnalyze").hidden = true; $("phResult").hidden = true; $("phHint").value = "";
  statusBox($("phStatus"), "", "");
  AI.available().then(function (ok) {
    $("photoCapture").hidden = !ok;
    if (!ok) statusBox($("phStatus"), "err", "L'analyse photo fonctionne quand l'appli est ouverte dans Claude. Utilise la recherche ou la saisie libre en attendant.");
  });
}
function setPhoto(file) {
  if (!file) return;
  photoFile = file; aiItems = [];
  var t = $("phThumb");
  if (t.src) URL.revokeObjectURL(t.src);
  t.src = URL.createObjectURL(file); t.hidden = false;
  $("phHintField").hidden = false; $("phAnalyze").hidden = false; $("phAnalyze").disabled = false; $("phAnalyze").textContent = "Analyser la photo";
  $("phResult").hidden = true; statusBox($("phStatus"), "", "");
}
$("phCamera").addEventListener("change", function () { setPhoto(this.files[0]); this.value = ""; });
$("phGallery").addEventListener("change", function () { setPhoto(this.files[0]); this.value = ""; });
$("phAnalyze").onclick = async function () {
  if (!photoFile) return;
  if (aiCtl) aiCtl.abort();
  var ctl = aiCtl = new AbortController();
  var btn = this;
  btn.disabled = true; $("phResult").hidden = true;
  statusBox($("phStatus"), "busy", "L'IA analyse ton assiette… (10 à 60 secondes)");
  try {
    var r = await AI.analyzeDish(photoFile, $("phHint").value.trim(), ctl.signal);
    if (ctl !== aiCtl) return;
    if (!r.items.length) { statusBox($("phStatus"), "err", "Aucun aliment reconnu sur cette photo. Essaie une photo plus nette, prise du dessus."); return; }
    statusBox($("phStatus"), "", "");
    aiItems = r.items.map(function (it) {
      var g = it.grams || 100;
      return { name: it.name, grams: it.grams, base: { g: g, kcal: it.kcal, p: it.p, c: it.c, f: it.f }, kcal: Math.round(it.kcal), p: it.p, c: it.c, f: it.f };
    });
    var pill = $("phConfidence");
    pill.textContent = "Fiabilité " + r.confidence;
    pill.className = "pill " + (r.confidence === "bonne" ? "ok" : r.confidence === "faible" ? "warn" : "");
    $("phNote").textContent = r.note || "";
    renderAiRows();
    $("phResult").hidden = false;
    btn.textContent = "Relancer l'analyse";
  } catch (e) {
    if (ctl !== aiCtl) return;
    var msg = AI.errorText(e);
    if (msg) statusBox($("phStatus"), "err", msg);
  } finally {
    if (ctl === aiCtl) { aiCtl = null; btn.disabled = false; }
  }
};
function renderAiRows() {
  $("phRows").innerHTML = aiItems.map(function (it, i) {
    return '<div class="ai-row" data-i="' + i + '">' +
      '<div class="field"><label for="ai-n' + i + '">Aliment</label><input id="ai-n' + i + '" data-k="name" value="' + esc(it.name) + '"></div>' +
      '<div class="field"><label for="ai-g' + i + '">Grammes</label><input id="ai-g' + i + '" data-k="grams" type="number" inputmode="decimal" min="0" value="' + Math.round(it.grams) + '"></div>' +
      '<div class="field"><label for="ai-k' + i + '">kcal</label><input id="ai-k' + i + '" data-k="kcal" type="number" inputmode="numeric" min="0" value="' + Math.round(it.kcal) + '"></div>' +
      '<button class="icon-btn" data-rm="' + i + '" aria-label="Retirer ' + esc(it.name) + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div class="macro-line num" id="ai-m' + i + '"></div></div>';
  }).join("");
  aiItems.forEach(function (_, i) { updateAiMacro(i); });
  updateAiTotal();
}
function updateAiMacro(i) { var it = aiItems[i]; $("ai-m" + i).textContent = "P " + fmt1(it.p) + " g · G " + fmt1(it.c) + " g · L " + fmt1(it.f) + " g"; }
function updateAiTotal() {
  var t = aiItems.reduce(function (a, it) { return a + (it.kcal || 0); }, 0);
  $("phTotal").textContent = fmt(t) + " kcal";
  $("phAddAll").disabled = !aiItems.length;
}
$("phRows").addEventListener("input", function (e) {
  var row = e.target.closest("[data-i]"); if (!row) return;
  var i = +row.dataset.i, it = aiItems[i], k = e.target.dataset.k;
  if (k === "name") { it.name = e.target.value; return; }
  var v = Math.max(0, parseFloat(e.target.value) || 0);
  if (k === "grams") {
    // Les calories et macros suivent la quantité, à partir de l'estimation de l'IA
    it.grams = v;
    var r = it.base.g ? v / it.base.g : 0;
    it.kcal = Math.round(it.base.kcal * r); it.p = it.base.p * r; it.c = it.base.c * r; it.f = it.base.f * r;
    $("ai-k" + i).value = it.kcal;
  } else if (k === "kcal") {
    var ratio = it.kcal ? v / it.kcal : 0;
    it.kcal = v;
    if (ratio) { it.p *= ratio; it.c *= ratio; it.f *= ratio; }
  }
  updateAiMacro(i); updateAiTotal();
});
$("phRows").addEventListener("click", function (e) {
  var b = e.target.closest("[data-rm]"); if (!b) return;
  aiItems.splice(+b.dataset.rm, 1); renderAiRows();
});
$("phAddAll").onclick = function () {
  var meal = $("mealSel").value;
  var list = aiItems.filter(function (it) { return it.kcal > 0; }).map(function (it) {
    return { id: newId(), meal: meal, name: (it.name || "Aliment").trim(), grams: Math.round(it.grams) || 0, kcal: Math.round(it.kcal),
      p: +it.p.toFixed(1), c: +it.c.toFixed(1), f: +it.f.toFixed(1), source: "photo" };
  });
  if (!list.length) return;
  pushEntries(list);
  closeSheet(); renderJournal(); toast(list.length + " aliment" + (list.length > 1 ? "s" : "") + " ajouté" + (list.length > 1 ? "s" : ""));
};

/* Libre */
$("addManual").onclick = function () {
  var name = $("mName").value.trim() || "Aliment";
  var k = +$("mKcal").value;
  if (!(k >= 0) || $("mKcal").value === "") { $("mKcal").focus(); toast("Indique au moins les calories"); return; }
  pushEntries([{ id: newId(), meal: $("mealSel").value, name: name, grams: 0, kcal: Math.round(k), p: +$("mP").value || 0, c: +$("mC").value || 0, f: +$("mF").value || 0 }]);
  closeSheet(); renderJournal(); toast(name + " ajouté");
};

function openSheet(meal) {
  $("mealSel").value = meal; picked = null;
  $("foodSearch").value = "";
  ["mName", "mKcal", "mP", "mC", "mF"].forEach(function (id) { $(id).value = ""; });
  setMode("search"); renderFoods();
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
}
function closeSheet() {
  if (aiCtl) { aiCtl.abort(); aiCtl = null; }
  if (dlg.close) dlg.close(); else dlg.removeAttribute("open");
}
$("closeSheet").onclick = closeSheet;
dlg.addEventListener("click", function (e) { if (e.target === dlg) closeSheet(); });
dlg.addEventListener("close", function () { if (aiCtl) { aiCtl.abort(); aiCtl = null; } });

document.addEventListener("visibilitychange", function () { if (!document.hidden && !$("view-journal").hidden) renderJournal(); });

route();
})();
