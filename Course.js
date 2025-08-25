// models/Course.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["Rapid", "Academic", "Workshop", "Other"],
    },
    ageGroup: [String], // e.g. ["6-8", "9-12"]
    structure: [String], // e.g. "Phonics", "Grammar", "Creative Writing"
    painPoints: [String],
    solutions: [String],
    salesScript: String,
    embeddings: {
      type: [Number],
      index: "vector",
      dimensions: 1536,
      similarity: "cosine",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
