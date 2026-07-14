export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Health check
    if (request.method !== "POST") {
      return Response.json(
        {
          status: "online",
          service: "Aria AI Worker",
        },
        {
          headers: corsHeaders,
        },
      );
    }

    try {
      const body = await request.json();

      const messages = body.messages;

      if (!messages || !Array.isArray(messages)) {
        return Response.json(
          {
            error: "Messages are required",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      console.log("Gemini key exists:", !!env.GEMINI_API_KEY);

      // Convert OpenAI format -> Gemini format
      const contents = messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",

          parts: [
            {
              text: msg.content,
            },
          ],
        }));

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },

          body: JSON.stringify({
            contents,

            systemInstruction: {
              parts: [
                {
                  text: "You are Aria, a helpful AI assistant.",
                },
              ],
            },

            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        },
      );

      const data = await geminiResponse.json();

      console.log("Gemini response:", data);

      if (!geminiResponse.ok) {
        return Response.json(
          {
            error: "Gemini API error",
            details: data,
          },
          {
            status: geminiResponse.status,
            headers: corsHeaders,
          },
        );
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response generated.";

      return Response.json(
        {
          reply,
        },
        {
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.error("Worker error:", error);

      return Response.json(
        {
          error: error.message,
        },
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  },
};
