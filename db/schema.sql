CREATE TABLE "user" (
  user_id    SERIAL PRIMARY KEY,
  full_name  VARCHAR(120) NOT NULL,
  email      VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'caregiver')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE caregiver_link (
  link_id      SERIAL PRIMARY KEY,
  patient_id   INT NOT NULL REFERENCES "user"(user_id),
  caregiver_id INT REFERENCES "user"(user_id),
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  invite_code  VARCHAR(10) UNIQUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medication (
  medication_id SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES "user"(user_id),
  name          VARCHAR(120) NOT NULL,
  dosage        VARCHAR(60) NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE schedule (
  schedule_id   SERIAL PRIMARY KEY,
  medication_id INT NOT NULL REFERENCES medication(medication_id),
  time_of_day   TIME NOT NULL,
  days_of_week  VARCHAR(20) NOT NULL
);

CREATE TABLE adherence_log (
  log_id      SERIAL PRIMARY KEY,
  schedule_id INT NOT NULL REFERENCES schedule(schedule_id),
  status      VARCHAR(20) NOT NULL CHECK (status IN ('taken', 'skipped', 'snoozed')),
  logged_at   TIMESTAMP DEFAULT NOW()
);
