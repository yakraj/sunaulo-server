const createPostHandler = (db, uniqid, st) => async (req, res) => {
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

  // Generate unique post ID
  const post_id = uniqid.process(user_id + Date.now());

  try {
    // Start a transaction
    const result = await db.transaction(async (trx) => {
      // Insert into posts table
      const [post] = await trx("posts")
        .insert({
          post_id,
          user_id,
          post_description,
          description_devanagari,
          price,
          post_status: "active",
          date_posted: new Date(),
          likes: 0,
          views: 0,
          images: req.files ? req.files.map((file) => file.secure_url) : [],
          geoloc: st.geomFromText(`Point(${longitude} ${latitude})`, 4326),
          category_id,
          is_featured: false,
          updated_at: new Date(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          contact_info,
          tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
          condition,
          negotiable,
        })
        .returning("*");

      // Create product views entry
      await trx("productviews").insert({
        adid: post_id,
      });

      // Create product likes entry
      await trx("productlike").insert({
        adid: post_id,
      });

      return post;
    });

    res.json({
      success: true,
      post: result,
    });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create post",
    });
  }
};

const deletePostHandler = (db) => async (req, res) => {
  const { post_id, user_id } = req.body;

  try {
    // Start a transaction
    await db.transaction(async (trx) => {
      // Delete from productlike
      await trx("productlike").where("adid", post_id).del();

      // Delete from productviews
      await trx("productviews").where("adid", post_id).del();

      // Delete from posts
      await trx("posts")
        .where({
          post_id,
          user_id, // Ensure user owns the post
        })
        .del();
    });

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete post",
    });
  }
};

module.exports = {
  createPostHandler,
  deletePostHandler,
};
