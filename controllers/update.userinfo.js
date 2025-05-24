const updateName = (db, uniqid, bcrypt) => async (req, res) => {
  const { user_id, name, username } = req.body;

  try {
    // Check if username is already taken
    if (username) {
      const existingUser = await db("users")
        .where("username", username)
        .whereNot("id", user_id)
        .first();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Username already taken",
        });
      }
    }

    // Update user information
    const [updatedUser] = await db("users")
      .where("id", user_id)
      .update({
        name: name || undefined,
        username: username || undefined,
        updated_at: new Date(),
      })
      .returning("*");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user name:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update user information",
    });
  }
};

const updateLocation = (db) => async (req, res) => {
  const { user_id, latitude, longitude, country } = req.body;

  try {
    // Update user location
    const [updatedUser] = await db("users")
      .where("id", user_id)
      .update({
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        country: country || undefined,
        geoloc:
          latitude && longitude
            ? db.raw(
                `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`
              )
            : undefined,
        updated_at: new Date(),
      })
      .returning("*");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user location:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update user location",
    });
  }
};

const updateAvatar = (db, b2Config) => async (req, res) => {
  console.log("Avatar update request received:", {
    body: req.body,
    file: req.file,
    files: req.files,
  });

  const { user_id } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      error: "No file uploaded",
    });
  }

  try {
    // Generate unique filename
    const uniqueId = uniqid();
    const sanitizedFilename = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();
    const b2Key = `${uniqueId}-${sanitizedFilename}`;

    console.log("Uploading to B2:", {
      b2Key,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    // Upload to B2
    await uploadFileToB2(
      b2Config.getConfig(),
      process.env.BACKBLAZE_B2_BUCKET_NAME,
      b2Key,
      file.buffer,
      file.mimetype
    );

    const avatarUrl = `${process.env.CLOUDFLARE_CDN_DOMAIN}/${b2Key}`;

    // Update user avatar
    const [updatedUser] = await db("users")
      .where("id", user_id)
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date(),
      })
      .returning("*");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user avatar:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update user avatar",
    });
  }
};

const updateMobile = (db) => async (req, res) => {
  const { user_id, mobile } = req.body;

  try {
    // Check if mobile is already taken
    const existingUser = await db("users")
      .where("mobile", mobile)
      .whereNot("id", user_id)
      .first();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Mobile number already registered",
      });
    }

    // Update user mobile
    const [updatedUser] = await db("users")
      .where("id", user_id)
      .update({
        mobile: mobile,
        updated_at: new Date(),
      })
      .returning("*");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user mobile:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update user mobile",
    });
  }
};

module.exports = {
  updateName,
  updateLocation,
  updateAvatar,
  updateMobile,
};
