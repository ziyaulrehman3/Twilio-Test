import mongoose from "mongoose";

const KnowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["course", "faq", "script"],
      default: "course",
    },
    content: { type: String, required: true },
    embedding: { type: [Number], index: "2dsphere" }, // vector field
    tags: [String],
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Knowledge" }, // relation
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Knowledge" }], // nested
  },
  { timestamps: true }
);

export default mongoose.model("Knowledge", KnowledgeSchema);
