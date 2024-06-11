from webbrowser import get
import sqlite3
from flask import g

class Userdatabase:
    def __init__(self):
        self.conn = self.get_db()
        self.cursor = self.conn.cursor()

    def get_db(self):
        if 'db' not in g:
            g.db = sqlite3.connect('inve.db')
        return g.db

    def get_all_users(self):
        query = "SELECT * FROM Users"
        self.cursor.execute(query)
        users = self.cursor.fetchall()
        users_list = []
        for user in users:
            user_dict = {"id": user[0], "username": user[1], "password": user[2]}
            users_list.append(user_dict)
        return users_list
    
    def get_user(self, username):
        query = f"SELECT * FROM Users WHERE username = '{username}'"
        self.cursor.execute(query)
        user_row = self.cursor.fetchall()
        if user_row:
            user_dict = {"id": user_row[0], "username": user_row[1], "password": user_row[2]}
            return user_dict
        return None

    def add_user(self, username, password):
        query = f"INSERT INTO Users(username, password) VALUES ('{username}', '{password}')"
        self.cursor.execute(query)
        self.conn.commit()

    def delete_user(self, id):
        query = f"DELETE FROM Users WHERE id = {id}"
        self.cursor.execute(query)
        if self.cursor.rowcount == 0:
            return False
        self.conn.commit()
        return True

    def update_user(self, id, username, password):
        query = f"UPDATE Users SET username = '{username}', password = '{password}' WHERE id = {id}"
        self.cursor.execute(query)
        if self.cursor.rowcount == 0:
            return False
        self.conn.commit()
        return True
