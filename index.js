require("dotenv").config();

console.log("✅ Starting app...");
console.log("✅ OPENAI_API_KEY loaded:", !!process.env.OPENAI_API_KEY);
console.log("✅ PORT:", process.env.PORT);

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

// Opsional: Cek apakah API key terbaca
console.log("✅ OPENAI_API_KEY loaded?", !!process.env.OPENAI_API_KEY);

app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.send("✅ Whisper backend is running!");
});

app.post("/evaluateRecitation", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}.m4a`);
    fs.writeFileSync(tempPath, req.file.buffer);

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

    res.json({
      success: true,
      transcription: whisperResponse.data.text,
    });
  } catch (err) {
    console.error("Whisper error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed",
      details: err.response?.data || err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
