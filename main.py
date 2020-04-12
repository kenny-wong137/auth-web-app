from flask import Flask, jsonify, make_response, request, abort
from gevent.pywsgi import WSGIServer
from dbaccess import (startup_db, register_user, verify_password,
                      load_all_usernames, contains_username, load_messages, save_message,
                      create_token, verify_token_and_extract_username_and_new_token)

app = Flask(__name__)


def authenticate(db_action):
    username = request.json.get('username')
    password = request.json.get('password')
    if not isinstance(username, str) or not isinstance(password, str):
        return abort(400)
    
    success = db_action(username, password)
    if success:
        response_body = create_token(username, require_refresh=True)
                            # i.e. response contains token, refresh_token
        return make_response(jsonify(response_body), 200)
    else:
        return abort(401)


@app.route('/register', methods=['POST'])
def register():
    return authenticate(register_user)


@app.route('/login', methods=['POST'])
def login():
    return authenticate(verify_password)


@app.route('/users', methods=['GET'])
def read_all_usernames():
    credentials = verify_token_and_extract_username_and_new_token(request.headers)
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
    credentials = verify_token_and_extract_username_and_new_token(request.headers)
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
    credentials = verify_token_and_extract_username_and_new_token(request.headers)
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


@app.route('/', methods=['GET'])
def frontend():
    return app.send_static_file('index.html')


if __name__ == '__main__':
    startup_db()
    WSGIServer(('', 5000), app).serve_forever()
    # NB in a serious deployment we would use HTTPS,
    # e.g. setting the constructor arguments keyfile=key.pem and certfile=cert.pem
