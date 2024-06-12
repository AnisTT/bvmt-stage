import React, { useState, useEffect } from "react";
import httpClient from "../httpClient";
import { User } from "../types";
import 'bootstrap/dist/css/bootstrap.min.css';

const LandingPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const logoutUser = async () => {
    await httpClient.post("//localhost:5000/logout");
    window.location.href = "/";
  };

  useEffect(() => {
    (async () => {
      try {
        const resp = await httpClient.get("//localhost:5000/@me");
        setUser(resp.data);
      } catch (error) {
        console.log("Not authenticated");
      }
    })();
  }, []);

  return (
    <div className="container">
      <h1 className="text-center my-4">Welcome</h1>

      {user != null ? (
        <div className="alert alert-success" role="alert">
          <h2 className="alert-heading">Logged in</h2>
          <p>ID: {user.id}</p>
          <p>Email: {user.email}</p>

          <button className="btn btn-primary" onClick={logoutUser}>Logout</button>
        </div>
      ) : (
        <div className="alert alert-danger" role="alert">
          <p>You are not logged in</p>
          <div>
            <a href="/login">
              <button className="btn btn-primary">Login</button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;