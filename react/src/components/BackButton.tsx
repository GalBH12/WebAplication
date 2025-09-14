import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../style/backbutton.css";

/**
 * BackButton Component
 *
 * - Displays a button that navigates the user one step back in history.
 * - Hidden automatically when the user is on the home page ("/").
 * - Includes an SVG arrow icon and accessibility labels.
 */
const BackButton: React.FC = () => {
  const nav = useNavigate();         // React Router hook for programmatic navigation
  const { pathname } = useLocation(); // Get the current path from the URL

  // Hide the button when on the homepage
  const isHome = pathname === "/";

  if (isHome) return null; // Don't render anything if we're on home page

  return (
    <button
      className="backbtn"     // Custom CSS class for styling
      onClick={() => nav(-1)} // Navigate one step back in history
      aria-label="חזרה אחורה" // Accessibility label (screen readers)
      title="חזרה"            // Tooltip text on hover
    >
      {/* Back arrow icon (SVG) */}
      <svg
        className="backbtn-icon"
        viewBox="0 0 24 24"
        focusable="false"  // Prevents focus via keyboard navigation
        aria-hidden="true" // Hides from screen readers (text label used instead)
      >
        {/* Path that draws the left arrow */}
        <path d="M15.5 19a1 1 0 0 1-.7-.3l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 1 1 1.4 1.4L10.9 12l5.3 5.3A1 1 0 0 1 15.5 19z"/>
      </svg>
      {/* Screen reader text (not visible but accessible) */}
      <span className="sr-only">חזרה</span>
    </button>
  );
};

export default BackButton;
