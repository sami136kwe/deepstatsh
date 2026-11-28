/**
 * Starter books for local development: `npm run seed:demo`.
 *
 * A book has numbered ideas. Each idea is an original short story that puts you
 * inside the idea, then "what to remember", then one action. The characters are
 * invented and every sentence is written for this app: the ideas are inspired by
 * the book, they do not quote it and they do not replace reading it.
 *
 * English only for now; French versions are added later (the app falls back to
 * English when a book has no French yet).
 */

export type IdeaVersion = { title: string; story: string; body: string; action_step: string };

export type IdeaSeed = {
  position: number;
  difficulty: 1 | 2 | 3;
  en: IdeaVersion;
};

export type BookSeed = {
  slug: string;
  title: string;
  author: string;
  published_year: number;
  info_link: string;
  is_public_domain: boolean;
  is_featured: boolean;
  /** Slugs of main categories (topics). The first one is used as the idea category. */
  topics: string[];
  summary: { en: string };
  ideas: IdeaSeed[];
};

export const DEMO_BOOKS: BookSeed[] = [
  {
    slug: "the-power-of-now",
    title: "The Power of Now",
    author: "Eckhart Tolle",
    published_year: 1997,
    info_link: "https://openlibrary.org/search?q=the+power+of+now+eckhart+tolle",
    is_public_domain: false,
    is_featured: true,
    topics: ["mentalite-developpement", "psychologie"],
    summary: {
      en: "A guide to stepping out of the constant commentary in your head and into the only moment where life actually happens: this one. Eight short stories walk through how thoughts, time, old emotion and the body shape everyday stress, and what shifts when you stop feeding them.",
    },
    ideas: [
      {
        position: 1,
        difficulty: 1,
        en: {
          title: `Who is doing the thinking?`,
          story: `Priya has been standing on the platform at Gare Centrale for ten minutes, and her train is late again. The departure board might as well be blank. Her mind is back in a meeting room three days ago, replaying what her manager said about her report. The answer she should have given, the calm, perfectly worded one, plays first. Then comes what she will say next Monday, and then a harsher version for good measure. Her shoulders are tight, and her jaw aches. Halfway through the third version, a thought cuts in: "Look at you, doing it again." Silence, for a second. She is no longer inside the argument but standing beside it, watching it run like a radio nobody switched on. The train finally rolls in, and she notices that she has been clenching her coffee cup so hard that it has dented.`,
          body: `The moment you notice a thought, you are no longer completely inside it. Whatever is noticing is not the thinking itself, and that small gap is where you get a choice back.`,
          action_step: `When you catch yourself replaying something today, silently say "I'm thinking about..." and watch the thought for ten seconds.`,
        },
      },
      {
        position: 2,
        difficulty: 1,
        en: {
          title: `The only appointment you can keep`,
          story: `Tomás eats lunch at his desk every day, and every day his mind is already on the afternoon. Today it is a budget review at two, a call at three and a pile of emails he has promised himself to clear. He reaches for his sandwich and finds only crumbs and a wrapper. He cannot remember a single bite. It unsettles him more than he expected, because this is not the first time. The next day, he tries something different. He puts his phone face down, looks out of the window at the street and eats slowly, on purpose. The tomato is sharper than he remembered. The bread is still slightly warm from the café downstairs, and somewhere outside a delivery truck is beeping. It is the same sandwich, and for once he is actually there.`,
          body: `Your life only ever happens now. The past is a memory and the future is a picture, and you can only visit either of them from this moment. Coming back to it is a skill you can train.`,
          action_step: `Pick one routine today, like washing dishes or walking to the station, and do it paying full attention to what you see, hear and feel.`,
        },
      },
      {
        position: 3,
        difficulty: 2,
        en: {
          title: `An old hurt with its own appetite`,
          story: `Whenever her sister mentions the family house, Lena feels a heavy mood rush in, far bigger than the conversation deserves. It happened again on Sunday, during their weekly call. Her sister only asked whether they should repaint the porch, and within a minute Lena was bringing up a quarrel from fifteen years ago. She snapped, picked at the old grievance and ended the call drained and ashamed. This time, something shifts. Halfway through a sentence, she stops. "The old weight is here," she thinks, and she lets it sit in her chest without adding a single complaint. It rises, trembles a little and seems to look for something to hold on to. She gives it nothing. After a few slow breaths, it loosens its grip, and she hears her sister asking, gently, if she is still there.`,
          body: `Some reactions are bigger than the moment because they carry old pain, and that pain grows when you feed it with replays and complaints. Watching it instead often lets it loosen. If a feeling stays overwhelming, talk to someone you trust or a professional.`,
          action_step: `Next time a reaction feels bigger than the situation, name it ("the old weight is here") and watch it for one minute before you speak.`,
        },
      },
      {
        position: 4,
        difficulty: 2,
        en: {
          title: `Your résumé is not you`,
          story: `After the layoff, Marcus dreads one question above all others: "So, what do you do?" For eleven years, the answer came easily, and people nodded with respect. On Saturday, at a friend's housewarming party, he opens his mouth and finds nothing there. A woman holding a plate of olives waits politely. He ends up talking about the sourdough he has been learning to bake and the podcast about birds that he cannot stop recommending. She laughs, tells him about her failed attempt at growing tomatoes, and they spend half an hour comparing disasters. It is warmer than any conversation he had at work in years. Walking home under the streetlights, he realizes that nobody asked for his title the whole evening, and that he did not miss it once.`,
          body: `When your sense of self is stitched to a job title, a status or a strong opinion, losing any of them feels like losing yourself. You are the awareness that stands behind those labels, not the labels.`,
          action_step: `Introduce yourself today without your job title or any role. Say one thing you are curious about instead.`,
        },
      },
      {
        position: 5,
        difficulty: 2,
        en: {
          title: `Stop arguing with Tuesday`,
          story: `Aiko's flight is cancelled, and she spends twenty minutes at the airport counter explaining how unfair this is. She has a client dinner tomorrow, she says, and she booked this ticket weeks ago. The agent nods patiently and keeps typing. Behind her, the line is growing, and her voice is getting higher. Eventually Aiko takes a breath and says it out loud, to nobody in particular: "Okay. It's cancelled." Her shoulders drop. Something in her chest, which had been braced against reality, lets go. She asks the agent what her real options are, books the first morning flight and a hotel near the airport, and sends a short, calm message to her client. By dinner she has a plan, a decent pasta and far more energy than the arguing would have left her.`,
          body: `Accepting the moment is not approving of it or giving up. It stops the fight with something that has already happened, so your energy goes into the part you can still change.`,
          action_step: `Name one thing you are resisting today, say "this is how it is right now", then write one action you can take about it.`,
        },
      },
      {
        position: 6,
        difficulty: 1,
        en: {
          title: `Come back through your hands`,
          story: `Ten minutes before his presentation, Jonas feels his heart pounding while his mind races through everything that could go wrong. The slides might freeze. He might forget the opening line. Half the board will be sitting in that room. In the corridor, he plants both feet on the floor and turns his attention to his hands. They are cold, slightly tingling and heavier than he expected. The paper of his notes presses between his fingers, and a faint pulse beats in his thumb. A slow breath fills his chest and leaves again. The racing thoughts do not vanish, but they stop steering him. When the door opens and someone calls his name, he walks into the room steady, with his hands still warm from being noticed.`,
          body: `Your body is always in the present moment. Feeling your hands, your feet or your breath pulls attention out of the thinking and back into now, which is often the quickest way to settle.`,
          action_step: `Before your next stressful moment, spend thirty seconds feeling your hands: their temperature, any tingling, their weight.`,
        },
      },
      {
        position: 7,
        difficulty: 2,
        en: {
          title: `The problem that lives in tomorrow`,
          story: `At midnight, Sofia is wide awake, listing everything that could go wrong at Thursday's meeting: the client cancels, the slides fail, her voice shakes in front of everyone. Each scenario leads to a worse one, and her heart is racing as if the meeting were happening right now. Then she asks herself a plain question: "What is wrong right now, in this room?" She looks around. The bed is warm. The house is quiet, except for the hum of the fridge downstairs. Her phone is charging, and the window is slightly open to the cool night air. Nothing at all is wrong at this exact moment. The fear belongs to Thursday, and Thursday is not here yet. She turns off the light and, for the first time that night, her breathing slows.`,
          body: `Worry usually lives in the future and regret in the past. Asking what is wrong right now often gives an honest answer of "nothing", and when something is wrong, it shrinks into a next small step.`,
          action_step: `When you start worrying today, ask "What is wrong in this exact moment?" and write the answer in one line.`,
        },
      },
      {
        position: 8,
        difficulty: 3,
        en: {
          title: `The pause between two thoughts`,
          story: `Daniel sits on a bench in the park with his coffee going cold, trying to do nothing. It is harder than it sounds. A thought about email appears, then one about the weekend, then one about whether he is doing this correctly. Each fades in turn. Before the next one arrives, there is a tiny stretch where nothing is said inside his head, only the sound of a bird and the weight of the cup in his hands. It lasts a second. He tries to hold on to it, and loses it at once, so he stops trying and simply sits there. A few moments later, it returns by itself, softer than before. He does not catch it this time. He lets it come and go, and he feels strangely rested.`,
          body: `Between two thoughts there is a small gap of plain awareness. You cannot force it, but you can notice it, and noticing it tends to make it easier to find again.`,
          action_step: `Sit for two minutes with no goal except to watch for the quiet moment between two thoughts.`,
        },
      },
    ],
  },
];
