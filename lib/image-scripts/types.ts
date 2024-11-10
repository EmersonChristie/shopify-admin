export interface ImageGenerationOptions {
  format?: "jpeg" | "png";
  canvasWidth?: number;
  canvasHeight?: number;
  background?: string;
  wallImagePath?: string;
  wallHeightInches?: number;
  position?: "center" | "top" | "bottom" | { x: number; y: number };
  xOffset?: number;
  yOffset?: number;
}

export interface ArtworkData {
  imageSrc: File;
  id: string;
  title: string;
  artworkHeightInches: number;
  artworkWidthInches: number;
}

export interface GeneratedImage {
  file: File;
  preview: string;
  type: "gradient" | "product" | "transparent";
}
