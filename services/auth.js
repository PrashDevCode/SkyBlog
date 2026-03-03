import JWT from 'jsonwebtoken';

// ✅ Read secret inside functions, NOT at the top level
// Reading at top level captures undefined because dotenv hasn't loaded yet

function createTokenForUser(user) {
  const payload = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profileImageURL: user.profileImageURL, // ✅ fixed typo (was profileImageUrl)
    role: user.role,
  };
  return JWT.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(token) {
  try {
    return JWT.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid token');
  }
}

export { createTokenForUser, verifyToken };