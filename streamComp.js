import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import weaviate from "weaviate-client";
import fs from "fs"; // For reading CSV
import csv from "csv-parser";

import { search } from "./query.js";

const BASE_URL1 = "https://api.openai.com/v1/chat/completions";
const BASE_URL2 = "https://api.openai.com/v1/threads";

const headers = {
  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  "OpenAI-Beta": "assistants=v2",
  "Content-Type": "application/json",
};

// export const client = weaviate.client({
//   scheme: "https",
//   host: process.env.WEAVIATE_HOST.replace("https://", ""),
//   apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
// });

async function createThread() {
  const response = await axios.post(`${BASE_URL2}`, {}, { headers });

  return response.data.id;
}

export async function ApiCalling(query, threadIdGiven = null, socket) {
  try {
    //Check Thread ID if not avilable then generate
    // console.log("✅ Thread Id:", threadIdGiven);

    // const threadId = threadIdGiven || (await createThread());
    // console.log("✅ Thread Id:", threadId);

    //Check Assistant ID

    // const assistantId = process.env.ASSISTANT_ID;
    // if (!assistantId) throw new Error("Missing ASSISTANT_ID");
    // console.log("✅ Assistance Id:", assistantId);

    //Find ReleventData

    const releventData = await search(query);
    console.log("Relevent Data:", releventData);

    //Adding Query to Thread

    // await axios.post(
    //   BASE_URL2 + "/" + threadId + "/messages",
    //   {
    //     role: "user",
    //     content: `Question:${query}\n\nRelevent Knowledge:\n${releventData}`,
    //   },
    //   {
    //     headers,
    //   }
    // );
    // console.log("✅ Query Add to Thread");

    //Now Streaming Answer and Run

    // const response = await axios.post(
    //   // BASE_URL2 + "/" + threadId + "/runs",
    //   BASE_URL1,
    //   {
    //     model: "gpt-4o-mini",
    //     // assistant_id: assistantId,
    //     messages: [
    //       {
    //         role: "system",
    //         content:
    //           "Your answers must only use the provided user history, and relevant Knowledge passed in messages not only promt or sytem instruction based, must use relevent knowledge provided in user content. Do not guess or create information outside of it.\n✅ Free Demo Class:\nYoungLabs provides a free demo class. Users can book it directly on the website or contact the team to schedule one.\n✅ Contact Information:\nIf a user asks to contact or be connected with the team, respond with:\nYou can WhatsApp us at +91 92890 29696.\n✅ Academic Excellence Program:\nMention that the Academic Excellence Program is like online tuition,offering in-depth support and structured learning for school subjects.\n✅ Discounts:\nIf a user asks about any discounts, respond with:\nFor current offers or discounts, please contact our team directly on WhatsApp at +91 92890 29696.\n✅ Course Mentions:\nOnly mention courses found in the knowledge base context passed.Examples include English, Maths, Science, Hindi, and Social Studies.\n❌ Do Not Mention any course not in the knowledge base. This includes robotics, coding, STEM, or abacus.\n❌ No Guessing:\nIf no course info is found, respond with:\nI am unable to answer this question. May I connect you with our team for a response?\n❌ Never mention source files or metadata.\n✅ Keep replies short (max 50 words), clear, and focused only on YoungLabs offerings.",
    //       },
    //       {
    //         role: "user",
    //         content: `Question:${query}\n\nRelevent Knowledge:\n${releventData}`,
    //       },
    //     ],
    //     stream: true,
    //   },
    //   {
    //     headers,
    //     responseType: "stream",
    //   }
    // );

    const newData = releventData.map((item) => {
      const temp = `${item.title},${item.type},${item.content},${item.tags}`;

      return temp.toString();
    });

    const response = await axios.post(
      BASE_URL1,
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Kimi, the official chatbot assistant of YoungLabs.Your answers  only use the provided Relevant Knowledge content passed in messages. Do not guess or create information outside of it.\nFree Demo Class:\nYoungLabs provides a free demo class. Users can book it directly on the website or contact the team to schedule one.\nContact Information:\nIf a user asks to contact or be connected with the team, respond with:'You can WhatsApp us at +91 92890 29696'\nAcademic Excellence Program:\nMention that the Academic Excellence Program is like online tuition,offering in-depth support and structured learning for school subjects.`,
          },

          {
            role: "user",
            content: `
Question: ${query}

Relevant Knowledge (only use this):
${newData}

Instructions:
- Answer ONLY using the above Relevant Knowledge.
- Do NOT invent information.
`,
          },
        ],
        stream: true,
      },
      {
        headers,
        responseType: "stream",
      }
    );

    if (!response.data) {
      throw new Error("No stream data received—check API response");
    }

    let fullResponse = "";
    // response.data.on("data", (chunk) => {
    //   console.log(chunk.toString());
    // });

    // response.data.on("data", (chunk) => {
    //   const chunkString = chunk.toString();
    //   console.log("Received chunk:", chunkString);
    //   // Parse SSE (add your logic here, e.g., extract deltas)
    //   const payloads = chunkString.split("\n\n");
    //   for (const payload of payloads) {
    //     if (payload.startsWith("data: ")) {
    //       try {
    //         const data = JSON.parse(payload.replace("data: ", ""));
    //         const content = data.data?.delta?.content?.[0]?.text?.value || "";
    //         if (content) fullResponse += content;
    //       } catch (error) {
    //         console.error("Chunk parse error:", error);
    //       }
    //     }
    //   }
    // });

    // response.data.on("data", async (chunk) => {
    //   const payloads = chunk.toString().split("\n\n");

    //   for (const payload of payloads) {
    //     if (payload == "event: done\ndata: [DONE]") {
    //       socket.emit("getResponse", "END-RESPONSE");
    //     }

    //     if (payload.startsWith("event: thread.message.delta")) {
    //       // Extract the part after "data: " (assuming SSE format with event and data lines)
    //       const parts = payload.split("data: ");
    //       if (parts.length > 1) {
    //         const dataPart = parts[1].trim(); // Get and clean the JSON string (index 1, not 10)

    //         try {
    //           const jsonPayload = JSON.parse(dataPart); // Parse the JSON
    //           //   console.log("Parsed Delta:", jsonPayload);

    //           // Safely access and log the nested text value
    //           const textValue =
    //             jsonPayload.delta?.content?.[0]?.text?.value || "";
    //           console.log("Streamed Text Value:", textValue);
    //           socket.emit("getResponse", textValue);

    //           // Accumulate or process textValue here (e.g., fullResponse += textValue)
    //         } catch (err) {
    //           console.error("Error parsing JSON:", err);
    //         }
    //       } else {
    //         console.log("No 'data: ' found in payload");
    //       }
    //     }
    //   }
    // });

    response.data.on("data", async (chunk) => {
      const payloads = chunk.toString().split("\n\n");

      for (const payload of payloads) {
        if (payload === "data: [DONE]") {
          socket.emit("getResponse", "END-RESPONSE");
        } else if (payload.startsWith("data: ")) {
          try {
            const data = await JSON.parse(payload.replace("data: ", ""));
            const textValue = (await data.choices?.[0]?.delta?.content) || "";
            if (textValue) {
              socket.emit("getResponse", textValue);
              // Optionally accumulate full response:
              fullResponse += textValue;
            }
          } catch (err) {
            console.error("Error parsing chunk JSON:", err);
          }
        }
      }
    });

    console.log("✅ Streaming is Running");

    // return textValue;
  } catch (err) {
    console.log(err);
    return "Hello Error";
  }
}
