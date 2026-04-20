import React, { useEffect, useState, useCallback } from 'react';
import { Handshake, Send, Check, X, RefreshCw, Shield, Swords, ScrollText, AlertTriangle } from 'lucide-react';

/**
 * DiplomacyPanel
 *
 * Student-facing panel for cross-class-period diplomacy and trade.
 *
 * Pulls from /api/diplomacy/student/*:
 *   - classmates: fellow students in the same period (so we know who we can trade with)
 *   - offers: pending incoming + outgoing trade proposals
 *   - relations: per-classmate diplomatic state (neutral / treaty / alliance / hostile)
 *
 * Why this is a panel (not a route): it's a companion to the main sim view.
 * Students should be able to propose a trade in the middle of a turn without
 * context-switching out of the map. We stack it as a collapsible side card
 * rather than a modal so it doesn't block their other decisions.
 *
 * Why we cap the trade form at four resources (production, science, culture,
 * faith): those are the four "soft" currencies students actually accumulate
 * and spend during play. Food/martial/defense are either consumed internally
 * or not transferable by fiction.
 *
 * Polls every 8s \u2014 matches the existing leaderboard cadence roughly, which
 * keeps the overall traffic footprint predictable for classroom networks.
 */

interface Classmate {
  id: number;
  name: string;
  username: string;
  civilization_id: string | null;
  display_civ_name: string | null;
}

interface TradeOffer {
  id: number;
  period_id: number;
  proposer_id: number;
  recipient_id: number;
  turn_number: number;
  offer_data: string; // JSON string
  status: string;
  responded_at: string | null;
  created_at: string;
  proposer_name?: string;
  proposer_username?: string;
  recipient_name?: string;
  recipient_username?: string;
}

interface DiplomacyRelation {
  id: number;
  period_id: number;
  student_a_id: number;
  student_b_id: number;
  relation_type: 'neutral' | 'treaty' | 'alliance' | 'hostile';
  established_turn: number | null;
  other_id: number;
  other_name: string;
}

interface DecodedOffer {
  offer: Record<string, number>;
  request: Record<string, number>;
  note?: string;
}

type ResourceKey = 'productionPool' | 'science' | 'culture' | 'faith';

const RESOURCE_LABELS: Record<ResourceKey, string> = {
  productionPool: 'Production',
  science: 'Science',
  culture: 'Culture',
  faith: 'Faith',
};

const RESOURCE_KEYS: ResourceKey[] = ['productionPool', 'science', 'culture', 'faith'];

interface Props {
  periodId: string | null;
  currentTurn: number;
  // Optional — lets the parent reflect trade effects into live game state.
  onOfferAccepted?: (offer: DecodedOffer, fromStudentId: number) => void;
}

function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function safeDecode(raw: string): DecodedOffer {
  try {
    const parsed = JSON.parse(raw || '{}');
    return {
      offer: parsed.offer || {},
      request: parsed.request || {},
      note: parsed.note || '',
    };
  } catch {
    return { offer: {}, request: {}, note: '' };
  }
}

function formatResourceList(bundle: Record<string, number>): string {
  const entries = Object.entries(bundle).filter(([, amt]) => Number(amt) > 0);
  if (entries.length === 0) return '(nothing)';
  return entries
    .map(([k, v]) => `${v} ${RESOURCE_LABELS[k as ResourceKey] || k}`)
    .join(', ');
}

const RELATION_STYLES: Record<DiplomacyRelation['relation_type'], { icon: React.ReactNode; label: string; cls: string }> = {
  neutral:  { icon: <Handshake size={12} />, label: 'Neutral',  cls: 'bg-slate-800 text-slate-300 border-slate-700' },
  treaty:   { icon: <ScrollText size={12} />, label: 'Treaty',   cls: 'bg-sky-900/40 text-sky-200 border-sky-700' },
  alliance: { icon: <Shield size={12} />,     label: 'Alliance', cls: 'bg-emerald-900/40 text-emerald-200 border-emerald-700' },
  hostile:  { icon: <Swords size={12} />,     label: 'Hostile',  cls: 'bg-rose-900/40 text-rose-200 border-rose-700' },
};

export function DiplomacyPanel({ periodId, currentTurn, onOfferAccepted }: Props) {
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [incoming, setIncoming] = useState<TradeOffer[]>([]);
  const [outgoing, setOutgoing] = useState<TradeOffer[]>([]);
  const [relations, setRelations] = useState<DiplomacyRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'offers' | 'propose' | 'relations'>('offers');

  // Propose-form state
  const [recipientId, setRecipientId] = useState<number | ''>('');
  const [offerBundle, setOfferBundle] = useState<Record<ResourceKey, number>>({
    productionPool: 0, science: 0, culture: 0, faith: 0,
  });
  const [requestBundle, setRequestBundle] = useState<Record<ResourceKey, number>>({
    productionPool: 0, science: 0, culture: 0, faith: 0,
  });
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // ---- Data loading -------------------------------------------------------

  const loadAll = useCallback(async () => {
    if (!periodId) {
      setLoading(false);
      return;
    }
    try {
      const [cRes, oRes, rRes] = await Promise.all([
        authedFetch('/api/diplomacy/student/classmates'),
        authedFetch('/api/diplomacy/student/offers'),
        authedFetch('/api/diplomacy/student/relations'),
      ]);
      if (!cRes.ok || !oRes.ok || !rRes.ok) {
        throw new Error(`Server error (${cRes.status}/${oRes.status}/${rRes.status})`);
      }
      const cJson = await cRes.json() as { classmates: Classmate[] };
      const oJson = await oRes.json() as { incoming: TradeOffer[]; outgoing: TradeOffer[] };
      const rJson = await rRes.json() as { relations: DiplomacyRelation[] };
      setClassmates(cJson.classmates || []);
      setIncoming(oJson.incoming || []);
      setOutgoing(oJson.outgoing || []);
      setRelations(rJson.relations || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load diplomacy data');
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    loadAll();
    if (!periodId) return;
    const t = setInterval(loadAll, 8000);
    return () => clearInterval(t);
  }, [loadAll, periodId]);

  // ---- Actions ------------------------------------------------------------

  const bundleSum = (b: Record<ResourceKey, number>) => RESOURCE_KEYS.reduce((acc, k) => acc + (b[k] || 0), 0);

  const submitOffer = async () => {
    if (!recipientId) { setFlash('Pick a classmate first.'); return; }
    if (bundleSum(offerBundle) === 0 && bundleSum(requestBundle) === 0) {
      setFlash('Add at least one resource to offer or request.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await authedFetch('/api/diplomacy/student/offers', {
        method: 'POST',
        body: JSON.stringify({
          recipientId,
          offer: offerBundle,
          request: requestBundle,
          note,
          turnNumber: currentTurn,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as any).message || `Failed (${r.status})`);
      }
      setFlash('Offer sent.');
      setOfferBundle({ productionPool: 0, science: 0, culture: 0, faith: 0 });
      setRequestBundle({ productionPool: 0, science: 0, culture: 0, faith: 0 });
      setNote('');
      setActiveTab('offers');
      await loadAll();
    } catch (e: any) {
      setFlash(e?.message || 'Could not send offer.');
    } finally {
      setSubmitting(false);
    }
  };

  const respondToOffer = async (offerId: number, action: 'accept' | 'reject' | 'cancel') => {
    try {
      const r = await authedFetch(`/api/diplomacy/student/offers/${offerId}/${action}`, { method: 'POST' });
      if (!r.ok) throw new Error(`Failed to ${action}`);
      if (action === 'accept' && onOfferAccepted) {
        const o = incoming.find((x) => x.id === offerId);
        if (o) onOfferAccepted(safeDecode(o.offer_data), o.proposer_id);
      }
      await loadAll();
    } catch (e: any) {
      setFlash(e?.message || 'Action failed');
    }
  };

  const setRelation = async (classmateId: number, relation: DiplomacyRelation['relation_type']) => {
    try {
      const r = await authedFetch(`/api/diplomacy/student/relations/${classmateId}`, {
        method: 'POST',
        body: JSON.stringify({ relation, turnNumber: currentTurn }),
      });
      if (!r.ok) throw new Error('Failed to update relation');
      await loadAll();
    } catch (e: any) {
      setFlash(e?.message || 'Could not change relation');
    }
  };

  const relationFor = (classmateId: number): DiplomacyRelation['relation_type'] => {
    const rel = relations.find((r) => r.other_id === classmateId);
    return (rel?.relation_type as DiplomacyRelation['relation_type']) || 'neutral';
  };

  // ---- Render -------------------------------------------------------------

  if (!periodId) {
    return (
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <Handshake size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diplomacy</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Solo mode — join a class period to trade and form alliances with classmates.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Handshake size={14} className="text-amber-300" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Diplomacy</span>
        </div>
        <button
          onClick={loadAll}
          className="text-slate-500 hover:text-slate-300"
          title="Refresh"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2 text-[10px]">
        {(['offers', 'propose', 'relations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFlash(null); }}
            className={`flex-1 py-1 rounded uppercase tracking-widest font-bold ${
              activeTab === tab
                ? 'bg-amber-700/50 text-amber-100 border border-amber-500/60'
                : 'bg-slate-900/40 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            {tab === 'offers' ? `Offers${incoming.length ? ` (${incoming.length})` : ''}` : tab}
          </button>
        ))}
      </div>

      {flash && (
        <div className="mb-2 text-[10px] text-amber-300 bg-amber-900/30 border border-amber-700/40 rounded px-2 py-1 flex items-start gap-1">
          <AlertTriangle size={10} className="mt-0.5 shrink-0" />
          <span className="flex-1">{flash}</span>
          <button onClick={() => setFlash(null)} className="text-amber-400 hover:text-amber-200">
            <X size={10} />
          </button>
        </div>
      )}

      {loading && <p className="text-[11px] text-slate-500 italic">Loading…</p>}
      {error && <p className="text-[11px] text-rose-400">{error}</p>}

      {/* OFFERS TAB */}
      {activeTab === 'offers' && !loading && (
        <div className="space-y-2">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Incoming ({incoming.length})
            </div>
            {incoming.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No incoming proposals.</p>
            ) : (
              <ul className="space-y-1">
                {incoming.map((o) => {
                  const d = safeDecode(o.offer_data);
                  return (
                    <li key={o.id} className="bg-slate-900/60 border border-slate-700 rounded p-2">
                      <div className="text-[11px] text-slate-200 font-bold mb-1">
                        {o.proposer_name} proposes:
                      </div>
                      <div className="text-[10px] text-slate-300 mb-1">
                        <span className="text-emerald-300">Gives you:</span> {formatResourceList(d.offer)}
                      </div>
                      <div className="text-[10px] text-slate-300 mb-1">
                        <span className="text-rose-300">Wants from you:</span> {formatResourceList(d.request)}
                      </div>
                      {d.note && (
                        <div className="text-[10px] italic text-slate-400 mb-1">"{d.note}"</div>
                      )}
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => respondToOffer(o.id, 'accept')}
                          className="flex-1 text-[10px] bg-emerald-700 hover:bg-emerald-600 text-white py-1 rounded flex items-center justify-center gap-1"
                        >
                          <Check size={10} /> Accept
                        </button>
                        <button
                          onClick={() => respondToOffer(o.id, 'reject')}
                          className="flex-1 text-[10px] bg-rose-700 hover:bg-rose-600 text-white py-1 rounded flex items-center justify-center gap-1"
                        >
                          <X size={10} /> Reject
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Outgoing ({outgoing.length})
            </div>
            {outgoing.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No pending proposals.</p>
            ) : (
              <ul className="space-y-1">
                {outgoing.map((o) => {
                  const d = safeDecode(o.offer_data);
                  return (
                    <li key={o.id} className="bg-slate-900/40 border border-slate-700 rounded p-2">
                      <div className="text-[11px] text-slate-200 font-bold mb-1">
                        To {o.recipient_name}:
                      </div>
                      <div className="text-[10px] text-slate-300">
                        <span className="text-emerald-300">You give:</span> {formatResourceList(d.offer)}
                      </div>
                      <div className="text-[10px] text-slate-300 mb-1">
                        <span className="text-rose-300">You want:</span> {formatResourceList(d.request)}
                      </div>
                      <button
                        onClick={() => respondToOffer(o.id, 'cancel')}
                        className="w-full text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 py-1 rounded flex items-center justify-center gap-1"
                      >
                        <X size={10} /> Cancel
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* PROPOSE TAB */}
      {activeTab === 'propose' && !loading && (
        <div className="space-y-2">
          <label className="block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trading Partner</span>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 w-full bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1"
            >
              <option value="">— pick a classmate —</option>
              {classmates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.display_civ_name ? ` (${c.display_civ_name})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="bg-slate-900/40 border border-slate-700 rounded p-2">
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-1">You offer</div>
            {RESOURCE_KEYS.map((k) => (
              <label key={k} className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] text-slate-300 flex-1">{RESOURCE_LABELS[k]}</span>
                <input
                  type="number"
                  min={0}
                  value={offerBundle[k]}
                  onChange={(e) => setOfferBundle({ ...offerBundle, [k]: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-16 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-0.5 text-right"
                />
              </label>
            ))}
          </div>

          <div className="bg-slate-900/40 border border-slate-700 rounded p-2">
            <div className="text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-1">You request</div>
            {RESOURCE_KEYS.map((k) => (
              <label key={k} className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] text-slate-300 flex-1">{RESOURCE_LABELS[k]}</span>
                <input
                  type="number"
                  min={0}
                  value={requestBundle[k]}
                  onChange={(e) => setRequestBundle({ ...requestBundle, [k]: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-16 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-0.5 text-right"
                />
              </label>
            ))}
          </div>

          <label className="block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Note (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Why this trade? (visible to recipient)"
              className="mt-1 w-full bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1"
            />
          </label>

          <button
            onClick={submitOffer}
            disabled={submitting}
            className="w-full bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1"
          >
            <Send size={12} />
            {submitting ? 'Sending…' : 'Send Offer'}
          </button>
        </div>
      )}

      {/* RELATIONS TAB */}
      {activeTab === 'relations' && !loading && (
        <div className="space-y-1">
          {classmates.length === 0 && (
            <p className="text-[11px] text-slate-500 italic">No classmates found in this period.</p>
          )}
          {classmates.map((c) => {
            const current = relationFor(c.id);
            const style = RELATION_STYLES[current];
            return (
              <div key={c.id} className="bg-slate-900/40 border border-slate-700 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] text-slate-200 font-bold truncate">
                    {c.name}
                    {c.display_civ_name && (
                      <span className="text-slate-500 font-normal"> · {c.display_civ_name}</span>
                    )}
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border flex items-center gap-1 ${style.cls}`}>
                    {style.icon}{style.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['neutral', 'treaty', 'alliance', 'hostile'] as const).map((rel) => (
                    <button
                      key={rel}
                      onClick={() => setRelation(c.id, rel)}
                      className={`text-[9px] py-0.5 rounded uppercase tracking-widest border ${
                        current === rel
                          ? RELATION_STYLES[rel].cls
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-[9px] text-slate-500 italic pt-1">
            Alliances require both sides to declare. Neutral/Hostile are unilateral.
          </p>
        </div>
      )}
    </div>
  );
}

export default DiplomacyPanel;
