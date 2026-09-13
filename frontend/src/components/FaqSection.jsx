import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  CircleDollarSign, 
  Wind, 
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FAQ_ITEMS } from '../data/mockData';

export default function FaqSection({ onOpenInquiry }) {
  const [openId, setOpenId] = useState('faq-1');

  const toggleItem = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wide">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Community Rules & Knowledge Base</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Guidelines & FAQ
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Everything you need to know regarding racket lending, shuttlecock standards, semester fees, and court rotation rules.
          </p>
        </div>

        {/* Feature Highlights: Equipment & Shuttlecock Policy Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Shuttlecock Policy */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-tuc-100 dark:bg-tuc-950 text-tuc-700 dark:text-emerald-400 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Shuttlecock Policy
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <p>
                <strong className="text-slate-800 dark:text-slate-200">Recreational & Beginners:</strong> Yonex Mavis 350 yellow nylon shuttles provided for longevity.
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-200">League & Squad Training:</strong> Victor Champion / Yonex AS-30 goose feather shuttles provided on Friday.
              </p>
            </div>
          </div>

          {/* Card 2: Rackets & Rental */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Racket Loan Service
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <p>
                8 balanced composite loaner rackets are stored at Sporthalle Thüringer Weg.
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                Free for your first 2 trial sessions. Just check the box during registration!
              </p>
            </div>
          </div>

          {/* Card 3: Semester Fees */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Membership & Fees
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="flex justify-between py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
                <span>TUC Students</span>
                <span className="font-bold text-slate-900 dark:text-white">€15 / Semester</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
                <span>TUC Staff</span>
                <span className="font-bold text-slate-900 dark:text-white">€25 / Semester</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>External Guests</span>
                <span className="font-bold text-slate-900 dark:text-white">€45 / Semester</span>
              </div>
            </div>
          </div>

        </div>

        {/* Accordion List */}
        <div className="max-w-4xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-all bg-slate-50/50 dark:bg-slate-950/40"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-tuc-100 dark:bg-tuc-950 text-tuc-800 dark:text-tuc-300 border border-tuc-200 dark:border-tuc-800">
                      {item.category}
                    </span>
                    <span className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-tuc-600 dark:text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 leading-relaxed animate-in fade-in duration-150">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions CTA */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-tuc-50 dark:bg-tuc-950/40 border border-tuc-200 dark:border-tuc-800/80 max-w-2xl mx-auto space-y-3">
          <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Have a specific question not covered here?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Reach out directly to the club coordinators. We typically respond within 24 hours.
          </p>
          <button
            onClick={onOpenInquiry}
            className="px-4 py-2 text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 dark:bg-tuc-600 dark:hover:bg-tuc-500 rounded-lg shadow-sm transition-all"
          >
            Ask a Question via Form
          </button>
        </div>

      </div>
    </section>
  );
}
