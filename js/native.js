/* Appli installée sur iPhone ou Android (Capacitor). Dans un navigateur, ce fichier ne fait rien.
   - masque l'onglet Photo IA tant qu'aucune IA n'est branchée dans l'appli ;
   - lit les pas dans Apple Santé (iPhone, et donc Apple Watch) ou Health Connect (Android).
   S'appuie sur window.App, exposé à la fin de app.js. */
(function () {
  "use strict";
  var Cap = window.Capacitor;
  if (!Cap || typeof Cap.isNativePlatform !== "function" || !Cap.isNativePlatform()) return;

  var App = window.App;
  if (!App) return;
  function $(id) { return document.getElementById(id); }
  var platform = Cap.getPlatform();
  document.documentElement.classList.add("native", "native-" + platform);

  /* ---------- Photo IA ---------- */
  AI.available().then(function (ok) {
    if (ok) return;
    var b = document.querySelector('#modeTabs button[data-v="photo"]');
    if (b) b.hidden = true;
    $("modeTabs").classList.add("tabs3");
  });

  /* ---------- Pas depuis la santé du téléphone ---------- */
  var Health = window.capacitorExports && typeof window.capacitorExports.registerPlugin === "function"
    ? window.capacitorExports.registerPlugin("Health") : null;
  if (!Health) return;

  var SOURCE = platform === "ios" ? "Apple Santé" : "Health Connect";
  var DAYS_BACK = 7;
  var syncing = false;

  function linked() { var st = App.getState(); return !!(st.profile && st.profile.healthSteps); }

  /* Bouton « Relier » et petite mention sous les pas */
  function decorate() {
    var btn = $("stepsHealth");
    if (btn) {
      btn.textContent = "Relier mes pas à " + SOURCE;
      btn.hidden = linked();
    }
    var lbl = $("stepsKcal");
    if (lbl && linked() && !App.stepsOf()) lbl.textContent = "En attente des pas d'" + SOURCE;
    var note = $("stepsSource");
    if (linked()) {
      if (!note) {
        note = document.createElement("div");
        note.id = "stepsSource";
        note.className = "small muted health-note";
        lbl.parentNode.insertBefore(note, lbl.nextSibling);
      }
      note.textContent = "Pas lus dans " + SOURCE;
    } else if (note) note.remove();
  }

  App.afterJournal = decorate;

  /* Lit les pas des 7 derniers jours, un total par jour */
  async function sync(quiet) {
    if (!linked() || syncing) return;
    syncing = true;
    try {
      var start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (DAYS_BACK - 1));
      var end = new Date();
      var res = await Health.queryAggregated({
        dataType: "steps", startDate: start.toISOString(), endDate: end.toISOString(), bucket: "day", aggregation: "sum"
      });
      var changed = false;
      (res && res.samples || []).forEach(function (s) {
        var mid = new Date((Date.parse(s.startDate) + Date.parse(s.endDate)) / 2);
        var v = Math.round(Number(s.value) || 0);
        var k = App.keyOf(mid);
        var st = App.getState();
        if (v > 0 && st.steps[k] !== v) {
          if (!changed) App.leaveExampleKeepToday();
          st = App.getState();
          st.steps[k] = v; changed = true;
        }
      });
      if (changed) App.save();
      App.refresh();
    } catch (e) {
      if (!quiet) App.toast("Pas illisibles dans " + SOURCE);
    } finally {
      syncing = false;
    }
  }

  async function link() {
    try {
      var av = await Health.isAvailable();
      if (!av || !av.available) {
        App.toast(platform === "android"
          ? "Installe « Health Connect » depuis le Play Store, puis réessaie"
          : "Apple Santé n'est pas disponible sur cet appareil");
        return;
      }
      await Health.requestAuthorization({ read: ["steps"], write: [] });
      App.getState().profile.healthSteps = true;
      App.save();
      App.toast("Pas reliés à " + SOURCE);
      await sync(false);
    } catch (e) {
      App.toast("Autorisation refusée. Tu peux l'activer dans les réglages de " + SOURCE + ".");
    }
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#stepsHealth")) link();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") sync(true);
  });

  App.refresh();
  decorate();
  sync(true);
})();
