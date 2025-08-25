// models/Company.js
import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    mission: String,
    vision: String,
    contact: {
      email: String,
      phone: String,
      address: String,
    },
    embeddings: {
      type: [Number], // store vector embedding
      index: "vector", // Atlas Vector Search index
      dimensions: 1536, // match with your embedding model
      similarity: "cosine",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
