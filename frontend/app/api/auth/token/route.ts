import { getAccessToken } from '@auth0/nextjs-auth0';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { accessToken } = await getAccessToken();

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    return new Response(JSON.stringify({ accessToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur getAccessToken:', error);
    return new Response(JSON.stringify({ error: 'Token error' }), { status: 500 });
  }
}
