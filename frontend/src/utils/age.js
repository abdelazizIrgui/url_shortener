// Computes whole-years age from a "YYYY-MM-DD" birth date string.
export function calcAge(birthDateStr) {
  if (!birthDateStr) return null;
  const dob = new Date(birthDateStr);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// Valid date-of-birth range for <input type="date">: no younger than 13,
// no older than 120 — the calendar itself blocks out-of-range picks instead
// of relying on the person to type a sane age.
const today = new Date();
export const MAX_BIRTH_DATE = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
  .toISOString().slice(0, 10);
export const MIN_BIRTH_DATE = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
  .toISOString().slice(0, 10);
