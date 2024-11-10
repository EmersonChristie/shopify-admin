import { ArtworkData, ImageGenerationOptions, GeneratedImage } from "./types";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}

interface GeneratedImageResponse {
  dataUrl: string;
  fileName: string;
  type: "gradient" | "product" | "transparent";
}

export async function generateProductImages(
  artwork: ArtworkData,
  options: ImageGenerationOptions = {}
): Promise<GeneratedImage[]> {
  try {
    console.log("Starting image generation with artwork:", {
      title: artwork.title,
      dimensions: `${artwork.artworkWidthInches}x${artwork.artworkHeightInches}`,
      fileInfo:
        artwork.imageSrc instanceof File
          ? {
              name: artwork.imageSrc.name,
              size: artwork.imageSrc.size,
              type: artwork.imageSrc.type,
            }
          : "Not a File",
    });

    // Calculate artwork dimensions
    const pixelsPerInch =
      (options.canvasHeight || 2048) / (options.wallHeightInches || 114);
    const artworkWidthPercent =
      ((artwork.artworkWidthInches * pixelsPerInch) /
        (options.canvasWidth || 2048)) *
      100;
    const artworkHeightPercent =
      ((artwork.artworkHeightInches * pixelsPerInch) /
        (options.canvasHeight || 2048)) *
      100;

    // Validate image source
    if (!(artwork.imageSrc instanceof File)) {
      throw new Error("Invalid image source: must be a File object");
    }

    if (!artwork.imageSrc.size) {
      throw new Error("Invalid file: file is empty");
    }

    console.log("Converting file to base64...");
    let artworkBase64: string;
    try {
      artworkBase64 = await fileToBase64(artwork.imageSrc);
      console.log("File successfully converted to base64");
    } catch (error) {
      console.error("Failed to convert file to base64:", error);
      throw new Error("Failed to process image file");
    }

    console.log("Sending request to generate-images API...");
    const response = await fetch("/api/generate-images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        artwork: {
          ...artwork,
          imageSrc: artworkBase64,
          artworkWidthPercent,
          artworkHeightPercent,
        },
        options,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API response not ok:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const generatedImages = await response.json();
    console.log("Successfully received generated images");

    // Convert the data URLs back to Files
    console.log("Converting generated images to files...");
    const convertedImages = await Promise.all(
      (generatedImages as GeneratedImageResponse[]).map(
        async ({ dataUrl, fileName, type }) => {
          try {
            const response = await fetch(dataUrl);
            if (!response.ok)
              throw new Error(
                `Failed to fetch data URL: ${response.statusText}`
              );

            const blob = await response.blob();
            const file = new File([blob], fileName, { type: "image/jpeg" });

            return {
              file,
              preview: dataUrl,
              type,
            };
          } catch (error) {
            console.error(
              `Failed to process generated image of type ${type}:`,
              error
            );
            throw error;
          }
        }
      )
    );

    console.log("Successfully converted all images");
    return convertedImages;
  } catch (error) {
    console.error("Failed to generate images:", error);
    throw error;
  }
}
