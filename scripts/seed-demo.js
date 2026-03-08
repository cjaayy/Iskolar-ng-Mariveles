const path = require("path");
module.paths.unshift(path.join(__dirname, "..", "frontend", "node_modules"));
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function run() {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "scholarship_system",
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS requirement_submissions (
      id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      application_id  INT UNSIGNED  NOT NULL,
      requirement_key VARCHAR(60)   NOT NULL,
      status          ENUM('missing','in_progress','pending','approved','rejected')
                                    NOT NULL DEFAULT 'missing',
      progress        TINYINT       NOT NULL DEFAULT 0,
      file_name       VARCHAR(255)  NULL,
      file_url        VARCHAR(500)  NULL,
      uploaded_at     TIMESTAMP     NULL,
      notes           TEXT          NULL,
      validated_by    INT UNSIGNED  NULL,
      validated_at    TIMESTAMP     NULL,
      validator_notes TEXT          NULL,
      created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_req_sub (application_id, requirement_key),
      CONSTRAINT fk_req_sub_app
        FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log("✓ requirement_submissions table ready");

  try {
    await pool.execute(
      `ALTER TABLE requirement_submissions ADD COLUMN file_url VARCHAR(500) NULL AFTER file_name`,
    );
  } catch {}
  try {
    await pool.execute(
      `ALTER TABLE requirement_submissions ADD COLUMN validated_by INT UNSIGNED NULL AFTER notes`,
    );
  } catch {}
  try {
    await pool.execute(
      `ALTER TABLE requirement_submissions ADD COLUMN validated_at TIMESTAMP NULL AFTER validated_by`,
    );
  } catch {}
  try {
    await pool.execute(
      `ALTER TABLE requirement_submissions ADD COLUMN validator_notes TEXT NULL AFTER validated_at`,
    );
  } catch {}

  const hash = await bcrypt.hash("Demo@1234", 10);
  await pool.execute(
    `INSERT INTO users (id, email, password_hash, full_name, role)
     VALUES (2, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name), role = VALUES(role)`,
    ["demo@iskolar.local", hash, "Juan Dela Cruz", "applicant"],
  );
  console.log("✓ Demo user (demo@iskolar.local / Demo@1234)");

  await pool.execute(`
    INSERT IGNORE INTO applicants
      (id, user_id, date_of_birth, contact_number, address)
    VALUES (1, 2, '2004-06-15', '+63 917 123 4567', NULL)
  `);
  console.log("✓ Applicant profile inserted (id=1)");

  await pool.execute(`
    INSERT IGNORE INTO applications
      (id, applicant_id, status,
       income_at_submission, submitted_at)
    VALUES (1, 1, 'under_review', 15000.00, NOW())
  `);
  console.log("✓ Application inserted (id=1, CHED Study Now Pay Later)");

  await pool.execute(
    "DELETE FROM requirement_submissions WHERE application_id = 1",
  );
  console.log("✓ Requirement submissions cleared — all 8 start as missing");

  const staffHash = await bcrypt.hash("Staff@1234", 10);
  await pool.execute(
    `INSERT INTO users (id, email, password_hash, full_name, role)
     VALUES (3, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name), role = VALUES(role)`,
    ["staff@iskolar.local", staffHash, "Staff Validator", "validator"],
  );
  console.log("✓ Staff user (staff@iskolar.local / Staff@1234)");

  await pool.end();
  console.log("\nDemo data seeded successfully!");
  console.log("  Applicant → demo@iskolar.local / Demo@1234 (Applicant ID: 1)");
  console.log("  Staff     → staff@iskolar.local / Staff@1234 (Validator)");
}

run().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
