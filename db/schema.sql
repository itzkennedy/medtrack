CREATE TABLE USER (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient', 'caregiver') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CAREGIVER_LINK (
  link_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  caregiver_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'revoked') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES USER(user_id),
  FOREIGN KEY (caregiver_id) REFERENCES USER(user_id)
);

CREATE TABLE MEDICATION (
  medication_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  dosage VARCHAR(60) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES USER(user_id)
);

CREATE TABLE SCHEDULE (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  medication_id INT NOT NULL,
  time_of_day TIME NOT NULL,
  days_of_week VARCHAR(20) NOT NULL,
  FOREIGN KEY (medication_id) REFERENCES MEDICATION(medication_id)
);

CREATE TABLE ADHERENCE_LOG (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  status ENUM('taken', 'skipped', 'snoozed') NOT NULL,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES SCHEDULE(schedule_id)
);
