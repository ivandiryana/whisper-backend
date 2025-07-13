const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint test
app.get("/", (req, res) => {
  res.send("✅ Whisper backend is running!");
});

app.post("/evaluateRecitation", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log("✅ Audio file received:", req.file.originalname);
    const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}.m4a`);
    fs.writeFileSync(tempPath, req.file.buffer);
    console.log("✅ Audio saved at:", tempPath);

    const form = new FormData();
    form.append("file", fs.createReadStream(tempPath));
    form.append("model", "whisper-1");
    form.append("language", "id");

    const whisperResponse = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        maxBodyLength: Infinity,
      }
    );

    fs.unlinkSync(tempPath);
    console.log("✅ Transcription successful");

    res.json({
      success: true,
      transcription: whisperResponse.data.text,
    });
  } catch (err) {
    console.error("❌ Whisper error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed",
      details: err.response?.data || err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
