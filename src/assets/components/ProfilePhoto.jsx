import { react } from 'react';
import { useNavigate } from 'react-router-dom';


const ProfilePhoto = ({ profile, user }) => {

  const name =
    profile?.username ||
    user?.displayName ||
    user?.email ||
    '👋';

  const firstLetter = name.charAt(0).toUpperCase();

  const photo = profile?.photo || user?.photoURL;
  const navigate = useNavigate();
  const handleClick = ({dark})=> {
    navigate('/profile')
  }

  return (
    <> { user && <div className="flex cursor-pointer items-center gap-2" onClick={handleClick}>
      {photo ? (

        <img
          src={photo}
          alt="profile"
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (

        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
          {firstLetter}
        </div>
      )}

      <p className="flex text-sm font-medium">{name}</p>
    </div>}
    </>
    
  );
};
export default ProfilePhoto
