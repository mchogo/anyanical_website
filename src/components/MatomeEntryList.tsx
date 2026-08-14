import { formatDateLabel } from '../hooks/useMatomeEntries';
import type { MatomeEntry } from '../hooks/useMatomeEntries';
import { MatomeEntryCard } from './MatomeEntryCard';

type DateGroup = { date: string; entries: MatomeEntry[] };

// entriesは新しい順（entryDate DESC）で渡ってくる前提。連続する同一日付をまとめる。
const groupByDate = (entries: MatomeEntry[]): DateGroup[] => {
  const groups: DateGroup[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.entryDate) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.entryDate, entries: [entry] });
    }
  }
  return groups;
};

export const MatomeEntryList = ({ entries }: { entries: MatomeEntry[] }) => (
  <div className="space-y-8">
    {groupByDate(entries).map((group) => (
      <section key={group.date}>
        <h2 className="border-b border-white/10 pb-2 text-sm font-black tracking-wide text-slate-300">
          {formatDateLabel(group.date)}
        </h2>
        <div className="mt-4 space-y-4">
          {group.entries.map((entry) => (
            <MatomeEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </section>
    ))}
  </div>
);
