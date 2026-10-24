-- SolveEverything — PostgreSQL schema (Phase 0/1)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE, password_hash TEXT,            -- NextAuth: argon2id/bcrypt
  name TEXT, locale TEXT DEFAULT 'fa', theme TEXT DEFAULT 'auto',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','contributor','reviewer','admin')),
  created_at TIMESTAMPTZ DEFAULT now(), last_login_at TIMESTAMPTZ
);
-- Note: CREATE EXTENSION citext; (enable alongside pgcrypto in production)

CREATE TABLE categories (
  id TEXT PRIMARY KEY, parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  name_fa TEXT NOT NULL, name_en TEXT NOT NULL, icon TEXT, sort_order INT DEFAULT 0
);

CREATE TABLE formulas (
  id TEXT PRIMARY KEY,                                -- e.g. trig_triangle_law_of_cosines
  name_fa TEXT NOT NULL, name_en TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  category_path TEXT[] NOT NULL, tags TEXT[] DEFAULT '{}',
  description_fa TEXT, description_en TEXT,
  formula_latex TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',              -- [{name,label_fa,type,unit,required}]
  outputs JSONB NOT NULL DEFAULT '[]',
  compute_js TEXT, compute_python TEXT, steps_generator TEXT,
  plot_spec JSONB DEFAULT '{}', examples JSONB DEFAULT '[]', tests JSONB DEFAULT '[]',
  difficulty TEXT DEFAULT 'basic' CHECK (difficulty IN ('basic','intermediate','advanced')),
  version TEXT NOT NULL DEFAULT '1.0.0', validated BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','review','published','deprecated')),
  created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_formulas_category ON formulas(category_id);
CREATE INDEX idx_formulas_tags ON formulas USING GIN(tags);
CREATE INDEX idx_formulas_search ON formulas USING GIN (to_tsvector('simple', name_fa||' '||name_en||' '||coalesce(description_fa,'')));

CREATE TABLE formula_versions (
  formula_id TEXT REFERENCES formulas(id) ON DELETE CASCADE, version TEXT NOT NULL,
  snapshot JSONB NOT NULL, changelog TEXT, created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (formula_id, version)
);

CREATE TABLE calculations (                            -- تاریخچه محاسبات کاربر (قابل حذف توسط کاربر)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = مهمان (فقط localStorage)
  formula_id TEXT REFERENCES formulas(id),
  inputs JSONB NOT NULL, outputs JSONB NOT NULL, steps JSONB DEFAULT '[]',
  duration_ms INT, source TEXT DEFAULT 'web', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_calc_user_time ON calculations(user_id, created_at DESC);
CREATE INDEX idx_calc_formula ON calculations(formula_id);

CREATE TABLE bookmarks (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, formula_id TEXT REFERENCES formulas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (user_id, formula_id)
);
CREATE TABLE shared_links (
  slug TEXT PRIMARY KEY, formula_id TEXT REFERENCES formulas(id), inputs JSONB NOT NULL,
  created_by UUID REFERENCES users(id), expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE contributions (                           -- پیشنهاد/تصحیح کاربران + داوری
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), formula_id TEXT, kind TEXT CHECK (kind IN ('new','fix','translation')),
  payload JSONB NOT NULL, status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_id UUID REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  formula_id TEXT, correct BOOLEAN, score INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL, plan TEXT DEFAULT 'free', quota_per_day INT DEFAULT 1000, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY, user_id UUID, event TEXT NOT NULL, props JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_events_time ON analytics_events(created_at DESC);
