import { cookies } from 'next/headers';
import { ok, handleApiError } from '@/lib/api';
import { clearAuthCookies } from '@/lib/auth';

export async function POST() {
  try {
    const jar = await cookies();
    clearAuthCookies((name) => jar.delete(name));
    return ok({ loggedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
