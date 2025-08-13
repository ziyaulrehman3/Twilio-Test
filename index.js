import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();
app.use(express.json());

import twilio from "twilio";
import openai from "openai";
import axios from "axios";

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

// 🟢 Main Flow
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

app.post("/voice", async (req, res) => {
  // console.log("Calling from Twilio");
  console.log("Calling from Local Host");
  console.log(req.body.msg);
  const { message } = req.body;
  const response = await ChatApi(message);
  console.log(response);

  res.status(200).json(response);

  // const twiml = new twilio.twiml.VoiceResponse();
  // twiml.say("ello, this is a Ziya test call from Younglabs!");

  // res.type("text/xml");
  // res.send(twiml.toString());
});

app.listen(PORT, (req, res) => {
  console.log("Server is running on port " + PORT);
});
