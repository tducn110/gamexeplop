export function normalizePointer(event: PointerEvent, rect: DOMRect) {
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}
