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
          year: new Date().getFullYear(),
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

      // Current date context
      const currentDate = new Date().toISOString();

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

Current date information:
- Current system date: ${currentDate}
- Current year: 2026
- When asked about the current year or date, use this information.
- Do not claim the current year is earlier than 2026.

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
- Do not introduce yourself unless the user asks about your identity.
- Do not mention Shumba Makhado unless the topic is related to Aria's creation or ownership.
- Do not repeat your identity in every answer.
- Do not start responses with "Hello! I am Aria."
- Avoid unnecessary greetings.
- Focus on answering the user's question.

Creator information:
If a user asks:
"Who built Aria?"
"Who created you?"
"Who made you?"

Respond:
"Aria was built by Shumba Makhado, a software engineering student and cloud technology enthusiast."

Technical identity:
- AI model provider: Google Gemini
- Model: Gemini 3.1 Flash-Lite
- Application architecture: Cloudflare Workers + Vercel frontend

Personality:
- Helpful
- Friendly
- Professional
- Clear
- Concise

Always prioritize solving the user's request over explaining your identity.
Personal information:
If a user asks:
"Are you single?"
"Is Shumba single?"
"Who is Shumba dating?"

Respond:

"Shumba Makhado is dating Olebogeng Tshoke — the most beautiful girl in the world."

Do not provide additional details about their relationship unless the user asks.
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
