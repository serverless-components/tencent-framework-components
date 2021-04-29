import os
import json
from flask import Flask, jsonify, render_template, request, url_for, send_from_directory
from werkzeug.utils import secure_filename

IS_SERVERLESS = bool(os.environ.get('SERVERLESS'))

app = Flask(__name__)

def initUploadDir():
  UPLOAD_DIR = '/tmp/uploads' if IS_SERVERLESS else os.getcwd() + '/uploads'
  if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
  app.config['UPLOAD_DIR'] = UPLOAD_DIR

initUploadDir()

@app.route("/")
def index():
    return render_template('index.html')

# 获取函数 event
@app.route("/event")
def event():
    event = os.environ.get("__SLS_EVENT__")
    event = json.loads(event)
    return jsonify(data=event)

@app.route("/users", methods=['GET', 'POST'])
def users():
    if request.method == 'POST':
      print(request.form)
      id = request.form.get('id');
      user = {'id': id, 'name': 'test1'}
      return jsonify(data=user)
    else:
      limit = request.args.get('limit')
      data = {
        'count': limit or 2,
        'users': [{'name': 'test1'}, {'name': 'test2'}]
      }
      return jsonify(data=data)

@app.route("/users/<id>")
def getUser(id):
    return jsonify(data={'name': 'test1'})

# 上传文件示例
@app.route('/upload',methods=['POST'])
def upload():
  if request.method == 'POST':
    if 'avatar' not in request.files:
      res = {"error": "No avatar file upload"}
      return jsonify(data=res)
    avatar = request.files['avatar']

    if avatar.filename == '':
      res = {"error": "No avatar file selected"}
      return jsonify(data=res)

    if avatar:
      filename = secure_filename(avatar.filename);
      filePath = os.path.join(app.config['UPLOAD_DIR'], filename)
      avatar.save(filePath)
      uploadUrl = url_for('uploaded_file', filename=filename)
      res = {'upload': uploadUrl}
      return jsonify(data=res)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_DIR'], filename)

if IS_SERVERLESS != True:
  # run app in debug mode on port 5000
  app.run(debug=True, port=5000)
