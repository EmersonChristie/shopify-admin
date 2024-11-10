import { NextRequest, NextResponse } from "next/server";
import nodeHtmlToImage from "node-html-to-image";
import { generateArtShadows } from "@/lib/image-scripts/boxShadow";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { artwork, options } = await request.json();

    // Convert artwork image URL to base64
    let artworkBase64: string;
    if (artwork.imageSrc.startsWith("data:")) {
      artworkBase64 = artwork.imageSrc;
    } else {
      throw new Error("Image must be provided as base64 data URL");
    }

    // Load wall image and convert to base64
    const wallImagePath = path.join(
      process.cwd(),
      "public",
      "background-images",
      "blank-wall.jpg"
    );
    const wallImageBase64 = fs.readFileSync(wallImagePath, {
      encoding: "base64",
    });
    const wallImageDataUrl = `data:image/jpeg;base64,${wallImageBase64}`;

    const imageTypes: ("gradient" | "product" | "transparent")[] = [
      "gradient",
      "product",
      "transparent",
    ];

    const images = await Promise.all(
      imageTypes.map(async (type) => {
        const html = `
          <html>
            <style>
              body {
                width: ${options.canvasWidth || 2048}px;
                height: ${options.canvasHeight || 2048}px;
                margin: 0;
                padding: 0;
              }
              .container {
                width: 100%;
                height: 100%;
                position: relative;
                background: ${
                  type === "gradient"
                    ? "linear-gradient(135deg, #ffffff 0%, #f5f5f5 20%, #eeeeee 40%, #e0e0e0 60%, #d5d5d5 80%, #cccccc 100%)"
                    : type === "product"
                    ? `url(${wallImageDataUrl})`
                    : "none"
                };
                background-size: cover;
                background-position: center;
              }
              .artwork {
                position: absolute;
                max-width: ${
                  type === "product" ? artwork.artworkWidthPercent : 85
                }%;
                max-height: ${
                  type === "product" ? artwork.artworkHeightPercent : 85
                }%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: ${generateArtShadows(7)};
              }
            </style>
            <body>
              <div class="container">
                <img class="artwork" src="${artworkBase64}" />
              </div>
            </body>
          </html>
        `;

        const buffer = await nodeHtmlToImage({
          html,
          transparent: type === "transparent",
          type: "jpeg",
          quality: 100,
        });

        const base64 = Buffer.from(buffer as Buffer).toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        return {
          dataUrl,
          type,
          fileName: `${artwork.title}-${type}-${options.canvasWidth}x${options.canvasHeight}.jpg`,
        };
      })
    );

    return NextResponse.json(images);
  } catch (error) {
    console.error("Failed to generate images:", error);
    return NextResponse.json(
      { error: "Failed to generate images" },
      { status: 500 }
    );
  }
}
