
const DEFAULT_MODEL = "gemini-3.8-flash";

// Check whether the Gemini key is configured.
export async function onRequestGet({ env }) {
  return Response.json(
    {
      configured: Boolean(env.GEMINI_API_KEY),
      provider: "Google Gemini"
    },
    {
      headers: { "Cache-Control": "no-store" }
    }
  );
}

// Receive the screening request from TalentLens.
export async function onRequestPost({ request, env }) {
  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const payload = await request.json();

    if (
      !payload?.contents ||
      !payload?.generationConfig
    ) {
      return Response.json(
        { error: "Invalid screening request." },
        { status: 400 }
      );
    }

    const model = env.GEMINI_MODEL || DEFAULT_MODEL;

    const response = await fetch(
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

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        result.error?.message
      );

      return Response.json(
        {
          error: result.error?.message ||
            "Gemini request failed."
        },
        { status: 502 }
      );
    }

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch (error) {
    console.error("Screening API error:", error.message);

    return Response.json(
      { error: "Unable to process screening request." },
      { status: 500 }
    );
  }
}
