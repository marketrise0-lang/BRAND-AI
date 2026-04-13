import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useAuth } from '../AuthContext';

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const email = location.state?.email || user?.email || 'votre email';

  const [isResending, setIsResending] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleResendEmail = async () => {
    if (!user) return;
    setIsResending(true);
    setResendStatus('idle');
    try {
      await sendEmailVerification(user);
      setResendStatus('success');
    } catch (err) {
      console.error("Resend error:", err);
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (err) {
      console.error("Sign out error:", err);
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="glass-dark p-12 rounded-[3.5rem] border-2 border-white/10 max-w-md w-full text-center shadow-3xl">
        <div className="mb-10">
          <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-4xl font-serif italic text-white mb-6">Vérifiez votre email</h2>
          <p className="text-indigo-200/60 text-sm font-medium leading-relaxed">
            We have sent you a verification email to {email}. Please verify it and log in.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isResending ? "ENVOI EN COURS..." : "RENVOYER L'EMAIL DE VÉRIFICATION"}
          </button>

          {resendStatus === 'success' && (
            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Email envoyé avec succès !</p>
          )}
          {resendStatus === 'error' && (
            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">Erreur lors de l'envoi. Réessayez plus tard.</p>
          )}

          <button
            onClick={handleBackToLogin}
            className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl"
          >
            RETOUR À LA CONNEXION
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
