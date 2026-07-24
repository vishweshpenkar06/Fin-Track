import sqlite3
import json
import time
import os

db_path = r'C:\Users\MANSI\.local\share\mimocode\mimocode.db'
db = sqlite3.connect(db_path)
db.row_factory = sqlite3.Row

cutoff_ms = int((time.time() - 30 * 86400) * 1000)

print("=== RECENT SESSIONS (last 30 days) ===")
rows = db.execute(
    'SELECT id, directory, title, time_created FROM session WHERE time_created > ? ORDER BY time_created DESC',
    (cutoff_ms,)
).fetchall()
for r in rows:
    title = r['title'][:80] if r['title'] else '(none)'
    print('  {} | ts={} | title={}'.format(r['id'], r['time_created'], title))
print('--- total: {} sessions ---\n'.format(len(rows)))

print("=== TOP TOOL USAGE (assistant turns, last 30 days) ===")
rows = db.execute("""
    SELECT json_extract(p.data, '$.tool') as tool,
           substr(json_extract(p.data, '$.state.input'), 1, 200) as input_preview,
           count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND m.time_created > ?
    GROUP BY tool, input_preview
    ORDER BY n DESC
    LIMIT 40
""", (cutoff_ms,)).fetchall()
for r in rows:
    tool = r['tool'] or ''
    preview = (r['input_preview'] or '')[:120].replace('\n', ' ')
    print('  {:4d}x | {:20s} | {}'.format(r['n'], tool, preview))
print()

print("=== USER TURN KEYWORD SEARCH ===")
keywords = ['again', 'every time', 'like last time', 'the usual', 'repeat', 'same as before', 'workflow']
for kw in keywords:
    rows = db.execute("""
        SELECT m.id, substr(json_extract(m.data, '$.content'), 1, 200) as preview, m.session_id
        FROM message m
        WHERE json_extract(m.data, '$.role') = 'user'
          AND json_extract(m.data, '$.content') LIKE ?
          AND m.time_created > ?
        LIMIT 10
    """, ('%' + kw + '%', cutoff_ms)).fetchall()
    if rows:
        print('  Keyword "{}" ({} hits):'.format(kw, len(rows)))
        for r in rows:
            preview = (r['preview'] or '')[:150].replace('\n', ' ')
            print('    [{}] {}'.format(r['session_id'], preview))
print()

print("=== REPEATED COMMAND SEQUENCES (tool call patterns per session) ===")
rows = db.execute("""
    SELECT m.session_id, group_concat(json_extract(p.data, '$.tool'), ' -> ') as seq, count(*) as cnt
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.type') = 'tool'
      AND m.time_created > ?
    GROUP BY m.session_id
    HAVING cnt >= 3
    ORDER BY cnt DESC
    LIMIT 20
""", (cutoff_ms,)).fetchall()
for r in rows:
    print('  [{}] ({} tools): {}'.format(r['session_id'], r['cnt'], r['seq']))
print()

print("=== TASK TABLE ===")
try:
    rows = db.execute("SELECT id, session_id, status, title FROM task ORDER BY id DESC LIMIT 20").fetchall()
    for r in rows:
        print('  task {} | ses={} | status={} | title={}'.format(r['id'], r['session_id'], r['status'], (r['title'] or '')[:80]))
except Exception as e:
    print('  No task table or error: {}'.format(e))
print()

print("=== ACTOR REGISTRY (subagents) ===")
try:
    rows = db.execute("SELECT * FROM actor_registry ORDER BY rowid DESC LIMIT 20").fetchall()
    cols = [d[0] for d in db.execute("SELECT * FROM actor_registry LIMIT 1").description]
    for r in rows:
        print('  {}'.format(dict(zip(cols, r))))
except Exception as e:
    print('  No actor_registry table or error: {}'.format(e))

db.close()
