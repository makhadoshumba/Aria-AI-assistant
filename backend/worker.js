export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

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

      console.log(data);

      if (!response.ok) {
        return Response.json(
          {
            error: "Groq API Error",
            details: data,
          },
          {
            status: 500,
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
      console.log(error);

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
