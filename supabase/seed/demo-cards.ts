/**
 * Hand-written starter cards (source_type = manual), one idea per main
 * category in French and English. Each card reads: title, a short story that
 * puts you inside the idea, what to remember, and one action for today.
 * They let you run the app locally and the end-to-end tests without an
 * Anthropic key: `npm run seed:demo`. The characters are invented.
 * The real catalogue comes from `npm run seed` (100+ cards per category).
 */

export type DemoCardVersion = { title: string; story: string; body: string; action_step: string };

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
      title: `Le coût déjà payé`,
      story: `Inès a payé quarante euros sa place de concert. Dès la deuxième chanson, elle sait que ça ne lui plaît pas. Elle regarde l'heure, soupire, mais reste : « J'ai payé, quand même. » À la fin, elle rentre après minuit, fatiguée, avec un mal de tête et aucun souvenir qu'elle voudra garder. Dans le tram, elle se demande ce qu'elle aurait pu faire de ces trois heures.`,
      body: `L'argent est déjà parti, que tu restes ou que tu partes. La seule vraie question, c'est ce que tu veux faire des prochaines heures. Franchement, partir est souvent la décision la plus lucide.`,
      action_step: `Choisis un projet ou un abonnement que tu gardes « parce que tu as déjà investi » et demande-toi si tu le reprendrais à zéro aujourd'hui.`,
    },
    en: {
      title: `Money already gone`,
      story: `Ines paid forty euros for a concert ticket. By the second song she knows she isn't enjoying it. She checks the time, sighs, and stays anyway: "I paid for it, after all." She gets home after midnight, tired, with a headache and nothing she wants to remember. On the tram she wonders what she could have done with those three hours.`,
      body: `The money is gone whether you stay or leave. The only real question is what you want to do with the next few hours. Honestly, walking out is often the clearest decision in the room.`,
      action_step: `Pick one project or subscription you keep "because you've already put so much in" and ask yourself if you'd start it again from scratch today.`,
    },
  },
  {
    subcategory: "ecoute-active",
    difficulty: 1,
    fr: {
      title: `Répète sa dernière phrase`,
      story: `Karim et sa sœur se disputent encore au sujet de la fête de famille. Chacun attend que l'autre finisse pour répondre, et personne n'écoute vraiment. Au troisième reproche, Karim s'arrête. « Si je te suis bien, ça t'énerve que je décide tout sans te demander ? » Sa sœur se tait un instant, puis souffle : « Oui, exactement. » La conversation change de ton.`,
      body: `Pendant une dispute, on prépare sa réponse au lieu d'écouter. Reformule ce que l'autre vient de dire avant de donner ton avis : il se sentira entendu, et la tension baisse souvent d'un cran.`,
      action_step: `Dans ta prochaine conversation un peu tendue, reformule une fois la position de l'autre avant de répondre.`,
    },
    en: {
      title: `Say it back first`,
      story: `Karim and his sister are arguing again about the family party. Each waits for the other to finish just to answer, and nobody really listens. At the third reproach, Karim stops. "If I'm following you, it bothers you that I decide everything without asking?" His sister goes quiet for a second, then breathes out: "Yes, exactly." The whole conversation changes tone.`,
      body: `In an argument, most of us are busy loading our reply instead of listening. Say back what the other person just said before you give your view: they feel heard, and the tension usually drops a notch.`,
      action_step: `In your next tense conversation, paraphrase the other person's point once before you answer.`,
    },
  },
  {
    subcategory: "ancrage-concessions",
    difficulty: 2,
    fr: {
      title: `Le premier chiffre tire tout`,
      story: `Léa veut vendre son vieux vélo. Un acheteur lui demande : « Vous en voulez combien ? » Elle hésite, murmure cent euros, et il lui répond aussitôt : « Je vous en donne soixante. » Ils finissent à quatre-vingts. Le soir, elle apprend que le même modèle partait à cent cinquante dans l'annonce voisine.`,
      body: `Le premier chiffre posé sur la table attire toute la discussion vers lui. Prépare ta fourchette à l'avance, et ose parler en premier quand tu connais bien le marché.`,
      action_step: `Avant ta prochaine négociation (salaire, loyer, achat d'occasion), écris le chiffre que tu annonceras en premier et pourquoi.`,
    },
    en: {
      title: `The first number pulls`,
      story: `Lea wants to sell her old bike. A buyer asks, "How much do you want?" She hesitates, mumbles a hundred euros, and he answers at once: "I'll give you sixty." They settle on eighty. That evening she finds out the same model was going for a hundred and fifty in the next listing.`,
      body: `The first number on the table drags the whole talk toward it. Work out your range beforehand, and don't be shy about speaking first when you know the market well.`,
      action_step: `Before your next negotiation (salary, rent, a used car), write down the opening number you'll say and why.`,
    },
  },
  {
    subcategory: "langage-corporel",
    difficulty: 1,
    fr: {
      title: `Regarde les pieds`,
      story: `Au bout du couloir, Samir discute avec un collègue. Le buste tourné vers lui, le collègue sourit et hoche la tête. Mais ses pieds pointent vers la sortie. Samir continue de parler dix minutes de plus. Quand il comprend enfin, l'autre file en s'excusant, déjà en retard.`,
      body: `Un visage, ça se contrôle. Les pieds, beaucoup moins. Quand quelqu'un te parle le buste tourné vers toi mais les pieds ailleurs, il a probablement envie de partir : c'est un indice, pas une preuve.`,
      action_step: `Lors de ta prochaine discussion debout, jette un œil discret à l'orientation des pieds de ton interlocuteur.`,
    },
    en: {
      title: `Watch the feet`,
      story: `At the end of the hallway, Sam is chatting with a coworker. Torso turned toward him, the coworker smiles and nods. But his feet point toward the exit. Sam keeps talking for ten more minutes. When he finally gets it, the other guy hurries off, apologizing, already late.`,
      body: `People can manage their faces. Their feet, not so much. If someone talks to you with their chest turned your way but their feet pointing elsewhere, they probably want to leave: it's a hint, not proof.`,
      action_step: `In your next standing conversation, glance at which way the other person's feet are pointing.`,
    },
  },
  {
    subcategory: "construire-arreter-habitudes",
    difficulty: 1,
    fr: {
      title: `Deux minutes, pas plus`,
      story: `Camille se promet de courir chaque matin depuis janvier. Il pleut, il fait froid, le lit est chaud. Ce lundi, elle ne cherche pas à courir : elle s'assoit au bord du lit et enfile ses chaussures. C'est tout. Une fois les lacets noués, elle se dit « tant qu'à faire » et sort dix minutes.`,
      body: `Une habitude démarre mieux quand la première étape est ridiculement petite, genre deux minutes. Une fois lancé, tu continues presque toujours, et sinon tu as quand même gardé le rythme.`,
      action_step: `Choisis une habitude que tu repousses, écris sa version de deux minutes, puis fais-la avant ce soir.`,
    },
    en: {
      title: `Just two minutes`,
      story: `Camille has promised herself she'd run every morning since January. It's raining, it's cold, the bed is warm. This Monday, she doesn't try to run: she sits on the edge of the bed and puts on her shoes. That's all. Once the laces are tied, she thinks "might as well" and heads out for ten minutes.`,
      body: `A habit starts much more easily when step one is almost silly, like two minutes. Once you're moving you usually keep going, and if you don't, you still kept the rhythm.`,
      action_step: `Pick a habit you keep putting off, write its two-minute version, and do it before tonight.`,
    },
  },
  {
    subcategory: "concentration-profonde",
    difficulty: 2,
    fr: {
      title: `Ton téléphone dans une autre pièce`,
      story: `Julien a bloqué deux heures pour finir son rapport. Son téléphone est posé face contre la table, silencieux. Pourtant, toutes les dix minutes, sa main part vers lui, sans raison. Au bout d'une heure, il n'a écrit que trois paragraphes. Le lendemain, il laisse le téléphone dans la cuisine et termine le rapport avant le déjeuner.`,
      body: `Retourner ton téléphone sur la table ne suffit pas : sa simple présence peut grignoter ton attention, même éteint. Pour une heure de vrai travail, mets-le carrément dans une autre pièce.`,
      action_step: `Avant ta prochaine tâche importante, pose ton téléphone dans une autre pièce et règle un minuteur de 45 minutes.`,
    },
    en: {
      title: `Phone in another room`,
      story: `Julian has blocked two hours to finish his report. His phone lies face down on the desk, silent. Still, every ten minutes his hand drifts toward it for no reason. After an hour he has written three paragraphs. The next day he leaves the phone in the kitchen and finishes the report before lunch.`,
      body: `Flipping your phone face down isn't enough: just having it nearby can eat into your attention, even switched off. For an hour of real work, put it in another room.`,
      action_step: `Before your next important task, leave your phone in another room and set a 45-minute timer.`,
    },
  },
  {
    subcategory: "sommeil",
    difficulty: 1,
    fr: {
      title: `Même réveil, même le samedi`,
      story: `Du lundi au vendredi, Nadia se lève à sept heures. Le week-end, elle dort jusqu'à onze heures, convaincue de « rattraper ». Chaque lundi matin, elle se traîne comme après un voyage au bout du monde. Un mois plus tard, elle règle son réveil à huit heures le samedi, sans exception. Le lundi devient enfin supportable.`,
      body: `On parle beaucoup de l'heure du coucher, mais c'est l'heure du lever qui cale ton horloge interne. Garder un réveil régulier, à une heure près, aide souvent plus qu'une tisane.`,
      action_step: `Fixe une heure de lever que tu peux tenir aussi le week-end et règle l'alarme dès ce soir.`,
    },
    en: {
      title: `Same wake-up time, even Saturday`,
      story: `Monday to Friday, Nadia gets up at seven. On weekends she sleeps until eleven, convinced she's "catching up". Every Monday morning she drags herself around as if she'd just flown across the world. A month later she sets her alarm for eight on Saturdays, no exceptions. Monday finally becomes bearable.`,
      body: `Everyone talks about bedtime, but it's your wake-up time that sets your body clock. A steady wake-up time, within an hour, often helps more than any herbal tea.`,
      action_step: `Pick a wake-up time you can keep on weekends too, and set the alarm tonight.`,
    },
  },
  {
    subcategory: "stoicisme-philosophie",
    difficulty: 1,
    book: MEDITATIONS,
    fr: {
      title: `Ce qui dépend de toi`,
      story: `Le train de Théo a quarante minutes de retard et il pleut sur le quai. Il fulmine contre la compagnie, contre la météo, contre le monde entier. Puis il sort un carnet et trace deux colonnes : ce qu'il contrôle, ce qu'il ne contrôle pas. Dans la première, il n'y a que deux lignes : prévenir son rendez-vous et finir sa lecture. Il s'y met, et le quai lui paraît soudain moins hostile.`,
      body: `Les stoïciens, d'Épictète à Marc Aurèle, faisaient un tri simple entre ce qui dépend de soi et le reste, puis mettaient leur énergie dans la première colonne. Ça paraît basique, mais en pleine journée pourrie, ça change l'humeur.`,
      action_step: `Ce soir, note un souci de ta journée et sépare-le en deux colonnes : ce que tu contrôles, ce que tu ne contrôles pas.`,
    },
    en: {
      title: `What's actually up to you`,
      story: `Theo's train is forty minutes late and it's raining on the platform. He rages at the rail company, at the weather, at the whole world. Then he pulls out a notebook and draws two columns: what he controls, what he doesn't. The first one has only two lines: call his appointment and finish his reading. He gets started, and the platform feels suddenly less hostile.`,
      body: `The Stoics, from Epictetus to Marcus Aurelius, sorted things into what's up to you and what isn't, then put their energy only into the first pile. Sounds basic, but on a rotten day it really shifts your mood.`,
      action_step: `Tonight, write down one worry from your day and split it into two columns: what you control and what you don't.`,
    },
  },
  {
    subcategory: "prise-de-decision",
    difficulty: 2,
    fr: {
      title: `Réversible ou pas ?`,
      story: `Amine hésite depuis trois jours entre deux applications de notes. Il compare, lit des avis, refait des tableaux. Sa collègue le voit faire et lui demande : « Et si tu te trompes, ça te coûte quoi ? » Il réfléchit. Presque rien : il pourra changer en dix minutes. Il en choisit une avant midi.`,
      body: `Avant de te prendre la tête sur une décision, demande-toi si tu peux revenir en arrière. Si oui, décide vite. Garde ta lenteur pour les rares choix difficiles à annuler, comme un déménagement ou une embauche.`,
      action_step: `Repère une décision que tu repousses depuis des jours. Si elle est réversible, prends-la avant midi.`,
    },
    en: {
      title: `Can you undo it?`,
      story: `Amine has been torn for three days between two note-taking apps. He compares, reads reviews, rebuilds spreadsheets. A colleague watches him and asks, "And if you're wrong, what does it cost you?" He thinks. Almost nothing: he can switch in ten minutes. He picks one before noon.`,
      body: `Before agonizing over a choice, ask yourself whether you could take it back. If so, decide fast. Save your slow thinking for the rare calls that stick, like moving cities or hiring someone.`,
      action_step: `Find one decision you've been putting off for days. If it's reversible, make it before noon.`,
    },
  },
  {
    subcategory: "limites-saines",
    difficulty: 2,
    fr: {
      title: `Un non avec une porte`,
      story: `Chloé reçoit un message de son voisin : peut-elle l'aider à déménager samedi ? Elle avait prévu de dormir, enfin. Pendant une heure, elle rédige des réponses et les efface, entre le oui qui l'épuise et le non qui la culpabilise. Elle finit par écrire : « Samedi, je ne peux pas. Mais je passe dimanche soir avec des pizzas. » Il répond par un pouce levé et trois émojis.`,
      body: `Dire non sèchement fait culpabiliser, tout accepter épuise. Entre les deux, il y a le non qui propose autre chose : tu protèges ton temps sans fermer la relation.`,
      action_step: `La prochaine fois qu'on te demande un service qui ne t'arrange pas, réponds par un non suivi d'une alternative que tu peux vraiment tenir.`,
    },
    en: {
      title: `A no with a door in it`,
      story: `Chloe gets a text from her neighbor: can she help him move on Saturday? She had plans to finally sleep in. For an hour she writes replies and deletes them, torn between the yes that drains her and the no that makes her feel guilty. She ends up typing: "Can't do Saturday. But I'll come by Sunday night with pizza." He answers with a thumbs-up and three emojis.`,
      body: `A flat no leaves you feeling guilty, a yes to everything wears you out. In between sits the no that offers something else: you protect your time without closing the relationship.`,
      action_step: `Next time someone asks a favor that doesn't suit you, answer with a no plus an alternative you can actually keep.`,
    },
  },
  {
    subcategory: "epargne-budget-investissement",
    difficulty: 1,
    fr: {
      title: `Paie-toi en premier`,
      story: `À chaque fin de mois, Hugo se promet d'épargner ce qui reste. Et chaque fin de mois, il ne reste presque rien. Un jour de paie, il programme un virement de trente euros vers un autre compte, le lendemain de son salaire. Il oublie même qu'il existe. Six mois plus tard, il ouvre l'appli et découvre cent quatre-vingts euros, sans avoir senti la différence.`,
      body: `Si tu épargnes ce qui reste, tu sais déjà combien il reste : pas grand-chose. Inverse l'ordre, et programme un virement automatique dès que ta paie tombe, même petit.`,
      action_step: `Ouvre ton appli bancaire et crée aujourd'hui un virement automatique, même petit, pour le lendemain de ta paie.`,
    },
    en: {
      title: `Pay yourself first`,
      story: `Every month-end, Hugo promises himself he'll save whatever is left. And every month-end, almost nothing is. One payday, he sets up an automatic transfer of thirty euros to another account, the day after his salary lands. He soon forgets it exists. Six months later he opens the app and finds a hundred and eighty euros, without having felt the difference.`,
      body: `If you save what's left, you already know how much that is: not much. Flip the order and schedule an automatic transfer as soon as your pay arrives, even a small one.`,
      action_step: `Open your banking app today and set up an automatic transfer, however small, for the day after payday.`,
    },
  },
  {
    subcategory: "sophismes-manipulation",
    difficulty: 2,
    fr: {
      title: `L'homme de paille`,
      story: `Dans une réunion, Mehdi propose de venir au bureau à vélo le vendredi. Un collègue sourit : « Donc tu veux qu'on interdise la voiture ? » Mehdi sent la discussion déraper vers une caricature qu'il n'a jamais défendue. Il respire et répond : « Ce que je dis, c'est juste un vendredi à vélo, pour ceux qui veulent. » La salle revient au vrai sujet.`,
      body: `Quand quelqu'un déforme ta position pour la rendre absurde, c'est un homme de paille, et répondre à la caricature ne mène nulle part. Reformule calmement ce que tu as vraiment dit, puis continue.`,
      action_step: `Dans ta prochaine discussion animée, si on caricature ton avis, réponds par « ce que je dis, c'est... » et répète ta vraie position.`,
    },
    en: {
      title: `The straw man`,
      story: `In a meeting, Mehdi suggests cycling to the office on Fridays. A coworker smirks: "So you want to ban cars altogether?" Mehdi feels the talk sliding toward a caricature he never defended. He breathes and answers: "What I'm saying is just one Friday on a bike, for whoever wants." The room returns to the real topic.`,
      body: `When someone twists your view into something absurd, that's a straw man, and arguing with the caricature gets you nowhere. Calmly restate what you actually said, then carry on.`,
      action_step: `In your next heated discussion, if someone caricatures your view, say "what I'm saying is..." and restate it.`,
    },
  },
];
