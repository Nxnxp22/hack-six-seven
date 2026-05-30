import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../power_overload.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to local SQLite database.');
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // 1. Create decoding_rules table
    db.run(`
      CREATE TABLE IF NOT EXISTS decoding_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        difficulty TEXT NOT NULL,
        rule_number INTEGER NOT NULL,
        description TEXT NOT NULL
      )
    `);

    // Seed decoding_rules if empty
    db.get("SELECT COUNT(*) as count FROM decoding_rules", (err, row: any) => {
      if (err) return;
      if (row.count === 0) {
        const rules = [
          { difficulty: 'EASY', rule_number: 1, description: 'If there is a RED wire, out the RED wire.' },
          { difficulty: 'EASY', rule_number: 2, description: 'Otherwise, if the last wire is BLUE, cut the BLUE wire.' },
          { difficulty: 'EASY', rule_number: 3, description: 'Otherwise, cut the 1st (top) wire.' },
          { difficulty: 'MEDIUM', rule_number: 1, description: 'If there is a YELLOW wire, cut it. Otherwise, cut the 3rd (middle) wire.' },
          { difficulty: 'MEDIUM', rule_number: 2, description: 'If the last wire is GREEN, cut the last wire. Otherwise, cut the 1st wire.' },
          { difficulty: 'MEDIUM', rule_number: 3, description: 'If both rules point to the same wire, cut the last wire instead for the 2nd target.' },
          { difficulty: 'HARD', rule_number: 1, description: 'Cut the GREEN wire if present. Otherwise, cut the 1st wire.' },
          { difficulty: 'HARD', rule_number: 2, description: 'If there is a CYAN wire, cut it. Otherwise, cut the 4th (middle) wire.' },
          { difficulty: 'HARD', rule_number: 3, description: 'If the last wire is ORANGE or PURPLE, cut the last wire. Otherwise, cut the 2nd wire.' },
          { difficulty: 'HARD', rule_number: 4, description: 'If any rule targets a wire already cut, cut the next available wire down.' }
        ];

        const stmt = db.prepare("INSERT INTO decoding_rules (difficulty, rule_number, description) VALUES (?, ?, ?)");
        for (const rule of rules) {
          stmt.run(rule.difficulty, rule.rule_number, rule.description);
        }
        stmt.finalize();
        console.log('Seeded database rules successfully.');
      }
    });

    // 2. Create critical_templates table
    db.run(`
      CREATE TABLE IF NOT EXISTS critical_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        difficulty TEXT UNIQUE NOT NULL,
        template TEXT NOT NULL
      )
    `);

    // Seed critical_templates if empty
    db.get("SELECT COUNT(*) as count FROM critical_templates", (err, row: any) => {
      if (err) return;
      if (row.count === 0) {
        const templates = [
          { difficulty: 'EASY', template: 'CRITICAL: Cut the {color} wire to restore power.' },
          { difficulty: 'MEDIUM', template: 'CRITICAL: System breach. Override sequence hex signatures: {hex1} -> {hex2}.' },
          { difficulty: 'HARD', template: 'CRITICAL: Nexus lock active. Mainframe defusal signatures sequence: {name1} -> {name2} -> {name3}.' }
        ];

        const stmt = db.prepare("INSERT OR IGNORE INTO critical_templates (difficulty, template) VALUES (?, ?)");
        for (const t of templates) {
          stmt.run(t.difficulty, t.template);
        }
        stmt.finalize();
        console.log('Seeded critical templates successfully.');
      }
    });
  });
}

// ─── decoding_rules CRUD ────────────────────────────────────────────────────

export const getRulesFromDB = (difficulty: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM decoding_rules WHERE difficulty = ? ORDER BY rule_number ASC",
      [difficulty],
      (err, rows) => { if (err) reject(err); else resolve(rows); }
    );
  });
};

export const getAllRulesFromDB = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM decoding_rules ORDER BY difficulty, rule_number ASC",
      [],
      (err, rows) => { if (err) reject(err); else resolve(rows); }
    );
  });
};

export const getRuleByIdFromDB = (id: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM decoding_rules WHERE id = ?", [id],
      (err, row) => { if (err) reject(err); else resolve(row); }
    );
  });
};

export const createRuleInDB = (difficulty: string, rule_number: number, description: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO decoding_rules (difficulty, rule_number, description) VALUES (?, ?, ?)",
      [difficulty, rule_number, description],
      function (err) { if (err) reject(err); else resolve(this.lastID); }
    );
  });
};

export const updateRuleInDB = (id: number, difficulty: string, rule_number: number, description: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE decoding_rules SET difficulty = ?, rule_number = ?, description = ? WHERE id = ?",
      [difficulty, rule_number, description, id],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const deleteRuleFromDB = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM decoding_rules WHERE id = ?", [id],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

// ─── critical_templates CRUD ─────────────────────────────────────────────────

export const getCriticalTemplateFromDB = (difficulty: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT template FROM critical_templates WHERE difficulty = ?",
      [difficulty],
      (err, row: any) => { if (err) reject(err); else resolve(row ? row.template : ''); }
    );
  });
};

export const getAllCriticalTemplatesFromDB = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM critical_templates ORDER BY difficulty ASC", [],
      (err, rows) => { if (err) reject(err); else resolve(rows); }
    );
  });
};

export const getCriticalTemplateByIdFromDB = (id: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM critical_templates WHERE id = ?", [id],
      (err, row) => { if (err) reject(err); else resolve(row); }
    );
  });
};

export const createCriticalTemplateInDB = (difficulty: string, template: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO critical_templates (difficulty, template) VALUES (?, ?)",
      [difficulty, template],
      function (err) { if (err) reject(err); else resolve(this.lastID); }
    );
  });
};

export const updateCriticalTemplateInDB = (id: number, difficulty: string, template: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE critical_templates SET difficulty = ?, template = ? WHERE id = ?",
      [difficulty, template, id],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const deleteCriticalTemplateFromDB = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM critical_templates WHERE id = ?", [id],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export default db;
