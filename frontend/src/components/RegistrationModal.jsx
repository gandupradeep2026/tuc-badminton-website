import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Send, 
  Calendar, 
  AlertCircle, 
  User, 
  Mail, 
  Award, 
  MessageSquare, 
  HelpCircle,
  Sparkles,
  Database
} from 'lucide-react';

export default function RegistrationModal({ 
  isOpen, 
  onClose, 
  initialSession = null,
  initialType = 'trial',
  onSuccess 
}) {
  const [activeTab, setActiveTab] = useState(initialType); // 'trial' | 'tournament' | 'inquiry'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    affiliation: 'TUC Student',
    skill_level: 'intermediate',
    preferred_day: 'Wednesday',
    racket_needed: false,
    message: '',
    subject: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // Sync initialSession if provided
  useEffect(() => {
    if (initialSession) {
      setFormData((prev) => ({
        ...prev,
        preferred_day: initialSession.day || 'Wednesday',
        skill_level: initialSession.level ? initialSession.level.toLowerCase() : 'intermediate',
      }));
    }
  }, [initialSession]);

  useEffect(() => {
    if (initialType) {
      setActiveTab(initialType);
    }
  }, [initialType]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'inquiry') {
        const response = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            subject: formData.subject || 'Badminton Question',
            message: formData.message,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to submit inquiry');

        setSubmittedData({
          type: 'inquiry',
          record: result.inquiry,
        });
      } else {
        // Registration (trial or tournament)
        const response = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            affiliation: formData.affiliation,
            session_type: activeTab, // 'trial' or 'tournament'
            skill_level: formData.skill_level,
            preferred_day: formData.preferred_day,
            racket_needed: formData.racket_needed,
            message: formData.message,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to submit registration');

        setSubmittedData({
          type: 'registration',
          record: result.registration,
        });
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'An error occurred while connecting to the local SQLite server.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setFormData({
      name: '',
      email: '',
      affiliation: 'TUC Student',
      skill_level: 'intermediate',
      preferred_day: 'Wednesday',
      racket_needed: false,
      message: '',
      subject: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs uppercase font-bold tracking-wider text-tuc-700 dark:text-emerald-400">
                TU Chemnitz Badminton Portal
              </span>
            </div>
            <h3 className="font-display font-black text-2xl text-slate-900 dark:text-white">
              {submittedData ? 'Confirmation' : 'Player Registration'}
            </h3>
          </div>

          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {submittedData ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h4 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                Saved to Local SQLite!
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Thank you, <strong className="text-slate-900 dark:text-white">{submittedData.record.name}</strong>. 
                Your entry has been assigned record ID <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-tuc-700 dark:text-emerald-400">#{submittedData.record.id}</code> in the database.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60 text-slate-500">
                <span className="flex items-center gap-1 font-semibold">
                  <Database className="w-3.5 h-3.5 text-tuc-600 dark:text-emerald-400" />
                  SQLite Record Details
                </span>
                <span className="font-mono text-[11px]">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-400">Email:</span> {submittedData.record.email}</div>
                <div><span className="text-slate-400">Type:</span> {submittedData.record.session_type || 'Inquiry'}</div>
                {submittedData.record.preferred_day && (
                  <div><span className="text-slate-400">Session:</span> {submittedData.record.preferred_day}</div>
                )}
                {submittedData.record.skill_level && (
                  <div><span className="text-slate-400">Skill:</span> {submittedData.record.skill_level}</div>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-tuc-50 dark:bg-tuc-950/50 border border-tuc-200 dark:border-tuc-800 text-xs text-tuc-800 dark:text-tuc-300 text-left">
              👟 <strong>Reminder:</strong> Remember to bring clean indoor shoes with non-marking soles to Sporthalle Thüringer Weg 11. Loaner rackets will be set aside for you.
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 text-sm font-bold text-white bg-tuc-800 hover:bg-tuc-700 dark:bg-tuc-600 rounded-xl shadow-sm transition-all"
            >
              Done / Return to Portal
            </button>
          </div>
        ) : (
          /* Form Content */
          <div className="p-6 sm:p-7 space-y-6">
            
            {/* Tab Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('trial')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'trial'
                    ? 'bg-white dark:bg-slate-700 text-tuc-800 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Trial Session
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tournament')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'tournament'
                    ? 'bg-white dark:bg-slate-700 text-tuc-800 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tournament Entry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inquiry')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'inquiry'
                    ? 'bg-white dark:bg-slate-700 text-tuc-800 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                General Inquiry
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name & Email Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Lukas Weber"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tuc-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@tu-chemnitz.de"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tuc-600"
                  />
                </div>
              </div>

              {/* Affiliation & Skill Level for Registrations */}
              {activeTab !== 'inquiry' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      University Affiliation
                    </label>
                    <select
                      name="affiliation"
                      value={formData.affiliation}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tuc-600"
                    >
                      <option value="TUC Student">TUC Student (Hochschulsport)</option>
                      <option value="TUC Staff / Faculty">TUC Staff / Faculty</option>
                      <option value="External Guest">External Community Guest</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Skill Level *</span>
                    </label>
                    <select
                      name="skill_level"
                      value={formData.skill_level}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tuc-600"
                    >
                      <option value="beginner">Beginner (Learning Rules & Strokes)</option>
                      <option value="intermediate">Intermediate (Regular Doubles Play)</option>
                      <option value="advanced">Advanced (Competitive / Club Player)</option>
                      <option value="hochschulsport">University Team Candidate</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Preferred Session Day for Registrations */}
              {activeTab !== 'inquiry' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Preferred Training Day</span>
                    </label>
                    <select
                      name="preferred_day"
                      value={formData.preferred_day}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tuc-600"
                    >
                      <option value="Monday">Monday 18:00 (Beginners • Thüringer Weg)</option>
                      <option value="Wednesday">Wednesday 19:30 (Open Doubles • Thüringer Weg)</option>
                      <option value="Friday">Friday 18:30 (Team Squad • CPS Reichenhainer)</option>
                      <option value="Sunday">Sunday 10:00 (Open Free Play • Thüringer Weg)</option>
                    </select>
                  </div>

                  {/* Loaner Racket Checkbox */}
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        name="racket_needed"
                        checked={formData.racket_needed}
                        onChange={handleChange}
                        className="w-4 h-4 rounded text-tuc-600 focus:ring-tuc-500 border-slate-300 dark:border-slate-600"
                      />
                      <span>I need to borrow a club racket on-site</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Subject for Inquiry */}
              {activeTab === 'inquiry' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Hochschulsport pass questions, restringing..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tuc-600"
                  />
                </div>
              )}

              {/* Message / Experience */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {activeTab === 'inquiry' ? 'Message *' : 'Previous Experience / Questions'}
                  </span>
                </label>
                <textarea
                  name="message"
                  rows={3}
                  required={activeTab === 'inquiry'}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={
                    activeTab === 'inquiry'
                      ? 'Ask your question regarding fees, schedules, or court equipment...'
                      : 'Tell us a bit about your badminton background or if you have any questions...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tuc-600 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-tuc-800 hover:bg-tuc-700 dark:bg-tuc-600 dark:hover:bg-tuc-500 shadow-md shadow-tuc-900/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving to SQLite...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {activeTab === 'trial'
                          ? 'Confirm Trial Session Booking'
                          : activeTab === 'tournament'
                          ? 'Submit Tournament Entry'
                          : 'Send Community Inquiry'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
                <Database className="w-3 h-3 text-tuc-600 dark:text-emerald-400" />
                <span>Writes directly to project SQLite database `data/badminton.sqlite`</span>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
