from flask import Flask, jsonify, render_template
app = Flask(__name__)


@app.route("/")
def index():
    return render_template('index.html')


@app.route("/users")
def users():
    users = [{'name': 'test1'}, {'name': 'test2'}]
    return jsonify(data=users)


@app.route("/users/<id>")
def user(id):
    return jsonify(data={'name': 'test1'})
