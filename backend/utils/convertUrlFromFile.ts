import uploadToCloudinary from "../cloudinary/uploadToCloudinary.ts";


 export const processFile = async ( bodyValue: string | undefined, file: Express.Multer.File | undefined, folder: string) => {
      if (file) {
        const result: any = await uploadToCloudinary(file.buffer, file.mimetype, folder);
        return result.secure_url;
      }

      // Agar existing string/URL aayi hai → direct save
      if (typeof bodyValue === "string" && bodyValue.trim() !== "") {
        return bodyValue.trim();
      }

      return undefined;
    };
