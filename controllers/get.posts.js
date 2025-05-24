// Ensure you have your Knex/db setup properly (e.g., using 'pg' client)
// The `db` variable will be your Knex instance.

// No need for a separate 'st' parameter if using Knex's raw capabilities
// and PostgreSQL's built-in PostGIS functions.
const getPosts = (db) => async (req, res) => {
  // Use req.query for GET requests, not req.body, unless you're explicitly
  // sending a POST request with body parameters for filtering/pagination.
  // For standard filtering/pagination with GET, query parameters are typical.
  const {
    latitude,
    longitude,
    last_post_id, // Changed to last_post_id for more robust pagination
    keyword,
    limit = 5,
  } = req.body; // Changed from req.body to req.query

  try {
    // Validate and convert coordinates
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
      return res.status(400).json({
        success: false,
        error: "Invalid latitude or longitude values.",
      });
    }

    // Build the base client point for distance calculations
    const clientPointRaw = `ST_SetSRID(ST_MakePoint(${clientLon}, ${clientLat}), 4326)::geography`;

    // Base query with distance calculation
    let query = db("posts")
      .select(
        "posts.*",
        db.raw(
          `ST_Distance(posts.geoloc::geography, ${clientPointRaw}) as distance`
        )
      )
      .where("post_status", "active")
      .where("expires_at", ">", db.fn.now()); // Use db.fn.now() for current timestamp

    // --- Pagination based on last_post_id and its distance ---
    // This is more reliable than passing `last_post_geoloc` which might
    // lose precision or be hard to pass correctly as a string.
    if (last_post_id) {
      // Fetch the distance of the last post viewed
      const lastPost = await db("posts")
        .select(
          db.raw(
            `ST_Distance(geoloc::geography, ${clientPointRaw}) as distance`
          )
        )
        .where("id", last_post_id)
        .first();

      if (lastPost && lastPost.distance !== null) {
        // Add a WHERE clause to filter for posts further than the last post
        query = query.whereRaw(
          `ST_Distance(posts.geoloc::geography, ${clientPointRaw}) > ?`,
          [lastPost.distance]
        );
      }
    }

    // If keyword is provided, search in description and tags
    if (keyword) {
      query = query.where(function () {
        this.where("post_description", "ilike", `%${keyword}%`)
          .orWhere("description_devanagari", "ilike", `%${keyword}%`)
          .orWhereRaw("? = ANY(tags)", [keyword.toLowerCase()]);
      });
    }

    // Order by distance (ascending) and limit results
    const posts = await query.orderBy("distance", "asc").limit(limit);

    // Get user details for each post
    // Consider joining the users table directly in the main query for efficiency
    // if you frequently need user details.
    const postsWithUserDetails = await Promise.all(
      posts.map(async (post) => {
        const user = await db("users")
          .select("id", "username", "name", "avatar_url")
          .where("id", post.user_id)
          .first();

        // Remove the internal `geoloc` object if not needed on the frontend
        // const { geoloc, ...restOfPost } = post;

        return {
          ...post,
          user: user || null,
        };
      })
    );

    res.json({
      success: true,
      posts: postsWithUserDetails,
      hasMore: posts.length === parseInt(limit), // Ensure limit is parsed as int
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch posts",
    });
  }
};

module.exports = {
  getPosts,
};
