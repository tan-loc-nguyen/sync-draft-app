const DEFAULT_DESTINATION = '/document';

/** The page the user was trying to reach, to be handed to Auth0 as appState. */
export const currentReturnTo = (): string =>
  `${window.location.pathname}${window.location.search}`;

/**
 * Decides where to send someone once they are signed in.
 *
 * The value has been round-tripped through Auth0, so it is treated as
 * untrusted: only a rooted, same-origin path is accepted. Anything else —
 * an absolute URL, a protocol-relative one, or a bare relative path — falls
 * back to the document list rather than becoming an open redirect.
 */
export const resolveReturnTo = (
  appState: { returnTo?: string } | undefined,
  fallback: string = DEFAULT_DESTINATION
): string => {
  const target = appState?.returnTo;

  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return fallback;
  }

  return target;
};
