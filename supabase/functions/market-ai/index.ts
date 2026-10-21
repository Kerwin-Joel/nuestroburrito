// =============================================================================
// Edge Function: market-ai
//
// IA para los productos que suben artesanos y emprendedores a la Tienda.
// Solo el dueño del producto puede llamarla (JWT obligatorio).
//
// POST { "action": "describe", "product_id": "<uuid>" }
//   Gemini mira las fotos (o el video si no hay fotos) y redacta título,
//   frase corta, descripción, historia, categoría, materiales, etiquetas y un
//   rango de precio sugerido (solo guía). Rechaza productos no aptos.
//   → { product }
//
// POST { "action": "video_start", "product_id": "<uuid>" }
//   Genera en segundo plano un video vertical corto del producto a partir de
//   su foto de portada (Gemini Omni Flash). Responde de inmediato; la app lee
//   ai_video_status / ai_video_path del producto hasta que termine.
//   Máximo 3 videos por producto (cuestan dinero).
//   → { status: "running" }
//
// Secrets:
//   GEMINI_API_KEY      (obligatorio)
//   MARKET_TEXT_MODEL   por defecto gemini-3.8-flash
//   MARKET_VIDEO_MODEL  por defecto gemini-omni-1.1-flash
// =============================================================================
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { decodeBase64, encodeBase64 } from "jsr:@std/encoding@1/base64";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const BUCKET = "market-media";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta";
const MAX_VIDEOS = 3;
/** Un video "corriendo" más que esto se da por perdido y se puede reintentar. */
const VIDEO_STALE_MS = 8 * 60 * 1000;
const CATEGORIES = ["artesania", "textil", "ceramica", "joyeria", "gastronomia", "decoracion", "experiencia", "otros"];

interface Media { path: string; type: "image" | "video" }
interface Product {
  id: string;
  seller_id: string;
  title: string | null;
  tagline: string | null;
  description: string | null;
  category: string | null;
  media: Media[];
  ai_text_status: string;
  ai_video_status: string;
  ai_video_count: number;
  ai_video_started_at: string | null;
}
interface Seller { business_name: string; craft: string | null; district: string | null }

const apiKey = () => Deno.env.get("GEMINI_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Usa POST" });
  if (!apiKey()) return json(503, { error: "La IA no está configurada todavía (falta GEMINI_API_KEY)" });

  let body: { action?: string; product_id?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "JSON inválido" });
  }
  if (typeof body.product_id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.product_id)) {
    return json(400, { error: "product_id inválido" });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: who } = await asUser.auth.getUser();
  if (!who?.user) return json(401, { error: "Inicia sesión" });

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: product } = await admin.from("market_products").select("*").eq("id", body.product_id).maybeSingle<Product>();
  if (!product || product.seller_id !== who.user.id) return json(404, { error: "Producto no encontrado" });
  const { data: seller } = await admin.from("market_sellers").select("business_name, craft, district")
    .eq("id", product.seller_id).single<Seller>();

  try {
    if (body.action === "describe") return await describe(admin, product, seller!);
    if (body.action === "video_start") return await videoStart(admin, product);
    return json(400, { error: "action debe ser describe o video_start" });
  } catch (e) {
    console.error(e);
    return json(500, { error: "No se pudo completar, intenta de nuevo" });
  }
});

// ── Texto ─────────────────────────────────────────────────────────────────────

async function describe(db: SupabaseClient, p: Product, seller: Seller): Promise<Response> {
  if (p.ai_text_status === "running") return json(409, { error: "La IA ya está escribiendo esta ficha" });
  await db.from("market_products").update({ ai_text_status: "running", ai_text_error: null }).eq("id", p.id);

  const fail = async (msg: string, status = 422) => {
    await db.from("market_products").update({ ai_text_status: "failed", ai_text_error: msg }).eq("id", p.id);
    return json(status, { error: msg });
  };

  // Hasta 4 fotos; si no hay fotos, el primer video (si no es muy pesado).
  const parts: unknown[] = [];
  for (const m of p.media.filter((m) => m.type === "image").slice(0, 4)) {
    const file = await download(db, m.path, 6_000_000);
    if (file) parts.push({ inline_data: { mime_type: file.mime, data: encodeBase64(file.bytes) } });
  }
  if (parts.length === 0) {
    const video = p.media.find((m) => m.type === "video");
    const file = video ? await download(db, video.path, 18_000_000) : null;
    if (file) parts.push({ inline_data: { mime_type: file.mime, data: encodeBase64(file.bytes) } });
  }
  if (parts.length === 0) return fail("Sube al menos una foto (o un video corto) del producto");

  const context = [
    `Vendedor: ${seller.business_name}`,
    seller.craft ? `Rubro: ${seller.craft}` : null,
    seller.district ? `Lugar: ${seller.district}, Piura, Perú` : "Lugar: Piura, Perú",
  ].filter(Boolean).join("\n");

  const prompt = `Eres el redactor de la Tienda de Burrito, una app de turismo de Piura (Perú).
Un artesano o emprendedor local subió las fotos/video de un producto. Escribe su ficha de venta.

${context}

Reglas:
- Describe SOLO lo que se ve. No inventes medidas, premios, certificaciones ni técnicas que no se noten.
- Si algo no se puede saber por la imagen (p. ej. material exacto), dilo con prudencia ("parece", "al estilo de").
- Español peruano, cálido y claro; puedes usar un toque piurano sin exagerar. Nada de emojis.
- title: nombre comercial, máx. 60 caracteres.
- tagline: frase gancho, máx. 90 caracteres.
- description: 2 o 3 párrafos cortos (máx. 700 caracteres): qué es, cómo se ve, para qué sirve o a quién regalarlo.
- story: 1 párrafo (máx. 450 caracteres) sobre la tradición o el oficio piurano relacionado, sin afirmar datos del vendedor que no conozcas.
- category: una de ${CATEGORIES.join(", ")}.
- materials y tags: listas cortas en minúsculas (máx. 5 cada una).
- price_min / price_max: rango razonable en soles (PEN) para el mercado turístico de Piura.
- apto: false si el producto es ilegal, peligroso, para adultos, de fauna protegida o si las imágenes no muestran un producto vendible; en ese caso explica en motivo.`;

  const schema = {
    type: "OBJECT",
    properties: {
      apto: { type: "BOOLEAN" },
      motivo: { type: "STRING" },
      title: { type: "STRING" },
      tagline: { type: "STRING" },
      description: { type: "STRING" },
      story: { type: "STRING" },
      category: { type: "STRING", enum: CATEGORIES },
      materials: { type: "ARRAY", items: { type: "STRING" } },
      tags: { type: "ARRAY", items: { type: "STRING" } },
      price_min: { type: "NUMBER" },
      price_max: { type: "NUMBER" },
    },
    required: ["apto", "title", "tagline", "description", "story", "category", "materials", "tags", "price_min", "price_max"],
  };

  const model = Deno.env.get("MARKET_TEXT_MODEL") ?? "gemini-3.8-flash";
  const res = await fetch(`${GEMINI}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey()! },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [...parts, { text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.6 },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    console.error("gemini text", res.status, await res.text());
    return fail("La IA no respondió, intenta de nuevo en un momento", 502);
  }
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "";
  let out: Record<string, unknown>;
  try {
    out = JSON.parse(text);
  } catch {
    return fail("La IA devolvió algo ilegible, intenta de nuevo", 502);
  }
  if (out.apto === false) {
    return fail(`No podemos publicar este producto: ${String(out.motivo ?? "no cumple las reglas de la tienda")}`);
  }

  const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : null);
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 5) : []);
  const num = (v: unknown) => (typeof v === "number" && isFinite(v) && v > 0 ? Math.round(v) : null);
  const update = {
    title: clip(out.title, 90),
    tagline: clip(out.tagline, 120),
    description: clip(out.description, 1500),
    story: clip(out.story, 1500),
    category: CATEGORIES.includes(String(out.category)) ? String(out.category) : "otros",
    materials: list(out.materials),
    tags: list(out.tags),
    ai_suggestion: { price_min: num(out.price_min), price_max: num(out.price_max), model },
    ai_text_status: "done",
    ai_text_error: null,
    updated_at: new Date().toISOString(),
  };
  const { data: saved, error } = await db.from("market_products").update(update).eq("id", p.id).select("*").single();
  if (error) throw error;
  return json(200, { product: saved });
}

// ── Video ─────────────────────────────────────────────────────────────────────

async function videoStart(db: SupabaseClient, p: Product): Promise<Response> {
  const running = p.ai_video_status === "running" && p.ai_video_started_at &&
    Date.now() - new Date(p.ai_video_started_at).getTime() < VIDEO_STALE_MS;
  if (running) return json(409, { error: "Tu video ya se está creando" });
  if (p.ai_video_count >= MAX_VIDEOS) return json(429, { error: `Ya generaste ${MAX_VIDEOS} videos para este producto` });
  const cover = p.media.find((m) => m.type === "image");
  if (!cover) return json(422, { error: "Necesitas al menos una foto para crear el video" });

  await db.from("market_products").update({
    ai_video_status: "running",
    ai_video_error: null,
    ai_video_count: p.ai_video_count + 1,
    ai_video_started_at: new Date().toISOString(),
  }).eq("id", p.id);

  // Sigue trabajando después de responder; la app lee el estado del producto.
  // @ts-ignore EdgeRuntime existe en Supabase Edge Functions
  EdgeRuntime.waitUntil(generateVideo(db, p, cover).catch(async (e) => {
    console.error("video", e);
    await db.from("market_products").update({
      ai_video_status: "failed",
      ai_video_error: e instanceof Error ? e.message.slice(0, 200) : "No se pudo crear el video",
    }).eq("id", p.id);
  }));
  return json(202, { status: "running" });
}

async function generateVideo(db: SupabaseClient, p: Product, cover: Media) {
  const file = await download(db, cover.path, 8_000_000);
  if (!file) throw new Error("No se pudo leer la foto de portada");

  const what = [p.title, p.tagline].filter(Boolean).join(". ") || "producto artesanal piurano";
  const prompt = `Video publicitario vertical, corto y cinematográfico de este producto: ${what}.
El producto de la foto es el protagonista y debe verse fiel a la imagen (misma forma, colores y detalles).
Movimiento de cámara lento y elegante (giro suave o acercamiento), luz cálida de tarde piurana,
fondo sutil de taller artesanal o mesa de madera con desenfoque. Sin texto en pantalla, sin logos,
sin personas reconocibles. Sonido ambiente suave.`;

  const model = Deno.env.get("MARKET_VIDEO_MODEL") ?? "gemini-omni-1.1-flash";
  const res = await fetch(`${GEMINI}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey()! },
    body: JSON.stringify({
      model,
      input: [
        { type: "image", data: encodeBase64(file.bytes), mime_type: file.mime },
        { type: "text", text: prompt },
      ],
      response_format: { type: "video", aspect_ratio: "9:16", resolution: "720p", delivery: "uri" },
    }),
    signal: AbortSignal.timeout(380_000),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("gemini video", res.status, detail);
    throw new Error(res.status === 429 ? "La IA de video está ocupada, intenta más tarde" : "La IA no pudo crear el video");
  }
  const video = findVideo(await res.json());
  if (!video) throw new Error("La IA no devolvió un video");

  let bytes: Uint8Array;
  if (video.data) {
    bytes = decodeBase64(video.data);
  } else {
    bytes = await fetchGeneratedFile(video.uri!);
  }

  const path = `${p.seller_id}/${p.id}/ia-${Date.now()}.mp4`;
  const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: "video/mp4", upsert: true });
  if (up.error) throw up.error;
  await db.from("market_products").update({
    ai_video_status: "done",
    ai_video_path: path,
    ai_video_error: null,
    updated_at: new Date().toISOString(),
  }).eq("id", p.id);
}

/** Busca en la respuesta el bloque de video ({ mime_type: video/*, data | uri }). */
function findVideo(node: unknown): { data?: string; uri?: string } | null {
  if (!node || typeof node !== "object") return null;
  const o = node as Record<string, unknown>;
  const mime = (o.mime_type ?? o.mimeType) as string | undefined;
  if ((o.type === "video" || mime?.startsWith("video/")) && (typeof o.data === "string" || typeof o.uri === "string")) {
    return { data: o.data as string | undefined, uri: o.uri as string | undefined };
  }
  for (const v of Object.values(o)) {
    const hit = findVideo(v);
    if (hit) return hit;
  }
  return null;
}

/** Con entrega por URI el archivo puede tardar en quedar ACTIVE: se espera y se baja. */
async function fetchGeneratedFile(uri: string): Promise<Uint8Array> {
  const id = uri.match(/files\/([^:/?]+)/)?.[1];
  if (id) {
    for (let i = 0; i < 40; i++) {
      const meta = await fetch(`${GEMINI}/files/${id}`, { headers: { "x-goog-api-key": apiKey()! } });
      if (meta.ok) {
        const m = await meta.json() as { state?: string };
        if (!m.state || m.state === "ACTIVE") break;
        if (m.state === "FAILED") throw new Error("La IA no pudo terminar el video");
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  const dl = id ? `${GEMINI}/files/${id}:download?alt=media` : uri;
  const res = await fetch(dl, { headers: { "x-goog-api-key": apiKey()! }, redirect: "follow" });
  if (!res.ok) throw new Error("No se pudo descargar el video generado");
  return new Uint8Array(await res.arrayBuffer());
}

// ── Utilidades ────────────────────────────────────────────────────────────────

async function download(db: SupabaseClient, path: string, maxBytes: number): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const { data, error } = await db.storage.from(BUCKET).download(path);
  if (error || !data || data.size > maxBytes) return null;
  const mime = data.type || (path.endsWith(".png") ? "image/png" : path.endsWith(".mp4") ? "video/mp4" : "image/jpeg");
  return { bytes: new Uint8Array(await data.arrayBuffer()), mime };
}
