// Get the canvas element and its 2d drawing context
const canvas = document.getElementById("sketchCanvas");
const ctx = canvas.getContext("2d");

// Variables to track drawing state
let drawing = false;

// Event listeners for mouse and touch events
canvas.addEventListener("mousedown", () => {
    drawing = true;
    ctx.beginPath();
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.closePath();
});

canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchstart", () => {
    drawing = true;
    ctx.beginPath();
});

canvas.addEventListener("touchend", () => {
    drawing = false;
    ctx.closePath();
});

canvas.addEventListener("touchmove", draw);

// Function to draw on the canvas
function draw(e) {
    if (!drawing) return;

    ctx.lineWidth = 2; // Set the line width
    ctx.strokeStyle = "#000"; // Set the stroke color
    ctx.lineCap = "round"; // Set the line cap style

    if (e.type === "mousemove") {
        ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    } else if (e.type === "touchmove") {
        const touch = e.touches[0];
        ctx.lineTo(touch.clientX - canvas.offsetLeft, touch.clientY - canvas.offsetTop);
    }

    ctx.stroke();
}

// Clear the canvas
document.getElementById("clearCanvas").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
