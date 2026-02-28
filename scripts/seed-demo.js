/**
 * scripts/seed-demo.js
 * Run once to populate demo applicant data:
 *   node scripts/seed-demo.js
 */
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function run() {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "scholarship_system",
  });

  // 1. requirement_submissions table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS requirement_submissions (
      id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      application_id  INT UNSIGNED  NOT NULL,
      requirement_key VARCHAR(60)   NOT NULL,
      status          ENUM('missing','in_progress','pending','approved','rejected')
                                    NOT NULL DEFAULT 'missing',
      progress        TINYINT       NOT NULL DEFAULT 0,
      file_name       VARCHAR(255)  NULL,
      uploaded_at     TIMESTAMP     NULL,
      notes           TEXT          NULL,
      created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_req_sub (application_id, requirement_key),
      CONSTRAINT fk_req_sub_app
        FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log("✓ requirement_submissions table ready");

  // 2. Demo user
  const hash = await bcrypt.hash("Demo@1234", 10);
  await pool.execute(
    "INSERT IGNORE INTO users (id, email, password_hash, full_name, role) VALUES (2, ?, ?, ?, ?)",
    ["demo@iskolar.local", hash, "Juan Dela Cruz", "applicant"],
  );
  console.log("✓ Demo user (demo@iskolar.local / Demo@1234)");

  // 3. Applicant profile
  await pool.execute(`
    INSERT IGNORE INTO applicants
      (id, user_id, student_number, date_of_birth, contact_number, address,
       gpa, year_level, course, college, monthly_income, household_size)
    VALUES (1, 2, '2026-DEMO-001', '2004-06-15', '+63 917 123 4567', NULL,
            1.82, 3, 'Bachelor of Science in Information Technology',
            'Mariveles National High School - College Dept.', 15000.00, 4)
  `);
  console.log("✓ Applicant profile inserted (id=1)");

  // 4. Application for CHED scholarship
  await pool.execute(`
    INSERT IGNORE INTO applications
      (id, applicant_id, scholarship_id, status,
       gpa_at_submission, income_at_submission, submitted_at)
    VALUES (1, 1, 1, 'under_review', 1.82, 15000.00, NOW())
  `);
  console.log("✓ Application inserted (id=1, CHED Study Now Pay Later)");

  // 5. Clear any existing requirement submissions so they all start as "missing"
  await pool.execute(
    "DELETE FROM requirement_submissions WHERE application_id = 1",
  );
  console.log("✓ Requirement submissions cleared — all 8 start as missing");

  await pool.end();
  console.log("\nDemo data seeded successfully!");
  console.log("  Email:    demo@iskolar.local");
  console.log("  Password: Demo@1234");
  console.log("  Applicant ID: 1");
}

run().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
