import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react'; 
import Home from './pages/home';
import Expense from './pages/expense';
import Login from './pages/login';
import Budget from './pages/budget';
import Register from './pages/register';
import ProtectedRoute from './ProtectedRoute';
import Analysis from './pages/analysis';
import CollaborativeBudgeting from './pages/collab';
import CollabGroup from './pages/collabgrp.js';
import MyGroups from './pages/MyGroups.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    // ✅ Try to load user from localStorage initially
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // ✅ Sync user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      const justRegistered = localStorage.getItem('justRegistered');
    if (justRegistered) {
      toast.success(`👋 Hey ${user.name}, welcome to the club! Budget greatness awaits 💰✨`);
      localStorage.removeItem('justRegistered'); // Only show once
    }
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

useEffect(() => {
  const checkLastExpense = async () => {
    if (!user) return;
    const res = await fetch(`http://localhost:5000/api/last-expense/${user.id}`);
    const data = await res.json();

    if (data.daysSinceLast > 1) {
      toast.info("👻 Hey! Haven’t seen an expense from you in a while. Budget ghosts are watching!");
    }
  };

  checkLastExpense();
}, [user]);



  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-amber-50 text-red-900">
      {/* Sidebar */}
      <aside className="w-64 bg-red-600 text-white shadow-md p-4">
      <Link to="/" className="text-3xl font-extrabold mb-8 tracking-tight block">
  <span className="text-amber-400">budget</span>
  <span className="text-white">Buddy</span>
</Link>

        <nav className="space-y-4">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-lg font-semibold ${
              isActive('/') ? 'bg-amber-400 text-red-800' : 'hover:bg-amber-300'
            }`}
          >
            Home
          </Link>
          <Link
            to="/expense"
            className={`block px-3 py-2 rounded-lg font-semibold ${
              isActive('/expense') ? 'bg-amber-400 text-red-800' : 'hover:bg-amber-300'
            }`}
          >
            Expense Log
          </Link>
          <Link
            to="/budgets"
            className={`block px-3 py-2 rounded-lg font-semibold ${
              isActive('/budgets') ? 'bg-amber-400 text-red-800' : 'hover:bg-amber-300'
            }`}
          >
            Budgets
          </Link>
          <Link
            to="/analysis"
            className={`block px-3 py-2 rounded-lg font-semibold ${
              isActive('/analysis') ? 'bg-amber-400 text-red-800' : 'hover:bg-amber-300'
            }`}
          >
            Analysis
          </Link>
          <Link
            to="/collaborate"
            className={`block px-3 py-2 rounded-lg font-semibold ${
              isActive('/collaborate') ? 'bg-amber-400 text-red-800' : 'hover:bg-amber-300'
            }`}
          >
            Collaborative Budgeting
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-red-700">Welcome to budgetBuddy!</h2>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 bg-amber-100 px-3 py-1 rounded-full shadow-sm">
                <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center text-red-800 font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Hi, {user.name}
                </span>
              </div>
            )}
            {user ? (
              <button
                onClick={() => {
                  setUser(null);
                  navigate('/log'); // Redirect to login on logout
                }}
                className="text-sm text-gray-600 hover:underline"
              >
                Log out
              </button>
            ) : (
              <Link to="/log" className="text-sm text-gray-600 hover:underline">
                Log in
              </Link>
            )}
          </div>
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/expense"
            element={
              <ProtectedRoute user={user}>
                <Expense user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets"
            element={
              <ProtectedRoute user={user}>
                <Budget user={user} />
              </ProtectedRoute>
            }
          />

          <Route path="/log" element={<Login setUser={setUser} navigate={navigate} />} />
          <Route path="/register" element={<Register />} />
          <Route
  path="/analysis"
  element={
    <ProtectedRoute user={user}>
      <Analysis user={user} />
    </ProtectedRoute>
  }
/>
<Route
  path="/collaborate"
  element={
    <ProtectedRoute user={user}>
      <CollaborativeBudgeting user={user} />
    </ProtectedRoute>
  }
/>
<Route
  path="/collabgrp/:code"
  element={
    <ProtectedRoute user={user}>
      <CollabGroup user={user} />
    </ProtectedRoute>
  }
/>
<Route
  path="/my-groups"
  element={
    <ProtectedRoute user={user}>
      <MyGroups />
    </ProtectedRoute>
  }
/>

        
        </Routes>
        <ToastContainer />

      </main>
    </div>
  );
}

export default App;