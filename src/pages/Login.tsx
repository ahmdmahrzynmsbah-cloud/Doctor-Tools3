import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { businessProfile } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError('');
    
    if (!password) {
      setError('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsLoading(true);
    const result = await login(password);
    setIsLoading(false);

    if (!result.success && result.error) {
      setError(result.error);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 font-cairo" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2180B2] to-[#2ECC71]"></div>
        
        <div className="flex flex-col items-center justify-center text-center mt-6 mb-8">
          <div className="w-20 h-20 bg-white border border-[#CBD5E1] rounded-2xl flex items-center justify-center mb-5 shadow-md overflow-hidden">
            <img src={businessProfile?.logo || '/logo.png'} alt="Doctor Tools" className="w-full h-full object-contain rounded-2xl" />
          </div>
          <h1 className="text-3xl font-black text-[#1E293B] tracking-tight">{businessProfile?.name || 'Doctor Tools'}</h1>
          <p className="text-[#475569] font-medium mt-2">{businessProfile?.description || 'نظام إدارة العيادات والمستلزمات الطبية المتكامل'}</p>
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0] mb-8">
          <p className="text-[#1E293B] font-bold text-center mb-4">تسجيل الدخول للموظفين والإدارة</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#475569] mb-1">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e as any);
                  }
                }}
                className="w-full border border-[#E2E8F0] rounded-lg px-4 py-3 bg-[#F1F5F9] focus:ring-2 focus:ring-[#2180B2] focus:outline-none"
                placeholder="أدخل كلمة المرور (admin)..."
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-[#2180B2] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#1A6B94] transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent flex-shrink-0 animate-spin rounded-full"></div>
              ) : (
                 <span>دخول النظام</span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-center">
            <p className="text-[#DC2626] text-sm font-bold">{error}</p>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-4 text-center w-full text-[#94A3B8] text-xs font-medium">
        © 2026 {businessProfile?.name || 'Doctor Tools'} - جميع الحقوق محفوظة
      </div>
    </div>
  );
}
