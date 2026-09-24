import type { InvitationLocation } from './types';

/** wa.me link that opens a chat with `phone` (E.164, e.g. +244923456789) and a pre-filled message. */
export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

type Place = Pick<
  InvitationLocation,
  'mapsUrl' | 'latitude' | 'longitude' | 'venueName' | 'address'
>;

const hasCoordinates = (place: Place): place is Place & { latitude: number; longitude: number } =>
  place.latitude !== null && place.longitude !== null;

/** The couple's Google Maps link, or a search for the coordinates / the address. */
export function googleMapsUrl(place: Place): string {
  if (place.mapsUrl) return place.mapsUrl;
  const query = hasCoordinates(place)
    ? `${place.latitude},${place.longitude}`
    : [place.venueName, place.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Waze needs coordinates; null without them. */
export function wazeUrl(place: Place): string | null {
  if (!hasCoordinates(place)) return null;
  return `https://waze.com/ul?ll=${place.latitude},${place.longitude}&navigate=yes`;
}
