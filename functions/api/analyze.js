
export async function onRequestGet({ env }) {
  return Response.json({
    configured: Boolean(env.GEMINI_API_KEY),
    provider: "Google Gemini"
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const payload = await request.json();

    if (
      !payload ||
      !Array.isArray(payload.contents) ||
      !payload.contents.length ||
      !payload.generationConfig
    ) {
      return Response.json(
        { error: "Invalid screening request." },
        { status: 400 }
      );
    }

    const model = env.GEMINI_MODEL || "gemini-3.8-flash";

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini request failed:", {
        status: geminiResponse.status,
        error: result.error?.message
      });

      return Response.json(
        {
          error: result.error?.message || "Gemini screening failed."
        },
        { status: 502 }
      );
    }

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch (error) {
    console.error("TalentLens API error:", error.message);

    return Response.json(
      { error: "Unable to process screening request." },
      { status: 500 }
    );
  }
}
