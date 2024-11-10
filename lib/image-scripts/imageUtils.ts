/**
 * Creates a canvas element with the specified dimensions
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Loads an image from a URL and returns a promise that resolves with the image
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Enable CORS
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Converts a canvas to a File object
 */
export function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  type: string = "image/jpeg",
  quality: number = 0.92
): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], fileName, { type });
          resolve(file);
        }
      },
      type,
      quality
    );
  });
}

/**
 * Creates a linear gradient background
 */
export function createGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Create a more realistic gradient
  const gradient = ctx.createLinearGradient(0, 0, width * 0.7, height * 0.7);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.2, "#f5f5f5");
  gradient.addColorStop(0.4, "#eeeeee");
  gradient.addColorStop(0.6, "#e0e0e0");
  gradient.addColorStop(0.8, "#d5d5d5");
  gradient.addColorStop(1, "#cccccc");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle noise texture
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 10 - 5;
    data[i] = Math.min(255, Math.max(0, data[i] + noise)); // R
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Applies shadow effect to a canvas context
 */
export function applyShadowEffect(
  ctx: CanvasRenderingContext2D,
  shadowString: string
): void {
  const shadows = shadowString.split(",").map((s) => s.trim());

  // Save the current canvas state
  ctx.save();

  // Create a temporary canvas for shadow composition
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = ctx.canvas.width;
  tempCanvas.height = ctx.canvas.height;
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) throw new Error("Could not get temporary canvas context");

  // Apply each shadow layer
  shadows.forEach((shadow) => {
    const [offsetX, offsetY, blur, spread, color] = shadow
      .split(" ")
      .map((v) => v.replace("px", ""));

    tempCtx.save();
    tempCtx.shadowOffsetX = parseFloat(offsetX);
    tempCtx.shadowOffsetY = parseFloat(offsetY);
    tempCtx.shadowBlur = parseFloat(blur);
    tempCtx.shadowColor = color;

    // Create a path for the shadow
    const padding =
      Math.max(Math.abs(parseFloat(offsetX)), Math.abs(parseFloat(offsetY))) +
      parseFloat(blur);

    tempCtx.beginPath();
    tempCtx.rect(
      padding,
      padding,
      tempCanvas.width - padding * 2,
      tempCanvas.height - padding * 2
    );
    tempCtx.fill();
    tempCtx.restore();
  });

  // Composite the shadows onto the main canvas
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  // Restore the original canvas state
  ctx.restore();
}
