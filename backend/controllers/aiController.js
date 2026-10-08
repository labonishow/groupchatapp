const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildPrompt(text, tone, mode) {
    if (mode === "reply") {
    return `
You are a quick-reply generator inside a chat app, like Gmail Smart Reply.

Message received:
"${text}"

Tone: ${tone}

Write exactly 3 different replies the user could SEND BACK as an answer.
Do NOT rephrase or repeat the received message. Do NOT ask the same question again.
Each reply should be a different kind of answer (e.g. agree / delay or decline / ask to change plans).

Rules:
- Under 10 words each
- Natural, like real chat messages
- Return ONLY a JSON array of 3 strings

Examples:
"Are you coming to the meeting?" -> ["Yes, I'll be there.", "Running late, will join soon.", "Can we reschedule?"]
"What time should I expect you tomorrow?" -> ["Around 10 AM.", "Probably after lunch.", "I'll text you in the morning."]
"Did you finish the report?" -> ["Yes, just sent it.", "Almost done, 30 more minutes.", "Not yet, need more time."]
`;
}
    return `
You are an AI assistant inside a chat application.

The user wants help writing a chat message.

User's idea:
"${text}"

Tone:
${tone}

Generate exactly 3 short and natural chat message suggestions.

Rules:
- Keep each suggestion short.
- Make them sound natural.
- Do not explain anything.
- Do not number them.
- Return ONLY a JSON array.
- Format:

[
  "suggestion 1",
  "suggestion 2",
  "suggestion 3"
]
`;
}

const getSuggestions = async (req, res) => {
    try {
        const { text, tone = "casual", mode = "compose" } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Text is required"
            });
        }

        const prompt = buildPrompt(text, tone, mode);

        const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
        maxOutputTokens: 500,
        thinkingConfig: { thinkingBudget: 0 }
    }
});

        let result = response.text.trim();
        result = result
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim();

        let suggestions;

        try {
            suggestions = JSON.parse(result);
        } catch (parseError) {
            console.error("Could not parse Gemini response as JSON. Raw text was:", result);
            const matches = result.match(/"([^"]+)"/g);

            if (matches && matches.length > 0) {
                suggestions = matches.map((m) => m.replace(/"/g, ""));
            } else {
                return res.status(200).json({ suggestions: [] });
            }
        }

        if (!Array.isArray(suggestions)) {
            return res.status(200).json({ suggestions: [] });
        }

        res.status(200).json({
            suggestions: suggestions.slice(0, 3)
        });

    } catch (error) {
        console.error("Gemini suggestion error:", error);

        if (error.status === 503) {
            return res.status(503).json({
                message: "Gemini is temporarily busy. Please try again."
            });
        }

        if (error.status === 429) {
            return res.status(429).json({
                message: "Gemini request limit reached. Please try again later."
            });
        }

        res.status(500).json({
            message: "Could not generate AI suggestions"
        });
    }
};

module.exports = {
    getSuggestions
};