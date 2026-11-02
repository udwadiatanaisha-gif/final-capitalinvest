import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { useApp } from '../../context/AppContext';
import { Menu, X, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { navigate, currentUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#101C2C]/95 backdrop-blur-md border-b border-[#172B46] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => navigate('home')}>
            <BrandLogo variant="dark" size="md" />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate('home')}
              className="text-sm font-medium text-slate-200 hover:text-[#C6A76A] transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate('about')}
              className="text-sm font-medium text-slate-200 hover:text-[#C6A76A] transition-colors"
            >
              Our Approach
            </button>
            <button
              onClick={() => navigate('solutions')}
              className="text-sm font-medium text-slate-200 hover:text-[#C6A76A] transition-colors"
            >
              Wealth Solutions
            </button>
            <button
              onClick={() => navigate('platform')}
              className="text-sm font-medium text-slate-200 hover:text-[#C6A76A] transition-colors"
            >
              Platform
            </button>
            <button
              onClick={() => navigate('legal', 'security')}
              className="text-sm font-medium text-slate-200 hover:text-[#C6A76A] transition-colors"
            >
              Security
            </button>
            <button
              onClick={() => navigate('contact')}
              className="text-sm font-medium text-slate-200 hover:text-[#C6A76A] transition-colors"
            >
              Contact
            </button>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <button
                onClick={() => navigate(currentUser.role === 'Client' ? 'client-dashboard' : 'dashboard')}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#147D64] hover:bg-[#116954] rounded-md transition-all shadow-sm"
              >
                Go to Workspace
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('signin')}
                  className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('signup')}
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-[#101C2C] bg-[#C6A76A] hover:bg-[#b89759] rounded-md transition-all shadow-sm"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#172B46] border-b border-[#243c60] px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => { navigate('home'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-slate-200 hover:text-[#C6A76A]"
          >
            Home
          </button>
          <button
            onClick={() => { navigate('about'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-slate-200 hover:text-[#C6A76A]"
          >
            Our Approach
          </button>
          <button
            onClick={() => { navigate('solutions'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-slate-200 hover:text-[#C6A76A]"
          >
            Wealth Solutions
          </button>
          <button
            onClick={() => { navigate('platform'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-slate-200 hover:text-[#C6A76A]"
          >
            Platform
          </button>
          <button
            onClick={() => { navigate('legal', 'security'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-slate-200 hover:text-[#C6A76A]"
          >
            Security
          </button>
          <button
            onClick={() => { navigate('contact'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-slate-200 hover:text-[#C6A76A]"
          >
            Contact
          </button>
          <div className="pt-4 border-t border-slate-700 space-y-2">
            <button
              onClick={() => { navigate('signin'); setMobileMenuOpen(false); }}
              className="w-full text-center py-2.5 rounded text-sm font-medium bg-white/10 text-white"
            >
              Sign In
            </button>
            <button
              onClick={() => { navigate('signup'); setMobileMenuOpen(false); }}
              className="w-full text-center py-2.5 rounded text-sm font-semibold bg-[#C6A76A] text-[#101C2C]"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
