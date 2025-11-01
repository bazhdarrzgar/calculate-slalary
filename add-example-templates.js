const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'currency_calculator.db');
const db = new Database(dbPath);

// Example templates for Iraqi government positions
const exampleTemplates = [
  {
    name: 'Senior Engineer',
    rank: 'Grade 1',
    department: 'Engineering',
    salary: 1250000
  },
  {
    name: 'Department Manager',
    rank: 'Grade 2',
    department: 'Administration',
    salary: 1450000
  },
  {
    name: 'Medical Doctor',
    rank: 'Specialist',
    department: 'Healthcare',
    salary: 1350000
  },
  {
    name: 'Senior Accountant',
    rank: 'Grade 3',
    department: 'Finance',
    salary: 980000
  },
  {
    name: 'IT Specialist',
    rank: 'Grade 4',
    department: 'Information Technology',
    salary: 850000
  },
  {
    name: 'HR Manager',
    rank: 'Grade 2',
    department: 'Human Resources',
    salary: 1100000
  },
  {
    name: 'Teacher - High School',
    rank: 'Senior',
    department: 'Education',
    salary: 750000
  },
  {
    name: 'Legal Advisor',
    rank: 'Grade 3',
    department: 'Legal',
    salary: 1050000
  }
];

try {
  // Ensure table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS salary_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rank TEXT,
      department TEXT,
      salary INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Check if templates already exist
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM salary_templates').get();
  
  if (existingCount.count > 0) {
    console.log(`Found ${existingCount.count} existing templates. Skipping example data insertion.`);
    console.log('To add examples anyway, delete existing templates first.');
  } else {
    // Insert example templates
    const insertStmt = db.prepare(`
      INSERT INTO salary_templates (id, name, rank, department, salary, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const createdAt = new Date().toISOString();

    for (const template of exampleTemplates) {
      const id = uuidv4();
      insertStmt.run(id, template.name, template.rank, template.department, template.salary, createdAt);
    }

    console.log(`✅ Successfully added ${exampleTemplates.length} example templates!`);
    
    // Display added templates
    const templates = db.prepare('SELECT * FROM salary_templates ORDER BY name').all();
    console.log('\nAdded templates:');
    templates.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name} - ${t.rank} (${t.department}) - ${t.salary.toLocaleString()} IQD`);
    });
  }
} catch (error) {
  console.error('Error adding example templates:', error);
} finally {
  db.close();
}
