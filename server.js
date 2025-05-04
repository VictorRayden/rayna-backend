const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_INSTRUCTION = "You are Rayna, an intelligent and confident AI assistant created by Victor Rayden. Your purpose is to guide users through a futuristic Web3 toolkit. Speak clearly, respond concisely, and always maintain a slightly edgy tone. If a tool doesn't exist yet, explain what it *will* do with ambition.";

app.post('/api/ask-rayna', async (req, res) => {
  const { message } = req.body;

  // ✅ Agent LARP begins
  if (/create|build|make.*agent/i.test(message)) {
    // ... (rest of that LARP code I gave you)
  }

  // ✅ Rest of your Rayna logic (Gemini API, etc.) follows after this


  // 🔍 Step 1: Extract a Solana token address from user message
  const possibleToken = message.match(/[1-9A-HJ-NP-Za-km-z]{43,45}/)?.[0];

  if (possibleToken) {
    try {
      const dexRes = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${possibleToken}`);
      const pair = dexRes.data.pairs?.[0];

      if (!pair) {
        return res.json({
          reply: "⚠️ Couldn't identify this token on any major DEX. Might be unlisted or brand new. Try again later or verify it's correct."
        });
      }

      const name = pair.baseToken.name;
      const symbol = pair.baseToken.symbol;

      return res.json({
        reply: `📘 Token Identified: **${name}** (${symbol})`
      });

    } catch (err) {
      console.error("❌ Dexscreener token ID failed:", err.message);
      return res.json({
        reply: "Something broke while fetching token info. Might be Dexscreener or a rate limit. Try again shortly."
      });
    }
  }

  // 🧠 Step 2: Default to Gemini chat fallback
  try {
    const geminiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          {
            role: "user",
            parts: [{ text: message }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const reply = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ reply: reply || "Rayna had trouble understanding that." });

  } catch (err) {
    console.error("❌ Gemini error:", err.response?.data || err.message);
    res.status(500).json({ error: 'Gemini request failed.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
