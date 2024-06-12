from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import DevelopmentConfig
from flask import Flask, render_template, g, request, jsonify, redirect, url_for, flash
import sqlite3
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity



app = Flask(__name__)
app.secret_key = 'your secret key'
CORS(app, supports_credentials=True, origins="http://localhost:3000")
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  
jwt = JWTManager(app)

bcrypt = Bcrypt(app)
def get_user_role(email):
    cursor = get_db().cursor()
    cursor.execute("SELECT role FROM Users WHERE email = ?", (email,))
    role = cursor.fetchone()
    return role[0] if role else None


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



def create_activity_log_table():
    cursor = get_db().cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS UserActivityLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            action TEXT,
            FOREIGN KEY(user_id) REFERENCES Users(id)
        )
    """)
    get_db().commit()
def create_roles_table():
    cursor = get_db().cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT,
            access_level TEXT,
            authorized_Tables TEXT
        )
    """)
    get_db().commit()



@app.route("/@me")
def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    cursor = get_db().cursor()
    cursor.execute("SELECT * FROM Users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    user_email = user[3]
    return jsonify({
        "id": user_id,
        "email": user_email
    }) 

@app.route("/register", methods=["POST"])
def register_user():
    email = request.json.get("email")
    password = request.json.get("password")
    role = request.json.get("role")

    cursor = get_db().cursor()
    cursor.execute("SELECT * FROM Users WHERE email = ?", (email,))
   
    if cursor.fetchone() is not None:
        return jsonify({"error": "User already exists"}), 409
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    cursor.execute("INSERT INTO Users (email, password, role) VALUES (?, ?, ?)", (email, hashed_password, role))
    get_db().commit()
    access_token = create_access_token(identity=email, additional_claims={"role": role})
    return jsonify({"access_token": access_token}), 200

@app.route("/login", methods=["POST"])
def login_user():
    email = request.json.get("email")
    password = request.json.get("password")

    cursor = get_db().cursor()
    cursor.execute("SELECT * FROM Users WHERE email = ?", (email,))
    user = cursor.fetchone()

    ip_address = request.remote_addr

    if user is None:
        cursor.execute("INSERT INTO UserActivityLog (user_id, ip_address, action) VALUES (?, ?, ?)", (None, ip_address, 'failed login - user not found'))
        get_db().commit()
        return jsonify({"error": "Unauthorized"}), 401

    user_password = user[2]
    if not bcrypt.check_password_hash(user_password, password):
        cursor.execute("INSERT INTO UserActivityLog (user_id, ip_address, action) VALUES (?, ?, ?)", (user[0], ip_address, 'failed login - incorrect password'))
        get_db().commit()
        return jsonify({"error": "Unauthorized"}), 401

    cursor.execute("INSERT INTO UserActivityLog (user_id, ip_address, action) VALUES (?, ?, ?)", (user[0], ip_address, 'login'))
    get_db().commit()
    


    cursor.execute("SELECT role FROM Users WHERE email = ?", (email,))
    role = cursor.fetchone()
    role = role[0] if role else None
    cursor.execute("SELECT id FROM Users WHERE email = ?", (email,))
    user_id = cursor.fetchone()


    access_token = create_access_token(identity=email, additional_claims={"role": role ,'user_id' : user_id})
    
    return jsonify({"access_token": access_token}), 200

@app.route("/logout", methods=["POST"])
def logout_user():
    session.pop("user_id")
    return "200"

@app.route('/')
def index():
    cursor = get_db().cursor()
    cursor.execute("SELECT Description FROM Process")
    process_names = [row[0] for row in cursor.fetchall()]
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('Users', 'UserActivityLog', 'sqlite_sequence');")
    table_names = [row[0] for row in cursor.fetchall()]
    return jsonify({
        "process_names": process_names,
        "table_names": table_names
    })

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

            
    return jsonify ({
        'process_data': process_data,
        'process_names': process_names,
        'asset_names': asset_data,
        'asset_list': asset_list,
        'selected_process': process_name,
        'table_names': table_names
    })

@app.route('/add-asset', methods=['POST'])
@jwt_required()
def add_asset():
    cursor = get_db().cursor()
    id = get_jwt_identity()
    cursor.execute("SELECT * FROM Users WHERE email = ?", (id,))
    user = cursor.fetchone()
    cursor.close()
    

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
    cursor.execute("")
    ip_address = request.remote_addr  # Get user's IP address
    message=f'Added asset {selectedAsset} in {selectedProcess}'
    cursor.execute("INSERT INTO UserActivityLog (user_id, ip_address, action) VALUES (?, ?, ?)", (user[0], ip_address, message))
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
  
    return  jsonify({
        'colnames': colnames,
        'data': Mdata
    })
@app.route('/users', methods=['GET'])
def get_users():
    cursor = get_db().cursor()
    cursor.execute("SELECT * FROM Users")
    users = cursor.fetchall()
    
    return jsonify(users)
@app.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    cursor = get_db().cursor()
    cursor.execute("DELETE FROM Users WHERE id = ?", (user_id,))
    get_db().commit()
    return jsonify({"message": "User deleted"}), 200

@app.route('/users/<user_id>', methods=['PUT'])
def edit_user(user_id):
    data = request.get_json()
    username = data.get('username')
    role = data.get('role')
    email = data.get('email')

    cursor = get_db().cursor()
    cursor.execute("UPDATE Users SET username = ?, role = ?, email = ? WHERE id = ?", (username, role, email, user_id))
    get_db().commit()
    return jsonify({"message": "User updated"}), 200
@app.route('/userActivity', methods=['GET'])
def get_user_activity():
    cursor = get_db().cursor()
    create_activity_log_table()

    cursor.execute("SELECT * FROM UserActivityLog")
    activities = cursor.fetchall()
    return jsonify(activities)
@app.route('/userActivity/<user_id>', methods=['GET'])
def get_user_activity_by_id(user_id):
    cursor = get_db().cursor()
    create_activity_log_table()

    cursor.execute("SELECT * FROM UserActivityLog WHERE user_id = ?", (user_id,))
    activities = cursor.fetchall()
    return jsonify(activities)

@app.route('/roles', methods=['GET'])
def get_roles():
    cursor = get_db().cursor()
    cursor.execute("SELECT role FROM roles")
    roles = cursor.fetchall()
    return jsonify(roles)
@app.route('/roles/Add-role', methods=['POST'])
def add_role():
    cursor = get_db().cursor()
    
    data = request.get_json()
    print(data)
    role = data['role']
    access_level = data['access_level']
    authorized_Tables = data['authorized_Tables']
    
    cursor.execute("INSERT INTO Roles (role, access, authorized) VALUES (?,?,?)", (role, access_level, authorized_Tables))
    get_db().commit()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)
