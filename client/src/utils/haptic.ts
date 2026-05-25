const canVibrate = () => typeof navigator !== 'undefined' && 'vibrate' in navigator;

/** Light tap — add, bookmark, checkbox */
export function lightTap() {
  if (canVibrate()) navigator.vibrate(8);
}

/** Medium tap — confirm, save */
export function mediumTap() {
  if (canVibrate()) navigator.vibrate(18);
}

/** Double pulse — remove/delete */
export function removePulse() {
  if (canVibrate()) navigator.vibrate([10, 40, 10]);
}

/** Success pattern — offline saved */
export function successPattern() {
  if (canVibrate()) navigator.vibrate([10, 30, 10, 30, 20]);
}
