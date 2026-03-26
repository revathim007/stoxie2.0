import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/accounts/login/', formData);
      const { user } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      
      if (user.role === 'admin') {
        navigate('/admin-welcome');
      } else {
        navigate('/customer-welcome');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      alert('Login failed. Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Glow Orbs (Mesh Gradient) */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-500/25 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-fuchsia-500/25 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] bg-cyan-500/15 rounded-full blur-[90px] animate-pulse delay-500"></div>

        {/* Futuristic Dot Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.20]" 
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.4) 1px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
        ></div>
        
        {/* Subtle Decorative Grid Lines */}
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      </div>

      <div className="glass-panel p-8 w-96 relative z-10">
        <div className="absolute top-4 left-4">
          <button onClick={() => navigate('/')} className="text-light-accent hover:text-white text-sm flex items-center transition-colors">
            ← Home
          </button>
        </div>
        <h2 className="text-3xl font-black mb-8 text-center text-white pt-4 tracking-tight">Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-200 text-sm font-bold mb-2">Username</label>
            <input
              type="text"
              name="username"
              className="glass-input w-full px-4 py-3"
              placeholder="Enter Username"
              required
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-gray-200 text-sm font-bold mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="glass-input w-full px-4 py-3 pr-12"
                placeholder="Enter Password"
                required
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full glass-button py-3 font-extrabold uppercase tracking-wider hover:glass-button-active"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <span 
            className="text-sm text-light-accent cursor-pointer hover:underline"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot password?
          </span>
        </div>
        
        <p className="mt-4 text-center text-sm text-gray-300">
          Don't have an account? <span className="text-light-accent cursor-pointer hover:underline font-bold" onClick={() => navigate('/register')}>Register</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
