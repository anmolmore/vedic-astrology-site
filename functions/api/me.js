import { requireUser, userPublicShape, getUserPrograms, jsonResponse } from '../_lib/auth.js';

export async function onRequestGet(context) {
  const user = await requireUser(context);
  if (!user) return jsonResponse({ error: 'Not signed in.' }, { status: 401 });
  const programs = await getUserPrograms(context.env.DB, user.id);
  return jsonResponse(userPublicShape(user, programs));
}
