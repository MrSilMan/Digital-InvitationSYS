import { notFound } from 'next/navigation';

/** /c/<slug> without a guest token: the same "Convite não encontrado" page as a bad link. */
export default function EventWithoutGuestPage(): never {
  notFound();
}
