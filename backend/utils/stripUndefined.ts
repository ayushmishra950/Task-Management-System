/**
 * exactOptionalPropertyTypes ke saath mongoose create/update ko undefined values
 * pasand nahi aati, isliye payload se undefined keys hata dete hain.
 */
export const stripUndefined = <T extends Record<string, any>>(payload: T): any =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
