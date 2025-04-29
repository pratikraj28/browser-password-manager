import React, { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import VirtualKeyboard from "./VirtualKeyboard"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import "bootstrap/dist/css/bootstrap.min.css"
import "./Login.css"
import "@fontsource/poppins"
import { AuthContext} from '../AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("") // OTP state
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [loginOtp, setLoginOtp] = useState(true);
  const navigate = useNavigate()
  const [isRegisterButtonDisabled, setIsRegisterButtonDisabled] = useState(false);


  const { setEmail: setUserEmail } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if(loginOtp) {
      handleLoginOtp();
    }
    else {
      handleOtpVerification();
    }
  };

  const handleLoginOtp = async () => {

    try {
      setErrorMessage("");
      const response = await axios.post("http://127.0.0.1:5000/verify-otp", { email, otp })

      if (response.data.status === 'success') {
        setIsOtpVerified(true)
        setSuccessMessage("OTP Verified successfully!")
        setIsRegister(false);   
        setUserEmail(email);
        localStorage.setItem('user',JSON.stringify({
          email
        }));
        setTimeout(() => {
          navigate("/dashboard")
        }, 2000)
      } else {
        setErrorMessage(response.data.message || "OTP verification failed. Please try again.")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
    }
  }


  // const handleLogin = async (e) => {
  //   e.preventDefault()
  //   setIsButtonDisabled(true)
  //   setErrorMessage("")
  //   setSuccessMessage("");

  //   try {
  //     const response = await axios.post("http://127.0.0.1:5000/login", { email, password })

  //     if (response.data.status === "success") {
  //       setSuccessMessage("OTP sent successfully!")
  //       setIsOtpSent(true);
  //       setIsOtpVerified(false);
  //     } else {
  //       setErrorMessage(response.data.message)
  //     }
  //   } catch (error) {
  //     console.error("Error logging in:", error)
  //     setErrorMessage("An error occurred. Please try again.")
  //   } finally {
  //     setIsButtonDisabled(false)
  //   }
  // }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post("http://127.0.0.1:5000/login", { email, password });

      if (response.data.status === "success") {
        setSuccessMessage("OTP sent successfully!");
        setIsOtpSent(true);
        setIsOtpVerified(false);
        localStorage.setItem("email", email); // Store email in localStorage
      } else {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsButtonDisabled(false);
    }
};


  const handleRegister = async (e) => {
    e.preventDefault()

  setIsRegisterButtonDisabled(true);

    if (registerPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match!")
      return
    }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(registerPassword)) {
    setErrorMessage(
      <div style={{ fontSize: "10px" }}>
        Password must be 8+ characters, with uppercase, lowercase, number, and special character.
      </div>
    );
    return;
  }
  

    try {
      setErrorMessage("");
      const response = await axios.post("http://127.0.0.1:5000/register", { email, username, password: registerPassword })

      if (response.data.status === "success") {
        setSuccessMessage("OTP sent to your email.")
        setIsOtpSent(true)
      } else {
        setErrorMessage(response.data.message)
      }
    } catch (error) {
      console.error("Error registering:", error)
      setErrorMessage("An error occurred. Please try again.")
    }
  }

  const handleOtpVerification = async () => {

    try {
      setErrorMessage("");
      const response = await axios.post("http://127.0.0.1:5000/verify-register-otp", {email, otp })

      console.log(response);

      if (response.data.status === 'success') {
        setIsOtpVerified(true)
        setSuccessMessage("OTP Verified successfully!")
        setIsRegister(false);
        setLoginOtp(true);
        setOtp("");
        setSuccessMessage("");
        setTimeout(() => {
          navigate("/")
        }, 2000)
      } else {
        setErrorMessage(response.data.message || "OTP verification failed. Please try again.")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
    }
  }

  const toggleLoginPasswordVisibility = () => {
    setShowLoginPassword((prevState) => !prevState)
  }

  const toggleRegisterPasswordVisibility = () => {
    setShowRegisterPassword((prevState) => !prevState)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prevState) => !prevState)
  }

  const handleLoginPasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)

    if (value) {
      setErrorMessage("")
    }
  }

  const handleRegisterPasswordChange = (e) => {
    const value = e.target.value
    setRegisterPassword(value)

    if (value) {
      setErrorMessage("")
    }
  }

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value
    setConfirmPassword(value)

    if (value) {
      setErrorMessage("")
    }
  }

  const handleOtpChange = (e) => {
    setOtp(e.target.value)
  }

  return (
    <div className={`login-container ${showKeyboard ? "keyboard-open" : ""}`}>
      {!showKeyboard && (
        <div className="image-section">
          <img
            src="/images/top-view-lock-with-password-keyboard.jpg"
            alt="Login Illustration"
            className="login-image"
          />
        </div>
      )}

      <div className={`login-card shadow-lg ${showKeyboard ? "expanded" : ""}`}>
        <h2 className="text-center mb-4">{isRegister ? "Register" : "Login"}</h2>
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {isRegister && !isOtpSent ? (
          <>
            <form onSubmit={handleRegister}>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  id="register-username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <input
                  type="email"
                  className="form-control"
                  id="register-email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-2 position-relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  className="form-control"
                  id="register-password"
                  placeholder="Enter your password"
                  value={registerPassword}
                  onChange={handleRegisterPasswordChange}
                  required
                />
                <button type="button" className="password-toggle-btn" onClick={toggleRegisterPasswordVisibility}>
                  {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="mb-2 position-relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  id="confirm-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                />
                <button type="button" className="password-toggle-btn" onClick={toggleConfirmPasswordVisibility}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}  
                </button>
              </div>

              <button type="submit" className="btn btn-success w-100">
                Register
              </button>
            </form>
            <p className="text-center mt-3">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setIsRegister(false);
                  setLoginOtp(true);
                  setEmail("");
                  setPassword("");
                }}
                style={{ color: "#3498db", cursor: "pointer", fontWeight: "500" }}
              >
                Login
              </span>
            </p>
          </>
        ) : isOtpSent && !isOtpVerified ? (
          <>
            <form onSubmit={handleSubmit}>
              <div className="mb-1">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-success w-100">
                Verify OTP
              </button>
            </form>
          </>
        ) : (
          <>
            <form onSubmit={handleLogin}>
              <div className="mb-5">
                <input
                  type="email"
                  className="form-control"
                  id="login-email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-5 position-relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  className="form-control"
                  id="login-password"
                  placeholder="Click to open the virtual keyboard"
                  value={password}
                  readOnly
                  onFocus={() => setShowKeyboard(true)}
                  onChange={handleLoginPasswordChange}
                  required
                />
                <button type="button" className="password-toggle-btn" onClick={toggleLoginPasswordVisibility}>
                  {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* 🔑 Forgot Password Link Here */}
  <p className="text-center mt-3">
    <span
      onClick={() => navigate("/forgot-password")}
      style={{ color: "#3498db", cursor: "pointer", fontWeight: "500", fontSize: "16px" }}
    >
      Forgot Password?
    </span>
  </p>

              <button type="submit" className="btn btn-success w-100" disabled={isButtonDisabled}>
                Login
              </button>
            </form>
            <p className="text-center mt-3">
              Don't have an account?{" "}
              <span
                onClick={() => {
                  setIsRegister(true);
                  setLoginOtp(false);

                }}
                style={{ color: "#3498db", cursor: "pointer", fontWeight: "500" }}
              >
                Register
              </span>
            </p>
          </>
        )}
      </div>
      {showKeyboard && (
        <div className="virtual-keyboard-container">
          <VirtualKeyboard
            onInput={(key) => setPassword((prev) => prev + key)}
            onBackspace={() => setPassword((prev) => prev.slice(0, -1))}
            onClear={() => setPassword("")}
            onClose={() => setShowKeyboard(false)}
          />
        </div>
      )}
    </div>
  )
}

export default LoginPage
