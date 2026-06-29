# Design System — Bộ Lạc Đậu Phộng (mini-game)

Phân tích từ 5 screenshot landing page bolacdauphong.vn (giới thiệu, nhân vật, liên hệ) để rút ra design language áp dụng cho phiên bản mini-game web.

---

## 1. Tổng quan thẩm mỹ

| Khía cạnh | Mô tả |
| --- | --- |
| Mood | Hoài niệm tuổi thơ, làng quê Việt Nam, ấm áp, hand-drawn |
| Style | Sketch bút chì + watercolor wash, kết hợp nhân vật 3D rendered |
| Personality | Vui tươi, dễ thương, chân thật, gần gũi |
| Inspiration | Tranh dân gian Đông Hồ + minh hoạ sách thiếu nhi |

---

## 2. Color tokens

| Token | Hex | Vai trò |
| --- | --- | --- |
| `--rice-paper` | `#f5ecd7` | Background chủ đạo (giấy dó) |
| `--paper-warm` | `#efe3c4` | Background section thứ 2, footer |
| `--ink-dark` | `#2a2418` | Text chính, viền nét |
| `--mascot-yellow` | `#f0b840` | Vàng mascot Lạc Lạc, logo bubble |
| `--orange-cta` | `#e87432` | CTA chính, dấu nhấn, link active |
| `--orange-cta-edge` | `#b85a22` | Border CTA |
| `--bamboo-green` | `#6b8e3d` | Lá tre, accent |
| `--leaf-deep` | `#4c6630` | Cỏ phía trước, gradient bottom |
| `--bamboo-soft` | `#c8d68a` | Cỏ nhạt, hill nền |
| `--earth-brown` | `#8e4e22` | Đất, viền secondary |
| `--pencil-gray` | `#8a7d65` | Đường sketch, viền input, text phụ |
| `--cream-card` | `#fdf6ea` | Background card, popover |
| `--alert-red` | `#c23838` | Hearts/lives, destructive |

**Rule:** không bao giờ dùng pure black `#000` cho text — luôn dùng `#2a2418` (ink-dark) để giữ tone giấy ấm.

---

## 3. Typography

- **Font family:** `Be Vietnam Pro` (sans-serif, hỗ trợ dấu tiếng Việt đầy đủ)
- **Weights:** 400 (body), 600 (label), 700 (strong), 800 (display)
- **Display tagline:** scale `clamp(40px, 7vw, 84px)`, weight 800, line-height 1.05, color ink-dark, dùng `text-shadow: 0 2px 0 rgba(255,255,255,0.6)` để nổi trên backdrop sketch.
- **Section heading:** `clamp(28px, 4vw, 44px)`, weight 800, căn giữa
- **Body:** 15–17px, weight 400–500, line-height 1.65, color `#4a4232`
- **Caption / overline:** 11–12px, weight 700, letter-spacing 1–1.5px, UPPERCASE, color theo accent của section

> Logo chính của bolacdauphong.vn dùng kiểu chữ marker hand-drawn. Trong mini-game ta thay bằng **logo bubble**: chữ "L" trắng trên hình tròn radial gradient vàng `#f8c860 → #d99820`, viền `#2a2418` 2px. Đây là dấu hiệu nhận diện gọn và scale tốt.

---

## 4. Layout & spacing

- **Container:** `max-width: 1100px`, `padding: 0 24px` (mobile) / `0 32px` (desktop)
- **Section padding dọc:** `80–100px`
- **Grid gutter:** 16–24px (card grid), 32–40px (footer columns)
- **Radius scale:**
  - Pill button / chip / nav dot label: `999px`
  - Card / modal: `20–24px`
  - Input / small chip: `12–14px`
- **Shadow:**
  - Card thường: `0 8px 24px rgba(42,36,24,0.06)`
  - Card nổi: `0 14px 40px rgba(42,36,24,0.18)`
  - CTA cam: `0 10px 24px rgba(232,116,50,0.4)`

---

## 5. Components

### 5.1 Top navigation
- Fixed, height ~64px, background `rgba(245,236,215,0.85)` + `backdrop-filter: blur(10px)`
- Trái: logo bubble + tên brand
- Giữa: dotted-progress nav (5 chấm 8px, gap 10–12px, label hiện ở desktop, nhãn ẩn ở mobile)
- Phải: nút mute (icon-only outline), pill VIE, CTA "Đăng nhập"
- Border-bottom: `1px solid rgba(138,125,101,0.18)`

### 5.2 CTA orange (primary button)
- Gradient `linear-gradient(180deg, #f08a48 0%, #e87432 100%)`
- Border `3px solid #b85a22` (lớn) hoặc `2px solid` (nhỏ)
- Border-radius `999px`, padding `16–18px 36px`, text trắng weight 800, shadow cam mềm.
- Hover: tăng `box-shadow` blur, không đổi gradient.

### 5.3 Ghost / secondary button
- Background `rgba(255,255,255,0.85)`, border `2px solid #8a7d65`, text ink-dark weight 700.
- Dùng cho action phụ ("Gặp Bộ Lạc", "Thoát").

### 5.4 Card
- Background `rgba(255,255,255,0.85)` hoặc `#fdf6ea`
- Border `1.5px solid rgba(138,125,101,0.3)` (đôi khi `1.5px dashed` để bắt cảm giác sketch)
- Radius 20, padding 24

### 5.5 Pixel / vector mascot
- Khi screenshot có nhân vật 3D, trong mini-game ta **vẽ lại bằng Pixi/SVG** (procedural). Không embed PNG đã có.
- Mascot peanut: hình ovan đôi (đầu nhỏ + thân lớn) màu vàng `#f0b840`, vân ngang nâu `#8e4e22`, mặt cười kiểu dấu chấm.
- Mascot mèo: hình tròn cam `#e87432` + tai tam giác + ria, sọc nâu nhạt.
- Khi render trong card, đặt trên gradient nền cỏ `#c8d68a → #6b8e3d`.

### 5.6 Carousel nhân vật
- Layout `[← btn] [card lớn] [→ btn]`
- Card chia 2 cột: ảnh (vẽ Pixi) bên trái + meta bên phải (role pill, tên display, mô tả, dots indicator, "01 / NN")
- Mobile: stack dọc, 2 nút điều hướng ở dưới

### 5.7 Dashboard
- 4 stat cards trên (Best / Last / Total / Rank) — mỗi card có icon màu accent + label uppercase + giá trị 32px weight 800
- Grid dưới `1.3fr 1fr`: bảng vinh danh (left) + lịch sử cá nhân (right)
- Top 3 trong leaderboard: badge số tròn màu vàng/bạc/đồng (`#f0b840`, `#d0c4a0`, `#d99258`)
- Empty state: italic text màu pencil-gray, padding 30px center

### 5.8 Footer
- Background gradient `#efe3c4 → #e6d8b2`, border-top `1px dashed`
- 3 cột: brand + email pill cam dashed / Điều hướng / Tải app (badges App Store + Google Play đen với icon vàng)
- Copyright row 12px pencil-gray dưới cùng

### 5.9 Login modal
- Backdrop `rgba(42,36,24,0.55)`, fadeIn 0.2s
- Card 420px, background `#fdf6ea`, radius 24, padding 32, logo bubble ở top, fields có icon trái, footer toggle login/signup
- CTA cam pill full-width

---

## 6. Backdrop sketch (hero)

Vẽ bằng SVG, không dùng ảnh raster.

Các layer từ xa → gần:
1. Bầu trời `#f5ecd7` (paper)
2. Núi mờ phía xa: path bezier mềm, fill `#e6d8b2` alpha 0.6, stroke pencil-gray 1px alpha 0.3
3. Cánh đồng giữa: bezier wave, fill `#c8d68a` alpha 0.5
4. Đường viền lúa: stroke ngắn pencil 1px lặp ngẫu nhiên
5. Khóm tre / dừa: stroke `#6b8e3d` width 1.2, alpha 0.45, 12–14 cây rải dọc
6. Đàn cò bay: 3–5 chữ V nhỏ stroke pencil-gray
7. Cỏ phía trước: gradient `#c8d68a → #4c6630`
8. Diều bay: stroke vàng + dây mảnh

Tất cả nét đều có cảm giác **hand-drawn** — `strokeLinecap: round`, độ dày 1–1.5px, alpha 0.4–0.6.

---

## 7. Game canvas (Pixi.js)

- Background trong canvas dùng cùng palette countryside (paper + hills + bamboo)
- HUD trong canvas:
  - "Điểm: NN" 20px weight 700 ink-dark, top-left padding 16/20
  - "Combo ×N (×mult)" 22px weight 700 cam, dưới score
  - "♥♥♥" 24px weight 700 đỏ alert, top-right
- Slice trail: 2 lớp stroke — lớp ngoài trắng width 6 alpha .9, lớp trong cam width 2 alpha 1, fade theo age ≤ 220ms
- Splatter: 18 mảnh tròn màu juice của loại quả, gravity 0.4×, life 0.6–0.9s
- Half pieces: 2 mảnh đơn giản với vận tốc perpendicular tới hướng slice, rotate, fade trong 1.4s

---

## 8. Animation & motion

- Scroll smooth toàn trang
- Section indicator slide khi active (chấm 8px → label hiện màu cam)
- Card hover: nâng nhẹ shadow, không transform để tránh layout shift
- Modal: fadeIn 0.2s
- Game: 60fps Pixi ticker, gravity 900 px/s², spawn interval `max(550, 1200 - score × 6)` ms

---

## 9. Accessibility

- Tất cả button có `aria-label` khi chỉ có icon (mute, nav)
- Modal `role="dialog" aria-modal="true"`
- Contrast: ink-dark `#2a2418` trên paper `#f5ecd7` đạt > 12:1 (AAA)
- Reduced motion: tôn trọng `prefers-reduced-motion` (giảm animation idle của mascot, tắt shake)
- Touch target ≥ 44×44px cho nav dots và CTA mobile

---

## 10. Asset policy

- **Không embed ảnh raster** từ `/src/imports/*.png` (đó chỉ là tài liệu tham khảo)
- Mọi nhân vật, backdrop, icon trong game **vẽ bằng SVG hoặc Pixi Graphics**
- Icon UI nhỏ (volume, login, chevron) dùng `lucide-react`
