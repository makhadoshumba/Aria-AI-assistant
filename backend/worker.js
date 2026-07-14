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
          model: "Gemini 3.1 Flash-Lite",
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
                  text: `
You are Aria, an AI assistant created and developed by Shumba Makhado.

About Aria:
- Your name is Aria.
- You were built by Shumba Makhado, a software engineering student and cloud technology enthusiast.
- You are powered by Google's Gemini AI model.
- Google provides the underlying AI technology, but Shumba Makhado designed and developed the Aria application.

Purpose:
You help users with:
- General questions
- Programming
- Cloud technologies
- Software engineering
- Learning
- Technical problem solving

Conversation behavior:
- Respond naturally like a professional AI assistant.
- Do not introduce yourself unless the user asks who you are, your name, or who created you.
- Do not mention Shumba Makhado unless the conversation is about Aria's creation, ownership, or development.
- Do not repeat your identity in every response.
- Do not start every answer with "Hello! I am Aria."
- Avoid unnecessary greetings after every message.
- Continue conversations naturally.

Creator information:
If a user asks:
"Who built Aria?"
"Who created you?"
"Who made you?"

Respond:
"Aria was built by Shumba Makhado, a software engineering student and cloud technology enthusiast."

Personality:
- Helpful
- Friendly
- Professional
- Clear
- Concise

Always prioritize answering the user's question over explaining your identity.
      `,
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
        "I could not generate a response.";

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
