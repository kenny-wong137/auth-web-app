from psycopg2 import connect
from passlib.hash import pbkdf2_sha256

DB_CONNECTION = connect(user='postgres', password='password',
                        host='localhost' , port='5432', database='postgres')


def startup(drop_on_startup=True):
    if drop_on_startup:
        drop_tables()
    create_tables_if_necessary()


def create_tables_if_necessary():
    cursor = DB_CONNECTION.cursor()
    
    cursor.execute('CREATE TABLE IF NOT EXISTS users ' +
                   '(username TEXT PRIMARY KEY, password_hash TEXT)')
    DB_CONNECTION.commit()

    cursor.execute('CREATE TABLE IF NOT EXISTS messages ' +
                   '(id SERIAL PRIMARY KEY, username TEXT REFERENCES users(username), message TEXT)')
    DB_CONNECTION.commit()
    
    cursor.close()


def drop_tables():
    cursor = DB_CONNECTION.cursor()
    
    cursor.execute('DROP TABLE IF EXISTS messages')
    DB_CONNECTION.commit()
    
    cursor.execute('DROP TABLE IF EXISTS users')
    DB_CONNECTION.commit()
    
    cursor.close()
    

def register_user(username, password):
    password_hash = pbkdf2_sha256.hash(password)
    cursor = DB_CONNECTION.cursor()
    cursor.execute('INSERT INTO users VALUES (%s, %s) ON CONFLICT (username) DO NOTHING',
                   (username, password_hash))
    DB_CONNECTION.commit()
    
    success = cursor.rowcount > 0  # successful if user didn't previously exist
    cursor.close()
    return success


def verify_password(username, password):
    cursor = DB_CONNECTION.cursor()
    cursor.execute('SELECT password_hash FROM users WHERE username = %s', (username,))
    DB_CONNECTION.commit()
    
    row = cursor.fetchone()
    if row is None:  # user does not exist
        return False
    
    existing_password_hash = row[0]
    success = pbkdf2_sha256.verify(password, existing_password_hash)
    cursor.close()
    return success


def load_messages(username):
    cursor = DB_CONNECTION.cursor()
    cursor.execute('SELECT message FROM messages WHERE username = %s ORDER BY id', (username,))
    DB_CONNECTION.commit()
    
    messages = [row[0] for row in cursor.fetchall()]
    
    cursor.close()
    return messages


def save_message(username, message):
    cursor = DB_CONNECTION.cursor()
    cursor.execute('INSERT INTO messages(username, message) VALUES (%s, %s)', (username, message))
    DB_CONNECTION.commit()
    cursor.close()


startup()
