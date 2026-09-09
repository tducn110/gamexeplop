import { Container } from "pixi.js";
import type { GameState } from "../../core/types";

/**
 * Camera & Screen Lock System
 * 
 * Hiện tại, hệ thống "camera" trong game được xử lý qua 2 lớp:
 * 
 * 1. Lớp Logic (Scroll Offset): 
 *    - Việc cuộn màn hình khi tháp cao lên KHÔNG di chuyển Container.
 *    - Thay vào đó, nó thay đổi `state.scroll`.
 *    - Hàm `getBlockY` ở `logic/rules.ts` tính toán vị trí Y thực tế của từng block dựa trên `state.scroll`.
 *    - Điều này giúp "khóa" các block ở vị trí tương đối trên màn hình.
 * 
 * 2. Lớp Render (Screen Shake / Transform):
 *    - Sử dụng hàm `applyCameraTransform` bên dưới để dịch chuyển toàn bộ Root Container.
 *    - Chức năng chính là tạo hiệu ứng rung lắc (Screen Shake) khi Game Over.
 */
let impactShake = {
  intensity: 0,
  durationMs: 0,
  startTime: 0,
};

/**
 * Kích hoạt rung toàn màn hình (root layer) khi khối rơm đáp xuống và tháp đẩy lên
 */
export function triggerPlacementCameraShake(intensity = 5, durationMs = 180) {
  impactShake = {
    intensity,
    durationMs,
    startTime: performance.now(),
  };
}

export function resetCameraShake() {
  impactShake = { intensity: 0, durationMs: 0, startTime: 0 };
}

export function applyCameraTransform(
  rootLayer: Container,
  state: GameState,
  options?: {
    enableShake?: boolean;
  }
) {
  const { enableShake = true } = options || {};

  let shakeX = 0;
  let shakeY = 0;

  // 1. Hiệu ứng rung phản hồi lực khi đặt khối rơm (Placement Impact & Camera Rise)
  const now = performance.now();
  const elapsed = now - impactShake.startTime;
  if (enableShake && elapsed < impactShake.durationMs) {
    const progress = elapsed / impactShake.durationMs;
    // Exponential decay: dập tắt dao động tự nhiên
    const decay = Math.exp(-progress * 3.5) * (1 - progress);
    const currentIntensity = impactShake.intensity * decay;
    // Rung ngang ngẫu nhiên + dập dọc theo quán tính khối rơm
    shakeX = (Math.random() - 0.5) * currentIntensity * 1.2;
    shakeY = (Math.random() - 0.5) * currentIntensity * 0.8 + Math.sin(progress * Math.PI) * (currentIntensity * 0.35);
  }

  // 2. Hiệu ứng rung lắc mạnh khi sập tháp (Game Over Crash)
  if (enableShake && state.sub === "gameOver" && state.crashT < 620) {
    const intensity = (1 - state.crashT / 620) * 12;
    shakeX = (Math.random() - 0.5) * intensity;
    shakeY = (Math.random() - 0.5) * intensity;
  }

  // Dịch chuyển toàn bộ Root Container (màn hình, nền, khối rơm, hiệu ứng)
  rootLayer.position.set(shakeX, shakeY);
}
