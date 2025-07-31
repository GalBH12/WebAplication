import '../style/profile.css';

const Profile = () => {
  const username = localStorage.getItem('username');

  return (
    <div className="profile-container">
      <h2>פרופיל משתמש</h2>
      {username ? (
        <p>ברוך הבא, {username}!</p>
      ) : (
        <p>אנא התחבר כדי לראות את הפרופיל שלך.</p>
      )}
    </div>
  );
};

export default Profile;