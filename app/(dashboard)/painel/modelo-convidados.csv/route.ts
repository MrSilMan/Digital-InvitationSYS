import { guests } from '@/i18n/pt-AO';
import { getSessionUser } from '@/server/auth/session';
import { importTemplateCsv } from '@/server/guests/csv';

/** The CSV template for importing guests: the columns and two example rows. Signed-in users. */
export async function GET(request: Request) {
  if (!(await getSessionUser())) {
    return Response.redirect(new URL('/entrar', request.url), 303);
  }
  return new Response(importTemplateCsv(), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${guests.import.templateFileName}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
