/** The API's rule (Postman `07 Save Onboarding Step — Nickname`): 3–20 characters, starts with a letter, then letters, digits, `_` or `.`. */
const NICKNAME = /^[A-Za-z][A-Za-z0-9_.]{2,19}$/;

export const NICKNAME_MAX_LENGTH = 20;

/** Whether a (trimmed) nickname meets the API's rule before it is checked for availability. */
export const isValidNickname = (name: string) => NICKNAME.test(name);
