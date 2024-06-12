import React, { useState, useEffect } from "react";
import Modal from 'react-modal';
import axios from "axios";

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const resp = await axios.get("http://localhost:5000/roles");
        if (resp.status === 200) {
          setRoleNames(resp.data);
        }
      } catch (error: any) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchRoles();
  }, []);

  
const [isModalOpen, setIsModalOpen] = useState(false);
const [Newrole, setNewRole] = useState('');
const [accessLevel, setAccessLevel] = useState('');
const [authorizedTables, setAuthorizedTables] = useState('');

const openModal = () => {
  setIsModalOpen(true);
};

const closeModal = () => {
  setIsModalOpen(false);
};

const handleNewRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setRole(e.target.value);
};

const handleAccessLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setAccessLevel(e.target.value);
};

const handleAuthorizedTablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setAuthorizedTables(e.target.value);
};

const AddRole = async () => {
  try {
    const resp = await axios.post("http://localhost:5000/roles/Add-role", {
      role,
      access_level: accessLevel,
      authorized_Tables: authorizedTables
    });
    if (resp.status === 204) {
      closeModal();
    }
  } catch (error) {
    console.error("Failed to add role:", error);
  }
};

  const registerUser = async () => {
    try {
      const resp = await axios.post("http://localhost:5000/register", {
        email,
        password,
        role,
      });
      if (resp.status === 200) {
        const token = resp.data.access_token;
        localStorage.setItem("token", token);
        console.log("Token stored:", token);
        window.location.href = "/home";
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 409) {
          setErrorMessage("User already exists");
        } else if (status === 401) {
          setErrorMessage("Unauthorized");
        } else {
          setErrorMessage("An error occurred. Please try again.");
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value);
  };

  return (
    <div className="container mt-5">
      <h1>Create an account</h1>
      {errorMessage && <p className="text-danger">{errorMessage}</p>}
      <form onSubmit={(e) => { e.preventDefault(); registerUser(); }}>
        <div className="form-group">
          <label>Email: </label>
          <input
            type="text"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password: </label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Role: </label>
          <select
            id="Role-select"
            className="form-control w-50"
            onChange={handleRoleChange}
            value={role}
          >
            <option value="">Select Role</option>
            {roleNames.map((rolename) => (
              <option key={rolename} value={rolename}>
                {rolename}
              </option>
            ))}
          </select>
        </div>
        <div>
    <button onClick={openModal}>Add Role</button>
        <Modal isOpen={isModalOpen} onRequestClose={closeModal}>
          <h2>Add Role</h2>
          <input type="text" value={role} onChange={handleNewRoleChange} placeholder="Role" />
          <input type="text" value={accessLevel} onChange={handleAccessLevelChange} placeholder="Access Level" />
          <input type="text" value={authorizedTables} onChange={handleAuthorizedTablesChange} placeholder="Authorized Tables" />
          <button onClick={AddRole}>Submit</button>
          <button onClick={closeModal}>Close</button>
        </Modal>
      </div>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
