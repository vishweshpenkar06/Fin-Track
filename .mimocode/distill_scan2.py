import sqlite3
import json
import time
import os

db_path = r'C:\Users\MANSI\.local\share\mimocode\mimocode.db'
db = sqlite3.connect(db_path)
db.row_factory = sqlite3.Row

cutoff_ms = int((time.time() - 30 * 86400) * 1000)

# 1. Find all user messages in the fin-track project
print("=== USER MESSAGES IN FIN-TRACK PROJECT (last 30 days) ===")
rows = db.execute("""
    SELECT m.id, m.session_id, substr(json_extract(m.data, '$.content'), 1, 500) as content, m.time_created
    FROM message m
    JOIN session s ON s.id = m.session_id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND s.directory LIKE '%fin-track%'
      AND m.time_created > ?
    ORDER BY m.time_created DESC
    LIMIT 50
""", (cutoff_ms,)).fetchall()
for r in rows:
    content = (r['content'] or '').replace('\n', ' ')[:200]
    print('  [{}] {}'.format(r['session_id'][-12:], content))
print()

# 2. Find all assistant messages in fin-track sessions
print("=== ASSISTANT TOOL USAGE IN FIN-TRACK (last 30 days) ===")
rows = db.execute("""
    SELECT json_extract(p.data, '$.tool') as tool,
           substr(json_extract(p.data, '$.state.input'), 1, 300) as input_preview,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    JOIN session s ON s.id = m.session_id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND s.directory LIKE '%fin-track%'
      AND m.time_created > ?
    GROUP BY tool, input_preview
    ORDER BY n DESC
    LIMIT 50
""", (cutoff_ms,)).fetchall()
for r in rows:
    tool = r['tool'] or ''
    preview = (r['input_preview'] or '')[:150].replace('\n', ' ')
    print('  {:4d}x | {:20s} | {}'.format(r['n'], tool, preview))
print()

# 3. Search for bash commands in fin-track
print("=== BASH COMMANDS IN FIN-TRACK (last 30 days) ===")
rows = db.execute("""
    SELECT substr(json_extract(p.data, '$.state.input'), 1, 400) as cmd,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    JOIN session s ON s.id = m.session_id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'bash'
      AND s.directory LIKE '%fin-track%'
      AND m.time_created > ?
    GROUP BY cmd
    ORDER BY n DESC
    LIMIT 30
""", (cutoff_ms,)).fetchall()
for r in rows:
    cmd = (r['cmd'] or '').replace('\n', ' ')[:200]
    print('  {:4d}x | {}'.format(r['n'], cmd))
print()

# 4. Sessions that are NOT checkpoint-writer and NOT in fin-track (cross-project patterns)
print("=== NON-FIN-TRACK SESSIONS (cross-project patterns) ===")
rows = db.execute("""
    SELECT s.id, s.title, s.directory, count(m.id) as msg_count
    FROM session s
    JOIN message m ON m.session_id = s.id
    WHERE s.time_created > ?
      AND s.directory NOT LIKE '%fin-track%'
      AND s.title NOT LIKE '%checkpoint-writer%'
    GROUP BY s.id
    ORDER BY s.time_created DESC
    LIMIT 20
""", (cutoff_ms,)).fetchall()
for r in rows:
    dir_name = (r['directory'] or '').split('\\')[-1] if r['directory'] else '?'
    print('  {} | msgs={} | dir={} | title={}'.format(r['id'][-12:], r['msg_count'], dir_name, (r['title'] or '')[:60]))
print()

# 5. Look for repeated file writes in fin-track
print("=== REPEATED FILE WRITES IN FIN-TRACK ===")
rows = db.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    JOIN session s ON s.id = m.session_id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'write'
      AND s.directory LIKE '%fin-track%'
      AND m.time_created > ?
    GROUP BY inp
    HAVING n > 1
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,)).fetchall()
for r in rows:
    inp = (r['inp'] or '').replace('\n', ' ')[:200]
    print('  {:4d}x | {}'.format(r['n'], inp))
print()

# 6. Look for read patterns to specific files
print("=== REPEATED FILE READS IN FIN-TRACK ===")
rows = db.execute("""
    SELECT json_extract(p.data, '$.state.input') as inp,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    JOIN session s ON s.id = m.session_id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'read'
      AND s.directory LIKE '%fin-track%'
      AND m.time_created > ?
    GROUP BY inp
    HAVING n > 2
    ORDER BY n DESC
    LIMIT 20
""", (cutoff_ms,)).fetchall()
for r in rows:
    inp = (r['inp'] or '').replace('\n', ' ')[:200]
    print('  {:4d}x | {}'.format(r['n'], inp))

db.close()
