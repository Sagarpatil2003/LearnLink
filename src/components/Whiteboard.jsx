import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  db
} from "../firebaseConfigration/firebaseConfigration";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
import {
  PenTool,
  Highlighter,
  Eraser,
  Undo,
  Redo,
  Trash2,
  ArrowLeft
} from "lucide-react";

// Canvas background color constant
const CANVAS_BG_COLOR = "#f3f4f6";

export function Whiteboard({
  role
}) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const history = useRef([]);
  const redoStack = useRef([]);
  const lastWriteTime = useRef(0);
  const throttleInterval = 16;
  
  // New state for the cursor style
  const [cursor, setCursor] = useState("default");

  // A helper function to set the canvas cursor
  const setCanvasCursor = useCallback((newTool) => {
    let cursorStyle = "default";
    switch (newTool) {
      case "pen":
        cursorStyle = "crosshair";
        break;
      case "highlighter":
        cursorStyle = "crosshair";
        break;
      case "eraser":
        cursorStyle = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eraser"><path d="m5 16 9-9"/><path d="m15 21 7-7"/><path d="M11 20a5 5 1.7 0 1-5-5-1.7"/></svg>') 12 12, auto`;
        break;
      default:
        cursorStyle = "default";
        break;
    }
    setCursor(cursorStyle);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const lastState = history.current[history.current.length - 1];
      if (lastState) {
        restoreCanvas(lastState);
      }
    };

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    ctx.fillStyle = CANVAS_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const whiteboardCol = collection(db, "whiteboard");
    const q = query(whiteboardCol, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          drawFromFirestore(data);
        }
      });
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Update the cursor when the tool changes
  useEffect(() => {
    setCanvasCursor(tool);
  }, [tool, setCanvasCursor]);

  // Function to save the current canvas state
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      history.current.push(canvas.toDataURL());
      redoStack.current = [];
    }
  }, []);

  // Function to restore a canvas state from a data URL
  const restoreCanvas = useCallback((dataUrl) => {
    if (!ctxRef.current || !dataUrl) return;
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctxRef.current.drawImage(img, 0, 0);
    };
  }, []);
  
  // Function to draw from Firestore data
  const drawFromFirestore = useCallback((data) => {
    if (!ctxRef.current) return;
    ctxRef.current.strokeStyle = data.color;
    ctxRef.current.lineWidth = data.lineWidth;
    ctxRef.current.globalAlpha = data.alpha || 1;
    ctxRef.current.lineTo(data.x, data.y);
    ctxRef.current.stroke();
  }, []);

  function startDraw(e) {
    if (e.target !== canvasRef.current) return;
    setDrawing(true);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    saveState();
  }

  function endDraw() {
    setDrawing(false);
  }

  async function draw(e) {
    if (!drawing) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    const now = Date.now();
    if (now - lastWriteTime.current < throttleInterval) {
      return;
    }
    lastWriteTime.current = now;

    let strokeColor = color;
    let strokeWidth = lineWidth;
    let alpha = 1;

    if (tool === "eraser") {
      strokeColor = CANVAS_BG_COLOR;
      strokeWidth = 20;
    } else if (tool === "highlighter") {
      alpha = 0.3;
      strokeWidth = lineWidth * 3;
    }

    ctxRef.current.strokeStyle = strokeColor;
    ctxRef.current.globalAlpha = alpha;
    ctxRef.current.lineWidth = strokeWidth;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();

    const whiteboardCol = collection(db, "whiteboard");
    await addDoc(whiteboardCol, {
      x,
      y,
      color: strokeColor,
      lineWidth: strokeWidth,
      tool,
      alpha,
      timestamp: Date.now(),
    });
  }

  const undo = () => {
    if (history.current.length < 2) return;
    const lastState = history.current.pop();
    redoStack.current.push(lastState);
    restoreCanvas(history.current[history.current.length - 1]);
  };

  const redo = () => {
    if (redoStack.current.length === 0) return;
    const nextState = redoStack.current.pop();
    history.current.push(nextState);
    restoreCanvas(nextState);
  };

  async function clearCanvas() {
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctxRef.current.fillStyle = CANVAS_BG_COLOR;
    ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const whiteboardCol = collection(db, "whiteboard");
    const snapshot = await getDocs(whiteboardCol);
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(doc(db, "whiteboard", docSnap.id));
    });
    saveState();
  }

  const handleGoBack = () => {
    navigate(-1);
  };

  const toolClasses = (currentTool) =>
    `p-2 rounded-lg transition-all duration-200 ${
      tool === currentTool ? "bg-blue-600 text-white shadow-lg scale-110" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    }`;

  const buttonClasses =
    "flex items-center justify-center p-3 text-white rounded-lg transition-colors duration-200 shadow-md hover:bg-blue-600";

  return (
    <div className="relative w-screen h-screen bg-gray-100 overflow-hidden">
      {/* Back Button and Toolbar Container */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-3 bg-white rounded-full shadow-lg transition-transform hover:scale-110"
          title="Go Back"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-50 flex flex-wrap gap-4 p-4 bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="flex gap-2">
          <button onClick={() => setTool("pen")} className={toolClasses("pen")} title="Pen">
            <PenTool size={20} />
          </button>
          <button onClick={() => setTool("highlighter")} className={toolClasses("highlighter")} title="Highlighter">
            <Highlighter size={20} />
          </button>
          <button onClick={() => setTool("eraser")} className={toolClasses("eraser")} title="Eraser">
            <Eraser size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 transform transition-transform duration-200 hover:scale-110"
            title="Stroke Color"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="lineWidth" className="text-gray-700 text-sm font-medium">
            Width:
          </label>
          <input
            type="range"
            id="lineWidth"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24 h-2 bg-gray-300 rounded-full cursor-pointer accent-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={undo} className={`${buttonClasses} bg-blue-500`} title="Undo">
            <Undo size={20} />
          </button>
          <button onClick={redo} className={`${buttonClasses} bg-blue-500`} title="Redo">
            <Redo size={20} />
          </button>
        </div>

        {role === "teacher" && (
          <button onClick={clearCanvas} className={`${buttonClasses} bg-red-500`} title="Clear Board">
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Canvas with dynamic cursor style */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ cursor }}
        onMouseDown={startDraw}
        onMouseUp={endDraw}
        onMouseMove={draw}
      />
    </div>
  );
}