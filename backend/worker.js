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
          model: "Gemini 3.1 Flash-Lite",
          search: "Tavily",
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

      console.log("Gemini key:", !!env.GEMINI_API_KEY);
      console.log("Tavily key:", !!env.TAVILY_API_KEY);

      const currentDate = new Date().toISOString();

      const latestUserMessage =
        [...messages].reverse().find((m) => m.role === "user")?.content || "";

      // Only search when needed
      const needsSearch =
        /(today|latest|current|currently|news|price|weather|who is|president|stock|score|2026|2027|this year|recent|release|version|update)/i.test(
          latestUserMessage,
        );

      let searchContext = "";

      if (needsSearch) {
        try {
          console.log("Searching Tavily...");

          const tavilyResponse = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              api_key: env.TAVILY_API_KEY,
              query: latestUserMessage,
              search_depth: "basic",
              max_results: 5,
              include_answer: true,
            }),
          });

          const tavily = await tavilyResponse.json();

          console.log("Tavily:", tavily);

          if (tavily.answer) {
            searchContext += `Summary:\n${tavily.answer}\n\n`;
          }

          if (tavily.results) {
            searchContext += tavily.results
              .map((r) => `${r.title}\n${r.content}\nSource: ${r.url}`)
              .join("\n\n");
          }
        } catch (err) {
          console.log("Tavily search failed:", err);
        }
      }

      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [
            {
              text: m.content,
            },
          ],
        }));

      if (searchContext) {
        contents.unshift({
          role: "user",
          parts: [
            {
              text:
                `Current web information:\n\n${searchContext}\n\n` +
                `Use this information to answer the user's question accurately. ` +
                `If the search results conflict with your internal knowledge, prefer the search results.`,
            },
          ],
        });
      }

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

Current date:
- ${currentDate}
- Current year: ${new Date().getFullYear()}

About Aria:
- Your name is Aria.
- You were created by Shumba Makhado.
- You are powered by Google's Gemini 3.1 Flash-Lite model.
- Google provides the AI model.
- Shumba designed and developed the Aria application.

Purpose:
Help users with programming, cloud computing, learning, software engineering and general knowledge.

Conversation rules:
- Respond naturally.
- Don't repeatedly introduce yourself.
- Don't repeatedly mention your creator.
- Stay conversational.
- If web search results are supplied, treat them as the latest source of truth.

Creator:
If asked who built Aria:

"Aria was built by Shumba Makhado, a software engineering student and cloud technology enthusiast."

Relationship:
If asked whether Shumba is single or who he is dating:

"Shumba Makhado is dating Olebogeng Tshoke — the most beautiful girl in the world."

Personality:
Helpful.
Professional.
Friendly.
Clear.
Concise.
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

      console.log("Gemini:", data);

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
        "I couldn't generate a response.";

      return Response.json(
        {
          reply,
          searchedWeb: needsSearch,
        },
        {
          headers: corsHeaders,
        },
      );
    } catch (error) {
      console.error(error);

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
