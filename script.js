// ==========================================
// DRAW2WEB AI - CANVAS ENGINE
// ==========================================
let generatedHTML = "";
let generatedCSS = "";

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

    const oldImage = canvas.toDataURL();

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#172a35";
    ctx.lineWidth = brushSize.value;

    // Restore previous drawing
    if (history.length > 0) {

        const image = new Image();

        image.onload = function () {
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
// MOUSE POSITION
// ==========================================

function getMousePosition(event) {

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

    isDrawing = true;

    const position = getMousePosition(event);

    lastX = position.x;
    lastY = position.y;

    canvasHint.style.opacity = "0";

    saveCanvas();
}


// ==========================================
// DRAW
// ==========================================

function draw(event) {

    if (!isDrawing) {
        return;
    }

    const position = getMousePosition(event);

    ctx.beginPath();

    ctx.moveTo(lastX, lastY);

    ctx.lineTo(
        position.x,
        position.y
    );

    ctx.strokeStyle = "#172a35";

    ctx.lineWidth = brushSize.value;

    ctx.lineCap = "round";

    ctx.lineJoin = "round";

    ctx.stroke();

    lastX = position.x;
    lastY = position.y;
}


// ==========================================
// STOP DRAWING
// ==========================================

function stopDrawing() {

    if (!isDrawing) {
        return;
    }

    isDrawing = false;

    saveCanvas();
}


// ==========================================
// SAVE CANVAS HISTORY
// ==========================================

function saveCanvas() {

    const image = canvas.toDataURL();

    history.push(image);

    // Keep only last 20 actions
    if (history.length > 20) {
        history.shift();
    }
}


// ==========================================
// UNDO
// ==========================================

function undoCanvas() {

    if (history.length <= 1) {

        clearCanvas();

        return;
    }

    history.pop();

    const previousImage =
        history[history.length - 1];

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

    image.src = previousImage;
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

    canvasHint.style.opacity = "1";

    saveCanvas();
}


// ==========================================
// BRUSH SIZE
// ==========================================

brushSize.addEventListener(
    "input",
    function () {

        ctx.lineWidth =
            brushSize.value;

    }
);


// ==========================================
// MOUSE EVENTS
// ==========================================

canvas.addEventListener(
    "mousedown",
    startDrawing
);

canvas.addEventListener(
    "mousemove",
    draw
);

canvas.addEventListener(
    "mouseup",
    stopDrawing
);

canvas.addEventListener(
    "mouseleave",
    stopDrawing
);


// ==========================================
// TOUCH EVENTS
// ==========================================

canvas.addEventListener(
    "touchstart",
    function (event) {

        event.preventDefault();

        const touch =
            event.touches[0];

        const rect =
            canvas.getBoundingClientRect();

        isDrawing = true;

        lastX =
            touch.clientX - rect.left;

        lastY =
            touch.clientY - rect.top;

        canvasHint.style.opacity = "0";

        saveCanvas();
    }
);


canvas.addEventListener(
    "touchmove",
    function (event) {

        event.preventDefault();

        if (!isDrawing) {
            return;
        }

        const touch =
            event.touches[0];

        const rect =
            canvas.getBoundingClientRect();

        const currentX =
            touch.clientX - rect.left;

        const currentY =
            touch.clientY - rect.top;

        ctx.beginPath();

        ctx.moveTo(
            lastX,
            lastY
        );

        ctx.lineTo(
            currentX,
            currentY
        );

        ctx.strokeStyle =
            "#172a35";

        ctx.lineWidth =
            brushSize.value;

        ctx.lineCap =
            "round";

        ctx.lineJoin =
            "round";

        ctx.stroke();

        lastX = currentX;

        lastY = currentY;
    }
);


canvas.addEventListener(
    "touchend",
    stopDrawing
);

// ==========================================
// GENERATE WEBSITE WITH AI
// ==========================================
async function generateWebsite() {

    if (history.length <= 1) {
        alert("✏️ Please draw a website layout first!");
        return;
    }

    const canvas = document.getElementById("drawingCanvas");
    const image = canvas.toDataURL("image/png");

    alert("🤖 AI is generating your website...");

    try {

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

        const data = await response.json();
        generatedHTML = data.html || "";
        generatedCSS = data.css || "";

        console.log("Backend Response:", data);

        if (!response.ok || !data.success) {

            alert(
                "❌ Website generation failed.\n\n" +
                (data.message || "Unknown error")
            );

            return;
        }

        console.log("Components:", data.components);
        console.log("Description:", data.description);
        console.log("HTML:", data.html);
        console.log("CSS:", data.css);


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

<title>AI Generated Website</title>

<style>

${data.css}

</style>

</head>

<body>

${data.html}

</body>

</html>
`;


        // ==========================================
        // SHOW WEBSITE IN IFRAME
        // ==========================================

        const preview =
            document.getElementById("websitePreview");

        preview.srcdoc = websiteCode;

        // ==========================================
// DOWNLOAD GENERATED WEBSITE
// ==========================================

const downloadButton = document.createElement("button");

downloadButton.innerText = "⬇️ Download Website";

downloadButton.style.marginTop = "15px";
downloadButton.style.padding = "12px 20px";
downloadButton.style.border = "none";
downloadButton.style.borderRadius = "8px";
downloadButton.style.cursor = "pointer";
downloadButton.style.background = "#172a35";
downloadButton.style.color = "white";
downloadButton.style.fontSize = "15px";

downloadButton.onclick = function () {

    const blob = new Blob(
        [websiteCode],
        { type: "text/html" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "ai-generated-website.html";

    link.click();

    URL.revokeObjectURL(url);
};

preview.parentElement.appendChild(downloadButton);


        // ==========================================
        // SCROLL TO PREVIEW
        // ==========================================

        preview.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        alert(
            "🎉 Website Generated Successfully!\n\n" +
            "Components:\n" +
            data.components.join(", ")
        );


    } catch (error) {

        console.error("Generation Error:", error);

        alert(
            "❌ Cannot connect to backend.\n\n" +
            "Make sure the backend is running at:\n" +
            "http://localhost:5000"
        );

    }
}
// ==========================================
// INITIALIZE
// ==========================================

window.addEventListener(
    "load",
    function () {

        resizeCanvas();

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = brushSize.value;
        ctx.strokeStyle = "#172a35";

        saveCanvas();
    }
);


// ==========================================
// RESIZE
// ==========================================

window.addEventListener(
    "resize",
    resizeCanvas
);
function setPreview(mode) {

    const preview = document.getElementById("websitePreview");

    if (mode === "mobile") {
        preview.style.width = "390px";
        preview.style.height = "700px";
        preview.style.margin = "20px auto";
    } else {
        preview.style.width = "100%";
        preview.style.height = "600px";
        preview.style.margin = "20px 0";
    }
}
function showHTML() {
    const viewer = document.getElementById("codeViewer");

    if (!generatedHTML) {
        viewer.textContent = "Generate a website first.";
        return;
    }

    viewer.textContent = generatedHTML;
}

function showCSS() {
    const viewer = document.getElementById("codeViewer");

    if (!generatedCSS) {
        viewer.textContent = "Generate a website first.";
        return;
    }

    viewer.textContent = generatedCSS;
}

function copyHTML() {
    if (!generatedHTML) {
        alert("Generate a website first.");
        return;
    }

    navigator.clipboard.writeText(generatedHTML);
    alert("✅ HTML copied!");
}

function copyCSS() {
    if (!generatedCSS) {
        alert("Generate a website first.");
        return;
    }

    navigator.clipboard.writeText(generatedCSS);
    alert("✅ CSS copied!");
}

function downloadWebsite() {
    if (!generatedHTML) {
        alert("Generate a website first.");
        return;
    }

    const fullWebsite = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Generated Website</title>

    <style>
        ${generatedCSS}
    </style>
</head>

<body>

${generatedHTML}

</body>
</html>
`;

    const blob = new Blob([fullWebsite], {
        type: "text/html"
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "generated-website.html";

    link.click();

    URL.revokeObjectURL(link.href);
}