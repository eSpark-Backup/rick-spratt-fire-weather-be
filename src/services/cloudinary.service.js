import cloudinary from "../config/cloudinary.js";

export const uploadImage = async (fileBuffer, folder = "uploads") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, timeout: 60000 }, // 60 seconds timeout
      (error, result) => {
        if (error) {
          if (error.name === "TimeoutError") {
            return reject(
              new Error("Cloudinary upload timed out. Please try again.")
            );
          }
          return reject(error);
        }
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );

    stream.end(fileBuffer);
  });
};

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      timeout: 60000,
    });
    return result;
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new Error("Cloudinary delete request timed out.");
    }
    throw error;
  }
};
