export default {
  async fetch(request) {
    // Handle CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Health check
    if (request.method === "GET") {
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

    // Chat endpoint
    if (request.method === "POST") {
      const body = await request.json();

      const userMessage = body.message;

      return Response.json(
        {
          reply: `You said: ${userMessage}`,
        },
        {
          headers: corsHeaders,
        },
      );
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  },
};
