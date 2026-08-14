import { AskAiButtons } from './AskAiButtons';

type AskAiSectionProps = {
  title: string;
  description: string;
  prompt: string;
};

export const AskAiSection = ({ title, description, prompt }: AskAiSectionProps) => (
  <section className="border-b border-white/10 bg-white/[0.02]">
    <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
      <span className="text-2xl" aria-hidden="true">
        ✨
      </span>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
        Ask AI
      </p>
      <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
        {description}
      </p>
      <div className="mt-7">
        <AskAiButtons prompt={prompt} />
      </div>
    </div>
  </section>
);
