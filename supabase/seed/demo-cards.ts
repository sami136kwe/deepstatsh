/**
 * Hand-written starter cards (source_type = manual), one idea per main
 * category in French and English. They let you run the app locally and the
 * end-to-end tests without an Anthropic key: `npm run seed:demo`.
 * The real catalogue comes from `npm run seed` (100+ cards per category).
 */

export type DemoCardVersion = { title: string; body: string; action_step: string };

export type DemoCard = {
  subcategory: string;
  difficulty: 1 | 2 | 3;
  book?: { title: string; author: string; published_year: number; info_link: string; is_public_domain: boolean };
  fr: DemoCardVersion;
  en: DemoCardVersion;
};

const MEDITATIONS = {
  title: "Pensées pour moi-même (Meditations)",
  author: "Marc Aurèle",
  published_year: 180,
  info_link: "https://openlibrary.org/search?q=meditations+marcus+aurelius",
  is_public_domain: true,
};

export const DEMO_CARDS: DemoCard[] = [
  {
    subcategory: "biais-cognitifs",
    difficulty: 1,
    fr: {
      title: "Le coût déjà payé",
      body: "Tu as déjà fini un film nul juste parce que tu avais payé la place ? C'est le piège des coûts irrécupérables. L'argent est parti quoi que tu fasses, et la seule vraie question, c'est ce que tu veux faire des deux prochaines heures. Franchement, partir au milieu est souvent la décision la plus lucide de la soirée.",
      action_step: "Choisis un projet ou un abonnement que tu gardes « parce que tu as déjà investi » et demande-toi si tu le reprendrais à zéro aujourd'hui.",
    },
    en: {
      title: "Money already gone",
      body: "Ever sat through a terrible movie just because you paid for the ticket? That's the sunk cost trap. The money is gone whatever you do, so the only real question is what you want from the next two hours. Honestly, walking out halfway is often the smartest call of the night.",
      action_step: "Pick one project or subscription you keep \"because you've already put so much in\" and ask yourself if you'd start it again today.",
    },
  },
  {
    subcategory: "ecoute-active",
    difficulty: 1,
    fr: {
      title: "Répète sa dernière phrase",
      body: "Pendant une dispute, on prépare sa réponse au lieu d'écouter. Résultat : chacun parle à un mur. Avant de donner ton avis, reformule ce que l'autre vient de dire (« si je te suis bien, ce qui t'agace c'est que... »). Souvent la tension tombe d'un cran, parce qu'il se sent enfin entendu.",
      action_step: "Dans ta prochaine conversation un peu tendue, reformule une fois la position de l'autre avant de répondre.",
    },
    en: {
      title: "Say it back first",
      body: "In an argument, most of us are busy loading our reply instead of listening. So both people end up talking to a wall. Before you give your view, sum up what the other person just said (\"so what bugs you is that...\"). The temperature usually drops, because they finally feel heard.",
      action_step: "In your next tense conversation, paraphrase the other person's point once before you answer.",
    },
  },
  {
    subcategory: "ancrage-concessions",
    difficulty: 2,
    fr: {
      title: "Le premier chiffre tire tout",
      body: "Le premier nombre posé sur la table attire toute la discussion vers lui. C'est l'ancrage. Si tu attends que l'autre annonce un prix, tu négocies autour de son chiffre, pas du tien. Alors prépare ta fourchette avant, et ose parler en premier quand tu connais bien le marché.",
      action_step: "Avant ta prochaine négociation (salaire, loyer, achat d'occasion), écris le chiffre que tu annonceras en premier et pourquoi.",
    },
    en: {
      title: "The first number pulls",
      body: "Whoever puts the first number on the table drags the whole talk toward it. That's anchoring. Wait for the other side to name a price and you'll be haggling around their figure, not yours. So do your homework, pick your range, and say it first when you know the market well.",
      action_step: "Before your next negotiation (salary, rent, a used car), write down the opening number you'll say and why.",
    },
  },
  {
    subcategory: "langage-corporel",
    difficulty: 1,
    fr: {
      title: "Regarde les pieds",
      body: "Un visage, ça se contrôle. Les pieds, beaucoup moins. Quand quelqu'un te parle le buste tourné vers toi mais les pieds pointés vers la porte, il a probablement envie de partir. Ce n'est pas une preuve, juste un indice, alors raccourcis et propose de reprendre plus tard.",
      action_step: "Lors de ta prochaine discussion debout, jette un œil discret à l'orientation des pieds de ton interlocuteur.",
    },
    en: {
      title: "Watch the feet",
      body: "People can manage their faces. Their feet, not so much. If someone is chatting with you, torso turned your way, but their feet point at the door, they probably want to leave. It's a hint, not proof, so wrap it up and offer to pick it up later.",
      action_step: "In your next standing conversation, glance at which way the other person's feet are pointing.",
    },
  },
  {
    subcategory: "construire-arreter-habitudes",
    difficulty: 1,
    fr: {
      title: "Deux minutes, pas plus",
      body: "Le matin où tu n'as pas envie d'aller courir, oublie le footing. Pense juste à mettre tes chaussures. Une habitude démarre beaucoup mieux quand la première étape est ridiculement petite, genre deux minutes. Une fois lancé, tu continues presque toujours, et sinon tu as quand même gardé le rythme.",
      action_step: "Choisis une habitude que tu repousses, écris sa version de deux minutes, puis fais-la avant ce soir.",
    },
    en: {
      title: "Just two minutes",
      body: "On the mornings you don't want to run, forget the run. Just put your shoes on. Habits start far more easily when step one is almost silly, two minutes, tops. Once you're moving you usually keep going, and if you don't, you still kept the streak alive.",
      action_step: "Pick a habit you keep putting off, write its two-minute version, and do it before tonight.",
    },
  },
  {
    subcategory: "concentration-profonde",
    difficulty: 2,
    fr: {
      title: "Ton téléphone dans une autre pièce",
      body: "J'ai longtemps cru que retourner mon téléphone sur la table suffisait. Pas du tout. Sa simple présence grignote ton attention, même éteint, parce qu'une partie du cerveau le surveille. Pour une heure de vrai travail, mets-le carrément dans une autre pièce.",
      action_step: "Pour ta prochaine tâche importante, pose ton téléphone dans une autre pièce et règle un minuteur de 45 minutes.",
    },
    en: {
      title: "Phone in another room",
      body: "For years I thought flipping my phone face down was enough. It isn't. Just having it nearby eats into your attention, even switched off, because part of your brain keeps an eye on it. For an hour of real work, put it in another room.",
      action_step: "Before your next important task, leave your phone in another room and set a 45-minute timer.",
    },
  },
  {
    subcategory: "sommeil",
    difficulty: 1,
    fr: {
      title: "Même réveil, même le samedi",
      body: "On parle beaucoup de l'heure du coucher. Mais c'est l'heure du lever qui cale ton horloge interne. Si tu te lèves à 7 h en semaine et à 11 h le week-end, ton corps vit un petit décalage horaire chaque lundi. Garder un réveil régulier, à une heure près, aide souvent plus qu'une tisane.",
      action_step: "Fixe une heure de lever que tu peux tenir aussi le week-end et règle l'alarme dès ce soir.",
    },
    en: {
      title: "Same wake-up time, even Saturday",
      body: "Everyone talks about bedtime. But it's your wake-up time that sets your body clock. Get up at 7 during the week and at 11 on weekends, and your body gets a little jet lag every Monday. Keeping a steady wake-up time, within an hour, often helps more than any herbal tea.",
      action_step: "Pick a wake-up time you can keep on weekends too, and set the alarm tonight.",
    },
  },
  {
    subcategory: "stoicisme-philosophie",
    difficulty: 1,
    book: MEDITATIONS,
    fr: {
      title: "Ce qui dépend de toi",
      body: "Le train est en retard, ton collègue est de mauvaise humeur, il pleut. Tu n'y peux rien. Les stoïciens comme Marc Aurèle faisaient un tri simple entre ce qui dépend de soi et le reste, puis mettaient toute leur énergie dans la première colonne. Ça paraît basique, mais en pleine journée pourrie, ça change l'humeur.",
      action_step: "Ce soir, note un souci de ta journée et sépare-le en deux colonnes : ce que tu contrôles, ce que tu ne contrôles pas.",
    },
    en: {
      title: "What's actually up to you",
      body: "The train is late, your coworker is grumpy, it's raining. Nothing you can do. Stoics like Marcus Aurelius sorted things into two piles, what's up to me and what isn't, and spent their energy only on the first one. Sounds basic, but on a rotten day it really shifts your mood.",
      action_step: "Tonight, write down one worry from your day and split it into two columns: what you control and what you don't.",
    },
  },
  {
    subcategory: "prise-de-decision",
    difficulty: 2,
    fr: {
      title: "Réversible ou pas ?",
      body: "Avant de te prendre la tête sur une décision, demande-toi si tu peux revenir en arrière. Changer d'outil de notes, tester un nouveau trajet, essayer un autre format de réunion : ça se défait facilement, donc décide vite. Garde ta lenteur pour les rares choix difficiles à annuler, comme un déménagement ou une embauche.",
      action_step: "Repère une décision que tu repousses depuis des jours. Si elle est réversible, prends-la avant midi.",
    },
    en: {
      title: "Can you undo it?",
      body: "Before agonizing over a choice, ask yourself whether you could take it back. Switching note apps, trying a new route to work, testing a new meeting format: all easy to reverse, so decide fast. Save your slow thinking for the rare calls that stick, like moving cities or hiring someone.",
      action_step: "Find one decision you've been putting off for days. If it's reversible, make it before noon.",
    },
  },
  {
    subcategory: "limites-saines",
    difficulty: 2,
    fr: {
      title: "Un non avec une porte",
      body: "Dire non sèchement, ça fait culpabiliser. Tout accepter, ça épuise. Entre les deux, il y a le non qui propose autre chose : « Je ne peux pas t'aider à déménager samedi, mais je peux passer dimanche soir avec des pizzas. » Tu protèges ton temps sans fermer la relation.",
      action_step: "La prochaine fois qu'on te demande un service qui ne t'arrange pas, réponds par un non suivi d'une alternative que tu peux vraiment tenir.",
    },
    en: {
      title: "A no with a door in it",
      body: "A flat no leaves you feeling guilty. A yes to everything wears you out. In between there's the no that offers something else: \"I can't help you move on Saturday, but I can come by Sunday night with pizza.\" You protect your time without closing the relationship.",
      action_step: "Next time someone asks a favor that doesn't suit you, answer with a no plus an alternative you can actually keep.",
    },
  },
  {
    subcategory: "epargne-budget-investissement",
    difficulty: 1,
    fr: {
      title: "Paie-toi en premier",
      body: "Si tu épargnes ce qui reste à la fin du mois, tu sais déjà combien il reste : pas grand-chose. Inverse l'ordre. Programme un virement automatique vers ton épargne le jour où ta paie tombe, même trente euros. Ce que tu ne vois pas sur ton compte courant, tu ne le dépenses pas.",
      action_step: "Ouvre ton appli bancaire et crée aujourd'hui un virement automatique, même petit, pour le lendemain de ta paie.",
    },
    en: {
      title: "Pay yourself first",
      body: "If you save whatever's left at the end of the month, you already know how much that is. Not much. Flip the order and set up an automatic transfer to savings on payday, even thirty bucks. Money you never see in your checking account is money you don't spend.",
      action_step: "Open your banking app today and set up an automatic transfer, however small, for the day after payday.",
    },
  },
  {
    subcategory: "sophismes-manipulation",
    difficulty: 2,
    fr: {
      title: "L'homme de paille",
      body: "« Donc tu veux qu'on interdise la voiture ? » Non, tu as juste proposé de venir au bureau à vélo le vendredi. Quand quelqu'un déforme ta position pour la rendre absurde, c'est un homme de paille, et répondre à la caricature ne mène nulle part. Reformule calmement ce que tu as vraiment dit, puis continue.",
      action_step: "Dans ta prochaine discussion animée, si on caricature ton avis, réponds par « ce que je dis, c'est... » et répète ta vraie position.",
    },
    en: {
      title: "The straw man",
      body: "\"So you want to ban cars altogether?\" No, you suggested biking to the office on Fridays. When someone twists your view into something absurd, that's a straw man, and arguing with the cartoon version gets you nowhere. Calmly restate what you actually said, then carry on.",
      action_step: "In your next heated discussion, if someone caricatures your view, just say \"what I'm saying is...\" and restate it.",
    },
  },
];
