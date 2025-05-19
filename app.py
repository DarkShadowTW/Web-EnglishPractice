import os
from flask import Flask, render_template, jsonify

print("Current directory:", os.getcwd())  # 印出目前工作目錄，確保路徑正確

app = Flask(__name__)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/data')
def data():
    return jsonify({
        "word": "apple",
        "sentence": "I eat an apple every day."
    })

if __name__ == '__main__':
    app.run(debug=True)
