import dotenv from "dotenv";
dotenv.config();

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from "express";
const app = express();
app.use(express.json());

import twilio from "twilio";
import openai from "openai";
import axios from "axios";
import fs from "fs";
import path from "path";

const PORT = process.env.PORT || 3000;

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function callTwilio() {
  const call = await twilioClient.calls.create({
    from: process.env.MY_PHONE_NUMBER,
    to: "+919760999879",
    url: "http://demo.twilio.com/docs/voice.xml",
  });

  console.log("Calling to Ziya... ");
}

app.get("/", (req, res) => {
  res.send("Hello from Twilio App");
  callTwilio();
});
const BASE_URL = "https://api.openai.com/v1";
const headers = {
  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  "OpenAI-Beta": "assistants=v2",
  "Content-Type": "application/json",
};

async function createThread() {
  const response = await axios.post(`${BASE_URL}/threads`, {}, { headers });
  return response.data.id;
}

async function addMessageToThread(threadId, content) {
  const response = await axios.post(
    `${BASE_URL}/threads/${threadId}/messages`,
    {
      role: "user",
      content,
    },
    { headers }
  );
  return response.data.id;
}

async function startRun(threadId, assistantId) {
  const response = await axios.post(
    `${BASE_URL}/threads/${threadId}/runs`,
    {
      assistant_id: assistantId,
    },
    { headers }
  );
  return response.data.id;
}

async function checkRunStatus(threadId, runId) {
  const response = await axios.get(
    `${BASE_URL}/threads/${threadId}/runs/${runId}`,
    { headers }
  );
  return response.data;
}

async function listMessages(threadId) {
  const response = await axios.get(`${BASE_URL}/threads/${threadId}/messages`, {
    headers,
  });
  return response.data.data;
}

// 🟢 Main Flow of ChatBoat
const ChatApi = async (query, threadId = null) => {
  try {
    const assistantId = process.env.ASSISTANT_ID;
    if (!assistantId) throw new Error("Missing ASSISTANT_ID");

    // const threadId = await createThread();
    // const threadId = "thread_OqrrwjBgea7bkRuozGp6b06W";
    console.log("Thread Id:", threadId);
    threadId = threadId || (await createThread());
    console.log("✅ Thread Created:", threadId);

    const messageId = await addMessageToThread(threadId, query);
    console.log("✅ User Message Added:", messageId);

    const runId = await startRun(threadId, assistantId);
    console.log("✅ Run Started:", runId);

    let runStatus = await checkRunStatus(threadId, runId);
    while (runStatus.status !== "completed") {
      console.log(`⏳ Waiting... Status: ${runStatus.status}`);
      await new Promise((r) => setTimeout(r, 500));
      runStatus = await checkRunStatus(threadId, runId);
    }
    console.log("✅ Run Completed!");

    const messages = await listMessages(threadId);
    const assistantMessage = messages.find((msg) => msg.role === "assistant");

    if (assistantMessage) {
      console.log(
        "\n✅ Assistant Reply:\n",
        assistantMessage.content[0].text.value
      );
    } else {
      console.log("❗ No assistant reply found");
    }

    const temp3 = assistantMessage.content[0].text.value.toString();
    const msg = temp3.replace(/【\d+:\d+†.*?】/g, "");

    return {
      msg,
      threadId,
    };
  } catch (error) {
    console.error(
      "❌ Error Occurred:\n",
      error.response?.data || error.message
    );

    return {
      msg: error.response?.data || error.message,
      threadId,
    };
  }
};

// async function ChatApiStreaming(query, threadId = null) {
//   try {
//     const assistantId = process.env.ASSISTANT_ID;
//     if (!assistantId) throw new Error("Missing ASSISTANT_ID");

//     // Reuse thread if possible
//     threadId = threadId || (await createThread());

//     // Add message to thread
//     await addMessageToThread(threadId, query);

//     // Start a streaming run
//     const response = await fetch(
//       `${BASE_URL}/threads/${threadId}/runs/stream`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//           "OpenAI-Beta": "assistants=v2",
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ assistant_id: assistantId }),
//       }
//     );

//     let finalText = "";
//     for await (const chunk of response.body) {
//       const textChunk = chunk.toString();
//       finalText += textChunk;
//       // Send partial output to client/Twilio here
//     }

//     return { msg: finalText, threadId };
//   } catch (err) {
//     console.error("❌ Error in streaming:", err);
//     return { msg: "Error generating response", threadId };
//   }
// }

// //cConvert Text to Voice

import fetch from "node-fetch"; // if not already installed

async function ChatApiStreaming(query, threadId) {
  try {
    const assistantId = process.env.ASSISTANT_ID;

    // Create thread only if not provided
    if (!threadId) {
      const res = await axios.post(`${BASE_URL}/threads`, {}, { headers });
      threadId = res.data.id;
    }

    // Add message to thread
    await axios.post(
      `${BASE_URL}/threads/${threadId}/messages`,
      { role: "user", content: query },
      { headers }
    );

    // Start streaming run
    const response = await fetch(
      `${BASE_URL}/threads/${threadId}/runs/stream`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ assistant_id: assistantId }),
      }
    );

    return response.body; // this is a readable stream
  } catch (err) {
    console.log(err);
  }
}

async function MakeVoiceStreamFromChunks(textChunks, res) {
  try {
    const response = await axios.post(
      `${EL_Base_URL}/${VOICE_ID}`,
      { text: textChunks.join(" ") }, // combine so far
      {
        headers: {
          "xi-api-key": process.env.ELEVEN_LAB_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "stream",
      }
    );

    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (err) {
    console.log(err);
  }
}

const EL_Base_URL = process.env.ELEVEN_LABS_BASE_URL;
const VOICE_ID = process.env.VOICE_ID;

const MakeVoice = async (text) => {
  try {
    const voiceResponse = await axios.post(
      `${EL_Base_URL}/${VOICE_ID}`,
      {
        text,
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVEN_LAB_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    return voiceResponse;
  } catch (err) {
    console.log(err);
  }
};

// app.post("/voice", async (req, res) => {
//   try {
//     const { message, threadId } = req.body;

//     const openAiStream = await ChatApiStreaming(message, threadId);

//     let buffer = "";
//     let chunks = [];

//     // Process each token as it arrives from OpenAI
//     for await (const chunk of openAiStream) {
//       const part = chunk.toString();
//       buffer += part;
//       chunks.push(part);

//       // Optionally, trigger early audio generation
//       if (buffer.length > 50) {
//         await MakeVoiceStreamFromChunks(chunks, res);
//         return; // exit after streaming
//       }
//     }

//     // Fallback: If no early break, stream full text
//     await MakeVoiceStreamFromChunks(chunks, res);
//   } catch (err) {
//     console.error("Streaming error:", err);
//     res.status(500).send("Error during streaming");
//   }
// });

app.post("/voice", async (req, res) => {
  // console.log("Calling from Twilio");
  console.log("Calling from Local Host");
  console.log(req.body.msg);
  const { message, threadId } = req.body;
  const response = await ChatApi(message, threadId);
  console.log(response);

  const audioResponse = await MakeVoice(response.msg);

  res.setHeader("Content-Type", "audio/mpeg");

  res.send(audioResponse?.data);

  // const filePath = path.join(__dirname, "output.mp3");
  // fs.writeFileSync(filePath, audioResponse.data);
  // res.download(filePath);
  // const twiml = new twilio.twiml.VoiceResponse();
  // twiml.say("ello, this is a Ziya test call from Younglabs!");

  // res.type("text/xml");
  // res.send(twiml.toString());
});

// const EL_Base_URL = process.env.ELEVEN_LABS_BASE_URL;
// const VOICE_ID = process.env.VOICE_ID;

// STREAM ElevenLabs TTS
// const MakeVoiceStream = async (text, res) => {
//   try {
//     const voiceStream = await axios.post(
//       `${EL_Base_URL}/${VOICE_ID}`,
//       { text },
//       {
//         headers: {
//           "xi-api-key": process.env.ELEVEN_LAB_API_KEY,
//           "Content-Type": "application/json",
//         },
//         responseType: "stream", // IMPORTANT for streaming
//       }
//     );

//     res.setHeader("Content-Type", "audio/mpeg");
//     voiceStream.data.pipe(res); // pipe audio directly to response
//   } catch (err) {
//     console.error(
//       "ElevenLabs streaming error:",
//       err.response?.data || err.message
//     );
//     res.status(500).send("Error generating voice");
//   }
// };

// STREAM OpenAI Assistants
// async function ChatApiStreaming(query, threadId = null) {
//   try {
//     const assistantId = process.env.ASSISTANT_ID;
//     if (!assistantId) throw new Error("Missing ASSISTANT_ID");

//     threadId = threadId || (await createThread());
//     await addMessageToThread(threadId, query);

//     const response = await fetch(
//       `${BASE_URL}/threads/${threadId}/runs/stream`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//           "OpenAI-Beta": "assistants=v2",
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ assistant_id: assistantId }),
//       }
//     );

//     let fullText = "";
//     for await (const chunk of response.body) {
//       const textChunk = chunk.toString();
//       fullText += textChunk;
//       // You could even start sending partial text to TTS here if desired
//     }

//     return { msg: fullText, threadId };
//   } catch (err) {
//     console.error("OpenAI streaming error:", err);
//     return { msg: "Error generating response", threadId };
//   }
// }

// Route that streams directly to client
// app.post("/voice", async (req, res) => {
//   try {
//     const { message } = req.body;
//     console.log("Incoming message:", message);

//     // 1. Get AI text from OpenAI (stream internally, but wait until complete here)
//     const response = await ChatApiStreaming(message);
//     console.log("AI Response:", response.msg);

//     // 2. Stream voice directly to HTTP client (starts playing immediately)
//     await MakeVoiceStream(response.msg, res);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });

app.listen(PORT, (req, res) => {
  console.log("Server is running on port " + PORT);
});
