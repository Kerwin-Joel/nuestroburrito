// Edge Function: generate-itinerary
//
// Recibe los spots candidatos (ya filtrados/ordenados por proximidad y
// ajustados al tiempo disponible — ese cálculo se hace en el cliente, tanto
// en la web como en la app nativa) y le pide a Gemini que elija el orden y
// horario final. La API key de Gemini vive SOLO aquí, como secreto de
// Supabase — nunca se embebe en el bundle web ni en el APK.
//
// Prompt idéntico al que usaba src/services/itineraryWizardService.ts en la
// web (llamada directa a Gemini desde el navegador, con la key expuesta —
// ver el gap analysis). Este Edge Function reemplaza esa llamada directa.
//
// Deploy:
//   supabase functions deploy generate-itinerary
//   supabase secrets set GEMINI_API_KEY=tu-key
//
// Invocar desde cualquier cliente autenticado con supabase-js / supabase-kt:
//   supabase.functions.invoke('generate-itinerary', { body: { prefs, spots } })

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WizardPrefs {
  who: string;
  group: string;
  time: string;
  budget: string;
  interests: string[];
}

interface SpotCandidate {
  id: string;
  name: string;
  category: string;
  description: string;
  local_tip: string;
  schedule?: Record<string, string> | null;
  event_date?: string | null;
}

const WHO_LABEL: Record<string, string> = {
  tourist: "Turista de otra ciudad",
  local: "Piurano local que quiere redescubrir su ciudad",
  transit: "De paso, pocas horas disponibles",
};
const GROUP_LABEL: Record<string, string> = {
  solo: "Viaja solo",
  couple: "En pareja",
  family: "En familia con niños",
  friends: "Con grupo de amigos",
};
const TIME_LABEL: Record<string, string> = {
  "4h": "Menos de 4 horas (visita rápida)",
  "6h": "Medio día (4-6 horas)",
  full: "Día completo (6+ horas)",
  weekend: "Fin de semana (2 días)",
};
const BUDGET_LABEL: Record<string, string> = {
  low: "Económico — hasta S/50",
  mid: "Moderado — S/50 a S/150",
  high: "Sin límite — lo mejor de Piura",
};

function buildPrompt(prefs: WizardPrefs, spots: SpotCandidate[]): string {
  const spotsInfo = spots
    .map((s, i) => {
      const isEvent = !!s.event_date;
      return `${i + 1}. ID:"${s.id}" | "${s.name}" | ${s.category}${isEvent ? " [EVENTO]" : ""} | Desc: ${(s.description ?? "").slice(0, 120)}`;
    })
    .join("\n");

  return `Eres un experto en turismo de Piura, Perú — conoces cada rincón de la región como un churre (local piurano).
Analiza este perfil de turista y estos spots candidatos, y crea un itinerario personalizado.
Responde ÚNICAMENTE con JSON válido, sin markdown, sin backticks, sin texto adicional.

PERFIL DEL TURISTA:
- Tipo de visitante: ${WHO_LABEL[prefs.who] ?? prefs.who}
- Grupo: ${GROUP_LABEL[prefs.group] ?? prefs.group}
- Tiempo disponible: ${TIME_LABEL[prefs.time] ?? prefs.time}
- Presupuesto: ${BUDGET_LABEL[prefs.budget] ?? prefs.budget}
- Intereses: ${prefs.interests.length > 0 ? prefs.interests.join(", ") : "Variado — abierto a todo"}

SPOTS CANDIDATOS (ya ordenados por proximidad):
${spotsInfo}

REGLAS CRÍTICAS DE HORARIOS:
1. RESPETAR los horarios de apertura/cierre. Un restaurante que abre a las 12:00 NO se puede visitar a las 08:30.
2. Los EVENTOS tienen horario fijo — DEBEN programarse dentro de su ventana horaria real.
3. Dejar al menos 15-20 minutos entre spots para traslados.
4. Los horarios empiezan desde las 08:30 (o más tarde si el primer spot abre después).
5. No agendar restaurantes fuera de horarios de comida razonables (almuerzo: 12:00-15:00, cena: 19:00-22:00).
6. MANTÉN la descripción y el tip EXACTAMENTE como vienen de la base de datos. NO los modifiques ni los reescribas.

El título debe ser creativo, en español, con sabor piurano (ej: "Un día churre en Piura").

Devuelve exactamente este JSON:
{
  "titulo": "nombre creativo del itinerario",
  "stops": [
    { "id": "id exacto del spot de la lista de candidatos", "time": "HH:MM" }
  ]
}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY no configurado en el servidor" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { prefs, spots } = (await req.json()) as { prefs: WizardPrefs; spots: SpotCandidate[] };
    if (!prefs || !spots?.length) {
      return new Response(JSON.stringify({ error: "prefs y spots son requeridos" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(prefs, spots);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 65536,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini HTTP ${geminiRes.status}: ${errBody}`);
    }

    const data = await geminiRes.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed.stops?.length) throw new Error("Gemini devolvió stops vacíos");

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
