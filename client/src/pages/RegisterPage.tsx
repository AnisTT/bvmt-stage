import React, { useState } from "react";
import axios from "axios";

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const registerUser = async () => {
    try {
      const resp = await axios.post("http://localhost:5000/register", {
        email,
        password,
        role, 
      });
      if (resp.status === 200) {
        const token = resp.data.access_token;
        localStorage.setItem("token", token);  // Ensure this line is correct
        console.log("Token stored:", token);  // Debug line
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
          <input
            type="text"
            className="form-control"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary flex">
          Submit
        </button>
      </form>
    </div>
  );
};
export default RegisterPage;
