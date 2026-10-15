const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export function generateKeyBetween(a, b) {
  if (a == null && b == null) return "a0";
  if (a == null) return before(b);
  if (b == null) return after(a);

  let i = 0;
  const result = [];
  while (true) {
    const ac = a.charCodeAt(i) || DIGITS.charCodeAt(0);
    const bc = i < b.length ? b.charCodeAt(i) : DIGITS.charCodeAt(DIGITS.length - 1) + 1;

    if (ac === bc) {
      result.push(String.fromCharCode(ac));
      i++;
      continue;
    }
    const mid = Math.floor((ac + bc) / 2);
    if (mid > ac) {
      result.push(String.fromCharCode(mid));
      return result.join("");
    }
    result.push(String.fromCharCode(ac));
    i++;
  }
}

function after(key) {
  const lastChar = key[key.length - 1];
  const idx = DIGITS.indexOf(lastChar);
  if (idx < DIGITS.length - 1) {
    return key.slice(0, -1) + DIGITS[idx + 1];
  }
  return key + "a";
}

function before(key) {
  const lastChar = key[key.length - 1];
  const idx = DIGITS.indexOf(lastChar);
  if (idx > 0) {
    return key.slice(0, -1) + DIGITS[idx - 1];
  }
  return key.slice(0, -1) || "a";
}
