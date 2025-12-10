CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(11) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar TEXT,
  registered BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2️⃣ ایجاد جدول مخاطبین
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

-- 3️⃣ ایجاد جدول پیام‌ها
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4️⃣ اضافه کردن کاربران تست
INSERT INTO users (phone, name, avatar) VALUES
('09123456789', 'علی احمدی', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali'),
('09387654321', 'سارا محمدی', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara'),
('09121112233', 'رضا کریمی', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Reza'),
('09101234567', 'کاربر فعلی', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Current');

-- 5️⃣ نمایش کاربران ایجاد شده
SELECT * FROM users;
