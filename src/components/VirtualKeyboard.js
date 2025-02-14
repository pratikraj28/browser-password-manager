import React, { useState, useEffect } from "react";
import "./VirtualKeyboard.css";

const VirtualKeyboard = ({ onInput, onBackspace, onClear, onClose }) => {
  const [keys, setKeys] = useState([]);
  const [isCaps, setIsCaps] = useState(false); 

  useEffect(() => {
    const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const numbers = "0123456789".split("");
    const specialChars = "!@#$%^&*()".split("");

    const shuffledAlphabets = alphabets.sort(() => Math.random() - 0.5);
    const shuffledNumbers = numbers.sort(() => Math.random() - 0.5);
    const shuffledSpecialChars = specialChars.sort(() => Math.random() - 0.5);
    const allKeys = [...shuffledAlphabets, ...shuffledNumbers, ...shuffledSpecialChars];
    setKeys(allKeys);
  }, []);
  const toggleCaps = () => {
    setIsCaps((prev) => !prev);
  };
  const handleKeyInput = (key) => {
    if (isCaps) {
      onInput(key.toUpperCase());
    } else {
      onInput(key.toLowerCase());
    }
  };

  return (
    <div className="virtual-keyboard">
      <div className="keys">
        {keys.map((key) => (
          <button
            key={key}
            className="key-button"
            onClick={() => handleKeyInput(key)}
          >
            {isCaps ? key.toUpperCase() : key.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="actions">
        <button className="action-button" onClick={onBackspace}>
          Backspace
        </button>
        <button className="action-button" onClick={onClear}>
          Clear
        </button>
        <button className="action-button" onClick={onClose}>
          Close
        </button>
        <button className="action-button" onClick={toggleCaps}>
          {isCaps ? "ABC" : "abc"}
        </button>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
