/**
 * auth middleware — JWT verification + role check.
 * Sprint 0: stub only. Real JWT logic lands in Sprint 1.
 */

function authenticate(req, res, next) {
  // TODO Sprint 1: verify JWT from Authorization header
  // For now, attach a mock user so routes don't crash
  req.user = { id: 1, role: "patient" };
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
