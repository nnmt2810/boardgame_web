import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './contexts/AuthContext';

// Import các trang (Pages)
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home'; // Giả sử đây là trang chứa bàn cờ

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  if (!user) return <Navigate dangerouslySetTab={true} to="/login" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;