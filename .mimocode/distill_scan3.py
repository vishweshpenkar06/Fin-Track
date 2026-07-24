import sqlite3
import json
import time

db_path = r'C:\Users\MANSI\.local\share\mimocode\mimocode.db'
db = sqlite3.connect(db_path)
db.row_factory = sqlite3.Row

# Get user messages from the main fin-track session ses_072527419ffedzXK1Vh2h4AwQw
print("=== USER MESSAGES IN MAIN SESSION ses_072527419ffe (Analyze all code) ===")
rows = db.execute("""
    SELECT m.id, substr(json_extract(m.data, '$.content'), 1, 500) as content, m.time_created
    FROM message m
    WHERE m.session_id = 'ses_072527419ffedzXK1Vh2h4AwQw'
      AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created ASC
""").fetchall()
for i, r in enumerate(rows):
    content = (r['content'] or '').replace('\n', ' ')[:300]
    print('  User msg {}: {}'.format(i+1, content))
print()

# Get the key assistant action patterns (edit/write tool calls)  
print("=== ASSISTANT EDITES IN ses_072527419ffe ===")
rows = db.execute("""
    SELECT json_extract(p.data, '$.tool') as tool,
           substr(json_extract(p.data, '$.state.input'), 1, 400) as inp,
           substr(json_extract(p.data, '$.state.output'), 1, 200) as out,
           m.time_created
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_072527419ffedzXK1Vh2h4AwQw'
      AND json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') IN ('edit', 'write')
    ORDER BY m.time_created ASC
    LIMIT 40
""").fetchall()
for r in rows:
    tool = r['tool']
    inp = (r['inp'] or '').replace('\n', ' ')[:250]
    print('  {} | {}'.format(tool, inp))
print()

# Look at the other big sessions 
print("=== USER MESSAGES IN ses_0e0fa3d49ffe (AppForge - Analyzing all code) ===")
rows = db.execute("""
    SELECT substr(json_extract(m.data, '$.content'), 1, 500) as content, m.time_created
    FROM message m
    WHERE m.session_id = 'ses_0e0fa3d49ffeb6ip4Y9DYdFlgL'
      AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created ASC
""").fetchall()
for i, r in enumerate(rows):
    content = (r['content'] or '').replace('\n', ' ')[:300]
    print('  User msg {}: {}'.format(i+1, content))
print()

print("=== USER MESSAGES IN ses_0b84de8abffe (AI SAAS APP - 1st) ===")
rows = db.execute("""
    SELECT substr(json_extract(m.data, '$.content'), 1, 500) as content, m.time_created
    FROM message m
    WHERE m.session_id = 'ses_0b84de8abffeCVcSPy8ZGhSmLV'
      AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created ASC
""").fetchall()
for i, r in enumerate(rows):
    content = (r['content'] or '').replace('\n', ' ')[:300]
    print('  User msg {}: {}'.format(i+1, content))
print()

print("=== USER MESSAGES IN ses_0ca3c1a97ffe (AI Customer Review Analyzer - 1st) ===")
rows = db.execute("""
    SELECT substr(json_extract(m.data, '$.content'), 1, 500) as content, m.time_created
    FROM message m
    WHERE m.session_id = 'ses_0ca3c1a97ffeDo4PHG6U11mXBC'
      AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created ASC
""").fetchall()
for i, r in enumerate(rows):
    content = (r['content'] or '').replace('\n', ' ')[:300]
    print('  User msg {}: {}'.format(i+1, content))
print()

# Check for repeated type-check / build / lint patterns across ALL projects
print("=== REPEATED CI VERIFICATION COMMANDS (all projects) ===")
rows = db.execute("""
    SELECT json_extract(p.data, '$.state.input') as cmd,
           s.directory,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    JOIN session s ON s.id = m.session_id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') = 'bash'
      AND (json_extract(p.data, '$.state.input') LIKE '%pnpm type-check%'
           OR json_extract(p.data, '$.state.input') LIKE '%pnpm build%'
           OR json_extract(p.data, '$.state.input') LIKE '%pnpm test%'
           OR json_extract(p.data, '$.state.input') LIKE '%pnpm lint%'
           OR json_extract(p.data, '$.state.input') LIKE '%npx tsc%')
      AND m.time_created > ?
    GROUP BY cmd, s.directory
    ORDER BY n DESC
    LIMIT 30
""", (int((time.time() - 30*86400) * 1000),)).fetchall()
for r in rows:
    cmd = (r['cmd'] or '').replace('\n', ' ')[:180]
    dir_name = (r['directory'] or '').split('\\')[-1] if r['directory'] else '?'
    print('  {:4d}x | {:20s} | {}'.format(r['n'], dir_name, cmd))
print()

# Check for "comprehensive analysis" / "analyze all code" pattern
print("=== COMPREHENSIVE ANALYSIS SESSIONS ===")
rows = db.execute("""
    SELECT s.id, s.title, s.directory, count(m.id) as msgs
    FROM session s
    JOIN message m ON m.session_id = s.id
    WHERE (s.title LIKE '%analy%' OR s.title LIKE '%review%' OR s.title LIKE '%comprehensive%'
           OR s.title LIKE '%understand%' OR s.title LIKE '%architecture%')
      AND s.time_created > ?
    GROUP BY s.id
    ORDER BY msgs DESC
""", (int((time.time() - 30*86400) * 1000),)).fetchall()
for r in rows:
    dir_name = (r['directory'] or '').split('\\')[-1] if r['directory'] else '?'
    print('  {} | msgs={:3d} | dir={} | title={}'.format(r['id'][-12:], r['msgs'], dir_name, (r['title'] or '')[:60]))

db.close()
