const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(express.json());

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
  host: 'localhost',
  user: 'root',
  password: 'Vrinda@5761',
  database: 'budgetbuddy',
});

app.use(cors({
  origin: 'http://localhost:3000', // frontend origin
  credentials: true               // must be true for sessions
}));

app.use(session({
  key: 'budgetbuddy_sid',
  secret: 'supersecret_key', // use a strong secret in production
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
    httpOnly: true,
    secure: false, // Set to true if using HTTPS
  }
}));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Vrinda@5761',
  database: 'budgetbuddy',
});

db.connect((err) => {
  if (err) throw err;
  console.log(' Connected to MySQL');
});

const PORT = 5000;

//Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error' });

    if (results.length > 0) {
      const user = results[0];
      req.session.user = { id: user.id, name: user.name }; // Store user in session
      res.status(200).json({ success: true, name: user.name, id: user.id });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

//Register
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }

    db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password],
      (err) => {
        if (err) return res.status(500).json({ message: 'Failed to register user' });

        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  });
});

//Add Income
app.post('/add-income', (req, res) => {
  const { user_id, amount } = req.body;

  if (!user_id || amount === undefined) {
    console.log("Invalid payload", req.body);
    return res.status(400).json({ message: 'Missing user_id or amount' });
  }

  const query = `
    INSERT INTO user_expenses (user_id, income)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE income = VALUES(income)
  `;

  db.query(query, [user_id, amount], (err) => {
    if (err) {
      console.error("Income update error:", err);  // 👈 log the error
      return res.status(500).json({ message: 'DB error' });
    }
    res.json({ message: 'Income updated successfully' });
  });
});


//Add Daily Expense saving to daily_expenses table
app.post('/add-daily-expense', (req, res) => {
  const { user_id, category, amount, description } = req.body;
  const validCategories = ['food', 'transport', 'shopping', 'misc'];

  if (!validCategories.includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  const query = `
    INSERT INTO daily_expenses (user_id, category, amount, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [user_id, category, amount, description || null], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'DB error' });
    }
    res.json({ message: 'Daily expense saved ' });
  });
});

//net income
app.get('/net-income', (req, res) => {
  const { user_id, date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const netIncomeQuery = `
    SELECT 
      COALESCE(ue.income, 0) - (
        COALESCE(ue.rent, 0) + COALESCE(ue.electricity, 0) +
        COALESCE(ue.water, 0) + COALESCE(ue.internet, 0) +
        COALESCE(ue.emi, 0) + COALESCE(ue.others, 0) +
        COALESCE(de.food_total, 0) + COALESCE(de.transport_total, 0) +
        COALESCE(de.shopping_total, 0) + COALESCE(de.misc_total, 0)
      ) AS netIncome
    FROM user_expenses ue
    LEFT JOIN (
      SELECT 
        user_id,
        SUM(CASE WHEN category = 'food' THEN amount ELSE 0 END) AS food_total,
        SUM(CASE WHEN category = 'transport' THEN amount ELSE 0 END) AS transport_total,
        SUM(CASE WHEN category = 'shopping' THEN amount ELSE 0 END) AS shopping_total,
        SUM(CASE WHEN category = 'misc' THEN amount ELSE 0 END) AS misc_total
      FROM daily_expenses
      WHERE user_id = ?
      GROUP BY user_id
    ) de ON ue.user_id = de.user_id
    WHERE ue.user_id = ?
  `;

  const recentExpensesQuery = `
    SELECT id, category, amount, description, created_at
    FROM daily_expenses
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `;

  const pieChartQuery = `
  SELECT category, SUM(amount) AS totalAmount
  FROM daily_expenses
  WHERE user_id = ? AND DATE(created_at) = ?
  GROUP BY category
`;

  // Parallel nested queries
  db.query(netIncomeQuery, [user_id, user_id], (err, netIncomeResults) => {
    if (err) {
      console.error('Error fetching net income:', err);
      return res.status(500).json({ message: 'Error fetching net income' });
    }

    db.query(recentExpensesQuery, [user_id], (err, expenseResults) => {
      if (err) {
        console.error('Error fetching recent expenses:', err);
        return res.status(500).json({ message: 'Error fetching expenses' });
      }

      db.query(pieChartQuery, [user_id, targetDate], (err, pieChartResults) => {

        if (err) {
          console.error('Error fetching pie chart data:', err);
          return res.status(500).json({ message: 'Error fetching pie chart data' });
        }

        const netIncome = netIncomeResults.length > 0 ? netIncomeResults[0].netIncome : 0;
        res.json({
          netIncome,
          recentExpenses: expenseResults,
          pieChartData: pieChartResults,
        });
      });
    });
  });
});
//Update Fixed Expenses
app.post('/update-fixed-expenses', (req, res) => {
  const { user_id, rent, electricity, water, internet, emi, others } = req.body;

  // 1. Validation
  if (!user_id) return res.status(400).send('User ID is required');
  if (!rent && !electricity && !water && !internet && !emi && !others) {
    return res.status(400).send('No fixed expenses provided');
  }

  // 2. SQL parts (if expenses are provided)
  const fields = [];
  const values = [];
  
  if (rent) {
    fields.push('rent');
    values.push(rent);
  }
  if (electricity) {
    fields.push('electricity');
    values.push(electricity);
  }
  if (water) {
    fields.push('water');
    values.push(water);
  }
  if (internet) {
    fields.push('internet');
    values.push(internet);
  }
  if (emi) {
    fields.push('emi');
    values.push(emi);
  }
  if (others) {
    fields.push('others');
    values.push(others);
  }

  //SQL Query to Update or Insert Fixed Expenses
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const sql = `
    INSERT INTO user_expenses (user_id, ${fields.join(', ')})
    VALUES (?, ${fields.map(() => '?').join(', ')})
    ON DUPLICATE KEY UPDATE ${setClause}
  `;

  db.query(sql, [user_id, ...values, ...values], (err) => {
    if (err) {
      console.error('Error updating fixed expenses:', err);
      return res.status(500).send('Error saving fixed expenses');
    }

    res.send('Fixed expenses updated successfully');
  });
});

//Get All Expense Breakdown
app.get('/all-expenses', (req, res) => {
  const { user_id } = req.query;

  const query = `
    SELECT income, rent, electricity, water, internet, emi, others
    FROM user_expenses
    WHERE user_id = ?
    LIMIT 1
  `;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching all expenses:", err); // ✅ log the real issue
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.json({}); // empty object if user hasn't set income/expenses yet
    }

    res.json(results[0]);
  });
});



//Create Collab Group
app.post("/create-collab", (req, res) => {
  const { group_title, group_income, group_code, num_members } = req.body;
  const userSession = req.session.user;

  if (!userSession || !userSession.id) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const user_id = userSession.id;

  const insertQuery = `
    INSERT INTO collab (group_title, group_income, group_code, num_members, user_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [group_title, group_income, group_code, num_members, user_id], (err, result) => {
    if (err) {
      console.error("Error creating group:", err);
      res.status(500).json({ error: "Failed to create group" });
    } else {
      res.status(200).json({ message: "Group created successfully" });
    }
  });
});





app.get("/collab-groups", (req, res) => {
  const query = `
    SELECT c.*, u.name AS owner_name
    FROM collab c
    JOIN users u ON c.user_id = u.id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching groups:", err);
      res.status(500).json({ error: "Failed to fetch groups" });
    } else {
      res.status(200).json(results);
    }
  });
});


app.post('/add-group-expense', (req, res) => {
  const { group_code, username, category, description, price } = req.body;

  const query = `
    INSERT INTO group_expenses (group_code, username, category, description, price)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [group_code, username, category, description, price], (err) => {
    if (err) {
      console.error('Error inserting group expense:', err);
      return res.status(500).json({ message: 'Error saving expense' });
    }
    res.json({ message: 'Expense added successfully' });
  });
});

app.get('/get-collab-group/:code', (req, res) => {
  const { code } = req.params;
  const query = `
  SELECT c.*, u.name AS owner_name
  FROM collab c
  JOIN users u ON c.user_id = u.id
  WHERE c.group_code = ?
`;

db.query(query, [code], (err, results) => {

    if (err) return res.status(500).json({ message: 'DB error' });
    if (results.length === 0) return res.status(404).json({ message: 'Group not found' });
    res.json(results[0]);
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('budgetbuddy_sid');
    res.json({ message: 'Logged out' });
  });
});

app.get('/api/groups/:id', (req, res) => {
  const userId = req.params.id;
  const query = `
    SELECT * FROM collab WHERE user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user's groups:", err);
      res.status(500).json({ error: "Failed to fetch groups" });
    } else {
      res.status(200).json(results);
    }
  });
});


app.post("/join-collab-group", (req, res) => {
  const { userId, groupCode } = req.body;

  const getGroupQuery = `SELECT * FROM collab WHERE group_code = ?`;
  db.query(getGroupQuery, [groupCode], (err, groupResults) => {
    if (err || groupResults.length === 0) {
      console.error("Group fetch error:", err);
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResults[0];

    // 👉 Step 1: Check if user already joined
    const checkMemberQuery = `SELECT * FROM collab_members WHERE user_id = ? AND collab_id = ?`;
    db.query(checkMemberQuery, [userId, group.id], (err, memberResults) => {
      if (err) {
        console.error("Check member error:", err);
        return res.status(500).json({ error: "Error checking membership" });
      }

      if (memberResults.length > 0) {
        // ✅ Already a member, just return success
        return res.json({ success: true, group });
      }

      // 👉 Step 2: Count current members
      const countQuery = `SELECT COUNT(*) AS count FROM collab_members WHERE collab_id = ?`;
      db.query(countQuery, [group.id], (err, countResult) => {
        if (err) {
          console.error("Count error:", err);
          return res.status(500).json({ error: "Error checking group members" });
        }

        const currentCount = countResult[0].count;

        if (currentCount >= group.num_members) {
          return res.status(403).json({ error: "Group is full" });
        }

        // 👉 Step 3: Add user
        const insertQuery = `INSERT INTO collab_members (user_id, collab_id) VALUES (?, ?)`;
        db.query(insertQuery, [userId, group.id], (err) => {
          if (err) {
            console.error("Insert error:", err);
            return res.status(500).json({ error: "Failed to join group" });
          }

          res.json({ success: true, group });
        });
      });
    });
  });
});


app.get("/get-messages/:code", (req, res) => {
  const groupCode = req.params.code;

  const getCollabIdQuery = `SELECT id FROM collab WHERE group_code = ?`;

  db.query(getCollabIdQuery, [groupCode], (err, results) => {
    if (err || results.length === 0) {
      console.error("Error fetching collab_id:", err);
      return res.status(404).json({ error: "Group not found" });
    }

    const collabId = results[0].id;

    const getMessagesQuery = `
      SELECT username, message, sent_at
      FROM group_messages
      WHERE collab_id = ?
      ORDER BY sent_at ASC
    `;

    db.query(getMessagesQuery, [collabId], (err, messages) => {
      if (err) {
        console.error("Error fetching messages:", err);
        return res.status(500).json({ error: "Failed to fetch messages" });
      }

      res.json(messages);
    });
  });
});

app.post("/send-message", (req, res) => {
  const { groupCode, userId, username, message } = req.body;

  // Step 1: Resolve collab_id from group_code
  const getCollabIdQuery = `SELECT id FROM collab WHERE group_code = ?`;

  db.query(getCollabIdQuery, [groupCode], (err, results) => {
    if (err || results.length === 0) {
      console.error("Error fetching collab_id:", err);
      return res.status(404).json({ error: "Group not found" });
    }

    const collabId = results[0].id;

    // Step 2: Insert message
    const insertQuery = `
      INSERT INTO group_messages (collab_id, user_id, username, message)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertQuery, [collabId, userId, username, message], (err) => {
      if (err) {
        console.error("Error saving message:", err);
        return res.status(500).json({ error: "Failed to save message" });
      }

      res.status(200).json({ success: true });
    });
  });
});


app.get('/api/joined-groups/:userId', (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT c.group_title, c.group_code
    FROM collab_members cm
    JOIN collab c ON cm.collab_id = c.id
    WHERE cm.user_id = ? AND c.user_id != ?
  `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching joined groups:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json(results);
  });
});

app.delete("/api/groups/:code", (req, res) => {
  const { code } = req.params;

  // First get the collab ID
  const getCollabIdQuery = `SELECT id FROM collab WHERE group_code = ?`;

  db.query(getCollabIdQuery, [code], (err, result) => {
    if (err || result.length === 0) {
      console.error("Error fetching collab ID:", err);
      return res.status(404).json({ error: "Group not found" });
    }

    const collabId = result[0].id;

    // Delete dependencies first (to maintain foreign key constraints)
    const deleteMessages = `DELETE FROM group_messages WHERE collab_id = ?`;
    const deleteMembers = `DELETE FROM collab_members WHERE collab_id = ?`;
    const deleteExpenses = `DELETE FROM group_expenses WHERE group_code = ?`;
    const deleteGroup = `DELETE FROM collab WHERE id = ?`;

    db.query(deleteMessages, [collabId], () => {
      db.query(deleteMembers, [collabId], () => {
        db.query(deleteExpenses, [code], () => {
          db.query(deleteGroup, [collabId], (err) => {
            if (err) {
              console.error("Error deleting group:", err);
              return res.status(500).json({ error: "Deletion failed" });
            }
            res.json({ success: true, message: "Group deleted" });
          });
        });
      });
    });
  });
});



app.get('/api/last-expense/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT MAX(created_at) AS last
    FROM daily_expenses
    WHERE user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });

    const last = results[0].last;
    if (!last) return res.json({ noExpenses: true }); // new user or no logs yet

    const diffMs = new Date() - new Date(last);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    res.json({ daysSinceLast: days });
  });
});




app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
