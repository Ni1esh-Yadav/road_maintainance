const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const ort = require("onnxruntime-node");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

let session;

// Load ONNX Model
async function loadModel() {
  try {
    session = await ort.InferenceSession.create(
      path.join(__dirname, "YOLOv8_Small_RDD.onnx")
    );
    console.log("✅ ONNX Model Loaded Successfully!");
  } catch (error) {
    console.error("❌ Error Loading ONNX Model:", error);
  }
}
loadModel();

// Preprocess Image for ONNX Model
async function preprocessImage(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(640, 640) // Resize to 640x640
    .toFormat("png") // Convert to PNG (to avoid format issues)
    .removeAlpha() // Remove transparency if any
    .raw() // Get raw pixel data
    .toBuffer({ resolveWithObject: true });

  // Convert image buffer to Float32Array and normalize pixel values (0-1)
  const float32Array = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    float32Array[i] = data[i] / 255.0;
  }

  return new ort.Tensor("float32", float32Array, [
    1,
    3,
    info.height,
    info.width,
  ]);
}

// Prediction Route
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded!" });
    }

    const imageTensor = await preprocessImage(req.file.path);
    const results = await session.run({ images: imageTensor });

    // Extract relevant detection info
    const rawData = results.output0.cpuData;
    const detections = [];

    // Loop through the data in chunks of 8 (assuming each detection has 8 values)
    for (let i = 0; i < rawData.length; i += 8) {
      const [x, y, width, height, confidence, classId] = rawData.slice(
        i,
        i + 8
      );

      // Only keep detections with high confidence (e.g., > 0.5)
      if (confidence > 0.5) {
        detections.push({ x, y, width, height, confidence, classId });
      }
    }

    // Send filtered detections
    res.json({ detections });
  } catch (error) {
    console.error("❌ Prediction Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
