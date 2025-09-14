import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./style/backbutton.css";

const BackButton: React.FC = () => {
  const nav = useNavigate();
  const { pathname } = useLocation();

  // הסתרה בדף הבית בלבד (התאם במידת הצורך)
  const isHome = pathname === "/";

  if (isHome) return null;

  return (
    <button
      className="backbtn"
      onClick={() => nav(-1)}
      aria-label="חזרה אחורה"
      title="חזרה"
    >
      {/* אייקון חץ (SVG) */}
      <svg
        className="backbtn-icon"
        viewBox="0 0 24 24"
        focusable="false"
        aria-hidden="true"
      >
        <path d="M15.5 19a1 1 0 0 1-.7-.3l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 1 1 1.4 1.4L10.9 12l5.3 5.3A1 1 0 0 1 15.5 19z"/>
      </svg>
      <span className="sr-only">חזרה</span>
    </button>
  );
};

export default BackButton;
