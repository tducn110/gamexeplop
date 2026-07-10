export function getViewSize(element: HTMLDivElement | null) {
  return {
    width: element?.clientWidth || window.innerWidth,
    height: element?.clientHeight || window.innerHeight,
  };
}
