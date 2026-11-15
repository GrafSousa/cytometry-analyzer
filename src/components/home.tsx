import type { CSSProperties } from "react";

import { ptBR } from "@/messages/pt-br";

// The first two entrance slots belong to the intro and the upload area.
const STEPS_STAGGER_START = 2;

export function Intro() {
  const copy = ptBR.intro;
  return (
    <div data-slot="intro" className="pa-intro pa-enter">
      <h1>{copy.title}</h1>
      <p>{copy.text}</p>
    </div>
  );
}

export function HowItWorks() {
  const copy = ptBR.steps;
  return (
    <section data-slot="how-it-works" className="pa-steps" aria-labelledby="how-it-works">
      <h2 id="how-it-works">{copy.title}</h2>
      <div className="pa-steps__grid">
        {copy.items.map((step, i) => (
          <div
            key={step.title}
            className="pa-step pa-enter"
            style={{ "--i": i + STEPS_STAGGER_START } as CSSProperties}
          >
            <span className="pa-step__n">{i + 1}</span>
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
