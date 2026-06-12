export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDateDDMMYYYY(date: Date): string {
  return `${pad2(date.getUTCDate())}-${pad2(date.getUTCMonth() + 1)}-${date.getUTCFullYear()}`;
}

export function uppercaseOfficial(value: string): string {
  return value
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getBirthPlace(regencyName: string): string {
  let value = regencyName.trim();
  if (value.toUpperCase().startsWith("KABUPATEN ")) {
    value = value.slice("KABUPATEN ".length);
  } else if (value.toUpperCase().startsWith("KOTA ")) {
    value = value.slice("KOTA ".length);
  }
  return uppercaseOfficial(value);
}

export function joinRtRw(rt: string, rw: string): string {
  return `${pad(Number(rt) || 0)}/${pad(Number(rw) || 0)}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatBirthDatePlace(
  birthPlace: string,
  birthDate: Date,
): string {
  return `${getBirthPlace(birthPlace)}, ${formatDateDDMMYYYY(birthDate)}`;
}

export function fieldLabel(label: string): string {
  return label.toUpperCase();
}
