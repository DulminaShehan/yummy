import os
import numpy as np
from PIL import Image, ImageFilter
from collections import deque
import base64

src = r'C:\Users\LOQ\.gemini\antigravity\brain\3fd5e13d-b59e-4363-b2a1-e4c84ffb34c7\.user_uploaded\media_1795697194399_adb161a5.jpg'
im = Image.open(src).convert('RGB')
w, h = im.size
arr = np.array(im)

# 1. Detect outer white corners using BFS from corners
is_outside = np.zeros((h, w), dtype=bool)
is_white = (arr[:, :, 0] > 230) & (arr[:, :, 1] > 230) & (arr[:, :, 2] > 230)

q = deque([(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)])
visited = np.zeros((h, w), dtype=bool)
for x, y in q:
    visited[y, x] = True

while q:
    x, y = q.popleft()
    is_outside[y, x] = True
    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx]:
            visited[ny, nx] = True
            if is_white[ny, nx]:
                q.append((nx, ny))

alpha = ((~is_outside) * 255).astype(np.uint8)
alpha_img = Image.fromarray(alpha, mode='L')
alpha_smooth = alpha_img.filter(ImageFilter.GaussianBlur(0.8))

rgba_icon = Image.new('RGBA', (w, h))
rgba_icon.paste(im, (0, 0))
rgba_icon.putalpha(alpha_smooth)

# 2. Adaptive Foreground (scaled to ~68% safe zone inside 1024x1024)
fg_canvas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
fg_size = 700
resized_for_fg = rgba_icon.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
fg_canvas.paste(resized_for_fg, ((1024 - fg_size) // 2, (1024 - fg_size) // 2), resized_for_fg)

# 3. Save Flutter App Assets
app_asset_dir = r'D:\BuyLanka\assets\images'
for fname in ['yummy_icon.png', 'yummy_logo.png', 'buylanka_icon.png', 'buylanka_logo.png']:
    rgba_icon.save(os.path.join(app_asset_dir, fname), 'PNG')

for fname in ['yummy_icon_foreground.png', 'buylanka_icon_foreground.png']:
    fg_canvas.save(os.path.join(app_asset_dir, fname), 'PNG')

print('Flutter app assets saved.')

# 4. Save Android mipmaps & drawables
res_dir = r'D:\BuyLanka\android\app\src\main\res'
mipmap_sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}
for folder, sz in mipmap_sizes.items():
    p = os.path.join(res_dir, folder, 'ic_launcher.png')
    resized = rgba_icon.resize((sz, sz), Image.Resampling.LANCZOS)
    resized.save(p, 'PNG')

fg_sizes = {
    'drawable-mdpi': 108,
    'drawable-hdpi': 162,
    'drawable-xhdpi': 216,
    'drawable-xxhdpi': 324,
    'drawable-xxxhdpi': 432,
}
for folder, sz in fg_sizes.items():
    p = os.path.join(res_dir, folder, 'ic_launcher_foreground.png')
    resized = fg_canvas.resize((sz, sz), Image.Resampling.LANCZOS)
    resized.save(p, 'PNG')

print('Android res icons saved.')

# 5. Save Web icons
web_dir = r'D:\BuyLanka\web'
rgba_icon.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(web_dir, 'favicon.png'), 'PNG')
for sz in [192, 512]:
    resized = rgba_icon.resize((sz, sz), Image.Resampling.LANCZOS)
    resized.save(os.path.join(web_dir, 'icons', f'Icon-{sz}.png'), 'PNG')
    resized.save(os.path.join(web_dir, 'icons', f'Icon-maskable-{sz}.png'), 'PNG')

for scale, sz in [(1, 192), (2, 384), (3, 512), (4, 768)]:
    resized = rgba_icon.resize((sz, sz), Image.Resampling.LANCZOS)
    for theme in ['light', 'dark']:
        resized.save(os.path.join(web_dir, 'splash', 'img', f'{theme}-{scale}x.png'), 'PNG')

print('Web icons saved.')

# 6. Save Admin Dashboard icons
admin_public = r'D:\BuyLanka\admin\public'
admin_src = r'D:\BuyLanka\admin\src\assets'
os.makedirs(admin_src, exist_ok=True)

rgba_icon.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(admin_public, 'favicon.png'), 'PNG')
rgba_icon.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(admin_public, 'yummy_logo.png'), 'PNG')
rgba_icon.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(admin_src, 'yummy_logo.png'), 'PNG')

with open(os.path.join(admin_public, 'favicon.png'), 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="64" height="64" />
</svg>'''

with open(os.path.join(admin_public, 'favicon.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('Admin icons saved successfully!')
