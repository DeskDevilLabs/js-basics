// Canvas setup
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');
const brushBtn = document.getElementById('brush-btn');
const eraserBtn = document.getElementById('eraser-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const colorPalette = document.querySelector('.color-palette');

// Drawing state
let isDrawing = false;
let currentColor = colorPicker.value;
let currentSize = brushSize.value;
let currentTool = 'brush';

// Color palette
const paletteColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#00ffff', '#ff00ff', '#ff9900', '#9900ff',
    '#0099ff', '#ff0099', '#99ff00', '#00ff99', '#ff6600',
    '#6600ff', '#0066ff', '#ff0066', '#66ff00', '#00ff66'
];

// Initialize the app
function init() {
    // Set up canvas
    resizeCanvas();

    // Only fill with white if the canvas is empty
    if (ctx.getImageData(0, 0, 1, 1).data[3] === 0) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = currentColor;
    }
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentColor;
    
    // Create color palette
    createColorPalette();
    
    // Set up event listeners
    setupEventListeners();
    
    // Enter fullscreen on first user interaction
    document.addEventListener('click', function fullscreenOnClick() {
        enterFullscreen();
        document.removeEventListener('click', fullscreenOnClick);
    }, { once: true });
}

function resizeCanvas() {
    // Save the current canvas content
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Resize the canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.querySelector('.controls').offsetHeight;
    
    // Restore the content (if there was any)
    if (imageData) {
        ctx.putImageData(imageData, 0, 0);
    } else {
        // If no content, fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = currentColor;
    }
}

// Fullscreen functions
function enterFullscreen() {
    try {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
        fullscreenBtn.textContent = 'Fullscreen';
    } catch (e) {
        console.error("Fullscreen error:", e);
    }
}

function exitFullscreen() {
    try {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        fullscreenBtn.textContent = 'Fullscreen';
    } catch (e) {
        console.error("Exit fullscreen error:", e);
    }
}

// Create color palette
function createColorPalette() {
    paletteColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        
        if (color === currentColor) {
            swatch.classList.add('active');
        }
        
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(sw => {
                sw.classList.remove('active');
            });
            swatch.classList.add('active');
            currentColor = color;
            colorPicker.value = color;
            setTool('brush');
        });
        
        colorPalette.appendChild(swatch);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Window events
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('fullscreenchange', updateFullscreenButton);
    
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Control events
    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
        setTool('brush');
        updateActiveSwatch(currentColor);
    });
    
    brushSize.addEventListener('input', (e) => {
        currentSize = e.target.value;
        brushSizeValue.textContent = currentSize;
    });
    
    brushBtn.addEventListener('click', () => setTool('brush'));
    eraserBtn.addEventListener('click', () => setTool('eraser'));
    clearBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', saveDrawing);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
}

// Update fullscreen button text
function updateFullscreenButton() {
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = 'Exit Fullscreen';
    } else {
        fullscreenBtn.textContent = 'Fullscreen';
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    if (document.fullscreenElement) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

// Set the current tool
function setTool(tool) {
    currentTool = tool;
    
    // Update button states
    brushBtn.classList.remove('active-tool');
    eraserBtn.classList.remove('active-tool');
    
    if (tool === 'brush') {
        brushBtn.classList.add('active-tool');
        ctx.strokeStyle = currentColor;
    } else if (tool === 'eraser') {
        eraserBtn.classList.add('active-tool');
        ctx.strokeStyle = 'white';
    }
}

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getPosition(e);
    
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
}

// Helper functions
function getPosition(e) {
    let x, y;
    if (e.type.includes('touch')) {
        const rect = canvas.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }
    return { x, y };
}

function updateActiveSwatch(color) {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.remove('active');
        if (swatch.dataset.color === color) {
            swatch.classList.add('active');
        }
    });
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentColor;
}

function saveDrawing() {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
}

function handleTouchEnd(e) {
    e.preventDefault();
    stopDrawing();
}

// Initialize the app
init();