import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, studentProfile, token, logout, getMe, getStudentProfile } = useAuthStore();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user and profile data
    getMe();
    getStudentProfile().catch(() => {
      // Profile might not exist yet
    });
  }, [token, navigate, getMe, getStudentProfile]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Campus Action AI</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user.name}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Info</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Name:</span> {user.name}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Role:</span>{' '}
                <span className="capitalize">{user.role}</span>
              </p>
            </div>
          </div>

          {/* Student Profile Card */}
          {studentProfile ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Profile</h2>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Roll No:</span> {studentProfile.roll_number}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Department:</span> {studentProfile.department}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Batch:</span> {studentProfile.batch}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">CGPA:</span> {studentProfile.cgpa || 'N/A'}
                </p>
                <Link
                  to="/profile"
                  className="text-indigo-600 hover:text-indigo-700 font-medium mt-4 inline-block"
                >
                  Edit Profile →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Profile</h2>
              <p className="text-gray-600 mb-4">
                Complete your student profile to get started.
              </p>
              <Link
                to="/profile-setup"
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Set Up Profile
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/notices"
                className="block text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Notices →
              </Link>
              <Link
                to="/eligibility"
                className="block text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Check Eligibility →
              </Link>
              <Link
                to="/settings"
                className="block text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Settings →
              </Link>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Status</h3>
          <p className="text-blue-800">
            ✓ Account verified | {studentProfile ? '✓ Profile complete' : '⚠ Profile pending'}
          </p>
        </div>
      </div>
    </div>
  );
}
