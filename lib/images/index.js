import { generateImage } from "./generateImage.js";

const wallGradient =
  "linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 50%, #d0d0d0 100%)";

const artwork = {
  imageSrc:
    "https://cdn.shopify.com/s/files/1/0664/9026/9888/files/5d6984d4e109e4a1bd1c24de00363693j.jpg?v=1726014399", // URL or local path to the image
  id: "8074394992832",
  title: "A Mother's Nature",
  artworkHeightInches: 48, // Artwork height in inches
  artworkWidthInches: 36, // Artwork width in inches
};

const options = {
  format: "jpeg",
  canvasWidth: 2048,
  canvasHeight: 2048,
  outputDir: "./static/output-images/",
};

// Generate gradient image
generateImage(artwork, {
  ...options,
  background: wallGradient,
  outputName: "gradient-image",
});

// Generate product image
generateImage(artwork, {
  ...options,
  wallImagePath: "./static/background-images/blank-wall.jpg",
  wallHeightInches: 114,
  outputName: "product-image",
});

// Generate transparent image
generateImage(artwork, {
  ...options,
  background: "transparent",
  outputName: "transparent-image",
});

// generateImage(
//   {
//     fileName: "lemons.jpg",
//     id: "001",
//     title: "Lemons",
//     artworkHeightInches: 31, // Artwork height in inches
//     artworkWidthInches: 30, // Artwork width in inches
//   },
//   {
//     format: "jpeg",
//     canvasWidth: 2048,
//     canvasHeight: 2048,
//     // background: wallGradient,
//     wallImagePath: "./static/background-images/blank-wall.jpg",
//     wallHeightInches: 144,
//     position: "center",
//     xOffset: 0,
//     yOffset: 0,
//     inputDir: "./static/art-images/",
//     outputDir: "./static/output-images/",
//     outputName: "product-image",
//   }
// );

// generateImage(
//   {
//     fileName: "1.jpg",
//     id: "001",
//     title: "test1",
//     artworkHeightInches: 63, // Artwork height in inches
//     artworkWidthInches: 90, // Artwork width in inches
//   },
//   {
//     format: "jpeg",
//     canvasWidth: 2048,
//     canvasHeight: 2048,
//     background: wallGradient, // Gradient background: ;
//     // wallImagePath: "./static/wall-images/wall.jpg", // Uncomment to use wall image
//     // wallHeightInches: 96, // Real-world wall height in inches (required if wallImagePath is provided)
//     position: "center",
//     xOffset: 0,
//     yOffset: 0,
//     inputDir: "./static/art-images/",
//     outputDir: "./static/output-images/",
//     outputName: "gradient-image",
//   }
// );

// generateImage(
//   {
//     fileName: "1.jpg",
//     id: "001",
//     title: "test3",
//     artworkHeightInches: 63, // Artwork height in inches
//     artworkWidthInches: 90, // Artwork width in inches
//   },
//   {
//     format: "jpeg",
//     canvasWidth: 2048,
//     canvasHeight: 2048,
//     background: "transparent",
//     //   wallImagePath: "./static/wall-images/blank-wall.jpg", // Uncomment to use wall image
//     //   wallHeightInches: 144, // Real-world wall height in inches (required if wallImagePath is provided)
//     position: "center",
//     xOffset: 0,
//     yOffset: 0,
//     inputDir: "./static/art-images/",
//     outputDir: "./static/output-images/",
//     outputName: "transparent-image",
//   }
// );
