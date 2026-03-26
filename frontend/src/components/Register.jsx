import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('customer'); // 'customer' or 'admin'
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    mpin: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        full_name: formData.fullName,
        username: formData.username,
        password: formData.password,
        role: role,
      };
      if (role === 'customer') {
        payload.email = formData.email;
        payload.mpin = formData.mpin;
        payload.phone_number = formData.phoneNumber;

        // Phone Validation
        const phoneRegex = /^[0-9]{10}$/;
        if (payload.phone_number && !phoneRegex.test(payload.phone_number)) {
          alert('Phone number must be exactly 10 digits and contain only numbers');
          return;
        }
      }
      
      await axios.post('http://localhost:8000/api/accounts/register/', payload);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      const errorMsg = error.response?.data 
        ? typeof error.response.data === 'string'
          ? error.response.data
          : Object.entries(error.response.data).map(([key, value]) => `${key}: ${value}`).join('\n')
        : error.message;
      alert(`Registration failed:\n${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-dark relative overflow-hidden py-12">
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

      <div className="glass-panel p-8 w-96 relative z-10 m-4">
        <div className="absolute top-4 left-4">
          <button onClick={() => navigate('/')} className="text-light-accent hover:text-white text-sm flex items-center transition-colors">
            ← Home
          </button>
        </div>
        <h2 className="text-3xl font-black mb-6 text-center text-white pt-4 tracking-tight">Register</h2>
        
        <div className="flex mb-6 bg-secondary-dark/50 backdrop-blur-md rounded-full p-1 border border-white/5">
          <button
            className={`flex-1 py-2 rounded-full transition-all font-bold text-sm ${role === 'customer' ? 'bg-light-accent text-primary-dark shadow-lg' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setRole('customer')}
          >
            Customer
          </button>
          <button
            className={`flex-1 py-2 rounded-full transition-all font-bold text-sm ${role === 'admin' ? 'bg-light-accent text-primary-dark shadow-lg' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-200 text-sm font-bold mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              className="glass-input w-full px-4 py-2"
              placeholder="Enter Full Name"
              required
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-gray-200 text-sm font-bold mb-1">Username</label>
            <input
              type="text"
              name="username"
              className="glass-input w-full px-4 py-2"
              placeholder="Enter Username"
              required
              onChange={handleChange}
            />
          </div>
          
          {role === 'customer' && (
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-1">Email</label>
              <input
                type="email"
                name="email"
                className="glass-input w-full px-4 py-2"
                placeholder="Enter Email"
                required
                onChange={handleChange}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-200 text-sm font-bold mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="glass-input w-full px-4 py-2 pr-12"
                placeholder="Enter Password"
                required
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {role === 'customer' && (
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-1">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                maxLength="10"
                className="glass-input w-full px-4 py-2"
                placeholder="Enter 10-digit Phone"
                required
                onChange={handleChange}
              />
            </div>
          )}

          {role === 'customer' && (
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-1">MPIN</label>
              <div className="relative">
                <input
                  type={showMpin ? "text" : "password"}
                  name="mpin"
                  maxLength="6"
                  className="glass-input w-full px-4 py-2 pr-12"
                  placeholder="Enter 6-digit MPIN"
                  required
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowMpin(!showMpin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showMpin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full glass-button py-3 font-extrabold uppercase tracking-wider hover:glass-button-active mt-2"
          >
            Register as {role === 'customer' ? 'Customer' : 'Admin'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-300">
          Already have an account? <span className="text-light-accent cursor-pointer hover:underline font-bold" onClick={() => navigate('/login')}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default Register;
