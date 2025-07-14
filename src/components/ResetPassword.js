import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setToken(params.get("token"));
    setEmail(params.get("email"));
  }, [location]);

  const evaluatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[\W_]/.test(password)) score++;

    if (score >= 4) return "Strong";
    if (score >= 3) return "Good";
    return "Weak";
  };

  const getStrengthColor = () => {
    if (passwordStrength === "Strong") return "text-success";
    if (passwordStrength === "Good") return "text-warning";
    return "text-danger";
  };

  useEffect(() => {
    setPasswordStrength(evaluatePasswordStrength(password));
  }, [password]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (evaluatePasswordStrength(password) === "Weak") {
      setError(
        "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character."
      );
      return;
    }

    try {
      const res = await axios.post("https://password-manager-backend-298931957092.us-central1.run.app/forgot-reset-password", {
        email,
        token,
        password
      });

      if (res.data.status === "success") {
        setMessage("Password reset successfully! Redirecting...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card shadow-lg">
        <h3 className="text-center mb-4">Reset Password</h3>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleReset}>
          {/* New Password Field */}
          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            <small className={`d-block mt-1 ${getStrengthColor()}`}>
              Password Strength: {passwordStrength}
            </small>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-3 position-relative">
  <input
    type={showConfirm ? "text" : "password"}
    className="form-control"
    placeholder="Confirm Password"
    value={confirm}
    onChange={(e) => setConfirm(e.target.value)}
    required
  />
  <button
    type="button"
    className="password-toggle-btn"
    onClick={() => setShowConfirm((prev) => !prev)}
  >
    {showConfirm ? <FaEyeSlash /> : <FaEye />}
  </button>
</div>



          <button type="submit" className="btn btn-success w-100">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
