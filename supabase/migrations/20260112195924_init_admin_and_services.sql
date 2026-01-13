CREATE TABLE admin_lock (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  admin_email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- enforce single row
INSERT INTO admin_lock (id, admin_email)
VALUES (TRUE, 'unreachedip101@gmail.com');


CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,

  type TEXT CHECK (type IN ('single', 'combo')) NOT NULL,

  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,

  description TEXT NOT NULL,

  duration_minutes INTEGER[] NOT NULL,

  benefits TEXT[] NOT NULL,

  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),

  currency TEXT DEFAULT 'INR',

  badge TEXT CHECK (badge IN ('POPULAR', 'BEST_VALUE')),

  included_services TEXT[],

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW()
);

