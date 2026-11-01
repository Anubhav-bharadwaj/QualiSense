import sqlite3

conn = sqlite3.connect('qualisense.db')
c = conn.cursor()
c.execute("PRAGMA table_info(investigations)")
cols = [col[1] for col in c.fetchall()]
print("Existing columns in investigations:", cols)

if "effectiveness_verification" not in cols:
    print("Adding effectiveness_verification column...")
    c.execute("ALTER TABLE investigations ADD COLUMN effectiveness_verification JSON")
    conn.commit()
    print("Column added successfully!")
else:
    print("Column already exists.")

conn.close()

