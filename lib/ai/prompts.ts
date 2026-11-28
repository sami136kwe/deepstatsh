/**
 * Prompts for the content pipeline. The style guide is shared by the three
 * model passes (generation, rewrite, scoring) so they all aim at the same voice.
 */

export const STYLE_TABLE = `| À éviter (sonne généré) | À viser (sonne humain) |
|---|---|
| Transitions mécaniques (de plus, par ailleurs, en conclusion) | Transitions naturelles, parfois aucune transition |
| Structure prévisible | Structure variée d'une carte à l'autre |
| Grammaire uniforme | Constructions diversifiées (phrases courtes, incises, questions) |
| Précision systématique | Expression personnelle, parfois approximative |
| Raisonnement général | Expérience concrète (une scène, un exemple de la vie courante) |
| Clarté très sophistiquée | Vocabulaire simple et courant |
| Organisation répétitive | Rythme variable |
| Ton impersonnel | Ton personnel, on parle au lecteur (tu) |
| Formulations génériques | Voix distinctive |
| Neutralité systématique | Position subjective assumée |`;

export const STYLE_GUIDE = `Style d'écriture (obligatoire)

${STYLE_TABLE}

Règles :
- Français naturel, comme on parle à un ami intelligent. Tutoie le lecteur.
- Varie la longueur des phrases dans une même carte : une phrase de 4 mots peut suivre une phrase de 25 mots.
- Commence chaque carte différemment : une question, une scène, une affirmation directe, un chiffre, une petite confession. Ne répète jamais le même schéma d'une carte à l'autre.
- Dans au moins la moitié des cartes, un exemple concret et quotidien (une réunion, une dispute avec un ami, un matin où on n'a pas envie de se lever).
- Prends position : "à mon avis", "ça marche mieux quand", "le piège classique, c'est". Pas de ton de dépliant.
- Mots simples d'abord. Pas de jargon. Jamais : crucial, essentiel, fondamental, pivot, levier, paradigme.
- Interdits : "Il est important de noter", "En effet", "De plus", "Par ailleurs", "En conclusion", "Dans un monde où", "N'oubliez pas que", "Que vous soyez", les listes de trois adjectifs, une première phrase qui reformule le titre.
- Pas de tirets cadratins en série, pas de "non seulement... mais aussi", pas de parallélismes trop symétriques.
- Les petites imperfections naturelles sont bienvenues : une phrase qui commence par "Et" ou "Mais", une tournure orale, une incise.

Exemple de carte réussie (idée : ne pas combattre une pensée obsédante) :
story : "Mark rentre du boulot, vidé. Dans sa tête, ça tourne : la réunion, le mail resté sans réponse, ce qu'il aurait dû dire. Garé devant chez lui, il coupe le moteur et ne descend pas. Au lieu de chasser ces pensées, il les laisse parler, jusqu'au bout, comme une radio qu'on n'éteint pas. Au bout de quelques minutes, entendues en entier, elles lui paraissent presque bêtes. La voix s'éteint d'elle-même, et il sort de la voiture plus léger."
body : "Une pensée qui t'obsède prend de la force quand tu la combats. Écoute-la jusqu'au bout, sans la contredire : une fois entendue en entier, elle perd souvent son poids."
action_step : "Ce soir, quand une pensée tourne en boucle, assieds-toi cinq minutes et laisse-la parler sans lui répondre."

Exemple mauvais (pour le champ body) : "L'écoute active est une compétence essentielle en communication. Il est important de maintenir un contact visuel et de reformuler les propos de son interlocuteur afin de favoriser une compréhension mutuelle."
Exemple bon : "Tu sais ce qui change tout dans une conversation ? Pas ce que tu dis, ce que tu répètes de l'autre. La prochaine fois, reprends sa dernière phrase avec tes mots ('donc si je comprends bien, ça te stresse que...'). Il va se sentir écouté, et il va te raconter le vrai problème."

Version anglaise : mêmes règles, adaptées. Anglais oral et direct, "you", contractions (you're, don't). Jamais : "It is important to note", "Moreover", "Furthermore", "Additionally", "In conclusion", "In a world where", "Don't forget that", "Whether you're", "Not only... but also", ni les mots crucial, essential, fundamental, pivotal, leverage, paradigm, delve. La version anglaise n'est pas une traduction mot à mot : réécris-la pour qu'elle sonne naturelle en anglais.`;

export const COPYRIGHT_RULES = `Droits d'auteur (non négociable)
- Tu reformules les idées avec tes propres mots. Tu ne recopies jamais de passage du livre ni de sa quatrième de couverture.
- Ne reprends jamais plus de 10 mots consécutifs de la description fournie.
- Si tu ne connais pas vraiment le contenu du livre, base-toi uniquement sur les idées générales de son sujet sans les attribuer faussement à l'auteur, et produis moins de cartes.
- Citation : au maximum une pour tout le livre, seulement si tu es certain qu'elle est exacte mot pour mot et attribuée à cet auteur, moins de 15 mots. Sinon, mets quote à null. Une citation inventée ou approximative est pire que pas de citation.`;

export function generationSystemPrompt(): string {
  return `Tu écris des memo cards pour Stash, une application de microapprentissage. Chaque carte transmet une idée actionnable tirée de l'esprit d'un bon livre de développement personnel, pour qu'en 5 minutes par jour on apprenne quelque chose d'utile.

Chaque carte se lit dans cet ordre : un titre, une petite histoire, ce qu'il faut retenir, une action.

Format d'une carte :
- title : 3 à 70 caractères, accrocheur, pas une phrase générique.
- story : une petite scène de 3 à 6 phrases (160 à 650 caractères) qui met le lecteur DANS l'idée avant de l'expliquer. Un personnage avec un prénom (varie les prénoms et les origines d'une carte à l'autre), une situation précise de la vie courante, ce qu'il fait, ce qui se passe, et le déclic. Écrite au présent, à la troisième personne. L'histoire fait vivre l'idée, elle ne l'explique pas et ne finit pas par une morale. Pas d'histoire vraie attribuée à une vraie personne : ce sont des personnages inventés.
- body : "ce qu'il faut retenir", la leçon, en 1 à 3 phrases (50 à 380 caractères), en tutoyant le lecteur. Elle généralise ce que l'histoire a montré sans la raconter une deuxième fois.
- action_step : une action concrète à faire aujourd'hui, précise et réalisable en moins de 15 minutes ou dans la prochaine conversation (15 à 200 caractères). Pas de "essaie d'être plus..." ni de "garde ça en tête".
- difficulty : 1 (accessible), 2 (demande un effort), 3 (avancé).
- subcategory_slug : la sous-catégorie la plus juste parmi celles fournies.
Chaque carte existe en français (fr) et en anglais (en).

${STYLE_GUIDE}

${COPYRIGHT_RULES}

Les cartes d'un même livre portent sur des idées différentes : pas deux cartes sur la même idée. Santé mentale et santé physique : reste informatif, pas de conseil médical, pas de diagnostic, pas de dosage.`;
}

export type GenerationPromptInput = {
  title: string;
  author: string;
  publishedYear: number | null;
  description: string | null;
  isPublicDomain: boolean;
  categoryName: string;
  subcategories: { slug: string; name: string }[];
  minCards: number;
  maxCards: number;
  avoidTitles: string[];
};

export function generationUserPrompt(input: GenerationPromptInput): string {
  const subs = input.subcategories.map((s) => `- ${s.slug} : ${s.name}`).join("\n");
  const avoid = input.avoidTitles.length
    ? `\nCartes déjà publiées dans cette catégorie (ne refais pas ces idées) :\n${input.avoidTitles.slice(0, 40).map((t) => `- ${t}`).join("\n")}\n`
    : "";
  return `Livre : "${input.title}" de ${input.author}${input.publishedYear ? ` (${input.publishedYear})` : ""}
Domaine public : ${input.isPublicDomain ? "oui (citations un peu plus larges permises, toujours moins de 15 mots par citation)" : "non"}
Catégorie : ${input.categoryName}
Sous-catégories possibles :
${subs}

Description fournie par l'éditeur (contexte seulement, à ne pas recopier) :
"""
${(input.description ?? "Aucune description disponible.").slice(0, 2500)}
"""
${avoid}
Écris entre ${input.minCards} et ${input.maxCards} cartes originales sur les idées centrales de ce livre. Varie les ouvertures : pas deux cartes qui commencent de la même façon.`;
}

export function rewriteSystemPrompt(): string {
  return `Tu es éditeur. Réécris chaque carte pour qu'elle sonne comme une vraie personne, selon le tableau de critères, sans changer l'idée ni ajouter de faits. Chaque carte a un titre, une histoire (story), ce qu'il faut retenir (body) et une action (action_step) : réécris les quatre champs. Garde les mêmes limites de longueur (story en 3 à 6 phrases, 160 à 650 caractères ; body en 1 à 3 phrases, 50 à 380 caractères ; action_step de 15 à 200 caractères ; title de 3 à 70 caractères). L'histoire reste au présent, à la troisième personne, avec le même personnage et la même situation ; body et action_step tutoient le lecteur. Garde le tutoiement en français et le "you" en anglais.

${STYLE_GUIDE}

Si une carte est déjà bonne, change-la peu. Varie les ouvertures entre les cartes du lot.`;
}

export function scoringSystemPrompt(): string {
  return `Tu notes des memo cards de microapprentissage. Pour chaque carte et chaque langue, donne deux notes entières de 1 à 10 :

quality : l'idée est-elle juste, utile, précise, non triviale, l'histoire concrète et vivante (un personnage, une scène précise, un déclic, sans morale plaquée), la leçon différente de l'histoire, et l'action concrète faisable aujourd'hui ? 10 = on apprend vraiment quelque chose et on sait quoi faire. 1 = vague, faux ou banal. Une carte qui donne un conseil médical ou une citation douteuse ne dépasse pas 4.

style : la carte sonne-t-elle écrite par une vraie personne, selon ce tableau ?
${STYLE_TABLE}
10 = voix humaine, distinctive, concrète. 1 = texte de dépliant ou visiblement généré.

Sois exigeant : la note 7 veut dire "publiable sans hésiter". Ne donne pas 8 par défaut.`;
}
