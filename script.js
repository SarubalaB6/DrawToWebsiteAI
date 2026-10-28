// ==========================================
// DRAW2WEB AI - COMPLETE SCRIPT
// ==========================================

// ==========================================
// GLOBAL GENERATED WEBSITE DATA
// ==========================================

let generatedHTML = "";
let generatedCSS = "";
let generatedJS = "";
let generatedComponents = [];
let generatedDescription = "";


// ==========================================
// CANVAS ELEMENTS
// ==========================================

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

const brushSize = document.getElementById("brushSize");
const canvasHint = document.querySelector(".canvas-hint");

let isDrawing = false;
let lastX = 0;
let lastY = 0;

let history = [];


// ==========================================
// CANVAS SIZE
// ==========================================

function resizeCanvas() {

    if (!canvas) return;

    const oldImage = canvas.width > 0 && canvas.height > 0
        ? canvas.toDataURL("image/png")
        : null;

    const rect = canvas.getBoundingClientRect();

    const width = Math.max(rect.width, 300);
    const height = Math.max(rect.height, 300);

    canvas.width = width;
    canvas.height = height;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#172a35";
    ctx.lineWidth = Number(brushSize?.value || 3);

    // Restore previous drawing
    if (oldImage && history.length > 0) {

        const image = new Image();

        image.onload = function () {

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );
        };

        image.src = oldImage;
    }
}


// ==========================================
// GET MOUSE / POINTER POSITION
// ==========================================

function getPointerPosition(event) {

    const rect = canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}


// ==========================================
// START DRAWING
// ==========================================

function startDrawing(event) {

    event.preventDefault();

    isDrawing = true;

    const position = getPointerPosition(event);

    lastX = position.x;
    lastY = position.y;

    if (canvasHint) {
        canvasHint.style.opacity = "0";
    }

    // Save current state before drawing
    saveCanvas();
}


// ==========================================
// DRAW
// ==========================================

function draw(event) {

    if (!isDrawing) return;

    event.preventDefault();

    const position = getPointerPosition(event);

    ctx.beginPath();

    ctx.moveTo(
        lastX,
        lastY
    );

    ctx.lineTo(
        position.x,
        position.y
    );

    ctx.strokeStyle = "#172a35";
    ctx.lineWidth = Number(brushSize?.value || 3);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.stroke();

    lastX = position.x;
    lastY = position.y;
}


// ==========================================
// STOP DRAWING
// ==========================================

function stopDrawing(event) {

    if (!isDrawing) return;

    if (event) {
        event.preventDefault();
    }

    isDrawing = false;

    saveCanvas();
}


// ==========================================
// SAVE CANVAS HISTORY
// ==========================================

function saveCanvas() {

    if (!canvas) return;

    const image = canvas.toDataURL("image/png");

    history.push(image);

    // Keep only last 20 states
    if (history.length > 20) {
        history.shift();
    }
}


// ==========================================
// RESTORE CANVAS
// ==========================================

function restoreCanvas(imageData) {

    const image = new Image();

    image.onload = function () {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );
    };

    image.src = imageData;
}


// ==========================================
// UNDO
// ==========================================

function undoCanvas() {

    if (history.length <= 1) {

        clearCanvas();

        return;
    }

    // Remove current state
    history.pop();

    const previousImage =
        history[history.length - 1];

    restoreCanvas(previousImage);
}


// ==========================================
// CLEAR CANVAS
// ==========================================

function clearCanvas() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    history = [];

    if (canvasHint) {
        canvasHint.style.opacity = "1";
    }

    saveCanvas();
}


// ==========================================
// CHECK WHETHER CANVAS IS EMPTY
// ==========================================

function isCanvasBlank() {

    const pixels = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    ).data;

    for (let i = 3; i < pixels.length; i += 4) {

        if (pixels[i] !== 0) {
            return false;
        }
    }

    return true;
}


// ==========================================
// BRUSH SIZE
// ==========================================

if (brushSize) {

    brushSize.addEventListener(
        "input",
        function () {

            ctx.lineWidth =
                Number(brushSize.value);

        }
    );
}


// ==========================================
// POINTER EVENTS
// ==========================================

canvas.style.touchAction = "none";

canvas.addEventListener(
    "pointerdown",
    startDrawing
);

canvas.addEventListener(
    "pointermove",
    draw
);

canvas.addEventListener(
    "pointerup",
    stopDrawing
);

canvas.addEventListener(
    "pointercancel",
    stopDrawing
);

canvas.addEventListener(
    "pointerleave",
    function (event) {

        if (isDrawing) {
            stopDrawing(event);
        }

    }
);


// ==========================================
// GENERATE WEBSITE WITH AI
// ==========================================

async function generateWebsite() {

    // Check empty canvas
    if (isCanvasBlank()) {

        alert(
            "✏️ Please draw a website layout first!"
        );

        return;
    }


    // ==========================================
    // GET CANVAS IMAGE
    // ==========================================

    const image = canvas.toDataURL(
        "image/png"
    );


    // ==========================================
    // GENERATE BUTTON
    // ==========================================

    const generateButton =
        document.getElementById("generateBtn") ||
        document.querySelector(
            'button[onclick="generateWebsite()"]'
        );


    if (generateButton) {

        generateButton.disabled = true;

        generateButton.dataset.originalText =
            generateButton.innerText;

        generateButton.innerText =
            "🤖 Generating...";
    }


    console.log("================================");
    console.log("🚀 DRAW2WEB AI");
    console.log("================================");
    console.log("📸 Drawing received");
    console.log("🤖 Sending drawing to Gemini...");


    try {

        // ==========================================
        // SEND IMAGE TO BACKEND
        // ==========================================

        const response = await fetch(
            "http://localhost:5000/analyze",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    image: image
                })
            }
        );


        // ==========================================
        // READ RESPONSE
        // ==========================================

        const data = await response.json();

        console.log(
            "🤖 Backend Response:",
            data
        );


        // ==========================================
        // CHECK ERROR
        // ==========================================

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Website generation failed."
            );
        }


        // ==========================================
        // STORE GENERATED DATA
        // ==========================================

        generatedHTML =
            data.html || "";

        generatedCSS =
            data.css || "";

        generatedJS =
            data.js || "";

        generatedComponents =
            Array.isArray(data.components)
                ? data.components
                : [];

        generatedDescription =
            data.description || "";


        console.log(
            "🧩 Components:",
            generatedComponents
        );

        console.log(
            "📝 Description:",
            generatedDescription
        );

        console.log(
            "🌐 HTML length:",
            generatedHTML.length
        );

        console.log(
            "🎨 CSS length:",
            generatedCSS.length
        );

        console.log(
            "⚡ JavaScript length:",
            generatedJS.length
        );


        // ==========================================
        // UPDATE COMPONENT LIST
        // ==========================================

        displayComponents();


        // ==========================================
        // UPDATE CODE VIEWER
        // ==========================================

        showHTML();


        // ==========================================
        // SHOW WEBSITE PREVIEW
        // ==========================================

        showPreview();


        // ==========================================
        // SUCCESS MESSAGE
        // ==========================================

        console.log(
            "✅ Website generated successfully!"
        );


        alert(
            "🎉 Website Generated Successfully!\n\n" +
            "Components:\n" +
            (
                generatedComponents.length > 0
                    ? generatedComponents.join(", ")
                    : "Website components detected"
            )
        );


        // ==========================================
        // SCROLL TO PREVIEW
        // ==========================================

        const preview =
            document.getElementById(
                "websitePreview"
            );

        if (preview) {

            preview.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }


    } catch (error) {

        console.error(
            "❌ Generation Error:",
            error
        );


        alert(
            "❌ Website generation failed.\n\n" +
            error.message +
            "\n\nMake sure the backend is running at:\n" +
            "http://localhost:5000"
        );


    } finally {

        // ==========================================
        // RESTORE GENERATE BUTTON
        // ==========================================

        if (generateButton) {

            generateButton.disabled = false;

            generateButton.innerText =
                generateButton.dataset.originalText ||
                "Generate Website";
        }
    }
}


// ==========================================
// SHOW WEBSITE PREVIEW
// ==========================================

function showPreview() {

    const preview =
        document.getElementById(
            "websitePreview"
        );


    if (!preview) {

        console.error(
            "❌ websitePreview iframe not found."
        );

        return;
    }


    // ==========================================
    // PROTECT SCRIPT TAG
    // ==========================================

    const safeJS =
        generatedJS.replace(
            /<\/script/gi,
            "<\\/script"
        );


    // ==========================================
    // CREATE COMPLETE WEBSITE
    // ==========================================

    const websiteCode = `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Draw2Web AI Generated Website</title>

    <style>

        ${generatedCSS}

    </style>

</head>

<body>

    ${generatedHTML}

    <script>

        try {

            ${safeJS}

        } catch (error) {

            console.error(
                "Generated Website JavaScript Error:",
                error
            );

        }

    <\/script>

</body>

</html>
`;


    // ==========================================
    // IFRAME SECURITY
    // ==========================================

    preview.setAttribute(
        "sandbox",
        "allow-scripts allow-forms"
    );


    // ==========================================
    // LOAD WEBSITE
    // ==========================================

    preview.srcdoc =
        websiteCode;


    console.log(
        "🌐 Preview loaded with HTML + CSS + JS"
    );
}


// ==========================================
// DISPLAY COMPONENTS
// ==========================================

function displayComponents() {

    const componentsList =
        document.getElementById(
            "componentsList"
        );


    if (!componentsList) {
        return;
    }


    componentsList.innerHTML = "";


    if (
        !generatedComponents ||
        generatedComponents.length === 0
    ) {

        componentsList.innerHTML =
            "<p>No components detected.</p>";

        return;
    }


    generatedComponents.forEach(
        function (component, index) {

            const item =
                document.createElement("div");

            item.className =
                "detected-component";


            item.innerHTML = `
                <span class="component-number">
                    ${index + 1}
                </span>

                <span class="component-name">
                    ${escapeHTML(component)}
                </span>
            `;


            componentsList.appendChild(item);

        }
    );
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// SHOW HTML
// ==========================================

function showHTML() {

    const viewer =
        document.getElementById(
            "codeViewer"
        );


    if (!viewer) {
        return;
    }


    if (!generatedHTML) {

        viewer.textContent =
            "Generate a website to view the code.";

        return;
    }


    viewer.textContent =
        generatedHTML;
}


// ==========================================
// SHOW CSS
// ==========================================

function showCSS() {

    const viewer =
        document.getElementById(
            "codeViewer"
        );


    if (!viewer) {
        return;
    }


    if (!generatedCSS) {

        viewer.textContent =
            "Generate a website to view the code.";

        return;
    }


    viewer.textContent =
        generatedCSS;
}


// ==========================================
// SHOW JAVASCRIPT
// ==========================================

function showJS() {

    const viewer =
        document.getElementById(
            "codeViewer"
        );


    if (!viewer) {
        return;
    }


    if (!generatedJS) {

        viewer.textContent =
            "No JavaScript generated.";

        return;
    }


    viewer.textContent =
        generatedJS;
}


// ==========================================
// COPY HTML
// ==========================================

async function copyHTML() {

    if (!generatedHTML) {

        alert(
            "Generate a website first."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            generatedHTML
        );

        alert(
            "✅ HTML copied!"
        );

    } catch (error) {

        console.error(
            "Copy HTML error:",
            error
        );

        alert(
            "❌ Could not copy HTML."
        );
    }
}


// ==========================================
// COPY CSS
// ==========================================

async function copyCSS() {

    if (!generatedCSS) {

        alert(
            "Generate a website first."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            generatedCSS
        );

        alert(
            "✅ CSS copied!"
        );

    } catch (error) {

        console.error(
            "Copy CSS error:",
            error
        );

        alert(
            "❌ Could not copy CSS."
        );
    }
}


// ==========================================
// COPY JAVASCRIPT
// ==========================================

async function copyJS() {

    if (!generatedJS) {

        alert(
            "No JavaScript generated."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            generatedJS
        );

        alert(
            "✅ JavaScript copied!"
        );

    } catch (error) {

        console.error(
            "Copy JS error:",
            error
        );

        alert(
            "❌ Could not copy JavaScript."
        );
    }
}


// ==========================================
// CREATE COMPLETE WEBSITE CODE
// ==========================================

function getCompleteWebsiteCode() {

    const safeJS =
        generatedJS.replace(
            /<\/script/gi,
            "<\\/script"
        );


    return `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Draw2Web AI Website</title>

    <style>

${generatedCSS}

    </style>

</head>

<body>

${generatedHTML}

<script>

${safeJS}

<\/script>

</body>

</html>
`;
}


// ==========================================
// DOWNLOAD WEBSITE
// ==========================================

function downloadWebsite() {

    if (!generatedHTML) {

        alert(
            "Generate a website first."
        );

        return;
    }


    const fullWebsite =
        getCompleteWebsiteCode();


    const blob =
        new Blob(
            [fullWebsite],
            {
                type: "text/html"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "draw2web-ai-website.html";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    setTimeout(
        function () {

            URL.revokeObjectURL(url);

        },
        1000
    );


    console.log(
        "⬇️ Website downloaded"
    );
}


// ==========================================
// PREVIEW MODE
// ==========================================

function setPreview(mode) {

    const preview =
        document.getElementById(
            "websitePreview"
        );


    if (!preview) {
        return;
    }


    if (mode === "mobile") {

        preview.style.width =
            "390px";

        preview.style.height =
            "700px";

        preview.style.margin =
            "20px auto";


    } else {

        preview.style.width =
            "100%";

        preview.style.height =
            "600px";

        preview.style.margin =
            "20px 0";
    }
}


// ==========================================
// DESKTOP PREVIEW
// ==========================================

function desktopPreview() {

    setPreview("desktop");
}


// ==========================================
// MOBILE PREVIEW
// ==========================================

function mobilePreview() {

    setPreview("mobile");
}


// ==========================================
// INITIALIZE
// ==========================================

window.addEventListener(
    "load",
    function () {

        resizeCanvas();

        ctx.lineCap =
            "round";

        ctx.lineJoin =
            "round";

        ctx.lineWidth =
            Number(brushSize?.value || 3);

        ctx.strokeStyle =
            "#172a35";


        // Save initial blank state
        history = [];

        saveCanvas();


        console.log(
            "✅ Draw2Web AI script loaded"
        );

    }
);


// ==========================================
// WINDOW RESIZE
// ==========================================

window.addEventListener(
    "resize",
    function () {

        resizeCanvas();

    }
);