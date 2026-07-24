import sqlite3
import json
import time

db_path = r'C:\Users\MANSI\.local\share\mimocode\mimocode.db'
db = sqlite3.connect(db_path)
db.row_factory = sqlite3.Row

# What does the user actually ask for in "analyze" sessions?
# Let me get user messages with their actual content
sessions_to_check = [
    'ses_0e0fa3d49ffeb6ip4Y9DYdFlgL',  # AppForge - Analyzing all code
    'ses_072527419ffedzXK1Vh2h4AwQw',  # fin-track - Analyze all code
    'ses_0f1464f14ffehUITkq3UScYqxC',  # meetingmind - Analyzing code
    'ses_0eaa18c80ffe2A9VBRzZxJ4kcA',  # AI Customer Review - Understanding
    'ses_0f13c23eaffe2RYW5XYETyjjpk',  # AI Smart Exam Manager - architecture review
    'ses_0f12f42a9ffe5k4bYMq6eAfFAC',  # AppForge code analysis
    'ses_0a9b1a084ffeGjIf4wrMnFgO29',  # OmniRegistrar - Comprehensive analysis
    'ses_0ca3c1a97ffeDo4PHG6U11mXBC',  # AI Customer Review Analyzer - 1st
    'ses_0b84de8abffeCVcSPy8ZGhSmLV',  # AI SAAS APP - 1st
]

for sid in sessions_to_check:
    print("=== {} ===".format(sid[-12:]))
    rows = db.execute("""
        SELECT substr(json_extract(m.data, '$.content'), 1, 500) as content, m.time_created
        FROM message m
        WHERE m.session_id = ?
          AND json_extract(m.data, '$.role') = 'user'
        ORDER BY m.time_created ASC
        LIMIT 10
    """, (sid,)).fetchall()
    for i, r in enumerate(rows):
        content = (r['content'] or '').strip()
        if content:
            print('  User {}: {}'.format(i+1, content[:300]))
        else:
            print('  User {}: (empty/encoded)'.format(i+1))
    
    # Also get first few assistant tool calls to see the workflow
    rows2 = db.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               substr(json_extract(p.data, '$.state.input'), 1, 300) as inp
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
          AND json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
        ORDER BY m.time_created ASC
        LIMIT 20
    """, (sid,)).fetchall()
    print('  First 20 tool calls:')
    for r in rows2:
        tool = r['tool'] or ''
        inp = (r['inp'] or '').replace('\n', ' ')[:200]
        print('    {} | {}'.format(tool, inp))
    print()

db.close()
