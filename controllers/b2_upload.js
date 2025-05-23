// b2_upload.js
const { S3Client } = require('@aws-sdk/client-s3'); // AWS SDK S3 Client for B2 compatibility
const multer = require('multer'); // Middleware for handling multipart/form-data


// --- Backblaze B2 S3-Compatible Client Configuration ---
// This client is configured to interact with Backblaze B2's S3-compatible API.
// Ensure your .env file has BACKBLAZE_B2_ACCOUNT_ID, BACKBLAZE_B2_APPLICATION_KEY, and BACKBLAZE_B2_REGION.
const b2S3Client = new S3Client({
  endpoint: `https://s3.${process.env.BACKBLAZE_B2_REGION}.backblazeb2.com`,  // Points to your B2 region's S3 endpoint
  region: process.env.BACKBLAZE_B2_REGION, // Your Backblaze B2 region
  credentials: {
    accessKeyId: process.env.BACKBLAZE_B2_ACCOUNT_ID, // Your B2 Account ID
    secretAccessKey: process.env.BACKBLAZE_B2_APPLICATION_KEY, // Your B2 Application Key
  },
  forcePathStyle: false, // Often not needed, but can be set to true for some S3-compatible services
});

// --- Multer Configuration ---
// Multer is configured to store uploaded files in memory as a Buffer.
// This allows us to directly stream the buffer to Backblaze B2.
const uploadMiddleware = multer({
  storage: multer.memoryStorage(), // Store file data in memory
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB (adjust as needed)
  },
  fileFilter: (req, file, cb) => {
    // Basic validation: only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Only image files are allowed!'), false); // Reject the file
    }
  },
});

// Helper functions for direct B2 interaction (moved from previous upload_s3.js)
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Uploads a file buffer to a specified Backblaze B2 bucket.
 * @param {S3Client} client - The S3Client instance configured for Backblaze B2.
 * @param {string} bucketName - The name of the Backblaze B2 bucket.
 * @param {string} key - The desired object key (path and filename) in the bucket.
 * @param {Buffer} fileBuffer - The file content as a Buffer.
 * @param {string} contentType - The MIME type of the file (e.g., 'image/jpeg').
 * @returns {Promise<void>} A promise that resolves when the upload is complete.
 */
const uploadFileToB2 = async (client, bucketName, key, fileBuffer, contentType) => {
  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  };
  try {
    await client.send(new PutObjectCommand(uploadParams));
    console.log(`Successfully uploaded ${key} to Backblaze B2 bucket ${bucketName}`);
  } catch (error) {
    console.error(`Error uploading ${key} to Backblaze B2:`, error);
    throw new Error(`Failed to upload file to Backblaze B2: ${key}`);
  }
};

/**
 * Deletes an object from a specified Backblaze B2 bucket.
 * @param {S3Client} client - The S3Client instance configured for Backblaze B2.
 * @param {string} bucketName - The name of the Backblaze B2 bucket.
 * @param {string} key - The object key (path and filename) to delete from the bucket.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
const deleteFileFromB2 = async (client, bucketName, key) => {
  const deleteParams = {
    Bucket: bucketName,
    Key: key,
  };
  try {
    await client.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted ${key} from Backblaze B2 bucket ${bucketName}`);
  } catch (error) {
    console.error(`Error deleting ${key} from Backblaze B2:`, error);
  }
};


module.exports = {
  b2Config: {
    b2S3Client, // Export the configured S3Client instance
  },
  uploadMiddleware, // Export the configured Multer middleware
  uploadFileToB2, // Export helper upload function
  deleteFileFromB2, // Export helper delete function
};