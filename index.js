const express = require("express");
const {
  BedrockRuntimeClient,
  InvokeModelCommand
} = require("@aws-sdk/client-bedrock-runtime");

const axios = require("axios");
require("dotenv").config();
const app = express();
const PORT = 5000;

// Middleware om JSON-gegevens te ontvangen
app.use(express.json());

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Je Hugging Face API-sleutel
// const HUGGING_FACE_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN;

app.post("/ask", async (req, res) => {
  const { question, context } = req.body;
  // amazon.titan-text-lite-v1
  // amazon.titan-text-express-v1

  // amazon.titan-embed-text-v1
  // amazon.titan-embed-text-v2:0
  // amazon.titan-embed-image-v1

  try {
    // Stap 1: Vraag embeddings voor de vraag
    // const embeddingsCommand = new InvokeModelCommand({
    //   modelId: "amazon.titan-embed-text-v1", // amazon.titan-embed-text-v2:0
    //   contentType: "application/json",
    //   body: JSON.stringify({
    //     inputText: question
    //   })
    // });
    // const embeddingsResponse = await client.send(embeddingsCommand);

    // const answer1 = JSON.parse(
    //   new TextDecoder().decode(embeddingsResponse.body)
    // );
    // embedding answer for search results
    // console.log(answer1.embedding);
    // Hier kun je een vergelijkingsalgoritme toevoegen (bijvoorbeeld cosine similarity)

    // Stap 2: Genereer een antwoord
    const command = new InvokeModelCommand({
      modelId: "amazon.titan-text-express-v1",
      contentType: "application/json",
      body: JSON.stringify({
        inputText: question,
        textGenerationConfig: {
          maxTokenCount: 8192,
          stopSequences: [],
          temperature: 0,
          topP: 1
        }
      })
    });
    const textResponse = await client.send(command);
    const answer = JSON.parse(new TextDecoder().decode(textResponse.body));

    res.json({ answer: answer.results?.[0]?.outputText });
  } catch (error) {
    console.error("Error bij Bedrock Runtime:", error);
    res
      .status(500)
      .send({ error: "Er is iets misgegaan met het verwerken van je vraag." });
  }
});

// huggingface
app.post("/generate", async (req, res) => {
  const inputText = req.body.text;
  const API_URL = "https://api-inference.huggingface.co/models/gpt2"; // gpt2 kan vervangen worden met andere models

  try {
    const response = await axios.post(
      API_URL,
      {
        inputs: inputText
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Stuur het resultaat naar de frontend
    res.json({ generated_text: response.data[0].generated_text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Er ging iets mis bij het genereren van tekst");
  }
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
