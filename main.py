from flask import Flask, jsonify, make_response, request, abort
from dbaccess import register_user, verify_password, load_messages, save_message
from jwtverify import create_token, verify_token_and_extract_username

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


@app.errorhandler(400)
def bad_request(error):
    return make_response(jsonify({'error': 'Bad request'}), 400)


@app.errorhandler(401)
def unauthorized(error):
    return make_response(jsonify({'error': 'Unauthorized'}), 401)


@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)


def authenticate(db_action):
    username = request.json['username']
    password = request.json['password']
    if not isinstance(username, str) or not isinstance(password, str):
        return abort(400)
    
    success = db_action(username, password)
    if success:
        token = create_token(username)
        response_body = {'username' : username, 'token' : token}
        return make_response(jsonify(response_body), 200)
    else:
        return abort(401)


@app.route('/register', methods=['POST'])
def register():
    return authenticate(register_user)


@app.route('/login', methods=['POST'])
def login():
    return authenticate(verify_password)


@app.route('/messages', methods=['GET'])
def read_messages():
    username = verify_token_and_extract_username(request.headers)
    if username is not None:
        messages = load_messages(username)
        response_body = {'username' : username, 'messages' : messages}
        return make_response(jsonify(response_body), 200)
    else:
        return abort(401)


@app.route('/messages', methods=['POST'])
def write_message():
    message = request.json['message']
    if not isinstance(message, str):
        return abort(400)
    username = verify_token_and_extract_username(request.headers)
    if username is not None:
        save_message(username, message)
        return make_response('', 200)
    else:
        return abort(401)
    

@app.route('/register', methods=['OPTIONS'])
@app.route('/login', methods=['OPTIONS'])
@app.route('/messages', methods=['OPTIONS'])
def options():
    response = make_response('', 200)
    return response


@app.after_request
def add_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Origin,Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
    return response
    

@app.route('/', methods=['GET'])
def frontend():
    return app.send_static_file('index.html')


if __name__ == '__main__':
    app.run()
