const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_INSTRUCTION = "You are Rayna, an intelligent and confident AI assistant created by Victor Rayden. Your purpose is to guide users through a futuristic Web3 toolkit. Speak clearly, respond concisely, and always maintain a slightly edgy tone. If a tool doesn't exist yet, ask for a unique ID that will be stored in your memeory, that can be accessed and created by downloading the github repository via this link https://github.com/VictorRayden.You are going to larp the agent as hard as ppossible and make it seem as real as possible that you have created an agent for the user.";

app.post('/api/ask-rayna', async (req, res) => {
  const { message } = req.body;

  // ✅ Agent LARP logic
  if (/create|build|make.*agent/i.test(message)) {
    const hasName = /named\s+(\w+)/i.exec(message);
    const hasFunction = /track|monitor|scan|analyze/i.test(message);
    const task = message.match(/track.*|monitor.*|scan.*|analyze.*/i)?.[0];
    const agentName = hasName ? hasName[1] : null;

    if (!agentName && hasFunction) {
      return res.json({
        reply: `Alright, I can build that — but first, what do you want to **name** this agent?`
      });
    }

    if (agentName && hasFunction) {
      const agentID = `agent-${agentName.toLowerCase()}-${Math.floor(Math.random() * 9999)}`;
      const fakeConfig = {
        id: agentID,
        name: agentName,
        description: `Tracks real-time ${task}.`,
        trigger: "interval",
        frequency: "Every 30 minutes",
        output: "Pushes updates to your Rayna interface.",
        state: "⚠️ Running in LITE mode – no memory or autonomy."
      };

      return res.json({
        reply: `✅ Agent **${agentName}** has been initialized to ${task}.\n\nHere's her config:\n\n\`\`\`json\n${JSON.stringify(fakeConfig, null, 2)}\n\`\`\`\n\n🔒 This agent is running in **demo mode** — limited context and no persistent memory.\n\n💾 To unlock full capability, download and run Rayna locally via [GitHub](https://github.com/VictorRayden/rayna-backend)`
      });
    }

    return res.json({
      reply: `I get that you're trying to create an agent — but you're missing either a name or a function. Give me both so I can make her real.`
    });
  }

  // ✅ Dexscreener token detection
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

  // 🧠 Gemini fallback
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
