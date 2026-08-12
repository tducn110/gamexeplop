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

  // Hiệu ứng rung màn hình khi tháp đổ
  if (enableShake && state.sub === "gameOver" && state.crashT < 620) {
    const intensity = (1 - state.crashT / 620) * 9;
    shakeX = (Math.random() - 0.5) * intensity;
    shakeY = (Math.random() - 0.5) * intensity;
  }

  // Khóa / Giữ màn hình ở vị trí gốc kèm hiệu ứng rung
  rootLayer.position.set(shakeX, shakeY);
}
