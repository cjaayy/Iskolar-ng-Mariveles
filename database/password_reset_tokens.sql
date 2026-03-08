CREATE TABLE password_reset_tokens (
  id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     INT           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token       VARCHAR(64)   NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ   NOT NULL,
  used        BOOLEAN       NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_token ON password_reset_tokens (token);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all access to password_reset_tokens"
  ON public.password_reset_tokens FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
