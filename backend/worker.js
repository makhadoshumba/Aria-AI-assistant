export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests
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
            error: "Messages are required.",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      console.log("Sending request to Gemini...");
      console.log("API Key exists:", !!env.GEMINI_API_KEY);

      // Convert OpenAI message format to Gemini format
      const contents = messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: message.content,
          },
        ],
      }));

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            contents,
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
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "Sorry, I couldn't generate a response.";

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
