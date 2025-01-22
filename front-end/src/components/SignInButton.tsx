import React from "react";
import {Link, useNavigate} from "react-router-dom";
import {getAuth, signOut} from "firebase/auth";

function SignInButton() {
  const auth = getAuth();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const handleSignOut = async () => {
    try{
      await signOut(auth);
      localStorage.removeItem("userUID")
      console.log("user signed out")
      navigate("/signin")
    } catch (error) {
      console.error("Error signing out", error);
    }
  }

  return (
    <nav className="flex justify-center p-4">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        {currentUser ? (
          <button
            onClick={handleSignOut}
            className="bg-purple-700 hover:bg-indigo-600 text-white font-semibold py-2 px-4 border-b-4 border-indigo-900 hover:border-purple-800 rounded w-full sm:w-auto shadow-md transition duration-300"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/signin"
            className="bg-purple-700 hover:bg-indigo-600 text-white font-semibold py-2 px-4 border-b-4 border-indigo-900 hover:border-purple-800 rounded w-full sm:w-auto shadow-md transition duration-300"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

export default SignInButton