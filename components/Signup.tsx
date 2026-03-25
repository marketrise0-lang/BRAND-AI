import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useNavigate } from 'react-router-dom';

interface SignupProps {
  onToggle: () => void;
}

const Signup: React.FC<SignupProps> = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | React.ReactNode>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send verification email
      await sendEmailVerification(user);
      
      // Sign out immediately
      await signOut(auth);
      
      // Redirect to verification screen
      navigate('/verify-email', { state: { email: user.email } });
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          <span>
            L'inscription par e-mail n'est pas activée. 
            <a href="https://console.firebase.google.com/project/gen-lang-client-0462787285/authentication/providers" target="_blank" rel="noopener noreferrer" className="underline ml-1">
              Cliquez ici pour l'activer dans votre console Firebase
            </a>.
          </span>
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        await signOut(auth);
        navigate('/verify-email', { state: { email: user.email } });
        return;
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Google signup error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          <span>
            La connexion Google n'est pas activée. 
            <a href="https://console.firebase.google.com/project/gen-lang-client-0462787285/authentication/providers" target="_blank" rel="noopener noreferrer" className="underline ml-1">
              Cliquez ici pour l'activer dans votre console Firebase
            </a>.
          </span>
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="glass-dark p-12 rounded-[3.5rem] border-2 border-white/10 max-w-md w-full text-center shadow-3xl">
        <div className="mb-10">
          <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          </div>
          <h2 className="text-4xl font-serif italic text-white mb-2">Rejoignez-nous</h2>
          <p className="text-indigo-200/40 text-sm font-medium">Créez votre compte pour accéder à l'élite du design.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <input
            type="password"
            placeholder="MOT DE PASSE"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
          >
            {isLoading ? "CHARGEMENT..." : "S'INSCRIRE"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="px-4 text-[10px] font-black text-white/20 uppercase tracking-widest">OU</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-indigo-50 transition-all shadow-xl flex items-center justify-center space-x-4 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>S'inscrire avec Google</span>
        </button>

        <div className="mt-10 pt-10 border-t border-white/5">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
            Déjà un compte ? <button onClick={onToggle} className="text-white/40 hover:text-white cursor-pointer transition-colors">Connectez-vous</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
