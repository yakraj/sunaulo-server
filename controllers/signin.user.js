const signinhandler = (db, bcrypt) => async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email, mobile, or username

  if (!identifier || !password) {
    return res.status(400).json({ error: "Missing identifier or password." });
  }

  // Try to find the user by email, mobile, or username
  try {
    const cred = await db("crediantials")
      .where("email", identifier)
      .orWhere("mobile", identifier)
      .orWhere("username", identifier)
      .first();

    if (!cred) {
      return res.status(404).json({ error: "username or  password Invalid." });
    }

    const isValid = bcrypt.compareSync(password, cred.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "username or  password Invalid." });
    }

    // Fetch user profile info
    const user = await db("users").where("username", cred.username).first();

    if (!user) {
      return res.status(404).json({ error: "username or  password Invalid." });
    }

    // Return user info (omit sensitive fields)
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      avatar_url: user.avatar_url,
      country: user.country,
      latitude: user.latitude,
      longitude: user.longitude,
      geoloc: user.geoloc,
      created_at: user.created_at,
      is_verified: user.is_verified,
      is_active: user.is_active,
      is_deleted: user.is_deleted,
      is_blocked: user.is_blocked,
      is_suspended: user.is_suspended,
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Signin failed.", details: err.message });
  }
};

// In-memory OTP store (for demo; use Redis or DB in production)
// Keyed by verifier (identifier + purpose)
const otpStore = {};

function getOtpKey(identifier, purpose = "reset") {
  return `${purpose}:${identifier}`;
}

// 1. Request OTP for password reset
const requestResetOtp = (db, bcrypt) => async (req, res) => {
  const { identifier } = req.body; // email or username or mobile
  if (!identifier) {
    return res
      .status(400)
      .json({ error: "Missing email, username, or mobile." });
  }

  // Find user by email, username, or mobile
  const cred = await db("crediantials")
    .where("email", identifier)
    .orWhere("username", identifier)
    .orWhere("mobile", identifier)
    .first();
  if (!cred || !cred.email) {
    return res.status(404).json({ error: "Invalid user." });
  }

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const key = getOtpKey(identifier, "reset");
  // Store OTP in memory (keyed by verifier)
  otpStore[key] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  // Simulate sending OTP to user's email
  // await sendOtpToUser(cred.email, otp); // Integrate your email provider here
  console.log(`OTP for ${cred.email}: ${otp}`); // For demo only

  res.json({
    message: "OTP sent successfully to your registered email address.",
  });
};

// 1b. Resend OTP for password reset
const resendResetOtp = (db, bcrypt) => async (req, res) => {
  const { identifier } = req.body; // email or username
  if (!identifier) {
    return res.status(400).json({ error: "Missing email or username." });
  }
  const key = getOtpKey(identifier, "reset");
  // Remove previous OTP if exists
  if (otpStore[key]) {
    delete otpStore[key];
  }
  // Call requestResetOtp logic to generate and send new OTP
  await requestResetOtp(req, res);
};

// 2. Verify OTP
const verifyResetOtp = () => async (req, res) => {
  const { identifier, otp } = req.body;
  if (!identifier || !otp) {
    return res.status(400).json({ error: "Missing identifier or OTP." });
  }
  const key = getOtpKey(identifier, "reset");
  const record = otpStore[key];
  if (!record || record.otp !== otp) {
    return res.status(400).json({ error: "Invalid or expired OTP." });
  }
  if (Date.now() > record.expires) {
    delete otpStore[key];
    return res.status(400).json({ error: "OTP expired." });
  }
  // Mark as verified (could set a flag or just allow next step)
  otpStore[key].verified = true;
  res.json({ message: "OTP verified. You can now reset your password." });
};

// 3. Reset password
const resetPassword = (db, bcrypt) => async (req, res) => {
  const { identifier, otp, new_password } = req.body;
  if (!identifier || !otp || !new_password) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  const key = getOtpKey(identifier, "reset");
  const record = otpStore[key];
  if (!record || record.otp !== otp || !record.verified) {
    return res.status(400).json({ error: "OTP not verified." });
  }
  // Update password
  const password_hash = bcrypt.hashSync(new_password);
  await db("crediantials")
    .where(function () {
      this.where("email", identifier).orWhere("username", identifier);
    })
    .update({ password_hash });
  // Fetch user details
  const cred = await db("crediantials")
    .where("email", identifier)
    .orWhere("username", identifier)
    .first();
  let user = null;
  if (cred && cred.username) {
    user = await db("users").where("username", cred.username).first();
  }
  // Clean up OTP
  delete otpStore[key];
  if (user) {
    res.json({ message: "Password reset successful.", user });
  } else {
    res.json({
      message: "Password reset successful, but user details not found.",
    });
  }
};

module.exports = {
  signinhandler,
  requestResetOtp,
  resendResetOtp,
  verifyResetOtp,
  resetPassword,
};
