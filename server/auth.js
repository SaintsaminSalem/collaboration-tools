const jwt = require("jsonwebtoken");

function verifyToken(token) {
  if (!token) throw new Error("No token");
  return jwt.verify(token, process.env.JWT_SECRET);
}

function issueToken(user) {
  // Accept either a user object or a plain userId string (back-compat)
  if (typeof user === "string") {
    return jwt.sign({ id: user }, process.env.JWT_SECRET, { expiresIn: "7d" });
  }
  return jwt.sign(
    { id: user.id || user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = { verifyToken, issueToken };
