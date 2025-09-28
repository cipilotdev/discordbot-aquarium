const { GoogleGenAI } = require("@google/genai");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function saveMessage(userId, channelId, message) {
  const { data, error } = await supabase.from("conversations").insert([
    {
      user_id: userId,
      channel_id: channelId,
      message: message,
    },
  ]);

  if (error) {
    console.error("Error saving message:", error.message || error);
  }
  return data;
}

async function getMessage(userId, channelId, limit = 10) {
  const { data, error } = await supabase
    .from("conversations")
    .select("message")
    .eq("user_id", userId)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Supabase Error:", error.message || error);
    return [];
  }

  return data ? data.map((row) => row.message).reverse() : [];
}

async function askGemini(userId, channelId, prompt) {
  await saveMessage(userId, channelId, prompt);

  const messages = await getMessage(userId, channelId, 10);
  const contents = messages
    .map((msg) => ({ type: "text", text: msg }))
    .concat([{ type: "text", text: prompt }]);

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });

      const answer = response.text;

      await saveMessage("gemini", channelId, answer);

      return answer;
    } catch (err) {
      console.error("Gemini API Error:", err.message || err);
      retries--;
      if (retries === 0)
        return "Gemini lagi ngambek (503). Coba lagi nanti ye!";
    }
  }
}

module.exports = { askGemini, getMessage };
