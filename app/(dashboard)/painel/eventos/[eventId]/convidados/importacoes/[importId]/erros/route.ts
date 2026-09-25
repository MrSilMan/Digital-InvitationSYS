import { z } from 'zod';

import { errors, guests } from '@/i18n/pt-AO';
import { serverNow } from '@/lib/clock';
import { toLuandaDateInput } from '@/lib/luanda-time';
import { fillTemplate } from '@/lib/template';
import { getSessionUser } from '@/server/auth/session';
import { findEditableEvent } from '@/server/events/access';
import { importErrorsCsv } from '@/server/guests/csv';
import { loadImportProblems } from '@/server/guests/import';

const importIdSchema = z.uuid();

function notFound(): Response {
  return new Response(errors.notFound.title, {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * The rows an import could not take, as CSV (the import's columns, then "linha" and "erro"), to
 * fix and import again. The event's couple or an admin only.
 */
export async function GET(
  request: Request,
  context: RouteContext<'/painel/eventos/[eventId]/convidados/importacoes/[importId]/erros'>,
) {
  const { eventId, importId } = await context.params;
  const user = await getSessionUser();
  if (!user) {
    const login = new URL('/entrar', request.url);
    login.searchParams.set('voltar', `/painel/eventos/${eventId}/convidados`);
    return Response.redirect(login, 303);
  }
  const event = await findEditableEvent(user, eventId);
  const id = importIdSchema.safeParse(importId);
  if (!event || !id.success) return notFound();
  const problems = await loadImportProblems(event, id.data);
  if (!problems) return notFound();

  const fileName = fillTemplate(guests.import.errorsFileName, {
    date: toLuandaDateInput(serverNow()),
  });
  return new Response(importErrorsCsv(problems), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
