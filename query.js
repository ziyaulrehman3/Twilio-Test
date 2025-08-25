// search.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import Knowledge from "./Knowledge.js";

// 1. Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 3. Search function
export async function search(query) {
  // Create embedding for the query
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  // Perform vector search
  const results = await Knowledge.aggregate([
    {
      $vectorSearch: {
        index: "vector_index", // 👈 add your Atlas index name here

        queryVector: embedding.data[0].embedding,
        path: "embedding",
        numCandidates: 100,
        limit: 5,
      },
    },
    {
      $project: {
        embedding: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
        _id: 0,
      },
    },
  ]);

  return results;
  // console.log("🔍 Search Results:", results);
}

// Run directly
// await search("automobile");

// Close connection
// await mongoose.connection.close();
