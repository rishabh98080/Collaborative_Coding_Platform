# 1) Create config file
mkdir -p frontend/src/lib
cat > frontend/src/lib/config.ts <<'EOF'
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const WS_ENDPOINT = `${API_BASE_URL}/ws`;
EOF

# 2) Replace hardcoded localhost URLs in frontend files
sed -i "s|http://localhost:8080/api/auth/register|\${API_BASE_URL}/api/auth/register|g" frontend/src/components/AuthModal.tsx
sed -i "s|http://localhost:8080/api/auth/login|\${API_BASE_URL}/api/auth/login|g" frontend/src/components/AuthModal.tsx

sed -i "s|http://localhost:8080/api/room/\${roomId}|\${API_BASE_URL}/api/room/\${roomId}|g" frontend/src/app/[roomId]/page.tsx
sed -i "s|http://localhost:8080/ws|\${WS_ENDPOINT}|g" frontend/src/app/[roomId]/page.tsx
sed -i "s|http://localhost:8080/api/execute|\${API_BASE_URL}/api/execute|g" frontend/src/app/[roomId]/page.tsx
sed -i "s|http://localhost:8080/api/auth/logout|\${API_BASE_URL}/api/auth/logout|g" frontend/src/app/[roomId]/page.tsx
sed -i "s|http://localhost:8080/api/sessions/last|\${API_BASE_URL}/api/sessions/last|g" frontend/src/app/[roomId]/page.tsx

sed -i "s|http://localhost:8080/ws|\${WS_ENDPOINT}|g" frontend/src/components/CodeEditor.tsx

# 3) Add imports where needed (manual safe append)
grep -q "from '@/lib/config'" frontend/src/components/AuthModal.tsx || \
  sed -i "1 a import { API_BASE_URL } from '@/lib/config';" frontend/src/components/AuthModal.tsx

grep -q "from '@/lib/config'" frontend/src/components/CodeEditor.tsx || \
  sed -i "5 a import { WS_ENDPOINT } from '@/lib/config';" frontend/src/components/CodeEditor.tsx

grep -q "from '@/lib/config'" frontend/src/app/[roomId]/page.tsx || \
  sed -i "1 a import { API_BASE_URL, WS_ENDPOINT } from '@/lib/config';" frontend/src/app/[roomId]/page.tsx

# 4) Env files
cat > frontend/.env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
EOF

cat > frontend/.env.production <<'EOF'
NEXT_PUBLIC_API_BASE_URL=https://collaborative-coding-platform-f9sx.onrender.com
EOF

# 5) Patch backend websocket allowed origins
python3 - <<'PY'
from pathlib import Path
p=Path("backend/src/main/java/com/antigravity/collaborativecoding/config/WebSocketConfig.java")
s=p.read_text()
s=s.replace('.setAllowedOriginPatterns("http://localhost:3000")',
            '.setAllowedOriginPatterns("http://localhost:3000", "http://localhost:5173", "https://collaborative-coding-platform-topaz.vercel.app")')
p.write_text(s)
print("Patched WebSocketConfig.java")
PY

# 6) Commit
git checkout -b fix/https-sockjs-api-endpoints
git add frontend/src/lib/config.ts frontend/src/components/AuthModal.tsx frontend/src/components/CodeEditor.tsx frontend/src/app/[roomId]/page.tsx frontend/.env.local frontend/.env.production backend/src/main/java/com/antigravity/collaborativecoding/config/WebSocketConfig.java
git commit -m "Fix mixed-content errors by using env-based API/WS URLs and production-safe SockJS endpoint"
echo "Done. Push with: git push -u origin fix/https-sockjs-api-endpoints"