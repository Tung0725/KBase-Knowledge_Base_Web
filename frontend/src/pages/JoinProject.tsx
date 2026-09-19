import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const JoinProject: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAttemptedJoin = React.useRef(false);

  useEffect(() => {
    if (!user) {
      // If not logged in, redirect to auth but save the invite code logic to localStorage or URL params
      // Since Auth page doesn't currently handle deep links gracefully out of the box, we just pass redirect
      sessionStorage.setItem('redirectAfterAuth', `/join/${inviteCode}`);
      navigate('/auth', { replace: true });
      return;
    }
    
    if (!hasAttemptedJoin.current) {
        hasAttemptedJoin.current = true;
        joinProject();
    }
  }, [user, inviteCode, navigate]);

  const joinProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await projectService.joinProjectByInviteCode(inviteCode!);
      toast.success('Tham gia dự án thành công!');
      if (res.projectId) {
        navigate(`/projects/${res.projectId}`, { replace: true });
      } else {
        navigate('/hub', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi không xác định khi tham gia dự án';
      
      if (msg.includes('already a member') || msg.includes('already the owner')) {
        toast.success('Bạn đã ở trong dự án này rồi.');
        navigate('/hub', { replace: true });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-lowest max-w-md w-full p-8 rounded-2xl shadow-xl text-center border border-outline-variant/30"
      >
        <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl">
            {loading && 'hourglass_empty'}
            {!loading && error && 'error'}
            {!loading && !error && 'check_circle'}
          </span>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          {loading && 'Đang tham gia dự án...'}
          {!loading && error && 'Không thể tham gia'}
          {!loading && !error && 'Thành công!'}
        </h1>
        
        <p className="text-on-surface-variant mb-8">
          {loading && 'Vui lòng chờ trong giây lát, chúng tôi đang xác thực lời mời của bạn.'}
          {!loading && error}
        </p>

        {error && (
          <button
            onClick={() => navigate('/hub')}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Quay lại trang chủ
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default JoinProject;
