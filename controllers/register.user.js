const registerhandler = (db, uniqid, bcrypt) => async (req, res) => {
  const {
    name,
    email,
    mobile,
    password,
    avatar_url,
    country,
    latitude,
    longitude,
    location, // should be { longitude, latitude }
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const username = uniqid.process(name);
  const password_hash = bcrypt.hashSync(password);
  const now = new Date();

  try {
    await db.transaction(async (trx) => {
      // Insert into crediantials
      const [cred] = await trx("crediantials")
        .insert({
          username,
          email,
          mobile: mobile || null,
          password_hash,
        })
        .returning(["id", "username"]);

      // Insert into users
      const [user] = await trx("users")
        .insert({
          username,
          email,
          mobile: mobile || null,
          name,
          avatar_url: avatar_url || "avatar.png",
          country: country || null,
          latitude: latitude || null,
          longitude: longitude || null,
          geoloc:
            longitude && latitude
              ? db.raw("ST_SetSRID(ST_MakePoint(?, ?), 4326)", [
                  longitude,
                  latitude,
                ])
              : null,
          created_at: now,
          updated_at: now,
          last_login: now,
          is_verified: false,
          is_active: true,
          is_deleted: false,
          is_blocked: false,
          is_suspended: false,
        })
        .returning([
          "id",
          "username",
          "email",
          "mobile",
          "name",
          "avatar_url",
          "country",
          "latitude",
          "longitude",
          "created_at",
        ]);

      res.json({ user });
    });
  } catch (err) {
    // Handle unique violation for email or mobile
    if (err.code === "23505") {
      // Unique violation in PostgreSQL
      if (err.detail && err.detail.includes("email")) {
        return res.status(409).json({ error: "Email already exists." });
      }
      if (err.detail && err.detail.includes("mobile")) {
        return res.status(409).json({ error: "Mobile already exists." });
      }
      if (err.detail && err.detail.includes("username")) {
        return res.status(409).json({ error: "Username already exists." });
      }
    }
    console.error("Register error:", err);
    res
      .status(500)
      .json({ error: "Registration failed.", details: err.message });
  }
};

module.exports = {
  registerhandler,
};
