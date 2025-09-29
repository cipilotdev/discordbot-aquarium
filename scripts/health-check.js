/**
 * const ciaService = require("../src/ai/cia");

async function performHealthChecks() {
  console.log("🔍 Performing health checks...\n");

  const results = {
    config: false,
    database: false,
    cia: false,eck script for the Discord bot
 */
const config = require("../src/config");
const database = require("../src/services/database");
const geminiService = require("../src/ai/cia");
const gptService = require("../src/ai/gpt");
const hfService = require("../src/ai/hf");

async function performHealthChecks() {
  console.log("🔍 Performing health checks...\n");

  const results = {
    config: false,
    database: false,
    gemini: false,
    gpt: false,
    hf: false,
  };

  // Check configuration
  try {
    if (config.discord.token && config.apis.gemini.key) {
      results.config = true;
      console.log("✅ Configuration: OK");
    } else {
      console.log("❌ Configuration: Missing required environment variables");
    }
  } catch (error) {
    console.log("❌ Configuration: Error loading config");
  }

  // Check database
  try {
    results.database = await database.healthCheck();
    console.log(
      results.database ? "✅ Database: OK" : "❌ Database: Connection failed"
    );
  } catch (error) {
    console.log("❌ Database: Error connecting");
  }

  // Check CIA API
  try {
    results.cia = await ciaService.healthCheck();
    console.log(
      results.cia ? "✅ CIA API: OK" : "❌ CIA API: Connection failed"
    );
  } catch (error) {
    console.log("❌ CIA API: Error connecting");
  }

  // Check GPT API
  if (config.apis.openai.key) {
    try {
      results.gpt = await gptService.healthCheck();
      console.log(
        results.gpt ? "✅ GPT API: OK" : "❌ GPT API: Connection failed"
      );
    } catch (error) {
      console.log("❌ GPT API: Error connecting");
    }
  } else {
    console.log("⚠️  GPT API: Not configured");
  }

  // Check Hugging Face API
  if (config.apis.huggingface.key) {
    try {
      results.hf = await hfService.healthCheck();
      console.log(
        results.hf
          ? "✅ Hugging Face API: OK"
          : "❌ Hugging Face API: Connection failed"
      );
    } catch (error) {
      console.log("❌ Hugging Face API: Error connecting");
    }
  } else {
    console.log("⚠️  Hugging Face API: Not configured");
  }

  console.log("\n📊 Health Check Summary:");
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  console.log(`${passedChecks}/${totalChecks} checks passed`);

  if (passedChecks === totalChecks) {
    console.log("🎉 All systems operational!");
    process.exit(0);
  } else {
    console.log("⚠️  Some systems are not operational. Check the logs above.");
    process.exit(1);
  }
}

performHealthChecks().catch((error) => {
  console.error("❌ Health check failed:", error.message);
  process.exit(1);
});
