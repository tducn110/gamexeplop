export function getViewSize(element: HTMLDivElement | null) {
  return {
    width: Math.max(320, element?.clientWidth || 390),
    height: Math.max(520, element?.clientHeight || 720),
  };
}
