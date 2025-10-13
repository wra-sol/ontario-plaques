import type { ActionFunctionArgs } from 'react-router';
import { setThemeCookie } from '../lib/theme';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const theme = formData.get('theme');
  
  if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
    return new Response('Invalid theme', { status: 400 });
  }
  
  // Return success with cookie
  return new Response(null, {
    status: 200,
    headers: {
      'Set-Cookie': setThemeCookie(theme),
    },
  });
}

