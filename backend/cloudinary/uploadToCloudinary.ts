import cloudinary from "./cloudinaryConfig.ts";
import type { UploadApiResponse, UploadApiErrorResponse, UploadApiOptions } from "cloudinary";

const uploadToCloudinary = (fileBuffer:Buffer, mimetype:string, folder = "employees") => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("No file buffer provided"));

    // Determine resource type
   let resource_type: UploadApiOptions["resource_type"] = "image"; // default
    if (mimetype.startsWith("video/")) resource_type = "video";
    else if (mimetype.startsWith("audio/")) resource_type = "video"; // Cloudinary me audio ko video resource ke under upload karte hai
    else if (mimetype === "application/pdf") resource_type = "raw"; // PDF ya docs ke liye "raw"

    cloudinary.uploader
      .upload_stream({ folder, resource_type }, (error:UploadApiErrorResponse | undefined, result:UploadApiResponse | undefined) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed, result is undefined"));
        resolve(result.secure_url);
      })
      .end(fileBuffer);
  });
};

export default uploadToCloudinary;
