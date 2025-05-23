// b2_upload.js
const axios = require("axios");
const multer = require("multer");
const validateEnvVariables = () => {
  const requiredVars = {
    BACKBLAZE_B2_ACCOUNT_ID: process.env.BACKBLAZE_B2_ACCOUNT_ID,
    BACKBLAZE_B2_APPLICATION_KEY: process.env.BACKBLAZE_B2_APPLICATION_KEY,
    BACKBLAZE_B2_BUCKET_NAME: process.env.BACKBLAZE_B2_BUCKET_NAME,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
};
class B2Config {
  constructor() {
    this.config = null;
    this.initializing = false;
  }

  async initialize() {
    if (this.config) return this.config;
    if (this.initializing) {
      // Wait for initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.initialize();
    }

    this.initializing = true;
    try {
      validateEnvVariables();

      // console.log("Initializing B2 configuration...");
      // Get authorization token
      const authResponse = await axios.get(
        "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
        {
          auth: {
            username: process.env.BACKBLAZE_B2_ACCOUNT_ID,
            password: process.env.BACKBLAZE_B2_APPLICATION_KEY,
          },
        }
      );

      // console.log("Got authorization response:", {
      //   apiUrl: authResponse.data.apiUrl,
      //   downloadUrl: authResponse.data.downloadUrl,
      //   allowed: authResponse.data.allowed,
      // });

      // Get bucket ID
      const bucketResponse = await axios.get(
        `${authResponse.data.apiUrl}/b2api/v2/b2_list_buckets`,
        {
          headers: { Authorization: authResponse.data.authorizationToken },
          params: { accountId: authResponse.data.accountId },
        }
      );

      // console.log("Got bucket list response:", bucketResponse.data);

      const bucket = bucketResponse.data.buckets.find(
        (b) => b.bucketName === process.env.BACKBLAZE_B2_BUCKET_NAME
      );

      if (!bucket) {
        throw new Error(
          `Bucket ${
            process.env.BACKBLAZE_B2_BUCKET_NAME
          } not found. Available buckets: ${bucketResponse.data.buckets
            .map((b) => b.bucketName)
            .join(", ")}`
        );
      }

      this.config = {
        apiUrl: authResponse.data.apiUrl,
        authorizationToken: authResponse.data.authorizationToken,
        downloadUrl: authResponse.data.downloadUrl,
        bucketId: bucket.bucketId,
        accountId: authResponse.data.accountId,
      };

      // console.log("B2 configuration initialized successfully:", {
      //   apiUrl: this.config.apiUrl,
      //   bucketId: this.config.bucketId,
      //   accountId: this.config.accountId,
      // });
      return this.config;
    } catch (error) {
      console.error("Failed to initialize B2 configuration:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          accountId: process.env.BACKBLAZE_B2_ACCOUNT_ID,
          bucketName: process.env.BACKBLAZE_B2_BUCKET_NAME,
          hasAppKey: !!process.env.BACKBLAZE_B2_APPLICATION_KEY,
        },
      });
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  getConfig() {
    if (!this.config) {
      throw new Error(
        "B2 configuration not initialized. Call initialize() first."
      );
    }
    return this.config;
  }
}

// Create singleton instance
const b2ConfigInstance = new B2Config();

// Initialize immediately
b2ConfigInstance.initialize().catch((error) => {
  console.error("Initial B2 initialization failed:", error);
});

// Validate environment variables

// Configure multer for file uploads
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("Processing file:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

/**
 * Uploads a file to Backblaze B2
 */
const uploadFileToB2 = async (
  b2Config,
  bucketName,
  key,
  fileBuffer,
  contentType
) => {
  console.log("Attempting to upload file:", {
    bucketName,
    key,
    contentType,
    bufferSize: fileBuffer.length,
  });

  try {
    // Get upload URL
    const uploadUrlResponse = await axios.get(
      `${b2Config.apiUrl}/b2api/v2/b2_get_upload_url`,
      {
        params: { bucketId: b2Config.bucketId },
        headers: { Authorization: b2Config.authorizationToken },
      }
    );

    const { uploadUrl, authorizationToken } = uploadUrlResponse.data;

    // Upload the file
    const uploadResponse = await axios.post(uploadUrl, fileBuffer, {
      headers: {
        Authorization: authorizationToken,
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length,
        "X-Bz-File-Name": key,
        "X-Bz-Content-Sha1": "do_not_verify",
      },
    });

    console.log("B2 Upload Response:", uploadResponse.data);
    return uploadResponse.data;
  } catch (error) {
    console.error("B2 Upload Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(`Failed to upload file to Backblaze B2: ${error.message}`);
  }
};

/**
 * Deletes a file from Backblaze B2
 */
const deleteFileFromB2 = async (b2Config, bucketName, key) => {
  console.log("Attempting to delete file:", {
    bucketName,
    key,
  });

  try {
    const response = await axios.post(
      `${b2Config.apiUrl}/b2api/v2/b2_delete_file_version`,
      {
        fileName: key,
        fileId: key, // You might need to store and retrieve the fileId separately
      },
      {
        headers: { Authorization: b2Config.authorizationToken },
      }
    );

    console.log("B2 Delete Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("B2 Delete Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      `Failed to delete file from Backblaze B2: ${error.message}`
    );
  }
};

module.exports = {
  b2Config: b2ConfigInstance,
  uploadMiddleware,
  uploadFileToB2,
  deleteFileFromB2,
};
