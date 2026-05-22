import { useState } from 'react';
import { CalendarClock, Send, CheckCircle2 } from 'lucide-react';

export default function ScheduledReportForm({ token, initialSql = '' }) {
  const [name, setName] = useState('Weekly revenue snapshot');
  const [sql, setSql]   = useState(initialSql || 'SELECT region, SUM(revenue) FROM sales_2026 GROUP BY region;');
  const [frequency, setFrequency] = useState('weekly');
  const [recipients, setRecipients] = useState('demo@aianalyst.com');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true); setError(null); setSaved(null);
    try {
      const r = await fetch('/api/custom-views/schedule-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          sql,
          frequency,
          recipients: recipients.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to schedule');
      setSaved(j.report);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary-600" />
        <span className="font-semibold text-gray-900">Schedule a Report</span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">SQL</label>
          <textarea
            value={sql}
            onChange={e => setSql(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Recipients (comma-separated)
            </label>
            <input
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-sm px-3 py-2 rounded"
        >
          <Send className="h-4 w-4" /> {submitting ? 'Saving...' : 'Schedule report'}
        </button>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {saved && (
          <div className="flex items-start gap-2 bg-emerald-50 text-emerald-800 text-sm rounded p-3">
            <CheckCircle2 className="h-5 w-5 mt-0.5" />
            <div>
              <div className="font-semibold">Report scheduled (#{saved.id})</div>
              <div className="text-xs">
                {saved.name} - {saved.frequency} - {saved.recipients}
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
