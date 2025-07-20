// Canvas setup
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');
const clearBtn = document.getElementById('clear-btn');
const eraserBtn = document.getElementById('eraser-btn');
const strokeEraserBtn = document.getElementById('stroke-eraser-btn');
const saveBtn = document.getElementById('save-btn');
const colorPalette = document.querySelector('.color-palette');

// Drawing state
let isDrawing = false;
let currentColor = colorPicker.value;
let currentSize = brushSize.value;
let isEraser = false;
let isStrokeEraser = false;
let lastPaths = [];
let currentPath = [];

// Color palette options
const paletteColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#00ffff', '#ff00ff', '#ff9900', '#9900ff',
    '#0099ff', '#ff0099', '#99ff00', '#00ff99', '#ff6600',
    '#6600ff', '#0066ff', '#ff0066', '#66ff00', '#00ff66'
];

// Initialize the app
function init() {
    // Set up canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentColor;
    
    // Create color palette
    createColorPalette();
    
    // Set up event listeners
    setupEventListeners();
}

// Create the color palette swatches
function createColorPalette() {
    paletteColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        
        // Set first color as active
        if (color === currentColor) {
            swatch.classList.add('active');
        }
        
        swatch.addEventListener('click', () => {
            // Remove active class from all swatches
            document.querySelectorAll('.color-swatch').forEach(sw => {
                sw.classList.remove('active');
            });
            
            // Add active class to clicked swatch
            swatch.classList.add('active');
            
            // Set current color
            currentColor = color;
            colorPicker.value = color;
            isEraser = false;
            isStrokeEraser = false;
            eraserBtn.textContent = 'Eraser';
            strokeEraserBtn.textContent = 'Stroke Eraser';
        });
        
        colorPalette.appendChild(swatch);
    });
}

// Set up all event listeners
function setupEventListeners() {
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
        isEraser = false;
        isStrokeEraser = false;
        eraserBtn.textContent = 'Eraser';
        strokeEraserBtn.textContent = 'Stroke Eraser';
        updateActiveSwatch(currentColor);
    });
    
    brushSize.addEventListener('input', (e) => {
        currentSize = e.target.value;
        brushSizeValue.textContent = currentSize;
    });
    
    clearBtn.addEventListener('click', clearCanvas);
    eraserBtn.addEventListener('click', toggleEraser);
    strokeEraserBtn.addEventListener('click', toggleStrokeEraser);
    saveBtn.addEventListener('click', saveDrawing);
}

// Update the active color swatch
function updateActiveSwatch(color) {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.remove('active');
        if (swatch.dataset.color === color) {
            swatch.classList.add('active');
        }
    });
}

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    currentPath = [];
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getPosition(e);
    
    if (isStrokeEraser) {
        // For stroke eraser, track the path
        currentPath.push(pos);
        redrawCanvas();
    } else {
        // Regular drawing or area erasing
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = isEraser ? 'white' : currentColor;
        
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        
        // Track path for stroke eraser functionality
        currentPath.push(pos);
    }
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
    
    if (currentPath.length > 0) {
        if (isStrokeEraser) {
            // Find and remove intersecting paths
            lastPaths = lastPaths.filter(path => {
                return !isPathIntersecting(currentPath, path);
            });
            redrawCanvas();
        } else {
            // Add the current path to saved paths
            lastPaths.push([...currentPath]);
        }
        currentPath = [];
    }
}

// Redraw the entire canvas
function redrawCanvas() {
    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all saved paths
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';
    
    lastPaths.forEach(path => {
        if (path.length > 0) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            
            ctx.stroke();
        }
    });
}

// Check if two paths intersect
function isPathIntersecting(path1, path2) {
    const threshold = currentSize * 2;
    
    for (const point1 of path1) {
        for (const point2 of path2) {
            const distance = Math.sqrt(
                Math.pow(point1.x - point2.x, 2) + 
                Math.pow(point1.y - point2.y, 2)
            );
            
            if (distance < threshold) {
                return true;
            }
        }
    }
    return false;
}

// Get position from event
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

// Tool functions
function toggleEraser() {
    isEraser = !isEraser;
    isStrokeEraser = false;
    eraserBtn.textContent = isEraser ? 'Brush' : 'Eraser';
    strokeEraserBtn.textContent = 'Stroke Eraser';
    
    if (!isEraser) {
        ctx.strokeStyle = currentColor;
    }
}

function toggleStrokeEraser() {
    isStrokeEraser = !isStrokeEraser;
    isEraser = false;
    strokeEraserBtn.textContent = isStrokeEraser ? 'Brush' : 'Stroke Eraser';
    eraserBtn.textContent = 'Eraser';
    
    if (!isStrokeEraser) {
        ctx.strokeStyle = currentColor;
    }
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentColor;
    lastPaths = [];
    currentPath = [];
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