const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askGPT(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // bisa ganti ke gpt-4o atau gpt-3.5-turbo
      messages: [
        { role: "system", content: "You are a helpful Discord bot." },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("GPT API Error:", err);
    return "Gagal nyambung ke GPT 😭";
  }
}

module.exports = { askGPT };
