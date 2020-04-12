from jwt import encode, decode

SECRET = 'MonkeyBusiness123'  # change to environment variable

def create_token(username):
    payload = {'username' : username}
    token = encode(payload, SECRET, algorithm='HS256')
    return token.decode('utf-8')

def verify_token_and_extract_username(request_header):
    auth_field = request_header.get('Authorization')
    if auth_field is None or auth_field[:7] != 'Bearer ':
        return None
    token = auth_field[7:].encode('utf-8')
    
    try:
        payload = decode(token, SECRET, algorithms=['HS256'])
        return payload.get('username')
    except:  # token signature invalid
        return None  

# WARNING: The JWT has unlimited lifetime.
# In a serious implementation, the JWT would have an expiry time, and refresh tokens would be issued.
