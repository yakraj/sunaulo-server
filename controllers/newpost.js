// new_post.js
const { uploadFileToB2, deleteFileFromB2 } = require("./b2_upload"); // Import B2 helper functions

const createPostHandler = (db, uniqid, st, b2Config) => async (req, res) => {
  console.log("Received request body:", JSON.stringify(req.body, null, 2));
  console.log("Received files:", req.files);

  // Parse the JSON data from the data field
  let postData;
  try {
    postData = JSON.parse(req.body.data);
  } catch (error) {
    console.error("Error parsing JSON data:", error);
    return res.status(400).json({
      success: false,
      error: "Invalid JSON data in request",
      receivedData: req.body,
    });
  }

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
  } = postData;

  // Log the extracted values
  console.log("Extracted values:", {
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
  });

  const files = req.files;
  console.log("Files received:", files ? files.length : 0, "files");

  const post_id = uniqid.process(user_id + Date.now());
  console.log("Generated post_id:", post_id);

  // Function to sanitize filename
  const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
  };

  let uploadedImageUrls = [];
  const uploadedB2Keys = [];

  try {
    if (files && files.length > 0) {
      console.log("Starting file upload process...");
      const b2ConfigInstance = await b2Config.initialize();

      const uploadPromises = files.map(async (file) => {
        console.log("Processing file:", file.originalname);
        const uniqueId = uniqid();
        const sanitizedFilename = sanitizeFilename(file.originalname);
        const b2Key = `${uniqueId}-${sanitizedFilename}`;
        console.log("Generated B2 key:", b2Key);

        try {
          await uploadFileToB2(
            b2ConfigInstance,
            process.env.BACKBLAZE_B2_BUCKET_NAME,
            b2Key,
            file.buffer,
            file.mimetype
          );
          console.log("Successfully uploaded to B2:", file.originalname);

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
      await Promise.all(uploadPromises);
      console.log("All files uploaded successfully");
    } else {
      console.log("No files to upload");
    }

    // Start a database transaction
    const result = await db.transaction(async (trx) => {
      // Validate required fields
      if (!user_id) {
        console.error("Missing user_id in parsed data:", postData);
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
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        contact_info: contact_info || "",
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        condition: condition || "new",
        negotiable: negotiable || false,
      };

      console.log("Inserting post data:", postData);

      // Only add geolocation if both latitude and longitude are provided
      if (latitude && longitude) {
        postData.geoloc = st.geomFromText(
          `Point(${longitude} ${latitude})`,
          4326
        );
      }

      // Insert new post data into the 'posts' table
      const [post] = await trx("posts").insert(postData).returning("*");
      console.log("Successfully inserted post:", post);

      // Create associated entries in 'productviews' and 'productlike' tables
      await trx("productviews").insert({ adid: post_id });
      await trx("productlikes").insert({ adid: post_id });

      return post;
    });

    res.json({
      success: true,
      post: result,
      message:
        "Post created successfully with images uploaded to Backblaze B2 and served via Cloudflare CDN.",
    });
  } catch (err) {
    console.error("Error creating post:", err);
    console.error("Request body:", req.body);
    console.error("Files:", req.files);

    // If an error occurs during post creation, attempt to clean up any images
    if (uploadedB2Keys.length > 0) {
      console.warn(
        "Attempting to clean up orphaned images from Backblaze B2 due to post creation failure."
      );
      await Promise.allSettled(
        uploadedB2Keys.map(async (b2Key) => {
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
      receivedData: req.body,
    });
  }
};

const deletePostHandler = (db, b2Config) => async (req, res) => {
  console.log("Delete request received:", {
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Get post_id and user_id from either FormData or JSON
  let post_id, user_id;

  try {
    // If data is sent as FormData
    if (req.body.data) {
      const formData = JSON.parse(req.body.data);
      post_id = formData.post_id;
      user_id = formData.user_id;
    } else {
      // If data is sent as JSON
      post_id = req.body.post_id;
      user_id = req.body.user_id;
    }

    console.log("Extracted data:", { post_id, user_id });

    if (!post_id || !user_id) {
      throw new Error("post_id and user_id are required");
    }

    // Start a database transaction
    await db.transaction(async (trx) => {
      // 1. First verify the post exists and belongs to the user
      const [postToDelete] = await trx("posts")
        .where({ post_id, user_id })
        .select("*");

      if (!postToDelete) {
        throw new Error("Post not found or unauthorized.");
      }

      // 2. Delete images from Backblaze B2
      if (postToDelete.images && postToDelete.images.length > 0) {
        console.log("Deleting images from B2:", postToDelete.images);

        const deletePromises = postToDelete.images.map(async (imageUrl) => {
          try {
            // Extract the B2 key from the CDN URL
            const urlParts = imageUrl.split("/");
            const b2Key = urlParts[urlParts.length - 1]; // Get the filename part

            if (!b2Key) {
              console.warn(`Could not extract B2 key from URL: ${imageUrl}`);
              return;
            }

            console.log("Deleting file from B2:", b2Key);
            await deleteFileFromB2(
              b2Config.getConfig(),
              process.env.BACKBLAZE_B2_BUCKET_NAME,
              b2Key
            );
          } catch (error) {
            console.error("Error deleting image from B2:", error);
            // Continue with other deletions even if one fails
          }
        });

        // Wait for all image deletions to complete
        await Promise.allSettled(deletePromises);
      }

      // 3. Delete all related data in the correct order
      console.log("Deleting related data from database...");

      // Delete from productviews
      await trx("productviews").where("adid", post_id).del();
      console.log("Deleted from productviews");

      // Delete from productlikes
      await trx("productlikes").where("adid", post_id).del();
      console.log("Deleted from productlikes");

      // Finally delete the post
      const deletedCount = await trx("posts").where({ post_id, user_id }).del();
      console.log("Deleted from posts");

      if (deletedCount === 0) {
        throw new Error("Failed to delete post");
      }
    });

    res.json({
      success: true,
      message: "Post and all associated data deleted successfully",
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
