import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'performance.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Performance table (sample data)
c.execute('''CREATE TABLE IF NOT EXISTS performance
             (id INTEGER PRIMARY KEY AUTOINCREMENT,
              technique TEXT,
              metric TEXT,
              value REAL,
              unit TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')

# Insert sample performance data if empty
c.execute("SELECT COUNT(*) FROM performance")
if c.fetchone()[0] == 0:
    sample_data = [
        ('VM', 'startup_time', 45.2, 'seconds'),
        ('Container', 'startup_time', 2.1, 'seconds'),
        ('VM', 'cpu_usage', 12.5, '%'),
        ('Container', 'cpu_usage', 5.3, '%'),
        ('VM', 'memory_usage', 1024, 'MB'),
        ('Container', 'memory_usage', 256, 'MB')
    ]
    c.executemany('INSERT INTO performance (technique, metric, value, unit) VALUES (?,?,?,?)', sample_data)
    print("✅ Sample performance data inserted.")

conn.commit()
conn.close()
print("✅ Database initialized with performance table.")