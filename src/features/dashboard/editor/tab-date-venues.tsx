'use client';

import { IconMapPin, IconPlus } from '@tabler/icons-react';
import { useState, useTransition } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { buttonClasses, cardClasses } from '@/components/dashboard/styles';
import { editor, invitationDefaults } from '@/i18n/pt-AO';
import { fillTemplate } from '@/lib/template';
import { isGoogleMapsUrl, isShortMapsUrl, parseMapsCoordinates } from '@/lib/maps-link';
import { EDITOR_LIMITS, type EventEditorValues } from '@/lib/validation/event-editor';

import { resolveMapsLink } from './actions';
import { FieldGroup, ListItemControls, TextField, useFieldError } from './fields';

const t = editor.dateVenues;

type Lookup =
  { state: 'idle' } | { state: 'found' | 'missing' } | { state: 'error'; message: string };

/** The Google Maps link of a venue, and the coordinates read from it. */
function MapsLink({ index }: { index: number }) {
  const { getValues, setValue, control } = useFormContext<EventEditorValues>();
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' });
  const [pending, startTransition] = useTransition();
  const latitude = useWatch({ control, name: `venues.${index}.latitude` });
  const longitude = useWatch({ control, name: `venues.${index}.longitude` });

  const setCoordinates = (lat: number, lng: number) => {
    const options = { shouldDirty: true, shouldValidate: true };
    setValue(`venues.${index}.latitude`, String(lat), options);
    setValue(`venues.${index}.longitude`, String(lng), options);
  };

  const read = () => {
    const link = getValues(`venues.${index}.mapsUrl`).trim();
    if (!link) return;
    const local = parseMapsCoordinates(link);
    if (local) {
      setCoordinates(local.latitude, local.longitude);
      setLookup({ state: 'found' });
      return;
    }
    if (!isShortMapsUrl(link)) {
      setLookup(
        isGoogleMapsUrl(link)
          ? { state: 'missing' }
          : { state: 'error', message: editor.mapsLink.errors.invalid },
      );
      return;
    }
    startTransition(async () => {
      const result = await resolveMapsLink(link);
      if (!result.ok) {
        const message =
          result.error === 'rate-limited'
            ? editor.mapsLink.errors.rateLimited
            : result.error === 'invalid'
              ? editor.mapsLink.errors.invalid
              : editor.mapsLink.errors.unavailable;
        setLookup({ state: 'error', message });
      } else if (result.latitude === null) {
        setLookup({ state: 'missing' });
      } else {
        setCoordinates(result.latitude, result.longitude);
        setLookup({ state: 'found' });
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <TextField
          name={`venues.${index}.mapsUrl`}
          label={t.mapsUrl}
          hint={t.mapsUrlHint}
          type="url"
          inputMode="url"
          maxLength={EDITOR_LIMITS.url}
          className="flex-1"
          onBlur={() => {
            if (!getValues(`venues.${index}.latitude`)) read();
          }}
        />
        <button
          type="button"
          onClick={read}
          disabled={pending}
          className={buttonClasses('secondary', 'md', 'shrink-0')}
        >
          <IconMapPin size={18} stroke={1.75} aria-hidden="true" />
          {pending ? t.readingCoordinates : t.readCoordinates}
        </button>
      </div>
      <p className="font-sans text-sm text-stone-600" aria-live="polite">
        {lookup.state === 'error'
          ? lookup.message
          : lookup.state === 'missing'
            ? t.coordinatesMissing
            : latitude && longitude
              ? fillTemplate(t.coordinatesFound, { lat: latitude, lng: longitude })
              : null}
      </p>
      <details className="font-sans text-sm">
        <summary className="cursor-pointer text-stone-600">
          {t.latitude} / {t.longitude}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextField
            name={`venues.${index}.latitude`}
            label={t.latitude}
            inputMode="decimal"
            hint={t.coordinatesHint}
          />
          <TextField name={`venues.${index}.longitude`} label={t.longitude} inputMode="decimal" />
        </div>
      </details>
    </div>
  );
}

export function DateVenuesTab() {
  const { control, getValues } = useFormContext<EventEditorValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'venues' });
  const listError = useFieldError('venues');

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="date" label={t.date} type="date" />
        <TextField name="startTime" label={t.startTime} type="time" />
        <TextField name="endTime" label={t.endTime} type="time" hint={t.endTimeHint} />
      </div>

      <FieldGroup legend={t.venues} hint={t.venuesHint}>
        {fields.map((field, index) => {
          const label = fillTemplate(t.venue, { n: String(index + 1) });
          return (
            <section
              key={field.id}
              aria-label={label}
              className={`${cardClasses} flex flex-col gap-4 p-4`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-sans text-sm font-semibold text-stone-700">{label}</h3>
                <ListItemControls
                  index={index}
                  count={fields.length}
                  label={label}
                  onMove={move}
                  onRemove={() => remove(index)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
                <TextField
                  name={`venues.${index}.heading`}
                  label={t.heading}
                  placeholder={t.headingPlaceholder}
                  maxLength={EDITOR_LIMITS.venueHeading}
                />
                <TextField
                  name={`venues.${index}.venueName`}
                  label={t.venueName}
                  maxLength={EDITOR_LIMITS.venueName}
                />
                <TextField name={`venues.${index}.time`} label={t.time} type="time" />
              </div>
              <TextField
                name={`venues.${index}.description`}
                label={t.description}
                hint={t.descriptionHint}
                placeholder={invitationDefaults.locationDescription
                  .replace('{venue}', '{local}')
                  .replace('{time}', '{hora}')}
                maxLength={EDITOR_LIMITS.venueDescription}
              />
              <TextField
                name={`venues.${index}.address`}
                label={t.address}
                maxLength={EDITOR_LIMITS.address}
              />
              <MapsLink index={index} />
            </section>
          );
        })}
        {listError ? <p className="font-sans text-sm text-red-700">{listError}</p> : null}
        {fields.length < EDITOR_LIMITS.venues ? (
          <button
            type="button"
            onClick={() =>
              append({
                heading: '',
                venueName: '',
                time: getValues('startTime') || '16:00',
                description: '',
                address: '',
                mapsUrl: '',
                latitude: '',
                longitude: '',
              })
            }
            className={buttonClasses('secondary', 'md', 'self-start')}
          >
            <IconPlus size={18} stroke={1.75} aria-hidden="true" />
            {t.add}
          </button>
        ) : (
          <p className="font-sans text-sm text-stone-600">
            {fillTemplate(editor.list.limit, { max: String(EDITOR_LIMITS.venues) })}
          </p>
        )}
      </FieldGroup>
    </div>
  );
}
