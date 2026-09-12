const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LIMITS = {
  service: { min: 1, max: 200 },
  email: { min: 3, max: 254 },
  password: { min: 1, max: 1024 },
  userName: { min: 3, max: 60 },
};

function validateCreateVault(data) {
  const errors = [];
  if (!data.service || typeof data.service !== "string") {
    errors.push("Service is required");
  } else if (
    data.service.trim().length < LIMITS.service.min ||
    data.service.trim().length > LIMITS.service.max
  ) {
    errors.push(`Service must be ${LIMITS.service.min}-${LIMITS.service.max} characters`);
  }

  if (!data.email || typeof data.email !== "string" || !EMAIL_REGEX.test(data.email.trim())) {
    errors.push("A valid email is required");
  } else if (
    data.email.trim().length < LIMITS.email.min ||
    data.email.trim().length > LIMITS.email.max
  ) {
    errors.push(`Email must be ${LIMITS.email.min}-${LIMITS.email.max} characters`);
  }

  if (!data.password || typeof data.password !== "string") {
    errors.push("Password is required");
  } else if (
    data.password.length < LIMITS.password.min ||
    data.password.length > LIMITS.password.max
  ) {
    errors.push(`Password must be ${LIMITS.password.min}-${LIMITS.password.max} characters`);
  }

  return { valid: errors.length === 0, errors };
}

function validateSignup({ userName, email, password }) {
  const errors = [];
  if (!userName || typeof userName !== "string") {
    errors.push("Username is required");
  } else if (
    userName.trim().length < LIMITS.userName.min ||
    userName.trim().length > LIMITS.userName.max
  ) {
    errors.push(`Username must be ${LIMITS.userName.min}-${LIMITS.userName.max} characters`);
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push("A valid email is required");
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  return { valid: errors.length === 0, errors };
}

function validatePassword(password) {
  if (!password || typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
}

module.exports = { validateCreateVault, validateSignup, validatePassword, EMAIL_REGEX };