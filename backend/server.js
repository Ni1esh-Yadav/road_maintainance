const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const ort = require("onnxruntime-node");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const upload = multer({ dest: "uploads/" });

// Add CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Create results directory if not exists
const resultsDir = path.join(__dirname, "results");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Serve saved images
app.use("/results", express.static(resultsDir));

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
    process.exit(1);
  }
}

// Preprocess Image for ONNX Model
async function preprocessImage(imagePath) {
  try {
    const { data, info } = await sharp(imagePath)
      .resize(640, 640)
      .toFormat("png")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

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
  } catch (error) {
    console.error("❌ Image preprocessing failed:", error);
    throw error;
  }
}

const ensureFileExists = (filePath, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (fs.existsSync(filePath)) {
        resolve(true);
      } else if (Date.now() - start > timeout) {
        reject(new Error("File creation timeout"));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

// Prediction Route
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded!" });
    }

    // Get original image metadata
    const metadata = await sharp(req.file.path).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    // Process image and run detection
    const imageTensor = await preprocessImage(req.file.path);
    const results = await session.run({ images: imageTensor });
    const rawData = results.output0.cpuData;

    // Process detections
    const detections = [];
    for (let i = 0; i < rawData.length; i += 6) {
      const [x_center, y_center, width, height, confidence] = rawData.slice(
        i,
        i + 6
      );

      // Ensure confidence value is within a valid range
      if (confidence > 630.5) {
        const detection = {
          x: (x_center - width / 2) * originalWidth,
          y: (y_center - height / 2) * originalHeight,
          width: width * originalWidth,
          height: height * originalHeight,
          confidence: confidence,
        };
        detections.push(detection);
      }
    }

    // Generate result image
    const resultFilename = `result_${uuidv4()}.jpg`;
    const resultPath = path.join(resultsDir, resultFilename);

    // Create SVG overlay
    const svg = `
      <svg width="${originalWidth}" height="${originalHeight}">
        ${detections
          .map(
            (d) => `
          <rect x="${d.x}" y="${d.y}"
                width="${d.width}" height="${d.height}"
                stroke="red" fill="none" stroke-width="3"/>
        `
          )
          .join("")}
      </svg>
    `;

    // Composite image with overlay
    await sharp(req.file.path)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .toFile(resultPath);

    // Ensure the file exists before sending response
    await ensureFileExists(resultPath);

    const resultUrl = `http://192.168.1.12:5000/results/${resultFilename}`;
    res.json({
      detections,
      imageUrl: resultUrl,
      originalWidth,
      originalHeight,
    });
    console.log(detections);
  } catch (error) {
    console.error("❌ Prediction Error:", error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Start server after model loads
loadModel().then(() => {
  app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
    console.log("🔗 Test endpoint: POST http://localhost:5000/predict");
  });
});
