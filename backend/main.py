from flask import Flask, jsonify, make_response, request, abort
from gevent.pywsgi import WSGIServer
from dbaccess import (startup_db, register_user, verify_password, change_password,
                      load_all_usernames, contains_username, load_messages, save_message,
                      create_token, create_refresh_token,
                      verify_token_and_extract_username_and_new_token)

app = Flask(__name__)


def _authenticate(db_action):
    username = request.json.get('username')
    password = request.json.get('password')
    if not isinstance(username, str) or not isinstance(password, str):
        return abort(400)
    
    success = db_action(username, password)
    if success:
        token = create_token(username)
        refresh_token = create_refresh_token(username, password)
        response_body = {'token' : token, 'refresh_token' : refresh_token}
        return make_response(jsonify(response_body), 200)
    else:
        return abort(401)


@app.route('/register', methods=['POST'])
def register():
    return _authenticate(register_user)


@app.route('/login', methods=['POST'])
def login():
    return _authenticate(verify_password)


def _parse_header(request):
    auth_field = request.headers.get('Authorization')
    if auth_field is None or auth_field[:7] != 'Bearer ':
        return None
    
    words = auth_field[7:].split(' ')
    if len(words) != 2 or len(words[0]) == 0 or len(words[1]) == 0:
        return None
    
    token = words[0]
    refresh_token = words[1]
    return {'token': token, 'refresh_token': refresh_token}


@app.route('/password', methods=['POST'])
def password():
    credentials = verify_token_and_extract_username_and_new_token(_parse_header(request))
    if credentials is not None:
        old_password = request.json.get('old_password')
        new_password = request.json.get('new_password')
        if not isinstance(old_password, str) or not isinstance(new_password, str):
            return abort(400)
        
        if verify_password(credentials['username'], old_password):
            change_password(credentials['username'], new_password)
            new_refresh_token = create_refresh_token(
                    credentials['username'], new_password, old_password)
            response_body = {'refresh_token' : new_refresh_token}
            if 'token' in credentials:
                response_body['token'] = credentials['token']
            return make_response(jsonify(response_body), 200)
        else:
            return make_response(jsonify({'error' : 'Old password invalid'}), 403)
    else:
        abort(401)
        

@app.route('/users', methods=['GET'])
def read_all_usernames():
    credentials = verify_token_and_extract_username_and_new_token(_parse_header(request))
    if credentials is not None:
        usernames = load_all_usernames()
        response_body = {'usernames' : usernames}
        if 'token' in credentials:
            response_body['token'] = credentials['token']
        return make_response(jsonify(response_body), 200)
    else:
        return abort(401)
    
    
@app.route('/messages/<string:target_username>', methods=['GET'])
def read_messages(target_username):
    credentials = verify_token_and_extract_username_and_new_token(_parse_header(request))
    if credentials is not None:
        if contains_username(target_username):
            messages = load_messages(target_username)
            response_body = {'messages' : messages}
            if 'token' in credentials:
                response_body['token'] = credentials['token']
            return make_response(jsonify(response_body), 200)
        else:
            return abort(404)
    else:
        return abort(401)


@app.route('/messages/<string:target_username>', methods=['POST'])
def write_message(target_username):
    message = request.json.get('message')
    if not isinstance(message, str):
        return abort(400)
    credentials = verify_token_and_extract_username_and_new_token(_parse_header(request))
    if credentials is not None and credentials['username'] == target_username:
        save_message(target_username, message)
        response_body = {}
        if 'token' in credentials:
            response_body['token'] = credentials['token']
        return make_response(jsonify(response_body), 200)
    else:
        return abort(401)
    
    
@app.route('/register', methods=['OPTIONS'])
@app.route('/login', methods=['OPTIONS'])
@app.route('/users', methods=['OPTIONS'])
@app.route('/messages/<string:target_username>', methods=['OPTIONS'])
def options(*args):
    response = make_response('', 200)
    return response


@app.after_request
def add_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Origin,Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
    return response


@app.errorhandler(400)
def bad_request(error):
    return make_response(jsonify({'error': 'Bad request'}), 400)


@app.errorhandler(401)
def unauthorized(error):
    return make_response(jsonify({'error': 'Unauthorized'}), 401)


@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)


@app.errorhandler(405)
def method_not_allowed(error):
    return make_response(jsonify({'error': 'Method not allowed'}), 405)


@app.errorhandler(500)
def server_error(error):
    return make_response(jsonify({'error': 'Internal server error'}), 500)


if __name__ == '__main__':
    startup_db()
    WSGIServer(('', 5000), app).serve_forever()
