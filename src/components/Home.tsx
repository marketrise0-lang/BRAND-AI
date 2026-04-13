import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Layers, 
  Palette, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Star,
  Globe,
  Smartphone,
  Layout,
  PenTool
} from 'lucide-react';
import { useAuth } from '../../AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselItems = [
    {
      title: "Identité Visuelle Complète",
      description: "Logos, palettes de couleurs et typographies générés par IA pour une marque cohérente.",
      image: "https://picsum.photos/seed/branding/1200/800",
      category: "Branding"
    },
    {
      title: "Réseaux Sociaux",
      description: "Bannières, posts et stories optimisés pour Instagram, LinkedIn et Facebook.",
      image: "https://picsum.photos/seed/social/1200/800",
      category: "Social Media"
    },
    {
      title: "Supports Marketing",
      description: "Cartes de visite, flyers et présentations professionnelles en quelques secondes.",
      image: "https://picsum.photos/seed/marketing/1200/800",
      category: "Print"
    },
    {
      title: "UI/UX Design",
      description: "Maquettes d'interfaces web et mobiles modernes basées sur votre ADN de marque.",
      image: "https://picsum.photos/seed/uiux/1200/800",
      category: "Digital"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }
  }, []);

  const pricingPlans = [
    { 
      name: "Starter", 
      price: "0€", 
      desc: "Pour tester la puissance de l'IA", 
      features: ["3 générations après création", "Basse résolution", "Support standard", "Accès basique"], 
      cta: "Essayer gratuitement", 
      popular: false 
    },
    { 
      name: "Pro", 
      price: billingCycle === 'monthly' ? "29€" : "10€", 
      annualPrice: "120€",
      desc: "Pour les entrepreneurs sérieux", 
      features: ["Projets illimités", "Haute résolution (4K)", "Support prioritaire", "Tous les formats d'export", "Brand Book complet"], 
      cta: "Devenir Pro", 
      popular: true 
    },
    { 
      name: "Agency", 
      price: billingCycle === 'monthly' ? "49€" : "40€", 
      annualPrice: "480€",
      desc: "Pour les équipes et agences", 
      features: ["Tout du plan Pro", "Accès multi-utilisateurs", "Marque blanche", "API Access", "Account Manager dédié"], 
      cta: "Contacter l'équipe", 
      popular: false 
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">BrandGenius <span className="text-indigo-500">AI</span></span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center"
              >
                Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-bold hover:text-indigo-400 transition-colors">Connexion</Link>
                <Link 
                  to="/auth" 
                  className="px-6 py-2.5 bg-white text-black hover:bg-white/90 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Essai Gratuit
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                L'avenir du branding est ici
              </span>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
                CRÉEZ VOTRE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">EMPIRE VISUEL</span>
              </h1>
              <p className="max-w-2xl mx-auto text-white/60 text-lg md:text-xl mb-12 leading-relaxed">
                BrandGenius AI transforme vos idées en une identité de marque complète et professionnelle en quelques secondes. Logos, réseaux sociaux, marketing et plus encore.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button 
                  onClick={() => navigate('/auth')}
                  className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-500/40 flex items-center justify-center group"
                >
                  Commencer maintenant
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto px-10 py-5 glass-dark border border-white/10 hover:bg-white/5 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
                >
                  Voir la démo
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Showcase Carousel Section */}
      <section id="showcase" className="py-24 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 space-y-6 md:space-y-0">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6">
                CAPABLE DE TOUT <br /> <span className="text-white/40 italic serif">Générer.</span>
              </h2>
              <p className="text-white/60 text-lg">
                Explorez la diversité des projets que notre IA peut concevoir pour votre entreprise.
              </p>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={prevSlide}
                className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextSlide}
                className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <img 
                  src={carouselItems[currentSlide].image} 
                  alt={carouselItems[currentSlide].title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl">
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="inline-block px-3 py-1 rounded-lg bg-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4"
                  >
                    {carouselItems[currentSlide].category}
                  </motion.span>
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl md:text-6xl font-black tracking-tighter mb-4"
                  >
                    {carouselItems[currentSlide].title}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/70 text-lg md:text-xl"
                  >
                    {carouselItems[currentSlide].description}
                  </motion.p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Indicators */}
            <div className="absolute top-8 right-8 flex space-x-2">
              {carouselItems.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1 transition-all duration-500 rounded-full ${idx === currentSlide ? 'w-12 bg-indigo-500' : 'w-4 bg-white/20'}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">POURQUOI NOUS ?</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Une suite d'outils puissants conçus pour propulser votre marque au niveau supérieur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="w-8 h-8 text-yellow-400" />, title: "Vitesse Éclair", desc: "Générez une identité complète en moins de 60 secondes." },
              { icon: <Shield className="w-8 h-8 text-emerald-400" />, title: "Qualité Premium", desc: "Des designs de haute résolution prêts pour l'impression et le web." },
              { icon: <Palette className="w-8 h-8 text-pink-400" />, title: "Personnalisation", desc: "Ajustez chaque détail pour qu'il corresponde à votre vision." },
              { icon: <Globe className="w-8 h-8 text-blue-400" />, title: "Multi-plateforme", desc: "Formats optimisés pour tous les réseaux sociaux et supports." },
              { icon: <Smartphone className="w-8 h-8 text-purple-400" />, title: "Mobile Friendly", desc: "Créez et gérez votre marque directement depuis votre téléphone." },
              { icon: <Layers className="w-8 h-8 text-indigo-400" />, title: "Cohérence Totale", desc: "L'IA assure que tous vos supports parlent la même langue visuelle." }
            ].map((feature, idx) => (
              <div key={idx} className="glass-dark p-10 rounded-3xl border border-white/5 hover:border-white/10 transition-all hover:-translate-y-2 group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-4">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">TARIFS TRANSPARENTS</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10">
              Choisissez le plan qui correspond à vos ambitions. Pas de frais cachés.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-white/40'}`}>Mensuel</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="w-14 h-7 bg-white/10 rounded-full relative p-1 transition-all"
              >
                <div className={`w-5 h-5 bg-indigo-500 rounded-full transition-all ${billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </button>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-bold ${billingCycle === 'annual' ? 'text-white' : 'text-white/40'}`}>Annuel</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-full border border-indigo-500/20">
                  -60% ÉCONOMIE
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div key={idx} className={`p-12 rounded-[2.5rem] border transition-all hover:-translate-y-2 flex flex-col ${plan.popular ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-500/20' : 'glass-dark border-white/5'}`}>
                {plan.popular && <span className="text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Le plus populaire</span>}
                <h3 className="text-3xl font-black tracking-tight mb-2">{plan.name}</h3>
                <div className="text-5xl font-black tracking-tighter mb-4">
                  {plan.price}
                  <span className="text-sm font-medium text-white/40">/mois</span>
                </div>
                {billingCycle === 'annual' && plan.annualPrice && (
                  <div className="text-xs font-bold text-indigo-300 mb-4 uppercase tracking-widest">
                    Facturé {plan.annualPrice} / an
                  </div>
                )}
                <p className="text-white/60 mb-8 text-sm">{plan.desc}</p>
                <div className="space-y-4 mb-12 flex-grow">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 mr-3 text-white/60" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/checkout', { state: { plan: { ...plan, billingCycle } } })}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${plan.popular ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-indigo-600">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-5xl md:text-7xl font-black tracking-tighter mb-2">50K+</div>
            <div className="text-indigo-200 text-xs font-black uppercase tracking-widest">Utilisateurs</div>
          </div>
          <div>
            <div className="text-5xl md:text-7xl font-black tracking-tighter mb-2">1M+</div>
            <div className="text-indigo-200 text-xs font-black uppercase tracking-widest">Designs Créés</div>
          </div>
          <div>
            <div className="text-5xl md:text-7xl font-black tracking-tighter mb-2">99%</div>
            <div className="text-indigo-200 text-xs font-black uppercase tracking-widest">Satisfaction</div>
          </div>
          <div>
            <div className="text-5xl md:text-7xl font-black tracking-tighter mb-2">24/7</div>
            <div className="text-indigo-200 text-xs font-black uppercase tracking-widest">Support IA</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/10 blur-[100px] rounded-full -translate-y-1/2"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-12">
            PRÊT À <br /> <span className="italic serif text-white/40">Briller ?</span>
          </h2>
          <p className="text-white/60 text-xl mb-12">
            Rejoignez des milliers d'entrepreneurs qui ont déjà transformé leur présence visuelle avec BrandGenius AI.
          </p>
          <button 
            onClick={() => navigate('/auth')}
            className="px-12 py-6 bg-white text-black hover:bg-white/90 rounded-2xl text-lg font-black uppercase tracking-widest transition-all shadow-2xl shadow-white/10"
          >
            Commencer l'aventure
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">BrandGenius <span className="text-indigo-500">AI</span></span>
          </div>
          
          <div className="flex flex-col items-center md:items-end space-y-6">
            <div className="flex space-x-6">
              {[
                { name: 'LinkedIn', icon: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>, url: 'https://linkedin.com/company/brandgenius-ai' },
                { name: 'Instagram', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.063-2.633-.333-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.62.074-3.14.391-4.3 1.551-1.159 1.159-1.477 2.68-1.551 4.3-.058 1.279-.072 1.688-.072 4.947s.014 3.667.072 4.947c.074 1.62.391 3.14 1.551 4.3 1.159 1.159 2.68 1.477 4.3 1.551 1.279.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.62-.074 3.14-.391 4.3-1.551 1.159-1.159 1.477-2.68 1.551-4.3.058-1.279.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.074-1.62-.391-3.14-1.551-4.3-1.159-1.159-2.68-1.477-4.3-1.551-1.279-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>, url: 'https://instagram.com/brandgenius_ai' },
                { name: 'X', icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>, url: 'https://x.com/brandgenius_ai' },
                { name: 'Facebook', icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>, url: 'https://facebook.com/brandgeniusai' },
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Suivez-nous sur ${link.name}`}
                  className="text-white/40 hover:text-indigo-400 transition-all duration-300 hover:scale-110"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    {link.icon}
                  </svg>
                </a>
              ))}
            </div>
            <div className="flex space-x-8 text-xs font-black uppercase tracking-widest text-white/40">
              <button onClick={() => alert('Privacy Policy coming soon')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => alert('Terms of Service coming soon')} className="hover:text-white transition-colors">Terms</button>
              <button onClick={() => alert('Contact us at support@brandgenius.ai')} className="hover:text-white transition-colors">Contact</button>
            </div>
          </div>

          <div className="text-white/20 text-[10px] font-medium uppercase tracking-widest">
            © 2026 BrandGenius AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
