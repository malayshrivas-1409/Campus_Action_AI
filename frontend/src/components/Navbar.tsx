import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuthStore();

  if (!token) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/documents', label: 'Documents', icon: '📄' },
    { path: '/search', label: 'Search', icon: '🔍' },
    { path: '/chat', label: 'Chat', icon: '💬' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-indigo-600">🎓</div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">Campus Action AI</h1>
              <p className="text-xs text-gray-500">Intelligent Notice Management</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span className="ml-2">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Menu & User */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <div className="md:hidden flex gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`p-2 rounded ${
                    isActive(item.path)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={item.label}
                >
                  {item.icon}
                </button>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="hidden sm:text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
