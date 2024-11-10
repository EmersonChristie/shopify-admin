import { generateImage } from "./generateImage.js";
import {
  getAllProducts,
  getProductMetafields,
  updateProductImages,
} from "../../shopify/products/services.js";
import { formatTitle } from "../../utils/index.js";
import fs from "fs";
import path from "path";

const extractDimensions = (metafields) => {
  const heightMetafield = metafields.find((mf) => mf.key === "height");
  const widthMetafield = metafields.find((mf) => mf.key === "width");

  if (!heightMetafield || !widthMetafield) {
    throw new Error("Height or width metafield not found");
  }

  const heightValue = JSON.parse(heightMetafield.value).value;
  const widthValue = JSON.parse(widthMetafield.value).value;

  return {
    height: parseFloat(heightValue),
    width: parseFloat(widthValue),
  };
};

const createProductImages = async (products) => {
  for (const product of products) {
    const metafields = await getProductMetafields(product.id);

    let dimensions;
    try {
      dimensions = extractDimensions(metafields);
    } catch (error) {
      console.error(
        `Error extracting dimensions for product ${product.id}: ${error.message}`
      );
      continue;
    }

    const artwork = {
      imageSrc: product.image.src,
      id: product.id,
      title: product.title,
      artworkHeightInches: dimensions.height,
      artworkWidthInches: dimensions.width,
    };

    const options = {
      format: "jpeg",
      canvasWidth: 2048,
      canvasHeight: 2048,
      outputDir: "./static/output-images/",
    };

    // Generate gradient image
    await generateImage(artwork, {
      ...options,
      background:
        "linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 50%, #d0d0d0 100%)",
      outputName: "gradient-image",
    });

    // Generate product image
    await generateImage(artwork, {
      ...options,
      wallImagePath: "./static/background-images/blank-wall.jpg",
      wallHeightInches: 114,
      outputName: "product-image",
    });

    // Generate transparent image
    await generateImage(artwork, {
      ...options,
      background: "transparent",
      outputName: "transparent-image",
    });

    // Prepare images for upload
    // const imageFilenames = [
    //   `${product.id}-${artwork.title
    //     .replace(/\s/g, "")
    //     .toLowerCase()}-gradient-image-2048x2048.jpeg`,
    //   `${product.id}-${artwork.title
    //     .replace(/\s/g, "")
    //     .toLowerCase()}-product-image-2048x2048.jpeg`,
    //   `${product.id}-${artwork.title
    //     .replace(/\s/g, "")
    //     .toLowerCase()}-transparent-image-2048x2048.jpeg`,
    // ];

    const imageFilenames = [
      `${product.id}-${formatTitle(
        artwork.title
      )}-gradient-image-2048x2048.jpeg`,
      `${product.id}-${formatTitle(
        artwork.title
      )}-product-image-2048x2048.jpeg`,
      `${product.id}-${formatTitle(
        artwork.title
      )}-transparent-image-2048x2048.jpeg`,
    ];

    const images = imageFilenames.map((filename, index) => ({
      product_id: product.id,
      position: index + 1,
      attachment: fs.readFileSync(path.join(options.outputDir, filename), {
        encoding: "base64",
      }),
    }));

    await updateProductImages(product.id, images);

    // half second delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

const products = await getAllProducts();
// filter out products that have a length longer than 1 of product.images
const remainingProducts = products.filter(
  (product) => product.images.length <= 1
);
// const testProducts = products.slice(0, 1); // Use only the first product for testing
createProductImages(remainingProducts); // Pass the testProducts array to the function
