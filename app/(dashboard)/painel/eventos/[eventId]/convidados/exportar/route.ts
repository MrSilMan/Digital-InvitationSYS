import { errors, guests } from '@/i18n/pt-AO';
import { serverNow } from '@/lib/clock';
import { compareGuestNames, matchesGuestFilters, parseGuestFilters } from '@/lib/guests/filters';
import { logger } from '@/lib/logger';
import { toLuandaDateInput } from '@/lib/luanda-time';
import { REQUEST_ID_HEADER, resolveRequestId } from '@/lib/request-id';
import { tooManyRequestsResponse } from '@/lib/security/too-many-requests';
import { fillTemplate } from '@/lib/template';
import { auditDashboardChange } from '@/server/audit/audit-log';
import { getSessionUser } from '@/server/auth/session';
import { findEditableEvent } from '@/server/events/access';
import { guestsToCsv } from '@/server/guests/export';
import { listGuests } from '@/server/guests/queries';
import { RATE_LIMITS } from '@/server/rate-limit/policies';
import { rateLimit } from '@/server/rate-limit/sliding-window';

/**
 * "Exportar lista (CSV)": the guests the list shows (same filters, from the query string), for
 * the event's couple or an admin (recorded in the audit log). Anyone else gets the same
 * "not found" as a missing event.
 */
export async function GET(
  request: Request,
  context: RouteContext<'/painel/eventos/[eventId]/convidados/exportar'>,
) {
  const { eventId } = await context.params;
  const url = new URL(request.url);
  const user = await getSessionUser();
  if (!user) {
    const login = new URL('/entrar', url);
    login.searchParams.set('voltar', `/painel/eventos/${eventId}/convidados`);
    return Response.redirect(login, 303);
  }
  const event = await findEditableEvent(user, eventId);
  if (!event) {
    return new Response(errors.notFound.title, {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const limit = await rateLimit(RATE_LIMITS.guestExportsPerUser, user.id);
  if (!limit.allowed) {
    return tooManyRequestsResponse(
      limit.retryAfterMs,
      resolveRequestId(request.headers.get(REQUEST_ID_HEADER)),
    );
  }

  const filters = parseGuestFilters(Object.fromEntries(url.searchParams));
  const list = (await listGuests(event))
    .filter((guest) => matchesGuestFilters(guest, filters))
    .sort(compareGuestNames);
  logger.info('Guest list exported', { eventId: event.id, rows: list.length });
  await auditDashboardChange(user, event, 'guest.export', { file: 'list', rows: list.length });

  const fileName = fillTemplate(guests.export.fileName, {
    slug: event.slug,
    date: toLuandaDateInput(serverNow()),
  });
  return new Response(guestsToCsv(list), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
