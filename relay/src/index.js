/* Relais IA de « Mon équilibre calorique ».
   L'appli envoie une photo (repas ou étiquette nutritionnelle), le relais la transmet à Claude
   avec la clé Anthropic gardée secrète côté Cloudflare, puis renvoie le résultat en JSON.
   Le relais n'accepte que deux demandes fixes (analyse de plat, lecture d'étiquette) :
   il ne peut pas servir de passerelle libre vers Claude. */
import Anthropic from "@anthropic-ai/sdk";

const MAX_IMAGE_BASE64 = 2_000_000; // ~1,5 Mo de photo : l'appli réduit avant d'envoyer
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];

const DISH_PROMPT =
  "Tu es diététicien·ne. La photo montre un repas. Identifie chaque aliment visible, estime sa quantité en grammes " +
  "(ou en ml pour une boisson), puis les calories et les macronutriments de cette quantité, avec des valeurs de référence " +
  "proches des tables Ciqual. Compte l'huile, le beurre et les sauces visibles. Sois réaliste sur les portions d'un repas en France. " +
  "Si la photo ne montre pas de nourriture, renvoie une liste vide. Noms d'aliments en français. " +
  "confidence vaut faible, moyenne ou bonne ; note est une phrase courte sur ce qui est incertain.";

const LABEL_PROMPT =
  "La photo montre l'emballage d'un produit alimentaire, normalement son tableau des valeurs nutritionnelles. " +
  "Lis les valeurs pour 100 g (ou 100 ml). Si seules des valeurs par portion sont visibles, convertis-les pour 100 g " +
  "à partir de la taille de portion indiquée. N'invente rien : si le tableau est illisible, mets readable à false. " +
  "name est le nom du produit s'il est visible, sinon une chaîne vide. serving_g est la portion indiquée en grammes, sinon 0.";

const num = { type: "number" };
const DISH_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, grams: num, kcal: num, p: num, c: num, f: num },
        required: ["name", "grams", "kcal", "p", "c", "f"],
        additionalProperties: false
      }
    },
    confidence: { type: "string", enum: ["faible", "moyenne", "bonne"] },
    note: { type: "string" }
  },
  required: ["items", "confidence", "note"],
  additionalProperties: false
};
const LABEL_SCHEMA = {
  type: "object",
  properties: { readable: { type: "boolean" }, name: { type: "string" }, kcal: num, p: num, c: num, f: num, serving_g: num },
  required: ["readable", "name", "kcal", "p", "c", "f", "serving_g"],
  additionalProperties: false
};

/* Le repli automatique en cas de refus existe pour ces modèles. */
const FALLBACK_MODELS = ["claude-opus-5-5", "claude-sonnet-5-5"];

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function reply(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(origin ? corsHeaders(origin) : {}) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const okOrigin = allowedOrigins(env).includes(origin) ? origin : "";

    if (request.method === "OPTIONS") {
      return okOrigin ? new Response(null, { status: 204, headers: corsHeaders(okOrigin) }) : new Response(null, { status: 403 });
    }
    if (request.method === "GET") return reply(200, { ok: true, service: "mon-equilibre-ia" }, okOrigin);
    if (request.method !== "POST") return reply(405, { error: "method" }, okOrigin);
    if (!okOrigin) return reply(403, { error: "forbidden" }, "");
    if (!env.ANTHROPIC_API_KEY) return reply(503, { error: "not_configured" }, okOrigin);

    if (env.PHOTO_LIMIT) {
      const ip = request.headers.get("CF-Connecting-IP") || "inconnue";
      const { success } = await env.PHOTO_LIMIT.limit({ key: ip });
      if (!success) return reply(429, { error: "rate_limited" }, okOrigin);
    }

    let body;
    try { body = await request.json(); } catch { return reply(400, { error: "bad_request" }, okOrigin); }
    const kind = body && body.kind;
    const image = body && typeof body.image === "string" ? body.image : "";
    const mediaType = MEDIA_TYPES.includes(body && body.media_type) ? body.media_type : "image/jpeg";
    if (kind !== "dish" && kind !== "label") return reply(400, { error: "bad_request" }, okOrigin);
    if (!image || !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 200))) return reply(400, { error: "image_rejected" }, okOrigin);
    if (image.length > MAX_IMAGE_BASE64) return reply(413, { error: "too_large" }, okOrigin);

    const hint = kind === "dish" && typeof body.hint === "string" ? body.hint.slice(0, 300).trim() : "";
    const prompt = kind === "dish"
      ? DISH_PROMPT + (hint ? "\nPrécisions de la personne : " + hint : "")
      : LABEL_PROMPT;
    const model = env.MODEL || "claude-opus-5-5";
    const useFallback = FALLBACK_MODELS.includes(model);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined });
    let response;
    try {
      response = await client.beta.messages.create({
        model,
        max_tokens: 8000,
        ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
        output_config: { format: { type: "json_schema", schema: kind === "dish" ? DISH_SCHEMA : LABEL_SCHEMA } },
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            { type: "text", text: prompt }
          ]
        }]
      });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return reply(429, { error: "rate_limited" }, okOrigin);
      if (e instanceof Anthropic.BadRequestError) return reply(400, { error: "image_rejected" }, okOrigin);
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
        return reply(503, { error: "not_configured" }, okOrigin);
      }
      console.error("Erreur Claude", e && e.status, e && e.message);
      return reply(502, { error: "upstream" }, okOrigin);
    }

    if (response.stop_reason === "refusal") return reply(422, { error: "refused" }, okOrigin);
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    let data;
    try { data = JSON.parse(text); } catch { return reply(502, { error: "invalid_json" }, okOrigin); }
    return reply(200, { result: data }, okOrigin);
  }
};
