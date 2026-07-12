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

      const userMessage = body.message;

      if (!userMessage) {
        return Response.json(
          {
            error: "Message is required",
          },
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      console.log("Sending request to Groq...");
      console.log("API Key exists:", !!env.GROQ_API_KEY);

      const groqResponse = await fetch(
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

      const data = await groqResponse.json();

      console.log("Groq response:", data);

      // Handle Groq errors
      if (!groqResponse.ok) {
        return Response.json(
          {
            error: "Groq API error",
            details: data,
          },
          {
            status: groqResponse.status,
            headers: corsHeaders,
          },
        );
      }

      return Response.json(
        {
          reply: data.choices[0].message.content,
        },
        {
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.log("Worker error:", error);

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
