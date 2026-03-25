import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  Zap,
  Lock,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../AuthContext';

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // If plan is passed via state, use it. Otherwise, default to Pro.
    if (location.state?.plan) {
      setSelectedPlan(location.state.plan);
    } else {
      // Default plan if accessed directly
      setSelectedPlan({
        name: "Pro",
        price: "29€",
        desc: "Pour les entrepreneurs sérieux",
        features: ["Projets illimités", "Haute résolution (4K)", "Support prioritaire", "Tous les formats d'export", "Brand Book complet"]
      });
    }
  }, [location]);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    
    // In a real app, you'd integrate Stripe here.
    alert("Paiement réussi ! (Simulation)");
    navigate('/dashboard');
  };

  if (!selectedPlan) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 selection:text-white pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-white/40 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Retour aux tarifs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">Récapitulatif <br /> <span className="text-indigo-500">de commande</span></h1>
              <p className="text-white/60 text-lg">Vous avez choisi le plan {selectedPlan.name}. Une fois le paiement validé, vous aurez un accès immédiat à toutes les fonctionnalités.</p>
            </div>

            <div className="glass-dark p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="w-24 h-24 text-indigo-500" />
              </div>
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2">{selectedPlan.name}</h3>
                  <p className="text-white/40 text-sm">{selectedPlan.desc}</p>
                </div>
                <div className="text-4xl font-black tracking-tighter">
                  {selectedPlan.price}
                  <span className="text-sm font-medium text-white/40">/mois</span>
                </div>
              </div>

              {selectedPlan.billingCycle === 'annual' && selectedPlan.annualPrice && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-8">
                  <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
                    Abonnement Annuel : {selectedPlan.annualPrice} / an
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-8">
                {selectedPlan.features.map((f: string, i: number) => (
                  <div key={i} className="flex items-center text-sm text-white/70">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-indigo-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                <span className="text-lg font-bold">Total à payer</span>
                <span className="text-3xl font-black text-indigo-400">
                  {selectedPlan.billingCycle === 'annual' && selectedPlan.annualPrice ? selectedPlan.annualPrice : selectedPlan.price}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="glass-dark p-6 rounded-2xl border border-white/5 text-center">
                <ShieldCheck className="w-6 h-6 mx-auto mb-3 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Sécurisé</span>
              </div>
              <div className="glass-dark p-6 rounded-2xl border border-white/5 text-center">
                <Lock className="w-6 h-6 mx-auto mb-3 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">SSL 256-bit</span>
              </div>
              <div className="glass-dark p-6 rounded-2xl border border-white/5 text-center">
                <Smartphone className="w-6 h-6 mx-auto mb-3 text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Mobile Ready</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-dark p-12 rounded-[3rem] border border-white/10 shadow-2xl"
          >
            <h2 className="text-2xl font-black tracking-tight mb-8 uppercase">Méthode de paiement</h2>
            
            <div className="space-y-4 mb-12">
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-6 rounded-2xl border flex items-center justify-between transition-all ${paymentMethod === 'card' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 mr-4" />
                  <span className="font-bold">Carte Bancaire</span>
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
                  <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold">MC</div>
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('paypal')}
                className={`w-full p-6 rounded-2xl border flex items-center justify-between transition-all ${paymentMethod === 'paypal' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.067 8.478c.492.88.556 2.014.307 3.292-.572 2.934-2.456 4.944-5.19 4.944H12.31l-.616 3.162c-.056.29-.31.504-.604.504H8.113c-.448 0-.772-.413-.685-.852l2.529-12.986c.056-.29.31-.504.604-.504h4.452c2.233 0 3.94.502 4.754 1.438h.3zm-4.462 4.14c.896 0 1.512-.658 1.698-1.61.186-.952-.162-1.61-1.058-1.61h-2.148l-.644 3.22h2.152z"/></svg>
                  <span className="font-bold">PayPal</span>
                </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('crypto')}
                className={`w-full p-6 rounded-2xl border flex items-center justify-between transition-all ${paymentMethod === 'crypto' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24ZM12 2.18182C6.57753 2.18182 2.18182 6.57753 2.18182 12C2.18182 17.4225 6.57753 21.8182 12 21.8182C17.4225 21.8182 21.8182 17.4225 21.8182 12C21.8182 6.57753 17.4225 2.18182 12 2.18182ZM12.5455 13.6364V15.8182H11.4545V13.6364H9.27273V12.5455H11.4545V11.4545H9.27273V10.3636H11.4545V8.18182H12.5455V10.3636H14.7273V11.4545H12.5455V12.5455H14.7273V13.6364H12.5455Z"/></svg>
                  <span className="font-bold">Crypto-monnaies</span>
                </div>
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Informations de facturation</label>
                <input 
                  type="email" 
                  placeholder="E-mail"
                  defaultValue={user?.email || ''}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full py-6 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl ${isProcessing ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Traitement en cours...
                  </div>
                ) : (
                  `Payer ${selectedPlan.billingCycle === 'annual' && selectedPlan.annualPrice ? selectedPlan.annualPrice : selectedPlan.price}`
                )}
              </button>

              <p className="text-center text-[10px] text-white/30 font-medium">
                En cliquant sur payer, vous acceptez nos <button className="underline">Conditions Générales de Vente</button>. 
                Paiement sécurisé par Stripe.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
