// new_post.js
const { uploadFileToB2, deleteFileFromB2 } = require("./b2_upload"); // Import B2 helper functions

const createPostHandler = (db, uniqid, st, b2Config) => async (req, res) => {
  const {
    user_id,
    post_description,
    description_devanagari,
    price,
    category_id,
    contact_info,
    tags,
    condition,
    negotiable,
    latitude,
    longitude,
  } = req.body;
  const files = req.files; // Files parsed by multer middleware
  console.log("Files received:", files ? files.length : 0, "files");

  const post_id = uniqid.process(user_id + Date.now()); // Generate unique post ID
  console.log("Generated post_id:", post_id);

  // Function to sanitize filename
  const sanitizeFilename = (filename) => {
    // Remove spaces and special characters, keep only alphanumeric, dots, and hyphens
    return filename.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
  };

  let uploadedImageUrls = [];
  const uploadedB2Keys = []; // To store B2 object keys for potential cleanup/deletion

  try {
    if (files && files.length > 0) {
      console.log("Starting file upload process...");
      // Ensure B2 config is initialized
      const b2ConfigInstance = await b2Config.initialize();

      const uploadPromises = files.map(async (file) => {
        console.log("Processing file:", file.originalname);
        // Generate a unique filename without folder structure and sanitize it
        const uniqueId = uniqid();
        const sanitizedFilename = sanitizeFilename(file.originalname);
        const b2Key = `${uniqueId}-${sanitizedFilename}`; // e.g., uniqueid-image.jpg
        console.log("Generated B2 key:", b2Key);

        try {
          // Upload the file to Backblaze B2 using the helper function
          await uploadFileToB2(
            b2ConfigInstance,
            process.env.BACKBLAZE_B2_BUCKET_NAME,
            b2Key,
            file.buffer,
            file.mimetype
          );
          console.log("Successfully uploaded to B2:", file.originalname);

          // Construct the public CDN URL for the uploaded image
          const cdnUrl = `${process.env.CLOUDFLARE_CDN_DOMAIN}/${b2Key}`;
          console.log("Generated CDN URL:", cdnUrl);
          uploadedImageUrls.push(cdnUrl);
          uploadedB2Keys.push(b2Key);
          return cdnUrl;
        } catch (uploadError) {
          console.error(
            "Error uploading file to B2:",
            file.originalname,
            uploadError
          );
          throw uploadError;
        }
      });

      console.log("Waiting for all uploads to complete...");
      await Promise.all(uploadPromises); // Wait for all image uploads to complete
      console.log("All files uploaded successfully");
    } else {
      console.log("No files to upload");
    }

    // Start a database transaction to ensure atomicity
    const result = await db.transaction(async (trx) => {
      // Validate required fields
      if (!user_id) {
        throw new Error("user_id is required");
      }

      // Prepare the post data
      const postData = {
        post_id,
        user_id,
        post_description: post_description || "",
        description_devanagari: description_devanagari || "",
        price: price || 0,
        post_status: "active",
        date_posted: new Date(),
        likes: 0,
        views: 0,
        images: uploadedImageUrls,
        category_id: category_id || null,
        is_featured: false,
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Post expires in 30 days
        contact_info: contact_info || "",
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        condition: condition || "new",
        negotiable: negotiable || false,
      };

      // Only add geolocation if both latitude and longitude are provided
      if (latitude && longitude) {
        postData.geoloc = st.geomFromText(
          `Point(${longitude} ${latitude})`,
          4326
        );
      }

      // Insert new post data into the 'posts' table
      const [post] = await trx("posts").insert(postData).returning("*"); // Return the inserted post record

      // Create associated entries in 'productviews' and 'productlike' tables
      await trx("productviews").insert({ adid: post_id });
      await trx("productlike").insert({ adid: post_id });

      return post; // Return the created post object
    });

    res.json({
      success: true,
      post: result,
      message:
        "Post created successfully with images uploaded to Backblaze B2 and served via Cloudflare CDN.",
    });
  } catch (err) {
    console.error("Error creating post:", err);

    // If an error occurs during post creation (e.g., DB error),
    // attempt to clean up any images that were already uploaded to Backblaze B2.
    if (uploadedB2Keys.length > 0) {
      console.warn(
        "Attempting to clean up orphaned images from Backblaze B2 due to post creation failure."
      );
      await Promise.allSettled(
        uploadedB2Keys.map(async (b2Key) => {
          // Use the delete helper function
          await deleteFileFromB2(
            b2Config.getConfig(),
            process.env.BACKBLAZE_B2_BUCKET_NAME,
            b2Key
          );
        })
      );
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to create post",
    });
  }
};

const deletePostHandler = (db, b2Config) => async (req, res) => {
  const { post_id, user_id } = req.body;

  try {
    // Start a database transaction
    await db.transaction(async (trx) => {
      // 1. Retrieve image URLs associated with the post before deleting the post record
      const [postToDelete] = await trx("posts")
        .where({ post_id, user_id })
        .select("images");

      if (!postToDelete) {
        return res
          .status(404)
          .json({ success: false, error: "Post not found or unauthorized." });
      }

      const imageUrls = postToDelete.images || [];

      // 2. Delete images from Backblaze B2 using the helper function
      if (imageUrls.length > 0) {
        const deletePromises = imageUrls.map(async (imageUrl) => {
          // Extract the B2 object key from the CDN URL
          // This assumes your CDN URL structure is like: CLOUDFLARE_CDN_DOMAIN/post_id/uniqueid-image.jpg
          const urlParts = imageUrl.split("/");
          const b2Key = urlParts.slice(3).join("/"); // Extracts everything after the domain/path

          if (!b2Key) {
            console.warn(
              `Could not extract B2 key from URL: ${imageUrl}. Skipping deletion for this image.`
            );
            return; // Skip if key extraction fails
          }
          // Use the delete helper function
          await deleteFileFromB2(
            b2Config.getConfig(),
            process.env.BACKBLAZE_B2_BUCKET_NAME,
            b2Key
          );
        });
        // Use Promise.allSettled to ensure all deletion attempts are made,
        // even if some fail, without stopping the transaction.
        await Promise.allSettled(deletePromises);
      }

      // 3. Delete related entries from 'productlike' and 'productviews' tables
      await trx("productlike").where("adid", post_id).del();
      await trx("productviews").where("adid", post_id).del();

      // 4. Delete the post record from the 'posts' table
      const deletedCount = await trx("posts")
        .where({
          post_id,
          user_id, // Ensure the user owns the post for security
        })
        .del();

      if (deletedCount === 0) {
        // This case should ideally be caught by the initial `postToDelete` check,
        // but it's a good safeguard if the post somehow disappears between checks.
        throw new Error("Post not found or unauthorized for deletion.");
      }
    });

    res.json({
      success: true,
      message:
        "Post and associated images deleted successfully from database and Backblaze B2.",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete post",
    });
  }
};

module.exports = {
  createPostHandler,
  deletePostHandler,
};
