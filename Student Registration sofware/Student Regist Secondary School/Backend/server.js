// server.js - Backend for Student Registration System

const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
// Set a descriptive process title for Windows tools and monitors
try { process.title = 'BlueLedger S Backend'; } catch (_) {}
const PORT = process.env.PORT || 4001;
// Directories configurable via env for packaging/runtime
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');
const APP_DATA_DIR = process.env.APP_DATA_DIR || __dirname;

// Middleware setup
// Add Private Network Access header required by Chromium/WebView2 for localhost
// Place BEFORE cors() so it applies to preflight responses handled by cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  next();
});
// CORS: allow UI in Tauri (app:// or file:// origin) to call 127.0.0.1
app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads and public files statically
app.use('/uploads', express.static(path.join(APP_DATA_DIR, 'uploads')));
app.use(express.static(PUBLIC_DIR));

// Serve main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Ensure uploads folder exists
const uploadsDir = path.join(APP_DATA_DIR, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.error('Failed to ensure uploads directory at', uploadsDir, e);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// SQLite database setup
const dbPath = path.join(APP_DATA_DIR, 'Registration.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite DB');

  // Promisified SQLite helpers for async/await usage
  const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
  const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
  const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

  // Ensure required columns exist using PRAGMA checks
  let MATRICULE_COL = 'matricule'; // actual column name as it exists in DB (case-sensitive)
  let MATRICULE_COL_QUOTED = 'matricule'; // identifier for SQL usage (quoted when needed)

  function ensureSchema(cb = () => {}) {
    // Ensure students.matricule
    db.all('PRAGMA table_info(students)', (err, columns) => {
      if (err) return cb(err);
      
      const matriculeCol = columns.find(c => c.name.toLowerCase() === 'matricule');
      const hasMatricule = !!matriculeCol;
      const hasPhone = columns.some(c => c.name.toLowerCase() === 'phone');
      const hasStatus = columns.some(c => c.name.toLowerCase() === 'status');
      const hasInactiveAt = columns.some(c => c.name.toLowerCase() === 'inactiveat');
      const hasDepartment = columns.some(c => c.name.toLowerCase() === 'department');
      const hasSeries = columns.some(c => c.name.toLowerCase() === 'series');
      
      if (hasMatricule) {
        MATRICULE_COL = matriculeCol.name; // preserve actual case
        MATRICULE_COL_QUOTED = /[^a-z0-9_]/i.test(MATRICULE_COL) || MATRICULE_COL !== MATRICULE_COL.toLowerCase()
          ? `"${MATRICULE_COL}"`
          : MATRICULE_COL;
      }

      // Helper functions for adding columns
      const addMatricule = (next) => {
        if (hasMatricule) return next();
        db.run('ALTER TABLE students ADD COLUMN matricule TEXT UNIQUE', (e) => next(e));
      };

      const addPhone = (next) => {
        if (hasPhone) return next();
        db.run('ALTER TABLE students ADD COLUMN phone TEXT', (e) => next(e));
      };

      const addStatus = (next) => {
        if (hasStatus) return next();
        db.run("ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'active'", (e) => next(e));
      };

      const addInactiveAt = (next) => {
        if (hasInactiveAt) return next();
        db.run('ALTER TABLE students ADD COLUMN inactiveAt TEXT', (e) => next(e));
      };

      const addDepartment = (next) => {
        if (hasDepartment) return next();
        db.run('ALTER TABLE students ADD COLUMN department TEXT', (e) => next(e));
      };

      const addSeries = (next) => {
        if (hasSeries) return next();
        db.run('ALTER TABLE students ADD COLUMN series TEXT', (e) => next(e));
      };
      
      const addFeesTotal = (next) => {
        const hasFeesTotal = columns.some(c => c.name.toLowerCase() === 'feestotal');
        if (hasFeesTotal) return next();
        db.run('ALTER TABLE students ADD COLUMN feesTotal INTEGER DEFAULT 0', (err) => {
          if (err) console.error('Error adding feesTotal column:', err);
          next();
        });
      };

      // Ensure helpful indexes exist (idempotent)
      const addIndexes = (next) => {
        const stmts = [
          "CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)",
          "CREATE INDEX IF NOT EXISTS idx_students_classLevel ON students(classLevel)",
          "CREATE INDEX IF NOT EXISTS idx_students_department ON students(department)",
          "CREATE INDEX IF NOT EXISTS idx_students_series ON students(series)",
          "CREATE INDEX IF NOT EXISTS idx_students_lastName ON students(lastName)",
          "CREATE INDEX IF NOT EXISTS idx_students_firstName ON students(firstName)",
          `CREATE INDEX IF NOT EXISTS idx_students_${MATRICULE_COL}_nocase ON students(${MATRICULE_COL})`,
          "CREATE INDEX IF NOT EXISTS idx_students_inactiveAt ON students(inactiveAt)",
        ];
        
        let i = 0;
        const runNext = () => {
          if (i >= stmts.length) return next();
          db.run(stmts[i], (err) => {
            if (err) console.error('Error creating index:', stmts[i], err);
            i++;
            runNext();
          });
        };
        runNext();
      };

      // Function to check and add school table columns
      const ensureSchoolColumns = (next) => {
        db.all('PRAGMA table_info(school)', (err, cols) => {
          if (err) return next(err);
          
          const hasCode = cols.some(c => c.name.toLowerCase() === 'code');
          const hasYear = cols.some(c => c.name.toLowerCase() === 'academicyear');
          
          const addCode = (cb) => {
            if (hasCode) return cb();
            db.run('ALTER TABLE school ADD COLUMN code TEXT', (e) => {
              if (e) console.error('Error adding school.code:', e);
              cb();
            });
          };
          
          const addYear = (cb) => {
            if (hasYear) return cb();
            db.run('ALTER TABLE school ADD COLUMN academicYear TEXT', (e) => {
              if (e) console.error('Error adding school.academicYear:', e);
              cb();
            });
          };
          
          // Run school column additions in series
          addCode(() => addYear(next));
        });
      };

      // Function to check and add license table columns
      const ensureLicenseColumns = (next) => {
        db.all('PRAGMA table_info(license)', (err, cols) => {
          if (err) return next(err);
          
          const hasActivatedAt = cols.some(c => c.name.toLowerCase() === 'activatedat');
          const hasInitialPurgeAt = cols.some(c => c.name.toLowerCase() === 'initialpurgeat');
          const hasExpiredAppliedAt = cols.some(c => c.name.toLowerCase() === 'expiredappliedat');
          
          const addActivatedAt = (cb) => {
            if (hasActivatedAt) return cb();
            db.run('ALTER TABLE license ADD COLUMN activatedAt TEXT', (e) => {
              if (e) console.error('Error adding license.activatedAt:', e);
              cb();
            });
          };
          
          const addInitialPurgeAt = (cb) => {
            if (hasInitialPurgeAt) return cb();
            db.run('ALTER TABLE license ADD COLUMN initialPurgeAt TEXT', (e) => {
              if (e) console.error('Error adding license.initialPurgeAt:', e);
              cb();
            });
          };
          
          const addExpiredAppliedAt = (cb) => {
            if (hasExpiredAppliedAt) return cb();
            db.run('ALTER TABLE license ADD COLUMN expiredAppliedAt TEXT', (e) => {
              if (e) console.error('Error adding license.expiredAppliedAt:', e);
              cb();
            });
          };
          
          // Run license column additions in series
          addActivatedAt(() => 
            addInitialPurgeAt(() => 
              addExpiredAppliedAt(next)
            )
          );
        });
      };

      // Main schema update sequence
      addMatricule((err) => {
        if (err) return cb(err);
        addPhone((err) => {
          if (err) return cb(err);
          addStatus((err) => {
            if (err) return cb(err);
            addInactiveAt((err) => {
              if (err) return cb(err);
              addDepartment((err) => {
                if (err) return cb(err);
                addSeries((err) => {
                  if (err) return cb(err);
                  addFeesTotal((err) => {
                    if (err) return cb(err);
                    addIndexes((err) => {
                      if (err) return cb(err);
                      ensureSchoolColumns((err) => {
                        if (err) return cb(err);
                        ensureLicenseColumns((err) => {
                          if (err) return cb(err);
                          cb(); // All schema updates complete
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  // Call ensureSchema on startup, then backfill missing matricules
  ensureSchema(() => {
    db.get('SELECT name, code, academicYear FROM school WHERE id = 1', (err, schoolRow) => {
      const deriveSchoolCode = (name) => {
        if (!name) return 'SCH';
        const words = name.split(/\s+/).filter(Boolean);
        if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
        return words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
      };
      const schoolCode = (schoolRow?.code && schoolRow.code.trim()) || deriveSchoolCode(schoolRow?.name || 'School');
      const year = (schoolRow?.academicYear && schoolRow.academicYear.trim()) || String(new Date().getFullYear());
      db.all(`SELECT id FROM students WHERE ${MATRICULE_COL_QUOTED} IS NULL OR ${MATRICULE_COL_QUOTED} = ''`, (e, rows) => {
        if (e || !rows || rows.length === 0) return;
        const stmt = db.prepare(`UPDATE students SET ${MATRICULE_COL_QUOTED} = ? WHERE id = ?`);
        rows.forEach(r => {
          const mat = `${schoolCode}-${year}-${String(r.id).padStart(4, '0')}`;
          stmt.run(mat, r.id);
        });
        stmt.finalize();
      });
    });
  });

  db.run(
    `CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      classLevel TEXT NOT NULL,
      feesPaid INTEGER NOT NULL,
      phone TEXT,
      department TEXT,
      series TEXT,
      profilePic TEXT,
      ${MATRICULE_COL} TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      inactiveAt TEXT
    )`,
    (err) => {
      if (err) console.error('Error creating students table:', err.message);
    }
  );

  // Add this block for school info
  db.run(
    `CREATE TABLE IF NOT EXISTS school (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      logo TEXT,
      code TEXT,
      academicYear TEXT
    )`,
    (err) => {
      if (err) console.error('Error creating school table:', err.message);
    }
  );

  // Add this table on DB setup:
  db.run(
    `CREATE TABLE IF NOT EXISTS class_fees (
      classKey TEXT PRIMARY KEY,
      fee INTEGER NOT NULL CHECK (fee >= 0)
    )`,
    (err) => {
      if (err) console.error('Error creating class_fees table:', err.message);
      // Insert default class keys if not present
      const defaultClasses = [
        "form1", "form2", "form3", "form4", "form5", "lower-sixth", "upper-sixth"
      ];
      defaultClasses.forEach(classKey => {
        db.run(
          `INSERT OR IGNORE INTO class_fees (classKey, fee) VALUES (?, 0)`,
          [classKey]
        );
      });
    }
  );

  // License table (single row id=1)
  db.run(
    `CREATE TABLE IF NOT EXISTS license (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      licenseKey TEXT,
      status TEXT,
      issuedTo TEXT,
      schoolCode TEXT,
      expiresAt TEXT,
      activatedAt TEXT,
      initialPurgeAt TEXT,
      expiredAppliedAt TEXT
    )`,
    (err) => {
      if (err) console.error('Error creating license table:', err.message);
    }
  );

  // Public key for verifying license signatures (Ed25519)
  const LICENSE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAp7ey28fjapuGn97ILi4Qpk8Uq3Aar0Vzwv0C8mTBst0=\n-----END PUBLIC KEY-----`;

  // Normalize a base64 string: strip whitespace, convert URL-safe to standard, and pad
  function normalizeBase64(input) {
    let s = String(input || '').trim();
    // remove all whitespace and line breaks
    s = s.replace(/\s+/g, '');
    // convert base64url to base64
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    // pad to multiple of 4
    const rem = s.length % 4;
    if (rem) s += '='.repeat(4 - rem);
    return s;
  }

  // Parse the license envelope from either base64(JSON) or raw JSON string
  function parseLicenseEnvelope(licenseKey) {
    const raw = String(licenseKey || '');
    const trimmed = raw.trim();
    let parsed;
    if (!trimmed) throw new Error('Empty license');
    try {
      if (trimmed.startsWith('{')) {
        // Allow raw JSON input for robustness
        parsed = JSON.parse(trimmed);
      } else {
        const b64 = normalizeBase64(trimmed);
        const buf = Buffer.from(b64, 'base64');
        if (buf.length === 0) throw new Error('Invalid base64');
        if (buf.length > 16 * 1024) throw new Error('License too large');
        const decoded = buf.toString('utf8');
        parsed = JSON.parse(decoded);
      }
    } catch (e) {
      throw new Error('Invalid license format');
    }
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid license format');
    if (!parsed.payload || !parsed.sig) throw new Error('Missing payload/signature');
    return parsed;
  }

  // Verify license key (base64 JSON: { payload: {...}, sig: base64 })
  function verifyLicenseKey(licenseKey, currentSchoolCode) {
    try {
      const parsed = parseLicenseEnvelope(licenseKey);
      const payload = parsed.payload;
      // string to verify must match what signer used
      const payloadString = JSON.stringify(payload);
      // normalize signature input (allow base64url or with whitespace)
      const signature = Buffer.from(normalizeBase64(parsed.sig), 'base64');
      if (signature.length !== 64) {
        return { valid: false, reason: 'Invalid signature format' };
      }
      const isValidSig = crypto.verify(null, Buffer.from(payloadString), LICENSE_PUBLIC_KEY_PEM, signature);
      if (!isValidSig) return { valid: false, reason: 'Bad signature' };

      // Business rules
      const now = Date.now();
      const exp = Date.parse(payload.expiresAt);
      if (!exp || isNaN(exp)) return { valid: false, reason: 'Bad expiry' };
      if (now > exp) return { valid: false, reason: 'Expired' };
      if (currentSchoolCode && payload.schoolCode && payload.schoolCode !== currentSchoolCode) {
        return { valid: false, reason: 'School code mismatch' };

      }

      return {
        valid: true,
        issuedTo: payload.issuedTo || null,
        schoolCode: payload.schoolCode || null,
        expiresAt: new Date(exp).toISOString(),
      };
    } catch (e) {
      return { valid: false, reason: e && e.message ? e.message : 'Parse/verify error' };
    }
  }

  // Get current license status from DB and compute active/expired
  function getLicenseStatus(cb) {
    db.get('SELECT * FROM license WHERE id = 1', (err, row) => {
      if (err) return cb(err);
      if (!row || !row.expiresAt) return cb(null, { status: 'missing' });
      const now = Date.now();
      const exp = Date.parse(row.expiresAt);
      const active = exp && now <= exp;
      cb(null, {
        status: active ? 'active' : 'expired',
        issuedTo: row.issuedTo || null,
        schoolCode: row.schoolCode || null,
        expiresAt: row.expiresAt || null,
      });
    });
  }

  // Middleware: enforce license for protected APIs
  function checkLicense(req, res, next) {
    const original = req.originalUrl || req.url || '';
    // Always allow preflight
    if (req.method === 'OPTIONS') return next();
    // Allow static and root GETs
    if (req.method === 'GET' && (original === '/' || original.startsWith('/uploads') || original.startsWith('/static'))) {
      return next();
    }
    // Allow license and school endpoints without active license
    const allowPrefixes = ['/api/license', '/api/school'];
    if (allowPrefixes.some(prefix => original.startsWith(prefix))) return next();

    getLicenseStatus((err, status) => {
      if (err) return res.status(500).json({ error: 'License check failed' });
      if (!status || status.status !== 'active') {
        return res.status(402).json({ error: 'License missing or expired', status });
      }
      next();
    });
  }

  // Helper to compute matricule string
  function computeMatriculeFromSchoolRow(row, id) {
    const deriveSchoolCode = (name) => {
      if (!name) return 'SCH';
      const words = name.split(/\s+/).filter(Boolean);
      if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
      return words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
    };
    const schoolCode = (row?.code && row.code.trim()) || deriveSchoolCode(row?.name || 'School');
    const year = (row?.academicYear && row.academicYear.trim()) || String(new Date().getFullYear());
    return `${schoolCode}-${year}-${String(id).padStart(4, '0')}`;
  }

  // Helper: Delete old profile picture file safely
  function deleteFileIfExists(filePath) {
    if (filePath && filePath.startsWith('/uploads/')) {
      const fullPath = path.join(APP_DATA_DIR, filePath.replace(/^\//, ''));
      fs.unlink(fullPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting file:', err);
        }
      });
    }
  }

  // Routes

  // License endpoints
  app.get('/api/license', (req, res) => {
    getLicenseStatus((err, status) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(status);
    });
  });

  app.post('/api/license', async (req, res) => {
    try {
      const { licenseKey } = req.body;
      const nowIso = new Date().toISOString();
      // Verify against current school code (if set)
      db.get('SELECT code FROM school WHERE id = 1', (e, schoolRow) => {
        if (e) return res.status(500).json({ error: e.message });
        const currentSchoolCode = schoolRow?.code || null;
        const result = verifyLicenseKey(licenseKey, currentSchoolCode);
        if (!result.valid) return res.status(400).json({ error: 'Invalid license', reason: result.reason });
        // Upsert license; reset activation-related windows on activation
        db.run(
          `INSERT INTO license (id, licenseKey, status, issuedTo, schoolCode, expiresAt, activatedAt, initialPurgeAt, expiredAppliedAt)
           VALUES (1, ?, 'active', ?, ?, ?, ?, NULL, NULL)
           ON CONFLICT(id) DO UPDATE SET
             licenseKey=excluded.licenseKey,
             status='active',
             activatedAt=excluded.activatedAt,
             initialPurgeAt=NULL,
             expiredAppliedAt=NULL`,
          [licenseKey, result.issuedTo, result.schoolCode, result.expiresAt, nowIso],
          function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true, ...result, activatedAt: nowIso });
          }
        );
      });
    } catch (err) {
      console.error('Activate license error', err);
      res.status(500).json({ error: 'Failed to activate license' });
    }
  });

  // Deactivate license (clear)
  app.delete('/api/license', (req, res) => {
    db.run(`DELETE FROM license WHERE id = 1`, [], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  // Apply license middleware to protected APIs
  app.use('/api', (req, res, next) => checkLicense(req, res, next));

  // GET students (paginated + filters)
  app.get('/api/students', async (req, res) => {
    try {
      console.log('API Request query params:', req.query);  // Debug log
      // Pagination
      const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
      const pageSizeRaw = Math.max(parseInt(req.query.pageSize || '20', 10) || 20, 1);
      const pageSize = Math.min(pageSizeRaw, 100); // cap page size
      const offset = (page - 1) * pageSize;

      // Filters
      const where = [];
      const params = [];

      const includeInactive = (req.query && (req.query.includeInactive === 'true' || req.query.includeInactive === true));
      const status = (req.query.status || '').trim();
      if (status) {
        where.push("COALESCE(status,'active') = ?");
        params.push(status);
      } else if (!includeInactive) {
        where.push("COALESCE(status,'active') = 'active'");
      }

      const classLevel = (req.query.classLevel || '').trim();
      if (classLevel) { where.push('classLevel = ?'); params.push(classLevel); }

      const department = (req.query.department || '').trim();
      if (department) { where.push('department = ?'); params.push(department); }

      const series = (req.query.series || '').trim();
      if (series) { where.push('series = ?'); params.push(series); }

      const gender = (req.query.gender || '').trim();
      if (gender) { where.push('gender = ?'); params.push(gender); }

      const q = (req.query.q || req.query.name || '').toString().trim();
      if (q) {
        const like = `%${q}%`;
        where.push(`(firstName LIKE ? OR lastName LIKE ? OR ${MATRICULE_COL_QUOTED} LIKE ?)`);
        params.push(like, like, like);
      }

      // Exact age search
      if (req.query.age) {
        const targetAge = parseInt(req.query.age, 10);
        console.log('Age search parameter:', { targetAge, query: req.query.age });
        if (!isNaN(targetAge)) {
          const today = new Date();
          const currentYear = today.getFullYear();
          const currentMonth = today.getMonth();
          const currentDay = today.getDate();
          
          // Calculate birth date range for exact age
          // Students born between (today - age - 1 years) and (today - age years)
          const minDate = new Date(currentYear - targetAge - 1, currentMonth, currentDay + 1);
          const maxDate = new Date(currentYear - targetAge, currentMonth, currentDay);
          
          console.log(`Searching for students with age ${targetAge}:`, { 
            minDate: minDate.toISOString().split('T')[0],
            maxDate: maxDate.toISOString().split('T')[0],
            currentYear,
            currentMonth,
            currentDay
          });
          
          where.push('(dob > ? AND dob <= ?)');
          params.push(
            minDate.toISOString().split('T')[0],
            maxDate.toISOString().split('T')[0]
          );
        }
      }

      // Fees status search
      console.log('Fees status query:', req.query.feesStatus);
      if (req.query.feesStatus) {
        if (req.query.feesStatus === 'completed') {
          // Student has paid all fees (feesPaid >= feesTotal and feesTotal > 0)
          where.push('(students.feesPaid >= students.feesTotal AND students.feesTotal > 0) OR (students.feesTotal = 0 AND students.feesPaid = 0)');
        } else if (req.query.feesStatus === 'owing') {
          // Student has not paid all fees (feesPaid < feesTotal or feesPaid is null) and feesTotal > 0
          where.push('(students.feesPaid < students.feesTotal OR students.feesPaid IS NULL) AND students.feesTotal > 0');
        }
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      // Count total
      db.get(`SELECT COUNT(*) as total FROM students ${whereSql}`, params, (errCount, countRow) => {
        if (errCount) return res.status(500).json({ error: errCount.message });
        const total = countRow ? countRow.total : 0;
        // Page data
        const dataSql = `SELECT * FROM students ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`;
        const dataParams = params.concat([pageSize, offset]);
        db.all(dataSql, dataParams, (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ data: rows || [], page, pageSize, total });
        });
      });
    } catch (e) {
      console.error('GET /api/students error', e);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  // POST new student
  app.post('/api/students', upload.single('profilePic'), (req, res) => {
    const {
      firstName,
      lastName,
      dob,
      gender,
      classLevel,
      feesPaid,
      phone,
      department,
      series,
    } = req.body;

    const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

    if (!firstName || !lastName || !dob || !gender || !classLevel || feesPaid === undefined) {
      return res.status(400).json({ error: 'Missing required student fields' });
    }

    db.run(
      `INSERT INTO students (firstName, lastName, dob, gender, classLevel, feesPaid, phone, department, series, profilePic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, dob, gender, classLevel, feesPaid, phone || null, department || null, series || null, profilePic],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const newId = this.lastID;
        // Compute matricule and update, then respond
        const doUpdate = () => {
          db.get('SELECT name, code, academicYear FROM school WHERE id = 1', (e, row) => {
            const deriveSchoolCode = (name) => {
              if (!name) return 'SCH';
              const words = name.split(/\s+/).filter(Boolean);
              if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
              return words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
            };
            const schoolCode = (row?.code && row.code.trim()) || deriveSchoolCode(row?.name || 'School');
            const year = (row?.academicYear && row.academicYear.trim()) || String(new Date().getFullYear());
            const matricule = `${schoolCode}-${year}-${String(newId).padStart(4, '0')}`;
            db.run(`UPDATE students SET ${MATRICULE_COL_QUOTED} = ? WHERE id = ?`, [matricule, newId], (uErr) => {
              if (uErr && /no such column/i.test(uErr.message)) {
                // Attempt to migrate and retry once
                return ensureSchema(() => {
                  db.run(`UPDATE students SET ${MATRICULE_COL_QUOTED} = ? WHERE id = ?`, [matricule, newId], (retryErr) => {
                    if (retryErr) return res.status(201).json({ id: newId });
                    return res.status(201).json({ id: newId, matricule });
                  });
                });
              }
              if (uErr) return res.status(201).json({ id: newId });
              return res.status(201).json({ id: newId, matricule });
            });
          });
        };

        // Ensure schema then update
        ensureSchema(() => doUpdate());
      }
    );
  });

  // PUT update existing student
  app.put('/api/students/:id', upload.single('profilePic'), (req, res) => {
    const id = req.params.id;
    const {
      firstName,
      lastName,
      dob,
      gender,
      classLevel,
      feesPaid,
      phone,
      department = null,
      series = null,
      existingPic = null,
    } = req.body;

    const newProfilePic = req.file ? `/uploads/${req.file.filename}` : existingPic;

    if (!firstName || !lastName || !dob || !gender || !classLevel || feesPaid === undefined) {
      return res.status(400).json({ error: 'Missing required student fields' });
    }

    // Fetch existing profile pic to delete if replaced
    db.get('SELECT profilePic FROM students WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Student not found' });

      if (req.file && row.profilePic && row.profilePic !== newProfilePic) {
        deleteFileIfExists(row.profilePic);
      }

      db.run(
        `UPDATE students SET
          firstName = ?, lastName = ?, dob = ?, gender = ?, classLevel = ?, feesPaid = ?, phone = ?, department = ?, series = ?, profilePic = ?
         WHERE id = ?`,
        [firstName, lastName, dob, gender, classLevel, feesPaid, phone || null, department, series, newProfilePic, id],
        function (updateErr) {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          if (this.changes === 0) return res.status(404).json({ error: 'Student not found' });
          res.json({ updated: this.changes });
        }
      );
    });
  });

  // DELETE student
  app.delete('/api/students/:id', (req, res) => {
    const id = req.params.id;

    // Get profilePic path before deletion to remove file
    db.get('SELECT profilePic FROM students WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Student not found' });

      db.run('DELETE FROM students WHERE id = ?', [id], function (delErr) {
        if (delErr) return res.status(500).json({ error: delErr.message });

        // Delete profile picture if exists
        if (row.profilePic) {
          deleteFileIfExists(row.profilePic);
        }

        if (this.changes === 0) return res.status(404).json({ error: 'Student not found' });
        res.json({ deleted: this.changes });
      });
    });
  });

  // Mark student inactive
  app.put('/api/students/:id/inactivate', (req, res) => {
    const id = req.params.id;
    const nowIso = new Date().toISOString();
    db.run(
      "UPDATE students SET status='inactive', inactiveAt=? WHERE id=?",
      [nowIso, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Student not found' });
        res.json({ success: true, id, inactiveAt: nowIso });
      }
    );
  });

  // Reactivate student
  app.put('/api/students/:id/reactivate', (req, res) => {
    const id = req.params.id;
    db.run(
      "UPDATE students SET status='active', inactiveAt=NULL WHERE id=?",
      [id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Student not found' });
        res.json({ success: true, id });
      }
    );
  });

  // GET school info
  app.get('/api/school', (req, res) => {
    db.get('SELECT * FROM school WHERE id = 1', (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || {});
    });
  });

  // POST/PUT school info (upsert)
  app.post('/api/school', upload.single('logo'), (req, res) => {
    const { name } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : req.body.existingLogo || null;
    const code = req.body.code || null;
    const academicYear = req.body.academicYear || null;
    if (!name) return res.status(400).json({ error: 'School name required' });

    db.run(
      `INSERT INTO school (id, name, logo, code, academicYear) VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, logo=excluded.logo, code=excluded.code, academicYear=excluded.academicYear`,
      [name, logo, code, academicYear],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // POST endpoint to regenerate matricules for all students
  app.post('/api/regenerate-matricules', (req, res) => {
    ensureSchema(() => {
      db.get('SELECT name, code, academicYear FROM school WHERE id = 1', (err, schoolRow) => {
        if (err) return res.status(500).json({ error: err.message });
        db.all('SELECT id FROM students', (e, rows) => {
          if (e) return res.status(500).json({ error: e.message });
          if (!rows || rows.length === 0) return res.json({ updated: 0 });
          const stmt = db.prepare(`UPDATE students SET ${MATRICULE_COL_QUOTED} = ? WHERE id = ?`);
          let count = 0;
          rows.forEach(r => {
            const mat = computeMatriculeFromSchoolRow(schoolRow, r.id);
            stmt.run(mat, r.id, () => {
              count++;
            });
          });
          stmt.finalize((finErr) => {
            if (finErr) return res.status(500).json({ error: finErr.message });
            res.json({ updated: count });
          });
        });
      });
    });
  });

  // GET class fees
  app.get('/api/class-fees', (req, res) => {
    db.all('SELECT * FROM class_fees', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const fees = {};
      rows.forEach(row => { fees[row.classKey] = row.fee; });
      res.json(fees);
    });
  });

  // POST/PUT class fees (bulk update)
  app.post('/api/class-fees', (req, res) => {
    // Accept both JSON and urlencoded/form submissions
    const fees = req.body;
    const stmt = db.prepare('INSERT INTO class_fees (classKey, fee) VALUES (?, ?) ON CONFLICT(classKey) DO UPDATE SET fee=excluded.fee');
    db.serialize(() => {
      for (const key in fees) {
        const fee = Number(fees[key]);
        if (fee < 0) continue;
        stmt.run(key, fee);
      }
      stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
  });

  // Helper: purge inactive students after retention (3 months post license activation)
  async function purgeInactiveStudentsTwoStage(manual = false) {
    try {
      const license = await get(`SELECT activatedAt, initialPurgeAt FROM license WHERE id=1`);
      if (!license || !license.activatedAt) {
        if (manual) console.log('[purge] skipped: no license activation');
        return { deleted: 0, stage: 'none' };
      }
      const now = new Date();
      const activatedAt = new Date(license.activatedAt);

      // Helper add months
      const addMonths = (d, m) => new Date(d.getFullYear(), d.getMonth() + m, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());

      const initialPurgeDue = now >= addMonths(activatedAt, 3);

      if (!initialPurgeDue) {
        if (manual) console.log('[purge] skipped: before 3-month window');
        return { deleted: 0, stage: 'pre-window' };
      }

      if (!license.initialPurgeAt) {
        // First-time purge at 3 months: delete all inactive students immediately
        const victims = await all(`SELECT id, profilePic FROM students WHERE COALESCE(status,'active')='inactive'`);
        for (const v of victims) {
          if (v.profilePic) deleteFileIfExists(v.profilePic);
        }
        const { changes } = await run(`DELETE FROM students WHERE COALESCE(status,'active')='inactive'`);
        await run(`UPDATE license SET initialPurgeAt = ? WHERE id=1`, [now.toISOString()]);
        console.log(`[purge] initial purge after 3 months: deleted ${changes}`);
        return { deleted: changes, stage: 'initial' };
      }

      // Subsequent purges: delete students inactive for >= 14 days
      const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const victims = await all(`SELECT id, profilePic FROM students WHERE COALESCE(status,'active')='inactive' AND inactiveAt IS NOT NULL AND datetime(inactiveAt) <= datetime(?)`, [cutoff]);
      for (const v of victims) {
        if (v.profilePic) deleteFileIfExists(v.profilePic);
      }
      const { changes } = await run(`DELETE FROM students WHERE COALESCE(status,'active')='inactive' AND inactiveAt IS NOT NULL AND datetime(inactiveAt) <= datetime(?)`, [cutoff]);
      if (changes > 0 || manual) console.log(`[purge] rolling purge (>=14 days inactive): deleted ${changes}`);
      return { deleted: changes, stage: 'rolling' };
    } catch (err) {
      console.error('purge job error', err);
      return { deleted: 0, stage: 'error', error: String(err) };
    }
  }

  // Manual purge endpoint (admin)
  app.post('/api/admin/purge-inactive', async (req, res) => {
    const result = await purgeInactiveStudentsTwoStage(true);
    res.json(result);
  });

  // Scheduler helper: when license expires, mark all students inactive once
  async function applyLicenseExpiryIfNeeded() {
    try {
      const lic = await get(`SELECT status, expiresAt, expiredAppliedAt FROM license WHERE id=1`);
      if (!lic || !lic.expiresAt) return;
      const now = new Date();
      const exp = new Date(lic.expiresAt);
      if (isNaN(+exp)) return;
      if (now >= exp && !lic.expiredAppliedAt) {
        // Set all students to inactive and stamp inactiveAt for those not already inactive
        const stamp = now.toISOString();
        await run(`UPDATE students SET status='inactive', inactiveAt=COALESCE(inactiveAt, ?) WHERE COALESCE(status,'active')='active'`, [stamp]);
        await run(`UPDATE license SET status='expired', expiredAppliedAt=? WHERE id=1`, [stamp]);
        console.log('[license] expired; marked all students inactive');
      }
    } catch (e) {
      console.error('applyLicenseExpiryIfNeeded error', e);
    }
  }

  // Scheduler at ~2:00 AM
  function scheduleDailyPurge() {
    const runAt2am = async () => {
      await applyLicenseExpiryIfNeeded();
      await purgeInactiveStudentsTwoStage(false);
    };
    // compute ms until next 02:00
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next - now;
    setTimeout(() => {
      runAt2am();
      setInterval(runAt2am, 24 * 60 * 60 * 1000);
    }, delay);
  }

  // Start scheduler and also attempt once on boot
  scheduleDailyPurge();
  setTimeout(() => { applyLicenseExpiryIfNeeded(); purgeInactiveStudentsTwoStage(); }, 10 * 1000);

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});