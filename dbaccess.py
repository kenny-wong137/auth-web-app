from psycopg2 import connect
from passlib.hash import pbkdf2_sha256
from jwt import encode, decode, ExpiredSignatureError
import datetime

DB_CONNECTION = connect(user='postgres', password='password',
                        host='localhost' , port='5432', database='postgres')

SECRET = 'MonkeyBusiness123'  # for JWT. Change to environment variable in serious deployment.


def startup_db(drop_on_startup=True):
    if drop_on_startup:
        drop_tables()
    create_tables_if_necessary()


def create_tables_if_necessary():
    cursor = DB_CONNECTION.cursor()
    
    cursor.execute('CREATE TABLE IF NOT EXISTS users ' +
                   '(username TEXT PRIMARY KEY, password_hash TEXT)')
    DB_CONNECTION.commit()
    
    cursor.execute('CREATE TABLE IF NOT EXISTS refresh ' +
                   '(refresh_token TEXT PRIMARY KEY, username TEXT REFERENCES users(username))')
    DB_CONNECTION.commit()

    cursor.execute('CREATE TABLE IF NOT EXISTS messages ' +
                   '(id SERIAL PRIMARY KEY, username TEXT REFERENCES users(username), message TEXT)')
    DB_CONNECTION.commit()
    
    cursor.close()


def drop_tables():
    cursor = DB_CONNECTION.cursor()
    
    cursor.execute('DROP TABLE IF EXISTS messages')
    DB_CONNECTION.commit()
    
    cursor.execute('DROP TABLE IF EXISTS refresh')
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


def change_password(username, new_password):
    password_hash = pbkdf2_sha256.hash(new_password)
    cursor = DB_CONNECTION.cursor()
    cursor.execute('UPDATE users SET password_hash = %s WHERE username = %s',
                   (password_hash, username))
    DB_CONNECTION.commit()
    cursor.close()


def load_all_usernames():
    cursor = DB_CONNECTION.cursor()
    cursor.execute('SELECT username FROM users GROUP BY username ORDER BY username')
    DB_CONNECTION.commit()
    
    usernames = [row[0] for row in cursor.fetchall()]
    cursor.close()
    return usernames


def contains_username(username):
    cursor = DB_CONNECTION.cursor()
    cursor.execute('SELECT * FROM users where username = %s', (username,))
    DB_CONNECTION.commit()
    
    row = cursor.fetchone()
    return row is not None
    

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


def create_token(username):
    payload = {'username' : username,
               'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=60)}
    token = encode(payload, SECRET, algorithm='HS256').decode('utf-8')
    return token


def create_refresh_token(username, password, old_password=None):
    refresh_payload = {'username' : username, 'password' : password}
    refresh_token = encode(refresh_payload, SECRET, algorithm='HS256').decode('utf-8')

    cursor = DB_CONNECTION.cursor()
    cursor.execute('INSERT INTO refresh VALUES (%s, %s) ' +
                   'ON CONFLICT (refresh_token) DO UPDATE SET username = EXCLUDED.username',
                   (refresh_token, username))
    
    if old_password is not None:
        old_refresh_payload = {'username' : username, 'password' : old_password}
        old_refresh_token = encode(old_refresh_payload, SECRET, algorithm='HS256').decode('utf-8')
        cursor.execute('DELETE FROM refresh WHERE refresh_token = %s', (old_refresh_token,))
        print('row count: {}'.format(cursor.rowcount))
    DB_CONNECTION.commit()
    
    return refresh_token
        
    
def verify_token_and_extract_username_and_new_token(request_header):
    auth_field = request_header.get('Authorization')
    if auth_field is None or auth_field[:7] != 'Bearer ':
        return None
    words = auth_field[7:].split(' ')
    if len(words) != 2 or len(words[0]) == 0 or len(words[1]) == 0:
        return None
    token = words[0]
    refresh_token = words[1]
    
    try:
        payload = decode(token.encode('utf-8'), SECRET, algorithms=['HS256'])
        username = payload.get('username')
        return {'username' : username}
    except ExpiredSignatureError: # token expired
        cursor = DB_CONNECTION.cursor()
        cursor.execute('SELECT username FROM refresh WHERE refresh_token = %s', (refresh_token,))
        DB_CONNECTION.commit()
        row = cursor.fetchone()
        
        if row is None:   # refresh tokens removed upon change of password
            return None
        
        username_in_db = row[0]
        refresh_payload = decode(refresh_token.encode('utf-8'), SECRET, algorithms=['HS256'])
        if username_in_db != refresh_payload['username']:  # this check isn't strictly necessary
            return None
        
        new_token = create_token(username_in_db)
        cursor.close()
        return {'username' : username_in_db, 'token' : new_token}
    except:  # token signature invalid
        return None  
