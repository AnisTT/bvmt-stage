import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

interface User {
    id: string;
    username: string;
    role: string;
    email: string;
}
interface UserActivity {
  id: string;
  user_id: string;
  login_time: string;
  ip_address: string;
  action: string;
}


const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
    const CreateUser = async () => {
      window.location.href = "/register";
    };


    useEffect(() => {
      axios.get('http://localhost:5000/userActivity')
          .then((response) => {
            const userActData = response.data.map((item: any[]) => ({
              id: item[0],
              user_id: item[1],
              login_time: item[2],
              ip_address: item[3],
              action: item[4],
          }));
          setUserActivity(userActData);
          });
  }, []);

    useEffect(() => {
        axios.get("http://localhost:5000/users").then((response) => {
            // Assuming response.data is an array of arrays
            const usersData = response.data.map((item: any[]) => ({
                id: item[0],
                username: item[1],
                role: item[3],
                email: item[4],
            }));
            setUsers(usersData);
        });
    }, []);

    const deleteUser = (id: string) => {
        axios.delete(`http://localhost:5000/users/${id}`).then(() => {
            setUsers(users.filter(user => user.id !== id));
        });
    };

    const startEditingUser = (user: User) => {
        setEditingUser(user);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            updateUser(editingUser.id, editingUser.username, editingUser.role, editingUser.email);
            setEditingUser(null);
        }
    };

    const updateUser = (id: string, username: string, role: string, email: string) => {
        axios.put(`http://localhost:5000/users/${id}`, { username, role, email }).then(() => {
            setUsers(users.map(user => user.id === id ? { id, username, role, email } : user));
        });
      };

    return (
        <div className="container mt-5">
            <h2 className="mb-4">User Management</h2>
            <button className="btn btn-primary btn-sm mr-2" onClick={CreateUser}>Create User</button>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.role}</td>
                            <td>{user.email}</td>
                            <td>
                                <button className="btn btn-primary btn-sm mr-2" onClick={() => startEditingUser(user)}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(user.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <table className="table">
    <thead>
        <tr>
            <th>User ID</th>
            <th>Login Time</th>
            <th>IP Address</th>
            <th>Action</th>
        </tr>
    </thead>
    <tbody>
            {userActivity.map((activity) => (
                <tr key={activity.id}>
                    <td>{activity.user_id}</td>
                    <td>{activity.login_time}</td>
                    <td>{activity.ip_address}</td>
                    <td>{activity.action}</td>
                </tr>
            ))}
        </tbody>
    </table>
            {editingUser && (
                <form onSubmit={handleEditSubmit} className="mt-4">
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" className="form-control" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <input type="text" className="form-control" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="text" className="form-control" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-success">Submit</button>
                </form>
            )}
        </div>
    );
}

export default Users;
