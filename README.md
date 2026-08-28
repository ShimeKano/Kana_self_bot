# 1. Tạo thư mục & copy tất cả file trên
cd Kana_self_bot

# 2. Cài dependencies
npm install

# 3. Copy .env.example thành .env & điền token
cp .env.example .env
# Mở .env, điền DISCORD_TOKEN & CHANNEL_ID

# 4. Chạy
npm start

# Hoặc chạy chế độ dev (tự restart khi sửa code)
npm run dev

# Kiểm tra cấu trúc
npm test
