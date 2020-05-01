from psycopg2.pool import ThreadedConnectionPool
from passlib.hash import pbkdf2_sha256
from jwt import encode, decode, ExpiredSignatureError
import datetime
import time

POOL = ThreadedConnectionPool(minconn=1, maxconn=4,
                              host='localhost' , port='5432', database='postgres',
                              user='postgres', password='password')

SECRET = 'MonkeyBusiness123'  # For JWT. Change to environment variable in serious deployment.


def connection_from_pool(operation):
    
    def decorated_operation(*args):
        connection = None
        num_retries = 0
        
        while connection is None and num_retries < 3:
            try:
                connection = POOL.getconn()
            except:
                time.sleep(1)
                num_retries += 1
        
        if connection is None:
            raise Exception('Pool exhausted')
            
        try:
            result = operation(connection, *args)
            connection.commit()
            return result
        except:
            connection.rollback()
            raise Exception('Operation rolled back')
        finally:
            connection.reset()
            POOL.putconn(connection)
    
    return decorated_operation


@connection_from_pool
def startup_db(connection, drop_on_startup=True):
    if drop_on_startup:
        with connection.cursor() as cursor:
            cursor.execute('DROP TABLE IF EXISTS messages')
        with connection.cursor() as cursor:
            cursor.execute('DROP TABLE IF EXISTS refresh')
        with connection.cursor() as cursor:
            cursor.execute('DROP TABLE IF EXISTS users')
    
    with connection.cursor() as cursor:
        cursor.execute('CREATE TABLE IF NOT EXISTS users ' +
                       '(username TEXT PRIMARY KEY, password_hash TEXT)') 
    with connection.cursor() as cursor:
        cursor.execute('CREATE TABLE IF NOT EXISTS refresh ' +
                       '(refresh_token TEXT PRIMARY KEY, username TEXT REFERENCES users(username))')
    with connection.cursor() as cursor:
        cursor.execute('CREATE TABLE IF NOT EXISTS messages ' +
                       '(id SERIAL PRIMARY KEY, username TEXT REFERENCES users(username), message TEXT)')


@connection_from_pool
def register_user(connection, username, password):    
    with connection.cursor() as cursor:
        password_hash = pbkdf2_sha256.hash(password)
        cursor.execute('INSERT INTO users VALUES (%s, %s) ON CONFLICT (username) DO NOTHING',
                       (username, password_hash))
        success = (cursor.rowcount > 0)  # successful if user didn't previously exist
        return success


@connection_from_pool
def verify_password(connection, username, password):
    with connection.cursor() as cursor:
        cursor.execute('SELECT password_hash FROM users WHERE username = %s', (username,))
        row = cursor.fetchone()
        if row is None:  # user does not exist
            return False
        existing_password_hash = row[0]
        success = pbkdf2_sha256.verify(password, existing_password_hash)
        return success


@connection_from_pool
def change_password(connection, username, new_password):
    with connection.cursor() as cursor:
        password_hash = pbkdf2_sha256.hash(new_password)
        cursor.execute('UPDATE users SET password_hash = %s WHERE username = %s',
                       (password_hash, username))


@connection_from_pool
def load_all_usernames(connection):
    with connection.cursor() as cursor:
        cursor.execute('SELECT username FROM users GROUP BY username ORDER BY username')
        usernames = [row[0] for row in cursor.fetchall()]
        return usernames


@connection_from_pool
def contains_username(connection, username):
    with connection.cursor() as cursor:
        cursor.execute('SELECT count(*) FROM users where username = %s', (username,))
        row = cursor.fetchone()
        success = (row[0] > 0) 
        return success
    

@connection_from_pool
def load_messages(connection, username):
    with connection.cursor() as cursor:
        cursor.execute('SELECT message FROM messages WHERE username = %s ORDER BY id', (username,))
        messages = [row[0] for row in cursor.fetchall()]
        return messages


@connection_from_pool
def save_message(connection, username, message):
    with connection.cursor() as cursor:
        cursor.execute('INSERT INTO messages(username, message) VALUES (%s, %s)', (username, message))


def create_token(username):
    payload = {'username' : username,
               'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=60)}
    token = encode(payload, SECRET, algorithm='HS256').decode('utf-8')
    return token


@connection_from_pool
def create_refresh_token(connection, username, password, old_password=None):
    with connection.cursor() as cursor:
        refresh_payload = {'username' : username, 'password' : password}
        refresh_token = encode(refresh_payload, SECRET, algorithm='HS256').decode('utf-8')
        cursor.execute('INSERT INTO refresh VALUES (%s, %s) ' +
                       'ON CONFLICT (refresh_token) DO UPDATE SET username = EXCLUDED.username',
                       (refresh_token, username))

    if old_password is not None:
        with connection.cursor() as cursor:
            old_refresh_payload = {'username' : username, 'password' : old_password}
            old_refresh_token = encode(old_refresh_payload, SECRET, algorithm='HS256').decode('utf-8')
            cursor.execute('DELETE FROM refresh WHERE refresh_token = %s', (old_refresh_token,))

    return refresh_token


@connection_from_pool
def get_username_and_token_using_refresh_token(connection, refresh_token):
    with connection.cursor() as cursor:
        cursor.execute('SELECT username FROM refresh WHERE refresh_token = %s', (refresh_token,))
        row = cursor.fetchone()
        
        if row is None:   # refresh tokens removed upon change of password
            return None
        
        username = row[0]
        new_token = create_token(username)
        return {'username' : username, 'token' : new_token}
    
    
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
        return get_username_and_token_using_refresh_token(refresh_token)
    except:  # token signature invalid
        return None  