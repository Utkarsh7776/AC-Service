import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from './auth';

/**
 * Get the current session from the httpOnly cookie.
 * Only works in Server Components and API Routes (not middleware).
 */
export async function getSession() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch (err) {
    return null;
  }
}

