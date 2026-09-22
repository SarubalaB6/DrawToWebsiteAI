const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
    res.json({
        message: "Draw2Web AI Backend is running 🚀"
    });
});

// ========================================
// SAFE JSON PARSER
// ========================================

function extractJSON(text) {
    if (!text) {
        throw new Error("Gemini returned an empty response");
    }

    text = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No valid JSON object found in Gemini response");
    }

    let jsonText = text.substring(firstBrace, lastBrace + 1);

    jsonText = jsonText.replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
        ""
    );

    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.log("⚠️ Gemini returned invalid JSON.");
        throw new Error(
            "Gemini returned invalid JSON. Please try again."
        );
    }
}

// ========================================
// GEMINI REQUEST WITH RETRY
// ========================================

async function generateWebsiteWithRetry(contents, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(
                `🔄 Gemini attempt ${attempt}/${maxRetries}`
            );

            const response = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: contents
            });

            console.log("🤖 Gemini response received");

            return response;

        } catch (error) {
            lastError = error;

            // ========================================
            // CLEAN ERROR HANDLING
            // ========================================

            if (error.status === 503) {
                console.log(
                    `⚠️ Gemini is temporarily busy. Retry ${attempt}/${maxRetries}...`
                );
            } else if (error.status === 429) {
                console.log(
                    `⚠️ Gemini request limit reached. Retry ${attempt}/${maxRetries}...`
                );
            } else if (error.status === 500) {
                console.log(
                    `⚠️ Gemini server error. Retry ${attempt}/${maxRetries}...`
                );
            } else {
                console.log(
                    `⚠️ Gemini request failed. Retry ${attempt}/${maxRetries}...`
                );
            }

            // ========================================
            // RETRY TEMPORARY ERRORS
            // ========================================

            if (
                error.status === 503 ||
                error.status === 429 ||
                error.status === 500
            ) {
                if (attempt < maxRetries) {
                    const waitTime = attempt * 2000;

                    console.log(
                        `⏳ Waiting ${waitTime / 1000}s before retry...`
                    );

                    await new Promise(resolve =>
                        setTimeout(resolve, waitTime)
                    );

                    continue;
                }
            }

            // Other errors
            throw error;
        }
    }

    throw lastError;
}

// ========================================
// ANALYZE DRAWING
// ========================================

app.post("/analyze", async (req, res) => {

    try {

        const { image } = req.body;

        // ========================================
        // CHECK IMAGE
        // ========================================

        if (!image) {
            return res.status(400).json({
                success: false,
                message: "Drawing image is required"
            });
        }

        console.log("🖼️ Drawing received");

        // ========================================
        // IMAGE VALIDATION
        // ========================================

        const match = image.match(
            /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
        );

        if (!match) {
            return res.status(400).json({
                success: false,
                message: "Invalid image format"
            });
        }

        const mimeType = match[1];
        const base64Image = match[2];

        console.log("🤖 Sending drawing to Gemini...");

        // ========================================
        // PROMPT
        // ========================================

        const prompt = `
You are a professional frontend developer.

Analyze this hand-drawn website wireframe.

Create a complete modern responsive website based on the drawing.

Return ONLY a valid JSON object.

Use exactly this structure:

{
  "components": [],
  "description": "",
  "html": "",
  "css": ""
}

Rules:

1. components must contain detected website elements.
2. description must briefly explain the website.
3. html must contain ONLY HTML inside the body.
4. css must contain complete CSS for the generated website.
5. Make the website responsive.
6. Do not use JavaScript.
7. Do not use external libraries.
8. Use semantic HTML.
9. Make the design clean and professional.
10. Do not use markdown code fences.
11. Do not include explanations outside the JSON.
12. Escape all double quotes inside JSON string values.
13. Escape newline characters inside HTML and CSS strings correctly.
14. Return syntactically valid JSON that can be parsed directly using JSON.parse().
`;

        // ========================================
        // GEMINI CONTENT
        // ========================================

        const contents = [
            {
                role: "user",
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }
        ];

        // ========================================
        // CALL GEMINI
        // ========================================

        const response = await generateWebsiteWithRetry(
            contents,
            3
        );

        // ========================================
        // GET RESPONSE TEXT
        // ========================================

        let result;

        if (typeof response.text === "function") {
            result = response.text();
        } else {
            result = response.text;
        }

        if (!result) {
            throw new Error(
                "Gemini returned an empty response"
            );
        }

        // ========================================
        // PARSE JSON
        // ========================================

        const aiData = extractJSON(result);

        // ========================================
        // VALIDATE RESULT
        // ========================================

        if (
            typeof aiData !== "object" ||
            aiData === null
        ) {
            throw new Error(
                "Gemini returned an invalid website object"
            );
        }

        console.log(
            "✅ Website generated successfully"
        );

        // ========================================
        // SEND TO FRONTEND
        // ========================================

        res.json({
            success: true,

            components:
                Array.isArray(aiData.components)
                    ? aiData.components
                    : [],

            description:
                typeof aiData.description === "string"
                    ? aiData.description
                    : "",

            html:
                typeof aiData.html === "string"
                    ? aiData.html
                    : "",

            css:
                typeof aiData.css === "string"
                    ? aiData.css
                    : ""
        });

    } catch (error) {

        // ========================================
        // CLEAN ERROR LOG
        // ========================================

        console.log(
            "⚠️ Website generation could not be completed."
        );

        // ========================================
        // FRIENDLY ERROR MESSAGE
        // ========================================

        let message =
            "AI website generation failed";

        if (error.status === 503) {

            message =
                "Gemini is temporarily busy. Please try again.";

        } else if (error.status === 429) {

            message =
                "Gemini request limit reached. Please try again later.";

        } else if (error.status === 400) {

            message =
                "Invalid request sent to Gemini.";

        } else if (
            error.message &&
            error.message.toLowerCase().includes("invalid json")
        ) {

            message =
                "Gemini generated invalid website data. Please try again.";

        } else if (
            error.message &&
            error.message.toLowerCase().includes("empty response")
        ) {

            message =
                "Gemini returned an empty response. Please try again.";

        }

        res.status(500).json({
            success: false,
            message: message
        });
    }
});

// ========================================
// SERVER
// ========================================

const PORT = 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 Draw2Web AI backend running at http://localhost:${PORT}`
    );

});