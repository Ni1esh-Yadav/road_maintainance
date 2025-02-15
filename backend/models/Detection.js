const mongoose = require("mongoose");

const DetectionSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true }, // URL of the processed image
  detections: [
    {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      confidence: Number,
      classId: Number,
    },
  ],
  originalWidth: Number,
  originalHeight: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Link to User
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Detection = mongoose.model("Detection", DetectionSchema);
module.exports = Detection;
