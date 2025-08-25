// insertData.js
import mongoose from "mongoose";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

import Knowledge from "./Knowledge.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ MongoDB connected");
}

async function insertKnowledge(
  title,
  type,
  content,
  tags = [],
  parent = null,
  children = null
) {
  // Generate embedding
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small", // cheaper & good for search
    input: content,
  });

  const vector = embeddingResponse.data[0].embedding;

  // Save to DB
  const knowledge = new Knowledge({
    title,
    type,
    content,
    tags,
    parent,
    children,
    embedding: vector,
  });

  const result = await knowledge.save();
  console.log(result);
  console.log(`✅ Inserted: ${title}`);
}

async function run() {
  await connectDB();

  await insertKnowledge(
    "Company About Us",
    "faq",
    "YoungLabs is an educational company focused on skill development for children and young learners. We provide customized courses designed for specific age groups with flexible learning plans.\n email: 'info@younglabs.in'\n phone:'+91-9289029696'\n website:'https://www.younglabs.in/'",
    ["Company", "About Us", "YoungLabs", "Meta Information"]
  );

  await insertKnowledge(
    "Benefits of Maths Learning Course",
    "faq",
    "oungLabs Maths Learning Course strengthens number sense, logical reasoning, and problem-solving. It is age-specific, includes interactive sessions, and ensures conceptual clarity—from basic operations to algebra and geometry building confidence for lifelong mathematical success",
    ["chils", "parent", "benefits", , "query"]
  );

  await insertKnowledge(
    "Acedamic Excellance Program",
    "faq",
    "YoungLabs' Academic Excellence Program is a structured online tuition solution for students from Class 1 to 12. It covers subjects like Maths, English, Science (Physics, Chemistry, Biology), Hindi, Social Studies, Business Studies, and Commerce. Available in 36, 72, and 144 sessions for 3, 6, and 12 months",
    ["chils", "parent", "query", "course", "acadamic", "school"]
  );

  mongoose.disconnect();
}

run();

// title,
//     type,
//     content,
//     tags,
//     parent,
//     children,

//     type: {
//       type: String,
//       enum: ["course", "faq", "script"],
//       default: "course",
//     },
//     tags: [String],
