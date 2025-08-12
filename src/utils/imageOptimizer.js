import sharp from "sharp";

/**
 * Optimize image before upload
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {object} options - Resize & quality options
 * @returns {Promise<Buffer>} - Optimized image buffer
 */
export const optimizeImage = async (fileBuffer, options = {}) => {
  const { width = 800, height = null, quality = 80 } = options;

  // Optimize the image buffer
  const optimizedBuffer = await sharp(fileBuffer)
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .toBuffer(); // Return the optimized image buffer

  return optimizedBuffer;
};
