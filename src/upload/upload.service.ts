import { Injectable } from '@nestjs/common';
import cloudinary from 'src/config/cloudinary.config'; // Ensure Cloudinary is configured correctly
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  async uploadImage(
    file: Express.Multer.File
  ): Promise<{ url: string; public_id: string }> {
    try {
      if (!file) {
        throw new Error('No file uploaded');
      }

      // Upload the image from memory using Cloudinary's upload_stream
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'auto' // Automatically detect the resource type (e.g., image, video)
            },
            (error, uploadResult) => {
              if (error) {
                reject(error); // Reject the promise if there's an error
              } else {
                resolve(uploadResult); // Resolve the promise with the upload result
              }
            }
          )
          .end(file.buffer); // Pass the buffer directly to upload_stream
      });

      // Return only the URL and public_id from the response
      return {
        url: result.secure_url, // URL for the uploaded image
        public_id: result.public_id // Public ID for later deletion
      };
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }
}
