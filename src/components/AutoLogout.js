import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AutoLogout = ({ logout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      logout();
      navigate("/login");
    }, 20000); //

    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return null;
};

export default AutoLogout;
