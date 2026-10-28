
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();

app.use(cors());

app.use(
    express.json({
        limit: "10mb"
    })
);


const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {

    res.json({
        message:
            "Draw2Web AI Backend is running 🚀"
    });

});


// ========================================
// REPAIR GEMINI JSON
// ========================================

function repairJSON(text) {

    let result = "";

    let insideString = false;

    let escaped = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];


        // ====================================
        // BACKSLASH
        // ====================================

        if (escaped) {

            result += char;

            escaped = false;

            continue;

        }


        if (
            char === "\\" &&
            insideString
        ) {

            result += char;

            escaped = true;

            continue;

        }


        // ====================================
        // QUOTE
        // ====================================

        if (char === '"') {

            if (!insideString) {

                insideString = true;

                result += char;

                continue;

            }


            // Find next non-space character

            let nextIndex =
                i + 1;


            while (
                nextIndex < text.length &&
                /\s/.test(
                    text[nextIndex]
                )
            ) {

                nextIndex++;

            }


            const nextChar =
                text[nextIndex];


            // ====================================
            // REAL CLOSING QUOTE
            // ====================================

            if (
                nextChar === "," ||
                nextChar === "}" ||
                nextChar === "]" ||
                nextChar === ":"
            ) {

                insideString = false;

                result += char;

            }

            // ====================================
            // INNER QUOTE
            // ====================================

            else {

                result += '\\"';

            }

            continue;

        }


        // ====================================
        // NEW LINE INSIDE STRING
        // ====================================

        if (
            insideString &&
            char === "\n"
        ) {

            result += "\\n";

            continue;

        }


        if (
            insideString &&
            char === "\r"
        ) {

            continue;

        }


        result += char;

    }


    return result;

}


// ========================================
// CLEAN AI RESPONSE
// ========================================

function cleanAIResponse(text) {

    let cleaned =
        text.trim();


    // Remove markdown fences

    cleaned =
        cleaned
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();


    return cleaned;

}


// ========================================
// ANALYZE DRAWING
// ========================================

app.post(
    "/analyze",
    async (req, res) => {

        try {

            const {
                image
            } = req.body;


            // ====================================
            // CHECK IMAGE
            // ====================================

            if (!image) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Drawing image is required"

                });

            }


            console.log(
                "🖼️ Drawing received"
            );


            console.log(
                "🤖 Preparing image for Gemini..."
            );


            // ====================================
            // IMAGE REGEX
            // ====================================

            const match =
                image.match(
                    /^data:(image\/[a-zA-Z+]+);base64,(.+)$/
                );


            if (!match) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid image format"

                });

            }


            const mimeType =
                match[1];


            const base64Image =
                match[2];


            // ====================================
            // PROMPT
            // ====================================

            const prompt = `

You are a professional frontend developer.

Analyze the hand-drawn website wireframe.

Create a complete modern responsive website based on the drawing.

Return ONLY valid JSON.

Use exactly this structure:

{
  "components": [],
  "description": "",
  "html": "",
  "css": "",
  "js": ""
}

IMPORTANT JSON RULES:

1. The response MUST be valid JSON.

2. Escape every double quote inside HTML, CSS and JavaScript strings.

3. Use \\n for line breaks inside strings.

4. Do not use markdown code fences.

5. Do not write anything before or after the JSON.

6. Do not use unescaped quotation marks inside string values.

7. Make sure JSON.parse() can parse the response directly.

WEBSITE RULES:

1. components must contain detected website elements.

2. description must briefly describe the generated website.

3. html must contain only HTML body content.

4. css must contain complete CSS.

5. js must contain JavaScript required for interactions.

6. JavaScript is allowed.

7. Buttons should work when possible.

8. Navigation links should work.

9. Forms should have basic interaction.

10. Make the website responsive.

11. Do not use external libraries.

12. Use semantic HTML.

13. Make the design clean and professional.

14. Do not invent fake personal information or achievements unless they are clearly represented in the drawing.

15. Return valid JSON only.

`;


            // ====================================
            // GEMINI REQUEST
            // ====================================

            let response = null;

            const maxRetries = 3;


            for (
                let attempt = 1;
                attempt <= maxRetries;
                attempt++
            ) {

                try {

                    console.log(
                        `🤖 Sending drawing to Gemini... Attempt ${attempt}/${maxRetries}`
                    );


                    response =
                        await ai.models.generateContent({

                            model:
                                "gemini-3.6-flash",


                            contents: [

                                {

                                    role:
                                        "user",

                                    parts: [

                                        {
                                            text:
                                                prompt
                                        },

                                        {

                                            inlineData: {

                                                mimeType:
                                                    mimeType,

                                                data:
                                                    base64Image

                                            }

                                        }

                                    ]

                                }

                            ],


                            config: {

                                responseMimeType:
                                    "application/json"

                            }

                        });


                    console.log(
                        "🤖 Gemini response received"
                    );


                    break;

                }

                catch (error) {

                    console.error(
                        `❌ Gemini attempt ${attempt} failed:`,
                        error.message
                    );


                    if (
                        error.status === 503 ||
                        error.status === 429 ||
                        error.status === 500
                    ) {

                        if (
                            attempt <
                            maxRetries
                        ) {

                            console.log(
                                "⏳ Retrying in 3 seconds..."
                            );


                            await new Promise(
                                resolve =>
                                    setTimeout(
                                        resolve,
                                        3000
                                    )
                            );

                        }

                        else {

                            throw error;

                        }

                    }

                    else {

                        throw error;

                    }

                }

            }


            // ====================================
            // GET RESPONSE
            // ====================================

            let result =
                response?.text;


            if (!result) {

                throw new Error(
                    "Gemini returned an empty response"
                );

            }


            console.log(
                "📦 Raw Gemini response received"
            );


            // ====================================
            // CLEAN RESPONSE
            // ====================================

            result =
                cleanAIResponse(
                    result
                );


            // ====================================
            // FIRST JSON PARSE
            // ====================================

            let aiData;


            try {

                aiData =
                    JSON.parse(
                        result
                    );


                console.log(
                    "✅ JSON parsed successfully"
                );

            }

            catch (firstError) {

                console.log(
                    "⚠️ Normal JSON parsing failed"
                );


                console.log(
                    "🔧 Trying automatic JSON repair..."
                );


                // ====================================
                // REPAIR JSON
                // ====================================

                const repaired =
                    repairJSON(
                        result
                    );


                try {

                    aiData =
                        JSON.parse(
                            repaired
                        );


                    console.log(
                        "✅ JSON repaired successfully"
                    );

                }

                catch (secondError) {

                    console.error(
                        "❌ JSON repair failed"
                    );


                    console.error(
                        "Raw Gemini response:"
                    );


                    console.error(
                        result
                    );


                    return res.status(500).json({

                        success: false,

                        message:
                            "Gemini returned invalid JSON",

                        error:
                            secondError.message

                    });

                }

            }


            // ====================================
            // NORMALIZE RESPONSE
            // ====================================

            const components =
                Array.isArray(
                    aiData.components
                )
                    ? aiData.components
                    : [];


            const description =
                typeof aiData.description === "string"
                    ? aiData.description
                    : "";


            const html =
                typeof aiData.html === "string"
                    ? aiData.html
                    : "";


            const css =
                typeof aiData.css === "string"
                    ? aiData.css
                    : "";


            const js =
                typeof aiData.js === "string"
                    ? aiData.js
                    : "";


            // ====================================
            // CHECK HTML
            // ====================================

            if (!html) {

                console.warn(
                    "⚠️ Gemini returned empty HTML"
                );

            }


            // ====================================
            // SUCCESS
            // ====================================

            console.log(
                "================================"
            );


            console.log(
                "✅ Website generated successfully"
            );


            console.log(
                "HTML:",
                html.length,
                "characters"
            );


            console.log(
                "CSS:",
                css.length,
                "characters"
            );


            console.log(
                "JS:",
                js.length,
                "characters"
            );


            console.log(
                "Components:",
                components.length
            );


            console.log(
                "================================"
            );


            // ====================================
            // SEND TO FRONTEND
            // ====================================

            res.json({

                success: true,

                components:
                    components,

                description:
                    description,

                html:
                    html,

                css:
                    css,

                js:
                    js

            });

        }


        catch (error) {

            console.error(
                "❌ Gemini Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "AI website generation failed",

                error:
                    error.message

            });

        }

    }
);


// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Draw2Web AI backend running on port ${PORT}`);
});