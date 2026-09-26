/** Results of the admin area's Server Actions (plain data: they cross to the browser). */

export type AdminErrorCode =
  | 'invalid'
  | 'unauthenticated'
  | 'not-found'
  | 'rate-limited'
  | 'unavailable'
  | 'email-taken'
  | 'slug-taken'
  | 'limit-below-guests'
  | 'own-account'
  | 'last-admin'
  | 'owner-invalid'
  /** The typed confirmation of a deletion does not match. */
  | 'confirmation';

export interface AdminFieldIssue {
  /** Dotted form path, e.g. "owner.email". */
  path: string;
  message: string;
}

export interface AdminActionError {
  ok: false;
  error: AdminErrorCode;
  issues?: AdminFieldIssue[];
  /** 'slug-taken': a free address to offer instead. */
  suggestion?: string;
  /** 'limit-below-guests': the event's current number of guests. */
  count?: number;
}

export type AdminActionResult<T extends object = object> = ({ ok: true } & T) | AdminActionError;

/** A temporary password, shown to the admin once to pass on to the couple. */
export interface TemporaryCredentials {
  email: string;
  password: string;
}
