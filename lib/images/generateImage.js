import sharp from "sharp";
import fs from "fs";
import nodeHtmlToImage from "node-html-to-image";
import BezierEasing from "bezier-easing";
import { formatTitle } from "../../utils/index.js";

/**
 * Returns a string of box shadows sepereated based on user input
 * @param {Number} numShadowLayers - the number of layers for the shadow
 * @param {Object} options - optional parameters for angle, blur, spread, and transparency
 */
const getBoxShadows = (numShadowLayers, options = {}) => {
  const {
    angle = 40,
    length = 130,
    finalBlur = 800,
    spread = 0,
    finalTransparency = 0.15,
  } = options;

  const angleToRadians = (angle) => {
    return angle * (Math.PI / 180);
  };

  const fixed = (num, precision = 1) =>
    parseFloat(num.toFixed(precision), 10).toString();

  const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;

  // prettier-ignore
  const shadow = (left, top, blur, spread, color) =>
  `${left}px ${top}px ${blur}px ${spread}px ${color}`

  let alphaEasingValue = [0.1, 0.5, 0.9, 0.5];
  let offsetEasingValue = [0.7, 0.1, 0.9, 0.3];
  let blurEasingValue = [0.7, 0.1, 0.9, 0.3];

  const alphaEasing = BezierEasing(...alphaEasingValue);
  const offsetEasing = BezierEasing(...offsetEasingValue);
  const blurEasing = BezierEasing(...blurEasingValue);

  let easedAlphaValues = [];
  let easedOffsetValues = [];
  let easedBlurValues = [];

  for (let i = 1; i <= numShadowLayers; i++) {
    const fraction = i / numShadowLayers;

    easedAlphaValues.push(alphaEasing(fraction));

    easedOffsetValues.push(offsetEasing(fraction));
    easedBlurValues.push(blurEasing(fraction));
  }
  let boxShadowValues = [];
  for (let i = 0; i < numShadowLayers; i++) {
    // Reverse SIN and COS for x & y points to measure angle off the bottom of positive x axis
    let yOffset =
      easedOffsetValues[i] * Math.cos(angleToRadians(angle)) * length;
    let xOffset =
      easedOffsetValues[i] * Math.sin(angleToRadians(angle)) * length;

    boxShadowValues.push([
      xOffset,
      yOffset,
      easedBlurValues[i] * finalBlur,
      spread,
      easedAlphaValues[i] * finalTransparency,
    ]);
  }
  /* offset-x | offset-y | blur-radius | spread-radius | color */
  const shadowString = boxShadowValues
    .map(([leftOffset, topOffset, blur, spread, alpha]) =>
      shadow(leftOffset, topOffset, blur, spread, rgba(0, 0, 0, alpha))
    )
    .join(",\n");

  return shadowString;
};

/**
 * A function with predefined options for artwork dropshadow
 * @param {Number} layers - number of shadow layers
 * @param {Number} [shadowIntensity=0.5] - intensity of the shadow, between 0 and 1
 * @returns {String} - The string version of the box shadow css
 */
const generateArtShadows = (layers, shadowIntensity = 0.4) => {
  // Ensure shadowIntensity is between 0 and 1
  shadowIntensity = Math.max(0, Math.min(1, shadowIntensity));

  // Calculate the intensity factor
  const intensityFactor = shadowIntensity * 2;

  const opts = {
    longShadow: {
      angle: 40,
      length: 125 * intensityFactor,
      finalBlur: 65 * (2 - intensityFactor),
      finalTransparency: 0.1 * intensityFactor,
    },
    shortShadow: {
      angle: 35,
      length: 90 * intensityFactor,
      finalBlur: 20 * (2 - intensityFactor),
      finalTransparency: 0.09 * intensityFactor,
    },
    upperShadow: {
      angle: -62,
      length: -80 * intensityFactor,
      finalBlur: 55 * (2 - intensityFactor),
      finalTransparency: 0.08 * intensityFactor,
    },
  };

  let shadows =
    getBoxShadows(layers, opts.longShadow) +
    ",\n" +
    getBoxShadows(layers, opts.shortShadow) +
    ",\n" +
    getBoxShadows(layers, opts.upperShadow);

  return shadows;
};

export const generateImage = async (artwork, options) => {
  const { imageSrc, id, title, artworkHeightInches, artworkWidthInches } =
    artwork;

  console.log(
    `Creating image for artwork: ${title}, width: ${artworkWidthInches}, height: ${artworkHeightInches}`
  );

  const {
    format = "jpeg",
    canvasWidth = 2048,
    canvasHeight = 2048,
    background = "transparent", // Can be 'transparent', a color, gradient, or image path/URL
    wallImagePath = null, // Path to your wall image (if any)
    wallHeightInches = null, // Real-world height of the wall in inches (required if wallImagePath is provided)
    position = "center", // 'center', 'top', 'bottom', or { x: Number, y: Number }
    xOffset = 0,
    yOffset = 0,
    outputDir = "./static/output-images/",
    outputName = "product-image",
    maxFileSize = null, // Max file size in bytes (optional)
  } = options;

  const getDataURI = (path) => {
    const image = fs.readFileSync(path);
    const base64Image = Buffer.from(image).toString("base64");
    const extension = path.split(".").pop();
    const dataURI = `data:image/${extension};base64,${base64Image}`;
    return dataURI;
  };

  // function to remove white space from title
  const formattedTitle = formatTitle(title);

  const artworkSource = imageSrc.startsWith("http")
    ? imageSrc
    : getDataURI(imageSrc);

  const outputFileName = `${outputDir}${id}-${formattedTitle}-${outputName}-${canvasWidth}x${canvasHeight}.${format}`;

  let backgroundStyle;
  let wallWidthPixels = canvasWidth;
  let wallHeightPixels = canvasHeight;

  // Determine the background style
  if (wallImagePath) {
    // If a wall image is provided, use it as the background
    if (!fs.existsSync(wallImagePath)) {
      console.error("Wall image not found at path:", wallImagePath);
      return;
    }

    const wallImageSource = getDataURI(wallImagePath);
    backgroundStyle = `url(${wallImageSource})`;

    // Load wall image dimensions
    const wallImage = sharp(wallImagePath);
    const wallMetadata = await wallImage.metadata();
    wallWidthPixels = wallMetadata.width;
    wallHeightPixels = wallMetadata.height;
  } else if (background === "transparent") {
    backgroundStyle = "rgba(0, 0, 0, 0)";
  } else if (
    background.startsWith("http") ||
    fs.existsSync(`./static/background-images/${background}`)
  ) {
    // Assume it's an image path or URL
    const backgroundImagePath = background.startsWith("http")
      ? background
      : `./static/background-images/${background}`;

    const backgroundImageSource = getDataURI(backgroundImagePath);
    backgroundStyle = `url(${backgroundImageSource})`;
  } else {
    // Assume it's a gradient or color
    backgroundStyle = background;
  }

  // Calculate artwork size and position
  let maxArtworkWidthPercent = 85; // Default max width percentage
  let maxArtworkHeightPercent = 85; // Default max height percentage
  let artworkPositionXPercent = 50; // Default to center
  let artworkPositionYPercent = 50; // Default to center

  if (wallImagePath && wallHeightInches) {
    // Calculate pixels per inch for the wall image
    const pixelsPerInch = wallHeightPixels / wallHeightInches;

    // Calculate artwork size in pixels
    const artworkWidthPixels = artworkWidthInches * pixelsPerInch;
    const artworkHeightPixels = artworkHeightInches * pixelsPerInch;

    // Convert artwork dimensions to percentages relative to wall image dimensions
    maxArtworkWidthPercent = (artworkWidthPixels / wallWidthPixels) * 100;
    maxArtworkHeightPercent = (artworkHeightPixels / wallHeightPixels) * 100;
    // Determine artwork position
    let artworkPositionX;
    let artworkPositionY;

    if (typeof position === "string") {
      switch (position) {
        case "center":
          artworkPositionX = wallWidthPixels / 2;
          artworkPositionY = wallHeightPixels / 2;
          break;
        case "top":
          artworkPositionX = wallWidthPixels / 2;
          artworkPositionY = artworkHeightPixels / 2;
          break;
        case "bottom":
          artworkPositionX = wallWidthPixels / 2;
          artworkPositionY = wallHeightPixels - artworkHeightPixels / 2;
          break;
        default:
          // Default to center
          artworkPositionX = wallWidthPixels / 2;
          artworkPositionY = wallHeightPixels / 2;
          break;
      }
    } else if (typeof position === "object") {
      artworkPositionX = position.x;
      artworkPositionY = position.y;
    } else {
      // Default to center
      artworkPositionX = wallWidthPixels / 2;
      artworkPositionY = wallHeightPixels / 2;
    }

    // Adjust for any offsets
    artworkPositionX += xOffset;
    artworkPositionY += yOffset;

    // Convert positions to percentages
    artworkPositionXPercent = (artworkPositionX / wallWidthPixels) * 100;
    artworkPositionYPercent = (artworkPositionY / wallHeightPixels) * 100;
  } else {
    // For transparent or gradient backgrounds, use default percentages
    maxArtworkWidthPercent = 85;
    maxArtworkHeightPercent = 85;
    artworkPositionXPercent = 50 + xOffset; // Center plus offset
    artworkPositionYPercent = 50 + yOffset; // Center plus offset
  }

  const htmlTemplate = `
    <html>
      <style>
        body {
          width: {{canvasWidth}}px;
          height: {{canvasHeight}}px;
          margin: 0;
          padding: 0;
          background: none;
        }
        .background-container {
          width: 100%;
          height: 100%;
          background: {{backgroundStyle}};
          background-size: cover;
          background-position: center;
          position: relative;
        }
        #artwork {
          position: absolute;
          max-width: {{maxArtworkWidthPercent}}%;
          max-height: {{maxArtworkHeightPercent}}%;
          top: {{artworkPositionYPercent}}%;
          left: {{artworkPositionXPercent}}%;
          transform: translate(-50%, -50%);
          box-shadow: ${generateArtShadows(7)};
        }
      </style>
      <body>
        <div class="background-container">
          <img id="artwork" src="{{artworkSource}}" />
        </div>
      </body>
    </html>`;

  try {
    await nodeHtmlToImage({
      output: outputFileName,
      html: htmlTemplate,
      content: {
        backgroundStyle,
        artworkSource,
        canvasWidth: wallWidthPixels,
        canvasHeight: wallHeightPixels,
        maxArtworkWidthPercent,
        maxArtworkHeightPercent,
        artworkPositionXPercent,
        artworkPositionYPercent,
      },
      transparent: background === "transparent",
    });

    // log html output

    console.log(`Image generated: ${outputFileName}`);
    // log max height and width
    console.log(`Max height: ${maxArtworkHeightPercent}`);
    console.log(`Max width: ${maxArtworkWidthPercent}`);

    // Handle max file size if provided
    if (maxFileSize) {
      let imageBuffer = fs.readFileSync(outputFileName);
      let imageSize = imageBuffer.length;

      if (imageSize > maxFileSize) {
        let quality = 90;

        while (imageSize > maxFileSize && quality > 10) {
          imageBuffer = await sharp(imageBuffer)
            .toFormat(format, { quality })
            .toBuffer();
          imageSize = imageBuffer.length;
          quality -= 10;
        }

        fs.writeFileSync(outputFileName, imageBuffer);
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }
};

// export const generateImage = async (artwork, options) => {
//   const { fileName, id, title, artworkHeightInches, artworkWidthInches } =
//     artwork;

//   const {
//     format = "jpeg",
//     canvasWidth = 2048,
//     canvasHeight = 2048,
//     background = "transparent", // Can be 'transparent', a color, gradient, or image path/URL
//     wallImagePath = null, // Path to your wall image (if any)
//     wallHeightInches = null, // Real-world height of the wall in inches (required if wallImagePath is provided)
//     position = "center", // 'center', 'top', 'bottom', or { x: Number, y: Number }
//     xOffset = 0,
//     yOffset = 0,
//     inputDir = "./static/art-images/",
//     outputDir = "./static/output-images/",
//     outputName = "product-image",
//     maxFileSize = null, // Max file size in bytes (optional)
//   } = options;

//   const getDataURI = (path) => {
//     const image = fs.readFileSync(path);
//     const base64Image = Buffer.from(image).toString("base64");
//     const extension = path.split(".").pop();
//     const dataURI = `data:image/${extension};base64,${base64Image}`;
//     return dataURI;
//   };

//   const artworkSource = getDataURI(`${inputDir}${fileName}`);
//   const outputFileName = `${outputDir}${id}-${title}-${outputName}-${canvasWidth}x${canvasHeight}.${format}`;

//   let backgroundStyle;
//   let wallWidthPixels = canvasWidth;
//   let wallHeightPixels = canvasHeight;

//   // Determine the background style
//   if (wallImagePath) {
//     // If a wall image is provided, use it as the background
//     if (!fs.existsSync(wallImagePath)) {
//       console.error("Wall image not found at path:", wallImagePath);
//       return;
//     }

//     const wallImageSource = getDataURI(wallImagePath);
//     backgroundStyle = `url(${wallImageSource})`;

//     // Load wall image dimensions
//     const wallImage = sharp(wallImagePath);
//     const wallMetadata = await wallImage.metadata();
//     wallWidthPixels = wallMetadata.width;
//     wallHeightPixels = wallMetadata.height;
//   } else if (background === "transparent") {
//     backgroundStyle = "rgba(0, 0, 0, 0)";
//   } else if (
//     background.startsWith("http") ||
//     fs.existsSync(`./static/background-images/${background}`)
//   ) {
//     // Assume it's an image path or URL
//     const backgroundImagePath = background.startsWith("http")
//       ? background
//       : `./static/background-images/${background}`;

//     const backgroundImageSource = getDataURI(backgroundImagePath);
//     backgroundStyle = `url(${backgroundImageSource})`;
//   } else {
//     // Assume it's a gradient or color
//     backgroundStyle = background;
//   }

//   // Calculate artwork size and position
//   let maxArtworkWidthPercent = 85; // Default max width percentage
//   let artworkPositionXPercent = 50; // Default to center
//   let artworkPositionYPercent = 50; // Default to center

//   if (wallImagePath && wallHeightInches) {
//     // Calculate pixels per inch for the wall image
//     const pixelsPerInch = wallHeightPixels / wallHeightInches;

//     // Calculate artwork size in pixels
//     const artworkWidthPixels = artworkWidthInches * pixelsPerInch;
//     const artworkHeightPixels = artworkHeightInches * pixelsPerInch;

//     // Convert artwork dimensions to percentages relative to wall image dimensions
//     maxArtworkWidthPercent = (artworkWidthPixels / wallWidthPixels) * 100;

//     // Determine artwork position
//     let artworkPositionX;
//     let artworkPositionY;

//     if (typeof position === "string") {
//       switch (position) {
//         case "center":
//           artworkPositionX = wallWidthPixels / 2;
//           artworkPositionY = wallHeightPixels / 2;
//           break;
//         case "top":
//           artworkPositionX = wallWidthPixels / 2;
//           artworkPositionY = artworkHeightPixels / 2;
//           break;
//         case "bottom":
//           artworkPositionX = wallWidthPixels / 2;
//           artworkPositionY = wallHeightPixels - artworkHeightPixels / 2;
//           break;
//         default:
//           // Default to center
//           artworkPositionX = wallWidthPixels / 2;
//           artworkPositionY = wallHeightPixels / 2;
//           break;
//       }
//     } else if (typeof position === "object") {
//       artworkPositionX = position.x;
//       artworkPositionY = position.y;
//     } else {
//       // Default to center
//       artworkPositionX = wallWidthPixels / 2;
//       artworkPositionY = wallHeightPixels / 2;
//     }

//     // Adjust for any offsets
//     artworkPositionX += xOffset;
//     artworkPositionY += yOffset;

//     // Convert positions to percentages
//     artworkPositionXPercent = (artworkPositionX / wallWidthPixels) * 100;
//     artworkPositionYPercent = (artworkPositionY / wallHeightPixels) * 100;
//   } else {
//     // For transparent or gradient backgrounds, use default percentages
//     maxArtworkWidthPercent = 80;
//     artworkPositionXPercent = 50 + xOffset; // Center plus offset
//     artworkPositionYPercent = 50 + yOffset; // Center plus offset
//   }

//   const htmlTemplate = `
//     <html>
//       <style>
//         body {
//           width: {{canvasWidth}}px;
//           height: {{canvasHeight}}px;
//           margin: 0;
//           padding: 0;
//           background: none;
//         }
//         .background-container {
//           width: 100%;
//           height: 100%;
//           background: {{backgroundStyle}};
//           background-size: cover;
//           background-position: center;
//           position: relative;
//         }
//         #artwork {
//           position: absolute;
//           width: {{maxArtworkWidthPercent}}%;
//           height: auto;
//           top: {{artworkPositionYPercent}}%;
//           left: {{artworkPositionXPercent}}%;
//           transform: translate(-50%, -50%);
//           box-shadow: ${generateArtShadows(7)};
//         }
//       </style>
//       <body>
//         <div class="background-container">
//           <img id="artwork" src="{{artworkSource}}" />
//         </div>
//       </body>
//     </html>`;

//   try {
//     await nodeHtmlToImage({
//       output: outputFileName,
//       html: htmlTemplate,
//       content: {
//         backgroundStyle,
//         artworkSource,
//         canvasWidth: wallWidthPixels,
//         canvasHeight: wallHeightPixels,
//         maxArtworkWidthPercent,
//         artworkPositionXPercent,
//         artworkPositionYPercent,
//       },
//       transparent: background === "transparent",
//     });

//     console.log(`Image generated: ${outputFileName}`);

//     // Handle max file size if provided
//     if (maxFileSize) {
//       let imageBuffer = fs.readFileSync(outputFileName);
//       let imageSize = imageBuffer.length;

//       if (imageSize > maxFileSize) {
//         let quality = 90;

//         while (imageSize > maxFileSize && quality > 10) {
//           imageBuffer = await sharp(imageBuffer)
//             .toFormat(format, { quality })
//             .toBuffer();
//           imageSize = imageBuffer.length;
//           quality -= 10;
//         }

//         fs.writeFileSync(outputFileName, imageBuffer);
//       }
//     }
//   } catch (error) {
//     console.error("Error generating image:", error);
//   }
// };
