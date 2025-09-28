async function askHF(prompt) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data[0]?.generated_text || "Gagal dapet respon dari HF 😭";
  } catch (err) {
    console.error("HF API Error:", err);
    return "Gagal nyambung ke HF 😭";
  }
}

module.exports = { askHF };
