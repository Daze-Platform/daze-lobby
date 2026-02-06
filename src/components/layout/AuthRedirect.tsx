interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Wrapper for the auth page - simply renders children.
 * Redirect logic happens AFTER successful login in the LoginForm component.
 */
export function AuthRedirect({ children }: AuthRedirectProps) {
  return <>{children}</>;
}
