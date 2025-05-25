const getPosts = (db) => async (req, res) => {
  const {
    latitude,
    longitude,
    last_post_id,
    last_distance,
    keyword,
    limit = 10,
  } = req.body;

  const clientLat = parseFloat(latitude);
  const clientLon = parseFloat(longitude);

  if (
    isNaN(clientLat) ||
    isNaN(clientLon) ||
    clientLat < -90 ||
    clientLat > 90 ||
    clientLon < -180 ||
    clientLon > 180
  ) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid coordinates" });
  }

  const clientPointRaw = `ST_SetSRID(ST_MakePoint(${clientLon}, ${clientLat}), 4326)::geography`;

  try {
    // Base query
    let query = db("posts")
      .select(
        "posts.*",
        db.raw(
          `ST_Distance(posts.geoloc::geography, ${clientPointRaw}) as distance`
        )
      )
      .where("post_status", "active")
      .andWhere("expires_at", ">", db.fn.now());

    // Keyword search
    if (keyword) {
      query = query.where(function () {
        this.where("post_description", "ilike", `%${keyword}%`)
          .orWhere("description_devanagari", "ilike", `%${keyword}%`)
          .orWhereRaw("? = ANY(tags)", [keyword.toLowerCase()]);
      });
    }

    // --- Pagination logic ---
    if (last_post_id && last_distance) {
      query = query.where(function () {
        this.whereRaw(
          `ST_Distance(posts.geoloc::geography, ${clientPointRaw}) > ?`,
          [last_distance]
        ).orWhere(function () {
          this.whereRaw(
            `ST_Distance(posts.geoloc::geography, ${clientPointRaw}) = ?`,
            [last_distance]
          ).andWhere("posts.id", ">", last_post_id);
        });
      });
    }

    // Order and limit
    const posts = await query
      .orderBy([
        { column: "distance", order: "asc" },
        { column: "id", order: "asc" },
      ])
      .limit(parseInt(limit));

    // Attach user data
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const user = await db("users")
          .select("id", "username", "name", "avatar_url")
          .where("username", post.user_id)
          .first();
        return { ...post, user: user || null };
      })
    );

    res.json({
      success: true,
      posts: postsWithUsers,
      hasMore: posts.length === parseInt(limit),
      // Send back pagination pointers for next page
      nextCursor:
        posts.length > 0
          ? {
              last_post_id: posts[posts.length - 1].id,
              last_distance: posts[posts.length - 1].distance,
            }
          : null,
    });
  } catch (err) {
    console.error("Post fetching error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch posts" });
  }
};

module.exports = {
  getPosts,
};
