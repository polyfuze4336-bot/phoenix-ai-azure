'use client';

import { useState } from 'react';
import { Ambulance, Hospital, Home, RotateCcw, ArrowLeft, ArrowRight, AlertTriangle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Level = 'emergency' | 'clinic' | 'home';

interface Question {
  id: string;
  text: string;
  options: { label: string; level: Level | null }[];
}

// Deterministic triage questionnaire. It does NOT call AI and does NOT diagnose;
// it maps answers to standard first-aid guidance thresholds.
const QUESTIONS: Question[] = [
  {
    id: 'breathing',
    text: 'Is the person having trouble breathing, or is the burn on the face, mouth, or throat?',
    options: [
      { label: 'Yes', level: 'emergency' },
      { label: 'No', level: null },
    ],
  },
  {
    id: 'size',
    text: 'How large is the injured area?',
    options: [
      { label: 'Larger than the palm of the hand', level: 'clinic' },
      { label: 'Smaller than the palm of the hand', level: null },
    ],
  },
  {
    id: 'depth',
    text: 'What does the skin look like?',
    options: [
      { label: 'White, charred, leathery, or numb', level: 'emergency' },
      { label: 'Blisters or broken skin', level: 'clinic' },
      { label: 'Red and painful, skin intact', level: null },
    ],
  },
  {
    id: 'location',
    text: 'Is the injury on the hands, feet, joints, or genitals?',
    options: [
      { label: 'Yes', level: 'clinic' },
      { label: 'No', level: null },
    ],
  },
  {
    id: 'infection',
    text: 'Are there signs of infection (spreading redness, pus, fever)?',
    options: [
      { label: 'Yes', level: 'clinic' },
      { label: 'No', level: null },
    ],
  },
];

const OUTCOME = {
  emergency: {
    icon: Ambulance,
    title: 'Seek emergency care now',
    body: 'Based on your answers, this may be serious. Call 999 or go to the nearest emergency department immediately. While waiting, follow first-aid steps and keep the person calm.',
    style: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
  clinic: {
    icon: Hospital,
    title: 'See a doctor or clinic',
    body: 'Your answers suggest this should be checked by a healthcare professional today. Visit a clinic or hospital for proper assessment and dressing.',
    style: 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  },
  home: {
    icon: Home,
    title: 'Home care may be appropriate',
    body: 'Your answers suggest this may be managed at home with basic first aid. Keep the area clean, watch for warning signs, and see a doctor if it worsens.',
    style: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
} as const;

export function AssessmentClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(Level | null)[]>([]);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[step];

  const choose = (level: Level | null) => {
    const next = [...answers];
    next[step] = level;
    setAnswers(next);
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setDone(true);
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setDone(false);
  };

  const result: Level = answers.includes('emergency') ? 'emergency' : answers.includes('clinic') ? 'clinic' : 'home';

  if (done) {
    const o = OUTCOME[result];
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className={cn('rounded-2xl border p-6', o.style)}>
          <o.icon className="h-8 w-8" />
          <h2 className="mt-3 font-display text-xl font-bold tracking-tight">{o.title}</h2>
          <p className="mt-2 text-sm opacity-90">{o.body}</p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" /> This tool gives general guidance only and is not a medical diagnosis.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={reset}><RotateCcw className="mr-1.5 h-4 w-4" /> Start over</Button>
          <Button asChild variant="secondary">
            <Link href="/v2/community/first-aid">View first aid steps</Link>
          </Button>
          <Button asChild>
            <Link href="/v2/community/chat"><MessageSquare className="mr-1.5 h-4 w-4" /> Ask Phoenix</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {step + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(((step + 1) / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-display text-lg font-bold tracking-tight">{q.text}</h2>
        <div className="mt-4 space-y-2">
          {q.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => choose(opt.level)}
              className="flex w-full items-center justify-between rounded-xl border bg-background p-4 text-left text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {opt.label}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {step > 0 ? (
        <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      ) : null}
    </div>
  );
}
