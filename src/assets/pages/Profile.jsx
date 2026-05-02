import { useContext, useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { User, Mail, School, Edit, Save, LogOut } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const Profile = ({ dark }) => {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    username: "",
    school: "",
    department: "",
  });

  const navigate = useNavigate();

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const fetchProfile = async () => {
    if (!auth.currentUser) return;

    try {
      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProfile(snap.data());
        setForm({
          username: snap.data().username || "",
          school: snap.data().school || "",
          department: snap.data().department || "",
        });
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          ...profile,
          ...form,
        },
        { merge: true }
      );

      await updateProfile(auth.currentUser, {
        displayName: form.username,
      });

      setMsg("Profile updated");
      setEdit(false);
      fetchProfile();
    } catch (err) {
      setMsg("Error updating profile");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) {
    return <p className="text-center mt-20">Loading profile...</p>;
  }

  return (
    <div
      className={`min-h-screen w-full pt-20 px-4 ${
        dark ? "bg-[#0b0f1a] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto">

        <div
          className={`rounded-2xl p-6 shadow-lg mb-6 ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white">
              {profile?.photo ? (
                <img
                  src={profile.photo}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitial(profile?.username || auth.currentUser?.email)
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">
                {profile?.username || "No Name"}
              </h2>
              <p className="text-sm opacity-70 flex items-center gap-2 justify-center md:justify-start">
                <Mail size={16} /> {user?.email}
              </p>

              <p className="text-sm opacity-70 mt-1 flex items-center gap-2 justify-center md:justify-start">
                <School size={16} /> {profile?.school || "No school added"}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEdit(!edit)}
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
              >
                <Edit size={16} /> Edit
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>

        {edit && (
          <div
            className={`rounded-2xl p-6 shadow-lg mb-6 ${
              dark ? "bg-[#111827]" : "bg-white"
            }`}
          >
            <h2 className="font-bold mb-4">Edit Profile</h2>

            <div className="grid gap-4">
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                placeholder="Username"
                className={`p-3 rounded border ${
                  dark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              />

              <input
                type="text"
                value={form.school}
                onChange={(e) =>
                  setForm({ ...form, school: e.target.value })
                }
                placeholder="School"
                className={`p-3 rounded border ${
                  dark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              />

              <input
                type="text"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                placeholder="Department"
                className={`p-3 rounded border ${
                  dark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              />

              <button
                onClick={handleSave}
                className="py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white flex justify-center items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>

              <p className="text-sm text-gray-400 text-center">{msg}</p>
            </div>
          </div>
        )}

        <div
          className={`rounded-2xl p-6 shadow-lg ${
            dark ? "bg-[#111827]" : "bg-white"
          }`}
        >
          <h2 className="font-bold mb-4">Your Activity</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm opacity-70">Uploads</p>
              <h3 className="text-xl font-bold">0</h3>
            </div>

            <div>
              <p className="text-sm opacity-70">Saved CGPA</p>
              <h3 className="text-xl font-bold">0</h3>
            </div>

            <div>
              <p className="text-sm opacity-70">Downloads</p>
              <h3 className="text-xl font-bold">0</h3>
            </div>

            <div>
              <p className="text-sm opacity-70">Member Since</p>
              <h3 className="text-sm font-bold">
                {auth.currentUser?.metadata?.creationTime?.slice(0, 11)}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;