import { describe, expect, it } from "vitest";
import { checkQuality } from "@/lib/ingestion/quality";
import {
  checkStyle,
  coefficientOfVariation,
  MIN_STRUCTURE_SAMPLE,
  structureShare,
  structureSignature,
} from "@/lib/ingestion/style";
import { LIBRARY as DEMO_BOOKS } from "@/supabase/seed/library";
import { DEMO_CARDS } from "@/supabase/seed/demo-cards";

// The two examples from the product brief.
const BAD = {
  language: "fr" as const,
  title: "L'écoute active",
  story: "Paul parle à sa collègue lors d'une réunion importante. Elle regarde son téléphone et hoche la tête de temps en temps. Paul continue de parler pendant vingt minutes sans s'apercevoir qu'elle ne l'écoute plus du tout.",
  body: "L'écoute active est une compétence essentielle en communication. Il est important de maintenir un contact visuel et de reformuler les propos de son interlocuteur afin de favoriser une compréhension mutuelle.",
  action_step: "Pratiquez l'écoute active lors de vos prochaines conversations.",
};
const GOOD = {
  language: "fr" as const,
  title: "Répète, ne réponds pas",
  story: "Mia raconte sa journée à Sam, qui l'écoute à moitié. Elle s'arrête au milieu d'une phrase. « Attends, tu viens de dire quoi ? » Sam rougit, puis reprend ses mots un à un, doucement. Mia sourit enfin et lui raconte le vrai problème.",
  body: "Tu sais ce qui change tout dans une conversation ? Pas ce que tu dis, ce que tu répètes de l'autre. La prochaine fois, reprends sa dernière phrase avec tes mots ('donc si je comprends bien, ça te stresse que...'). Il va se sentir écouté, et il va te raconter le vrai problème.",
  action_step: "Dans ta prochaine conversation, reformule une fois ce que l'autre vient de dire avant de répondre.",
};

describe("style rules", () => {
  it("rejects the brief's bad example", () => {
    const result = checkStyle(BAD);
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.startsWith("banned_phrase"))).toBe(true);
    expect(result.reasons.some((r) => r.startsWith("banned_word"))).toBe(true);
    expect(result.reasons).toContain("no_direct_address");
  });

  it("accepts the brief's good example", () => {
    expect(checkStyle(GOOD)).toEqual({ ok: true, reasons: [] });
    expect(checkQuality(GOOD).ok).toBe(true);
  });

  it("accepts every hand-written demo card in both languages", () => {
    for (const card of DEMO_CARDS) {
      for (const language of ["fr", "en"] as const) {
        const input = { language, ...card[language] };
        expect({ title: input.title, ...checkStyle(input) }).toEqual({ title: input.title, ok: true, reasons: [] });
        expect({ title: input.title, ...checkQuality(input) }).toEqual({ title: input.title, ok: true, reasons: [] });
      }
    }
  });

  it("accepts every idea of the demo books, numbered without gaps", () => {
    for (const book of DEMO_BOOKS) {
      expect(book.ideas.map((i) => i.position)).toEqual(book.ideas.map((_, i) => i + 1));
      for (const idea of book.ideas) {
        const input = { language: "en" as const, ...idea.en };
        expect({ title: input.title, ...checkStyle(input) }).toEqual({ title: input.title, ok: true, reasons: [] });
        expect({ title: input.title, ...checkQuality(input) }).toEqual({ title: input.title, ok: true, reasons: [] });
      }
    }
  });

  it("flags sentences that all have the same length", () => {
    const body = "Tu lis un livre chaque soir. Tu notes une idée chaque soir. Tu la testes le lendemain matin.";
    expect(coefficientOfVariation([6, 6, 6])).toBe(0);
    expect(checkStyle({ language: "fr", title: "Lire", body, action_step: "Note une idée ce soir avant de dormir." }).reasons).toContain(
      "uniform_sentence_length",
    );
  });

  it("flags more than two sentences starting with the same word", () => {
    const body =
      "Tu te lèves. Tu bois un grand verre d'eau avant de toucher ton téléphone, même si ça paraît bête. Tu ouvres la fenêtre. Et là, ta journée démarre autrement.";
    expect(checkStyle({ language: "fr", title: "Matin", body, action_step: "Pose un verre d'eau sur ta table de nuit ce soir." }).reasons).toContain(
      "repeated_opener:tu",
    );
  });

  it("flags English filler connectors and buzzwords", () => {
    const result = checkStyle({
      language: "en",
      title: "Sleep",
      body: "Sleep matters for you. Moreover, it is crucial to leverage a consistent schedule in order to see the benefits over many weeks.",
      action_step: "Go to bed at the same time tonight.",
    });
    expect(result.reasons).toEqual(
      expect.arrayContaining(["banned_phrase:\\bmoreover\\b", "banned_word:\\bcrucial\\b", "banned_word:\\bleverag(e|es|ing)\\b"]),
    );
  });

  it("flags adjective triads and 'non seulement'", () => {
    const result = checkStyle({
      language: "fr",
      title: "Le calme",
      body: "Tu deviens patient, attentif et bienveillant quand tu respires. Non seulement ça t'aide, mais aussi ça aide les autres autour de toi, au travail comme à la maison.",
      action_step: "Respire trois fois avant ta prochaine réunion.",
    });
    expect(result.reasons).toContain("adjective_triad");
    expect(result.reasons.some((r) => r.includes("non seulement"))).toBe(true);
  });

  it("does not flag 'de plus en plus'", () => {
    const body =
      "Tu scrolles de plus en plus le soir, et tu dors de moins en moins bien. Coupe l'écran avant de dormir. Juste une semaine, pour voir ce que ça change sur ton humeur du matin.";
    expect(checkStyle({ language: "fr", title: "Écrans", body, action_step: "Mets une alarme à 22 h 30 qui te dit de poser le téléphone." }).ok).toBe(true);
  });

  it("rejects a structure shared by more than 30 % of recent cards", () => {
    const body = "Tu doutes ? Normal. Mais chaque matin où tu avances un peu, tu prouves le contraire à ta petite voix intérieure.";
    const sig = structureSignature("fr", body);
    const recent = [...Array(4).fill(sig), ...Array(MIN_STRUCTURE_SAMPLE).fill({ opening: "direct", shape: "LM" })];
    expect(structureShare(sig, recent)).toBeCloseTo(4 / 12);
    expect(checkStyle({ language: "fr", title: "Douter", body, action_step: "Écris ce soir une petite victoire de ta journée." }, recent).reasons).toContain(
      "repetitive_structure",
    );
    expect(structureShare(sig, recent.slice(0, 3))).toBe(0);
  });
});

describe("story rules", () => {
  const base = { ...GOOD };

  it("flags a story whose sentences are all the same length", () => {
    const story = "Mia lit un livre chaque soir. Sam fait la cuisine chaque soir. Ils parlent un peu chaque soir. Puis ils dorment bien chaque soir.";
    expect(checkStyle({ ...base, story }).reasons).toContain("uniform_story_sentence_length");
  });

  it("allows a character's name or pronoun to repeat up to three times, not four", () => {
    const three = "Léa arrive en retard à la réunion. Elle s'excuse, un peu gênée. Elle s'assoit au fond de la salle. Elle découvre que personne n'a vraiment remarqué son absence.";
    const four = `${three} Elle respire enfin.`;
    expect(checkStyle({ ...base, story: three }).reasons.filter((r) => r.startsWith("story_repeated_opener"))).toEqual([]);
    expect(checkStyle({ ...base, story: four }).reasons).toContain("story_repeated_opener:elle");
  });

  it("applies the banned phrases and buzzwords to the story too", () => {
    const story = "Paul pense que la communication est essentielle. En effet, il écoute sa collègue avec attention pendant toute la réunion de lundi matin, sans rien dire.";
    const reasons = checkStyle({ ...base, story }).reasons;
    expect(reasons.some((r) => r.startsWith("banned_phrase"))).toBe(true);
    expect(reasons.some((r) => r.startsWith("banned_word"))).toBe(true);
  });

  it("does not require 'tu' in the story (it is told in the third person)", () => {
    expect(checkStyle(base).reasons).not.toContain("no_direct_address");
  });
});

describe("quality rules", () => {
  it("rejects cards without a concrete action", () => {
    const r = checkQuality({ ...GOOD, action_step: "Garde ça en tête." });
    expect(r.reasons).toEqual(expect.arrayContaining(["action_vague"]));
  });

  it("rejects lessons that are too long or too many sentences", () => {
    expect(checkQuality({ ...GOOD, body: `${GOOD.body} ${"Encore une phrase de plus. ".repeat(20)}` }).reasons).toContain("body_too_long");
    expect(checkQuality({ ...GOOD, body: "Écoute. Répète. Respire. Attends. Reformule." }).reasons).toContain("body_sentence_count");
  });

  it("requires a story that is long enough, with a few sentences", () => {
    expect(checkQuality({ ...GOOD, story: undefined }).reasons).toContain("story_missing");
    expect(checkQuality({ ...GOOD, story: undefined }, null, { requireStory: false }).ok).toBe(true);
    expect(checkQuality({ ...GOOD, story: "Mia parle à Sam." }).reasons).toEqual(expect.arrayContaining(["story_too_short", "story_sentence_count"]));
    expect(checkQuality({ ...GOOD, story: `${GOOD.story} ${"Puis il se passe encore quelque chose de nouveau. ".repeat(20)}` }).reasons).toEqual(
      expect.arrayContaining(["story_too_long", "story_sentence_count", "story_word_count"]),
    );
  });

  it("judges the length of the whole card, story included", () => {
    expect(checkQuality({ ...GOOD, body: `${GOOD.body} ${"Mot ".repeat(260)}.` }).reasons).toContain("card_too_long");
  });

  it("rejects long or unattributed quotes", () => {
    expect(checkQuality({ ...GOOD, quote: "un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze", quote_author: "X" }).reasons).toContain(
      "quote_too_long",
    );
    expect(checkQuality({ ...GOOD, quote: "Connais-toi toi-même.", quote_author: "" }).reasons).toContain("quote_unattributed");
  });

  it("rejects text copied from the source description", () => {
    const source = `Blurb. ${GOOD.body}`;
    expect(checkQuality(GOOD, source).reasons.some((r) => r.startsWith("copied_from_source"))).toBe(true);
  });
});
