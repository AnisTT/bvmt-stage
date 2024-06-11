import React, { useState } from "react";
import axios from "axios";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const logInUser = async () => {
    try {
      const response = await axios.post("http://localhost:5000/login", {
        email,
        password,
      }, {
        withCredentials: true 
      });

      if (response.status === 200) {
        const token = response.data.access_token;
        localStorage.setItem("token", token);  // Ensure this line is correct
        console.log("Token stored:", token);  // Debug line
        window.location.href = "/home";
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          console.error('Invalid credentials');
          alert("verify your email or password");
        }
      }
    }
  };

  return (
    <div className="container mt-5">
      <h1>Log Into Your Account</h1>
      <form>
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
        <button type="button" className="btn btn-primary" onClick={logInUser}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default LoginPage;