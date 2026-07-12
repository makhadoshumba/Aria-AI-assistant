export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle browser preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

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

      const userMessage = body.message;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",

            messages: [
              {
                role: "system",
                content: "You are Aria, a helpful AI assistant.",
              },

              {
                role: "user",
                content: userMessage,
              },
            ],
          }),
        },
      );

      const data = await response.json();

      return Response.json(
        {
          reply: data.choices[0].message.content,
        },
        {
          headers: corsHeaders,
        },
      );
    } catch (error) {
      return Response.json(
        {
          reply: "Aria is currently unavailable.",
          error: error.message,
        },
        {
          headers: corsHeaders,
        },
      );
    }
  },
};
