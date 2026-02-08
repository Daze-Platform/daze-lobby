// Common breached passwords list (top 100 most common)
const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
  "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine",
  "ashley", "bailey", "shadow", "123123", "654321", "superman", "qazwsx",
  "michael", "football", "password1", "password123", "batman", "login",
  "admin", "passw0rd", "hello", "charlie", "donald", "password2", "qwerty123",
  "welcome", "welcome1", "p@ssw0rd", "123456789", "12345", "1234567890",
  "ninja", "mustang", "photoshop", "zaq12wsx", "princess", "starwars",
  "cheese", "corvette", "mercedes", "summer", "love", "lakers", "ginger",
  "harley", "hunter", "ranger", "buster", "soccer", "hockey", "george",
  "andrew", "joshua", "michelle", "hannah", "thomas", "pepper", "jordan",
  "hunter1", "tigger", "jennifer", "secret", "diamond", "password12",
  "austin", "bonnie", "samantha", "whatever", "zxcvbnm", "internet",
  "killer", "access", "hockey1", "computer", "orange", "flower", "thunder",
  "silver", "maggie", "asshole", "fuckyou", "123qwe", "qwe123", "matrix",
  "cookie", "steelers", "yankees", "cowboys", "angels", "maverick", "nicole",
  "chelsea", "banana", "purple", "monster", "nothing", "phoenix", "jackson"
]);

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

export interface PasswordValidationResult {
  score: number;
  label: string;
  requirements: PasswordRequirement[];
  isAcceptable: boolean;
}

export function validatePassword(password: string): PasswordValidationResult {
  const requirements: PasswordRequirement[] = [
    {
      key: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      key: "uppercase",
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      key: "lowercase",
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      key: "number",
      label: "One number",
      met: /\d/.test(password),
    },
    {
      key: "special",
      label: "One special character",
      met: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password),
    },
  ];

  const isCommonPassword = COMMON_PASSWORDS.has(password.toLowerCase());
  const metCount = requirements.filter((r) => r.met).length;

  // Calculate score (0-5)
  let score: number;
  if (password.length === 0) {
    score = 0;
  } else if (password.length < 8) {
    score = 1;
  } else if (isCommonPassword) {
    score = 1; // Common passwords get lowest score even if they meet requirements
  } else if (metCount <= 2) {
    score = 2;
  } else if (metCount === 3) {
    score = 3;
  } else if (metCount === 4) {
    score = 4;
  } else {
    score = 5;
  }

  // Determine label
  let label: string;
  switch (score) {
    case 0:
      label = "";
      break;
    case 1:
      label = isCommonPassword ? "Common password" : "Weak";
      break;
    case 2:
      label = "Fair";
      break;
    case 3:
      label = "Good";
      break;
    case 4:
    case 5:
      label = "Strong";
      break;
    default:
      label = "";
  }

  return {
    score,
    label,
    requirements,
    isAcceptable: score >= 3 && !isCommonPassword,
  };
}

export function getStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return "hsl(var(--destructive))";
    case 2:
      return "hsl(25 95% 53%)"; // Orange
    case 3:
      return "hsl(48 96% 53%)"; // Yellow
    case 4:
    case 5:
      return "hsl(142 76% 36%)"; // Green
    default:
      return "hsl(var(--muted))";
  }
}
