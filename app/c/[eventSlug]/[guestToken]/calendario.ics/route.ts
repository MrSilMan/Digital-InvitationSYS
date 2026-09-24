import { buildIcs, calendarEventFor } from '@/features/invitation/calendar';
import { t } from '@/i18n';
import { serverNow } from '@/lib/clock';
import { invitationParamsSchema } from '@/lib/validation/invitation';
import { getInvitation } from '@/server/invitations/queries';

/** "Adicionar ao calendário": the ceremony as an .ics file, only for a valid guest link. */
export async function GET(
  _request: Request,
  context: RouteContext<'/c/[eventSlug]/[guestToken]/calendario.ics'>,
) {
  const parsed = invitationParamsSchema.safeParse(await context.params);
  const data = parsed.success
    ? await getInvitation(parsed.data.eventSlug, parsed.data.guestToken)
    : null;
  if (!data) {
    return new Response(t.invitation.notFound.title, {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  return new Response(buildIcs(calendarEventFor(data.event), serverNow()), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="casamento-${data.event.slug}.ics"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
