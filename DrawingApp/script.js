// Canvas setup
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');
const brushBtn = document.getElementById('brush-btn');
const eraserBtn = document.getElementById('eraser-btn');
const textBtn = document.getElementById('text-btn');
const lineBtn = document.getElementById('line-btn');
const rectBtn = document.getElementById('rect-btn');
const circleBtn = document.getElementById('circle-btn');
const arrowBtn = document.getElementById('arrow-btn');
const gridBtn = document.getElementById('grid-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const colorPalette = document.querySelector('.color-palette');
const textInputContainer = document.getElementById('text-input-container');
const textInput = document.getElementById('text-input');

// Drawing state
let isDrawing = false;
let currentColor = colorPicker.value;
let currentSize = brushSize.value;
let currentTool = 'brush';
let startX, startY;
let isGridVisible = false;
let tempCanvas = document.createElement('canvas');
let tempCtx = tempCanvas.getContext('2d');
let shapes = [];
let currentShape = null;

// Shape types
const SHAPE_TYPES = {
    BRUSH: 'brush',
    ERASER: 'eraser',
    TEXT: 'text',
    LINE: 'line',
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    ARROW: 'arrow'
};

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
    
    // Set up temp canvas
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Only fill with white if the canvas is empty
    if (ctx.getImageData(0, 0, 1, 1).data[3] === 0) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = currentColor;
    }
    
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
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Restore the content (if there was any)
    if (imageData) {
        ctx.putImageData(imageData, 0, 0);
    } else {
        // If no content, fill with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = currentColor;
    }
    
    // Redraw grid if it was visible
    if (isGridVisible) {
        drawGrid();
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
        fullscreenBtn.textContent = 'Exit Fullscreen';
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
            setTool(SHAPE_TYPES.BRUSH);
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
    
    // Text input event
    textInput.addEventListener('keydown', handleTextInput);
    
    // Control events
    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
        setTool(SHAPE_TYPES.BRUSH);
        updateActiveSwatch(currentColor);
    });
    
    brushSize.addEventListener('input', (e) => {
        currentSize = e.target.value;
        brushSizeValue.textContent = currentSize;
    });
    
    brushBtn.addEventListener('click', () => setTool(SHAPE_TYPES.BRUSH));
    eraserBtn.addEventListener('click', () => setTool(SHAPE_TYPES.ERASER));
    textBtn.addEventListener('click', () => setTool(SHAPE_TYPES.TEXT));
    lineBtn.addEventListener('click', () => setTool(SHAPE_TYPES.LINE));
    rectBtn.addEventListener('click', () => setTool(SHAPE_TYPES.RECTANGLE));
    circleBtn.addEventListener('click', () => setTool(SHAPE_TYPES.CIRCLE));
    arrowBtn.addEventListener('click', () => setTool(SHAPE_TYPES.ARROW));
    gridBtn.addEventListener('click', toggleGrid);
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
    textBtn.classList.remove('active-tool');
    lineBtn.classList.remove('active-tool');
    rectBtn.classList.remove('active-tool');
    circleBtn.classList.remove('active-tool');
    arrowBtn.classList.remove('active-tool');
    
    if (tool === SHAPE_TYPES.BRUSH) {
        brushBtn.classList.add('active-tool');
        ctx.strokeStyle = currentColor;
    } else if (tool === SHAPE_TYPES.ERASER) {
        eraserBtn.classList.add('active-tool');
        ctx.strokeStyle = 'white';
    } else if (tool === SHAPE_TYPES.TEXT) {
        textBtn.classList.add('active-tool');
    } else if (tool === SHAPE_TYPES.LINE) {
        lineBtn.classList.add('active-tool');
    } else if (tool === SHAPE_TYPES.RECTANGLE) {
        rectBtn.classList.add('active-tool');
    } else if (tool === SHAPE_TYPES.CIRCLE) {
        circleBtn.classList.add('active-tool');
    } else if (tool === SHAPE_TYPES.ARROW) {
        arrowBtn.classList.add('active-tool');
    }
}

// Drawing functions
function startDrawing(e) {
    if (currentTool === SHAPE_TYPES.TEXT) {
        const pos = getPosition(e);
        showTextInput(pos.x, pos.y);
        return;
    }
    
    isDrawing = true;
    const pos = getPosition(e);
    startX = pos.x;
    startY = pos.y;
    
    if (currentTool === SHAPE_TYPES.BRUSH || currentTool === SHAPE_TYPES.ERASER) {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    } else {
        // For shapes, create a temp canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.strokeStyle = currentTool === SHAPE_TYPES.ERASER ? 'white' : currentColor;
        tempCtx.lineWidth = currentSize;
        tempCtx.fillStyle = currentColor;
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getPosition(e);
    
    if (currentTool === SHAPE_TYPES.BRUSH || currentTool === SHAPE_TYPES.ERASER) {
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentTool === SHAPE_TYPES.ERASER ? 'white' : currentColor;
        
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    } else {
        // Draw temporary shape on temp canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        switch (currentTool) {
            case SHAPE_TYPES.LINE:
                drawLine(tempCtx, startX, startY, pos.x, pos.y);
                break;
            case SHAPE_TYPES.RECTANGLE:
                drawRectangle(tempCtx, startX, startY, pos.x, pos.y);
                break;
            case SHAPE_TYPES.CIRCLE:
                drawCircle(tempCtx, startX, startY, pos.x, pos.y);
                break;
            case SHAPE_TYPES.ARROW:
                drawArrow(tempCtx, startX, startY, pos.x, pos.y);
                break;
        }
    }
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (currentTool === SHAPE_TYPES.BRUSH || currentTool === SHAPE_TYPES.ERASER) {
        ctx.beginPath();
    } else {
        // Draw the final shape on the main canvas
        ctx.drawImage(tempCanvas, 0, 0);
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
}

// Shape drawing functions
function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawRectangle(ctx, x1, y1, x2, y2) {
    const width = x2 - x1;
    const height = y2 - y1;
    ctx.beginPath();
    ctx.rect(x1, y1, width, height);
    ctx.stroke();
}

function drawCircle(ctx, x1, y1, x2, y2) {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Draw the shaft of the arrow
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Draw the head of the arrow
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
        toX - headLength * Math.cos(angle - Math.PI / 6),
        toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        toX - headLength * Math.cos(angle + Math.PI / 6),
        toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

// Text functions
function showTextInput(x, y) {
    textInputContainer.style.display = 'block';
    textInputContainer.style.left = `${x}px`;
    textInputContainer.style.top = `${y}px`;
    textInput.focus();
}

function handleTextInput(e) {
    if (e.key === 'Enter') {
        const text = textInput.value;
        if (text) {
            ctx.font = `${currentSize}px Arial`;
            ctx.fillStyle = currentColor;
            ctx.fillText(text, parseInt(textInputContainer.style.left), parseInt(textInputContainer.style.top));
        }
        textInput.value = '';
        textInputContainer.style.display = 'none';
    } else if (e.key === 'Escape') {
        textInput.value = '';
        textInputContainer.style.display = 'none';
    }
}

// Grid functions
function toggleGrid() {
    isGridVisible = !isGridVisible;
    if (isGridVisible) {
        drawGrid();
        gridBtn.classList.add('active-tool');
    } else {
        redrawCanvas();
        gridBtn.classList.remove('active-tool');
    }
}

function drawGrid() {
    const gridSize = 20;
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function redrawCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (isGridVisible) {
        drawGrid();
    }
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