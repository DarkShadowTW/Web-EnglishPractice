import os
import json         #for save file
#Python Flask 框架中常見的 模組導入語句，它的意思是：
#Flask 應用的主類別。你會用 app = Flask(__name__) 來建立網站應用的入口。
#讓你能夠載入 HTML 模板（如 index.html），搭配變數渲染出完整頁面。
#把 Python 的字典（dict）轉成 JSON 格式回傳給前端。常用於 API 回應。
#讓你可以接收前端傳來的資料，例如表單內容、JSON 請求、GET/POST 參數。
from flask import Flask, render_template, jsonify, request   
#for JSON 存檔時要有 DATE/TIME
from datetime import datetime
#產生唯一 Key 的模組
import uuid

print("Current directory:", os.getcwd())  # 印出目前工作目錄，確保路徑正確

app = Flask(__name__)

SAVE_FILE = 'save.json'   #保存用的 JSON 檔案

@app.route('/')
def index():
    return render_template("index.html", delay=3000)  # 預設為 3000 毫秒

@app.route('/api/data')
def data():
    return jsonify({
        "EN": "apple",
        "CH": "I eat an apple every day."
    })

@app.route('/save', methods=['POST'])
def save():
    import re
    from datetime import datetime

    data = request.get_json()

    EN = data.get('EN', '').strip()
    CH = data.get('CH', '').strip()
    JP = data.get('JP', '').strip()
    email = data.get('email')

    if not email:
        return jsonify({'message': '未登入，無法儲存'}), 400
    if not (EN or CH or JP):
        return jsonify({'message': '空白資料不儲存'}), 400

    # 安全產生使用者檔名
    user_id = re.sub(r'\W+', '_', email.split('@')[0])
    filename = f'save_{user_id}.json'

    # 使用匯入時提供的時間，否則用現在時間
    date = data.get('date') or datetime.now().strftime("%Y-%m-%d")
    time = data.get('time') or datetime.now().strftime("%H:%M:%S")

    # 讀舊資料
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            saved = json.load(f)
    except FileNotFoundError:
        saved = {}

    # 產生唯一 key
    new_key = str(uuid.uuid4())
    saved[new_key] = {
        'EN': EN,
        'CH': CH,
        'JP': JP,
        'date': date,
        'time': time
    }

    # 寫入
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(saved, f, ensure_ascii=False, indent=2)

    print(f"🟢 儲存成功：{EN}/{CH}/{JP} @ {date} {time} -> KEY={new_key}")

    return jsonify({'message': '儲存成功'})



@app.route('/load', methods=['POST'])
def load():
    import re
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({})  # 未登入就回傳空字典

    user_id = re.sub(r'\W+', '_', email.split('@')[0])
    filename = f'save_{user_id}.json'

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            saved = json.load(f)
    except FileNotFoundError:
        saved = {}

    return jsonify(saved)

@app.route('/delete/<key>', methods=['POST'])
def delete(key):
    import re
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'message': '未登入'}), 400

    user_id = re.sub(r'\W+', '_', email.split('@')[0])
    filename = f'save_{user_id}.json'

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            saved = json.load(f)
    except FileNotFoundError:
        return jsonify({'message': '無資料可刪除'}), 404

    if key in saved:
        del saved[key]
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(saved, f, ensure_ascii=False, indent=2)
        return jsonify({'message': '已刪除'})
    else:
        return jsonify({'message': '找不到指定項目'}), 404

if __name__ == '__main__':
    app.run(debug=True)
