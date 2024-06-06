from calendar import c
from flask import Flask, render_template, g, request, jsonify, redirect, url_for
import sqlite3

app = Flask(__name__, template_folder='my_templates')

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect('inve.db')
    return g.db

@app.before_request
def before_request():
    g.db = get_db()

@app.teardown_request
def teardown_request(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.route('/')
def index():
    cursor = get_db().cursor()
    cursor.execute("SELECT Description FROM Process")
    process_names = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    table_names = [row[0] for row in cursor.fetchall()]

    return render_template('home.html', process_names=process_names, table_names=table_names)

@app.route('/process/<process_name>')
def process(process_name):
    cursor = get_db().cursor()
    cursor.execute("SELECT * FROM Process WHERE Description = ?", (process_name,))
    process_data = cursor.fetchone()
    processID = process_data[0]
    cursor.execute("SELECT Description FROM Process")
    process_names = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT AssetName FROM ProcessAssets WHERE ProcessID = ?", (processID,))
    asset_list = [row[0] for row in cursor.fetchall()]
    
    tables = ['PC', 'Routers', 'Server', 'Switches', 'VM']
    asset_data = []
    for table in tables:
        cursor.execute(f"SELECT Name FROM {table}")
        data = cursor.fetchall()
        if data:
            asset_data.extend([item[0] for item in data])
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    table_names = [row[0] for row in cursor.fetchall()]

            
    return render_template('home.html', process_data=process_data, process_names=process_names, asset_names=asset_data, asset_list=asset_list, selected_process=process_name, table_names=table_names)  

@app.route('/add-asset', methods=['POST'])
def add_asset():
    data = request.get_json()
    selectedAsset = data['asset']
    selectedProcess = data['process_name']
    cursor = get_db().cursor()

    cursor.execute("SELECT * FROM ProcessAssets WHERE AssetName = ? AND ProcessName = ?", (selectedAsset, selectedProcess))
    if cursor.fetchone() is not None:
        return '', 409  # Conflict
    cursor.execute("SELECT ProcessID FROM Process WHERE Description = ?", (selectedProcess,))
    processID = cursor.fetchone()[0]
    cursor.execute("INSERT INTO ProcessAssets (ProcessID, AssetName, ProcessName) VALUES (?,?,?)", (processID, selectedAsset, selectedProcess))
    get_db().commit()
    return '', 204
@app.route('/get-data/<table_name>', methods=['GET'])
def get_data(table_name):
    cursor = get_db().cursor()
    query = f"SELECT * FROM {table_name}"
    cursor.execute(query)
    Mdata = cursor.fetchall()

    query = f"SELECT name FROM PRAGMA_TABLE_INFO('{table_name}')"
    cursor.execute(query)
    colnames = cursor.fetchall()
    data = {
        'colnames': colnames,
        'data': Mdata
    }
    return data 

if __name__ == '__main__':
    app.run(debug=True)
