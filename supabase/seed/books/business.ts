import { book } from "./helpers";

const T = ["produit-business"];

export const BUSINESS_BOOKS = [
  book({
    slug: "the-lean-startup",
    title: "The Lean Startup",
    author: "Eric Ries",
    year: 2011,
    topics: [...T],
    featured: true,
    summary:
      "A method for building products by testing small guesses quickly instead of betting everything on a big launch. Six stories on experiments, learning and knowing when to change course.",
    ideas: [
      [
        "Build the smallest test",
        "Dana spends eight months building an app before showing it to a single customer. Her friend Jo puts up a one-page site describing the idea and counts the sign-ups in a weekend. Few people sign up. Jo has lost two days, while Dana has lost most of a year.",
        "Test the riskiest assumption with the cheapest experiment you can build. You learn faster when your first version is tiny.",
        "Write your riskiest assumption and one way to test it in under a week.",
      ],
      [
        "Measure what matters",
        "Pedro's team celebrates a rising total of downloads each week. Yet when Ines checks how many people use the product twice, the number is flat and small. The big total hid the truth. They switch to tracking whether new users come back.",
        "Vanity numbers make you feel good without teaching you anything. Choose metrics that show whether people really use and value your work.",
        "Replace one total in your reports with a number that shows repeat use or real value.",
      ],
      [
        "Pivot without shame",
        "After months of work, Aiko's data shows customers ignore her main feature and love a side tool. She feels the sting of admitting the plan was off. Then she rebuilds around what people actually use, and growth follows within weeks. Changing direction was the best decision she made.",
        "A pivot is a change of strategy based on evidence, not a failure. Letting go of a weak plan frees you to pursue a better one.",
        "List what your data says customers value and what they ignore, then note one change to make.",
      ],
      [
        "Learn before you scale",
        "A shop owner opens ten locations before confirming that customers love the first. Each new store repeats the same flaw at larger cost. Tomas, in contrast, polishes one store until customers keep returning, then grows. Scaling a leak only makes the puddle bigger.",
        "Growth multiplies whatever you have, good or bad. Fix the core experience before you try to make it bigger.",
        "Name one weakness in your core offer you would want fixed before you grow it.",
      ],
      [
        "Talk to real customers",
        "Nina is sure users want a dozen features. After five short conversations she realizes they struggle with something far simpler. She had been designing for an imaginary person. A single afternoon of listening changes her roadmap.",
        "Your guesses about customers are often wrong. A handful of real conversations can redirect months of work.",
        "Schedule three conversations with real users this week and write down what surprised you.",
      ],
      [
        "Short loops win",
        "Luis ships a small change every week and watches the result. Competitors with large annual releases learn exactly once a year, and by the time they see any feedback it is stale. Luis has run fifty experiments. His edge is not genius but the speed of his learning.",
        "The faster you complete a cycle of build, measure and learn, the more you improve. Shorten your loops wherever you can.",
        "Shrink one project into a version you could finish and test within a week.",
      ],
    ],
  }),
  book({
    slug: "zero-to-one",
    title: "Zero to One",
    author: "Peter Thiel",
    year: 2014,
    topics: [...T],
    summary:
      "Notes on building something new instead of copying what exists, and why monopolies of value beat crowded competition. Six stories about original thinking and bold focus.",
    ideas: [
      [
        "Going from zero to one",
        "Copying a successful product gets you from one to many, a little more of the same. Creating something genuinely new takes you from zero to one. Mei sees that most of her industry is busy copying each other. She decides to look for a problem nobody has solved yet.",
        "Real progress comes from making something new, not repeating what already works. Ask what is missing instead of what is popular.",
        "Write one thing in your field that does not exist yet but should.",
      ],
      [
        "The question nobody agrees on",
        "Raj asks himself a tricky question: what important truth do very few people agree with me on? At first he draws a blank, since agreeing is comfortable. After a week, he finds a belief about his customers that his competitors reject. That belief becomes his company's starting point.",
        "Original businesses often start from a belief most people disagree with but that turns out to be true. Seek your own contrarian truth.",
        "Write one belief about your work that most of your peers reject, and why you hold it.",
      ],
      [
        "Escape competition",
        "Two restaurants on the same street fight over prices. Neither profits. Marta opens a place that serves something nobody else in town offers. She faces no direct rival and sets her own prices. Her trick is being unlike everybody, not being better than everybody.",
        "Fierce competition squeezes profits. Being uniquely valuable in a small niche can be better than being slightly better in a crowded one.",
        "Identify one niche where you could be the only choice rather than one of many.",
      ],
      [
        "Start small and own it",
        "Sol's company aims to serve the whole world from day one, and it spreads thin. A rival picks one tiny group of customers and serves them perfectly. Once she owns that corner, she expands step by step. Small and dominant beats big and diluted.",
        "Dominating a small market first gives you a base for expansion. Narrow focus makes early success possible.",
        "Pick the smallest group of customers you could serve extremely well.",
      ],
      [
        "Ten times better",
        "A product that is ten percent better does not make customers switch. Cleo sets herself a harder target: make something so much better that the choice is obvious. It forces her to rethink the whole approach rather than polish it. The result looks different, not just cleaner.",
        "Small improvements rarely beat an established habit. Aim for a leap big enough that people switch without hesitation.",
        "Ask yourself what would make your offer ten times better and write one bold idea.",
      ],
      [
        "Plans over luck",
        "Joe believes success is mostly luck, so he improvises each week. Yara writes a clear plan for the next ten years and adjusts as she learns. Both face surprises, but Yara has a direction to measure them against. A definite view of the future gives her a compass.",
        "Luck helps, but a definite plan gives you direction. Have a clear idea of where you are going and update it as you learn.",
        "Write a one-paragraph plan of where you want to be in five years.",
      ],
    ],
  }),
  book({
    slug: "hooked",
    title: "Hooked",
    author: "Nir Eyal",
    year: 2014,
    topics: [...T, "psychologie"],
    summary:
      "How products build habits through a loop of trigger, action, reward and investment. Six stories about why people come back, and how to use the idea responsibly.",
    ideas: [
      [
        "Start with a trigger",
        "Lena opens a news app every morning because her phone buzzes. The buzz is an external trigger. After a few weeks the boredom she feels in line at the cafe becomes an internal trigger, and she opens the app without any alert. The habit has moved inside her.",
        "Habits begin with triggers, first from outside and later from your own feelings. Products that attach to a feeling stick best.",
        "Notice one habit of yours and name the feeling that sets it off.",
      ],
      [
        "Make the action easy",
        "Rob's fitness app asks for ten fields before the first workout. Few users finish. His competitor lets people start with a single tap, and users return daily. The less effort an action takes, the more likely it happens.",
        "People do what is easy. Remove steps between the trigger and the action you want, in your products and in your own habits.",
        "Remove one step from a task you keep postponing.",
      ],
      [
        "Variable rewards",
        "Chiara scrolls her feed, never knowing whether the next post will be boring or delightful. The uncertainty pulls her back again and again. Slot machines use the same trick. She starts to notice how often her attention is held by a surprise just around the corner.",
        "Rewards that vary in size or timing are far more compelling than predictable ones. Be aware of when this pulls at your attention.",
        "Spot one app that uses unpredictable rewards and decide how much time you will give it.",
      ],
      [
        "Invest a little",
        "After Omar saves playlists, follows artists and rates songs, his music app becomes better for him. Leaving would mean losing all that effort. Each small input makes the next visit more rewarding. He sees how a bit of investment ties him to a product.",
        "When users put in time or data, the product grows more valuable to them. Small investments make people come back.",
        "Think of one product you stay with because of what you have put into it.",
      ],
      [
        "Ask whether it helps",
        "Ana builds a habit-forming tool and then asks a hard question: would I want my own family to use this? If it improves lives, she keeps going. If it just wastes their time, she rethinks. She decides that building habits comes with responsibility.",
        "Habit design can help people or manipulate them. Ask whether your product improves your users' lives before you make it sticky.",
        "Write whether the product you work on, or use, truly improves people's lives.",
      ],
      [
        "Use the loop on yourself",
        "Sam wants to read more. He leaves a book on his pillow as a trigger, reads just one page as a tiny action and ticks a calendar for the reward. After a month he reads a chapter without thinking. He used the loop for himself.",
        "The same loop that hooks users can build your own good habits. Design a trigger, a tiny action and a reward.",
        "Choose a habit and set a trigger, a tiny action and a small reward for it today.",
      ],
    ],
  }),
  book({
    slug: "the-mom-test",
    title: "The Mom Test",
    author: "Rob Fitzpatrick",
    year: 2013,
    topics: [...T],
    summary:
      "How to ask questions about your idea so even your mom cannot lie to you. Six stories on getting honest customer feedback without fishing for compliments.",
    ideas: [
      [
        "Don't pitch, ask",
        "Hugo describes his app to a friend and she smiles, saying it sounds great. He walks away encouraged but knowing nothing. Later he asks another person how she handles the problem today, and the answer changes his plans. Compliments feel good, but stories are what teach.",
        "Pitching invites polite praise. Asking about real situations produces facts you can use.",
        "Next time you share an idea, ask how the other person handles the problem now.",
      ],
      [
        "Talk about their life",
        "Instead of asking whether people would buy his product, Ben asks about the last time they faced the problem. People describe real events, workarounds and costs. He learns far more from three stories than from thirty opinions. Their lives hold the answers, not his idea.",
        "Questions about your idea invite guesses. Questions about the past reveal what people actually do.",
        "Ask someone to tell you about the last time they struggled with a particular problem.",
      ],
      [
        "Past beats future",
        "Would you use this next year? Everyone says yes. Cleo notices that such promises cost people nothing. She switches to asking what they did last month about the problem, and how much they spent. The past is honest, and the future is flattering.",
        "People are bad at predicting their own future behavior. Ask about what they have already done, not what they might do.",
        "Replace one would-you question with a what-did-you-do question.",
      ],
      [
        "Seek commitment",
        "Isa gets enthusiastic feedback from many people, but nobody agrees to a follow-up meeting or a deposit. She realizes that enthusiasm without commitment is just politeness. When one person offers to pay for early access, she knows she has found a real need. Commitment is the true signal.",
        "A meeting, an introduction or money shows real interest. Praise alone tells you very little.",
        "After a conversation, ask for a small commitment such as a follow-up or an introduction.",
      ],
      [
        "Hunt the bad news",
        "Noel realizes he has been steering every talk toward good answers. This time he asks what might make the idea fail and what they dislike about current solutions. The conversation gets uncomfortable and becomes valuable. Bad news, he sees, is cheaper now than later.",
        "Fishing for praise protects your ego and costs you the truth. Invite criticism early while changing course is cheap.",
        "Ask one person what would make your idea a bad one.",
      ],
      [
        "Write it down right away",
        "After each chat, Rita jots down quotes, facts and surprises before they fade. A month later she spots patterns across many notes that no single conversation showed. Her memory alone would have kept only what she wanted to hear. The notes keep her honest.",
        "Memory bends toward what you hoped to hear. Record conversations quickly to see the real patterns.",
        "Spend five minutes after your next conversation writing the exact facts you heard.",
      ],
    ],
  }),
  book({
    slug: "crossing-the-chasm",
    title: "Crossing the Chasm",
    author: "Geoffrey A. Moore",
    year: 1991,
    topics: [...T],
    summary:
      "Why technology products that thrill early adopters often stall before the mainstream, and how to bridge that gap by focusing on one niche. Six stories on adoption and focus.",
    ideas: [
      [
        "Early fans are not the crowd",
        "Kira's gadget has a small group of passionate fans who love trying new things. When she aims at ordinary customers, sales stall. They want something that simply works and reassures them. She realizes that the people who love novelty are a different audience from the people who want results.",
        "Visionary early adopters and the pragmatic mainstream want different things. Do not assume the first group's enthusiasm will carry over.",
        "Describe the difference between your earliest users and the customers you want next.",
      ],
      [
        "Pick one beachhead",
        "A landing force does not attack the whole coast. Mo takes one small, specific market and serves it so well that word spreads inside it. Once it is secure, he moves to neighboring groups. His focus feels narrow, but it opens the door.",
        "Win one niche decisively before you move on. Dominating a small segment builds reputation and momentum.",
        "Choose one specific customer segment to focus on this quarter.",
      ],
      [
        "Sell the whole product",
        "Pragmatists do not just want a product, they want the support, guides and integrations around it. Eli sells a good tool, but customers struggle to set it up. When he adds training and templates, adoption jumps. The extras were part of what customers were buying.",
        "Customers buy the complete solution, not just the core feature. Fill the gaps around your product so it works for them from day one.",
        "List what a new customer needs besides your product to succeed.",
      ],
      [
        "References matter",
        "In a conservative industry, buyers trust people like themselves. Tia gets one respected customer to talk about results, and that story opens many doors. Others do not want to be first, but they will follow someone familiar. A trusted voice is worth more than an advert.",
        "Mainstream buyers prefer proof from their own peers. Collect case studies from the segment you want to enter.",
        "Ask one happy customer if you can share their story.",
      ],
      [
        "Name your competition",
        "Pia says she has no competitors and customers look confused. When she positions her product against the solution people already use, they understand immediately. A clear comparison gives buyers a reference point. Without one, they struggle to place you.",
        "Customers understand new things by comparing them with known alternatives. Position yourself against what they use today.",
        "Write one sentence saying who you are for and what you replace.",
      ],
      [
        "Expect the dip",
        "After early success, Gus's growth suddenly slows. His team panics. The pattern is common, because the excitement of early fans fades well before the mainstream arrives. Gus keeps his focus on one niche, and the curve slowly picks up again. Knowing the gap exists lets him ride it out.",
        "Many products stall between early success and mainstream adoption. Treat the dip as a stage you can plan for, not proof of failure.",
        "Note when you might face a slow stretch and how you will respond.",
      ],
    ],
  }),
  book({
    slug: "good-to-great",
    title: "Good to Great",
    author: "Jim Collins",
    year: 2001,
    topics: ["produit-business", "leadership-carriere"],
    summary:
      "What separates companies that stay good from those that become lasting leaders: humble leaders, the right people, honest facts and relentless focus. Six stories drawn from those ideas.",
    ideas: [
      [
        "Humble and fierce",
        "The boss everyone expects is loud and charismatic. Instead, the leader who transformed Nora's company was quiet, gave credit to others and refused to quit. Her ambition was for the company, not for her own fame. The mix of modesty and stubborn will surprised everyone.",
        "Great leaders pair personal humility with fierce resolve. Aim at the success of the whole organization, not your own spotlight.",
        "Give credit to someone else for a win today.",
      ],
      [
        "First who, then what",
        "Before deciding where the bus goes, Dev first gets the right people on it and the wrong people off. With a strong team, new directions become easy. With a weak one, even the best plan fails. The question of who comes before the question of what.",
        "Hire and keep the right people before you set the plan. Strong people can figure out a changing world.",
        "Think about who is on your team and which role is the weakest link.",
      ],
      [
        "Face the brutal facts",
        "Mara holds meetings where every bad number is put on the table without blame. At first, it stings. Soon the team spots problems early and fixes them before they grow. Optimism does not mean hiding reality, and she keeps faith that they will prevail.",
        "Stay confident that you will succeed while confronting the harshest facts. Honesty about problems makes solutions possible.",
        "Share one uncomfortable fact about your project with your team.",
      ],
      [
        "The hedgehog idea",
        "A fox knows many tricks, but a hedgehog knows one big thing. Abel looks for the place where three things overlap: what he can be best at, what drives his economics and what he cares about. Whatever sits outside it, he stops doing. Simplicity gives him focus.",
        "Find the one thing at the overlap of your strengths, your passion and what pays. Say no to what falls outside it.",
        "Write what you could be best in the world at and what you care about.",
      ],
      [
        "Disciplined people, disciplined action",
        "In a disciplined culture, Lea does not need heavy rules or constant supervision. People take responsibility, work inside a clear framework and have freedom within it. Discipline comes from the team, not from control. It makes bureaucracy unnecessary.",
        "Self-disciplined people need fewer rules. Build a culture with clear boundaries and freedom to act inside them.",
        "Write the simple rules your team really needs and drop the rest.",
      ],
      [
        "The flywheel",
        "Pushing a heavy wheel feels hopeless at first. Each push adds a little, and after many turns the wheel builds its own momentum. Tom sees his company's success not as a single breakthrough but as steady, consistent pushes. There was no miracle moment.",
        "Great results come from many consistent efforts that build momentum. Keep pushing your own wheel in the same direction.",
        "Choose one action to repeat every day for the next month.",
      ],
    ],
  }),
  book({
    slug: "the-hard-thing-about-hard-things",
    title: "The Hard Thing About Hard Things",
    author: "Ben Horowitz",
    year: 2014,
    topics: ["produit-business", "leadership-carriere"],
    summary:
      "Lessons from running a company through crises: tough conversations, painful decisions and staying steady when there is no playbook. Six stories on the lonely side of leading.",
    ideas: [
      [
        "There is no formula",
        "When the company nearly runs out of money, Sasha searches for a guide that tells her what to do. There is none. She learns that the hardest moments arrive without a manual, and she has to decide with incomplete information. Leaders are paid for exactly those moments.",
        "The hardest problems have no playbook. Be ready to decide with imperfect information and own the result.",
        "Write down a decision you are avoiding because there is no clear answer.",
      ],
      [
        "Tell the team the truth",
        "A layoff is coming, and Joel hesitates to say so. Staff sense something and rumors spread faster than facts. When he finally explains the situation clearly and kindly, trust returns even though the news is bad. Silence does more damage than honesty.",
        "People can handle bad news better than uncertainty. Share difficult facts clearly and with care.",
        "Tell your team one hard truth you have been holding back.",
      ],
      [
        "Struggle is part of it",
        "Lia hears that great founders stay calm and sure. Her own nights are sleepless and full of doubt. She learns that struggle is the normal experience, not a sign of failure. She stops hiding it. She starts talking with other leaders about what keeps her up at night.",
        "Fear and doubt come with building something difficult. Talking about them with peers makes your load lighter.",
        "Call someone in a similar role and tell them honestly how things are going.",
      ],
      [
        "Hire for strength",
        "Cal keeps looking for a candidate with no weaknesses and finds nobody. Then he hires someone with a remarkable strength and a few clear gaps, and the team thrives. The gaps matter less than what the person does brilliantly. He stops hunting for perfect.",
        "People with great strengths usually have weaknesses too. Hire for what someone does exceptionally well.",
        "Think of a role you need to fill and write the one strength that matters most.",
      ],
      [
        "Take care of people first",
        "Ned believes his job is the product. A mentor tells him it is the people, and the product will follow. He starts caring about how teammates are treated, trained and promoted. Over time the product improves because the people do.",
        "Look after your team and they will look after the product and customers. Culture is built by how you treat people daily.",
        "Do one thing today that shows a teammate you value their work.",
      ],
      [
        "Wartime and peacetime",
        "In calm times, Fay lets people explore, discuss and build consensus. When a rival threatens the company, she acts faster and sets clear orders. She learns that the same leadership style cannot serve both situations. Knowing which time you are in matters.",
        "Different situations demand different leadership. Recognize if the moment is calm or a crisis, and adjust.",
        "Decide whether your current situation needs consensus or quick direction.",
      ],
    ],
  }),
  book({
    slug: "contagious",
    title: "Contagious",
    author: "Jonah Berger",
    year: 2013,
    topics: ["produit-business", "psychologie"],
    summary:
      "Why some ideas, products and stories spread while others vanish. Six stories about social currency, triggers, emotion and public visibility.",
    ideas: [
      [
        "Make people look good",
        "People share things that make them seem smart, funny or in the know. Una creates a tiny secret feature that users feel clever for discovering and mention to friends. The feature costs little but spreads her product. People talk about what boosts their image.",
        "People pass along things that make them look good. Give them something that makes sharing feel like status.",
        "Think of a detail in your work that would make someone feel clever for knowing it.",
      ],
      [
        "Link to a trigger",
        "A candy bar linked itself to a day of the week and saw sales rise whenever that day came. Ray ties his product to a frequent cue from daily life. Each time the cue appears, people think of him. Frequent triggers keep an idea top of mind.",
        "Ideas tied to everyday cues are remembered and mentioned more. Connect yours to something that happens often.",
        "Find one common situation that could remind people of your idea.",
      ],
      [
        "Feel something big",
        "Pia compares two articles about the same topic. The one that sparks awe or anger travels widely, while the calm one barely moves. High-energy emotions push people to share. She starts to ask what feeling her message creates.",
        "Emotions that excite, such as awe or anger, drive sharing more than calm ones. Choose the feeling your message creates.",
        "Name the emotion you want people to feel from your next message.",
      ],
      [
        "Make it visible",
        "A bright, odd-looking product on a coworker's desk makes everyone ask about it. Hal designs his packaging to be seen on desks and in bags. Things that people can observe get copied. Hidden things cannot spread.",
        "Behavior that others can see is easier to imitate. Make your product or idea visible in public.",
        "Add one visible element to your product or work that others can notice.",
      ],
      [
        "Give practical help",
        "Jess shares a short guide to saving time at the grocery store, and it travels widely because it helps people. Useful information gets passed on out of kindness. She starts packaging tips in short, easy-to-share forms. People like to help their friends.",
        "People share useful information to help others. Make your advice short, clear and easy to pass along.",
        "Turn one piece of your expertise into a short tip someone could forward.",
      ],
      [
        "Tell a story that carries the message",
        "Facts get forgotten, but a good story carries them along. Max wraps his product's benefit inside a memorable tale people retell without thinking. The message rides inside the story like a passenger. Retelling the story spreads the product.",
        "Stories travel farther than facts. Make your key message impossible to retell without mentioning it.",
        "Write a short story that carries your main message inside it.",
      ],
    ],
  }),
  book({
    slug: "start-with-why",
    title: "Start with Why",
    author: "Simon Sinek",
    year: 2009,
    topics: ["produit-business", "leadership-carriere"],
    summary:
      "Why people follow organizations that explain their purpose before their product. Six stories on purpose, trust and communicating from the inside out.",
    ideas: [
      [
        "Why before what",
        "Most companies explain what they do, then how. Zoe's favorite brand starts with why it exists, and only then shows the product. The belief is what draws her in, and the product simply confirms it. She begins to open her own pitches with purpose.",
        "People connect first with why you do something. Begin with your purpose, then explain how and what.",
        "Write one sentence about why your work exists, beyond making money.",
      ],
      [
        "People buy beliefs",
        "Two shops sell nearly identical coats. One talks about warmth and price, the other about protecting wild places and the people who love them. Customers queue for the second. They are buying the belief as much as the coat.",
        "Customers often choose a brand that shares their values. Make your beliefs clear, and attract those who share them.",
        "Write one value you want people to associate with you or your work.",
      ],
      [
        "Consistency builds trust",
        "Emil's company says it values honesty, then hides fees in fine print. Customers notice the gap and trust drains away. A rival acts the same way it speaks, in small things and big ones. Trust grows when words and actions match.",
        "Trust comes from saying and doing the same thing. Check that your actions match your stated values.",
        "Find one place where your actions and your stated values do not line up.",
      ],
      [
        "Find the right people",
        "Ada stops trying to convince everyone and speaks plainly about her beliefs. The people who share them step forward and become loyal, while the rest drift off. Her team becomes smaller but stronger. She learns that the goal is not to attract all, but the right few.",
        "Aim to attract people who believe what you believe. Fit matters more than headcount.",
        "Describe the kind of person who shares your why and where to find them.",
      ],
      [
        "Early believers spread it",
        "A small group of early believers adopts an idea first, not for convenience but because they care. Their enthusiasm convinces the next group. Ted sees that his first customers are not just buyers but carriers of the idea. He treats them like partners.",
        "Early supporters who share your beliefs help your idea spread. Treat them as partners, not just customers.",
        "Thank three early supporters personally and ask what they would like to see next.",
      ],
      [
        "Why drifts when you win",
        "After a big success, Cass finds the team focused on numbers and has forgotten why they began. Decisions grow cold and trust thins. She calls everyone together to remember the original purpose. Success, she learns, can quietly erode the reason behind it.",
        "Success can make you forget why you started. Return to your purpose regularly to stay on course.",
        "Schedule a conversation with your team about why you started.",
      ],
    ],
  }),
  book({
    slug: "100m-offers",
    title: "$100M Offers",
    author: "Alex Hormozi",
    year: 2021,
    topics: ["produit-business", "negociation-persuasion"],
    summary:
      "How to craft an offer so strong that people feel foolish saying no, by raising the value delivered and lowering the risk. Six stories on pricing, value and guarantees.",
    ideas: [
      [
        "Price follows value",
        "Wes charges little because he fears customers will say no. They still hesitate, because cheap suggests low value. When he clearly shows the results customers get, he raises his price and sales improve. People pay for outcomes, not for hours.",
        "Customers judge price against the outcome they receive. Show the value clearly and the price makes sense.",
        "Write the concrete result your customers get and what it is worth to them.",
      ],
      [
        "Four dials on every offer",
        "Customers want a dream outcome but doubt they will reach it, and they dislike waiting and effort. Dina designs her offer to promise the result, prove it works, shorten the wait and reduce the work. Each step makes the offer stronger. The doubt shrinks as the value grows.",
        "A strong offer increases the dream outcome and likelihood, while cutting the time and effort required. Work on each of these dimensions.",
        "Choose one part of your offer to make faster or easier for the customer.",
      ],
      [
        "Remove the risk",
        "Buyers fear wasting their money. Ivo adds a guarantee that if the customer does not get the result, they are refunded. Fewer people hesitate, and the extra sales outweigh the refunds. Taking on the risk shows confidence.",
        "A good guarantee removes fear from the buyer and puts it on you. Offer one you can honestly keep.",
        "Write a guarantee you could confidently offer your customers.",
      ],
      [
        "Stack the bonuses",
        "Instead of cutting the price, Bea adds useful extras that cost her little but matter to the buyer. Templates, a checklist and a quick call make the package feel richer. Customers compare the whole bundle with the price. The perceived value climbs without a discount.",
        "Add valuable extras instead of dropping the price. Bonuses that cost you little can feel big to the buyer.",
        "List three low-cost extras you could add to make your offer feel richer.",
      ],
      [
        "Scarcity must be real",
        "Fake countdowns erode trust once customers spot them. Gil limits his spots because he can only serve a few people well, and says so honestly. Real limits create urgency without lies. People respect honest scarcity.",
        "Real limits give people a reason to act now. Fake pressure destroys your credibility, so only use true constraints.",
        "Find a real limit in your offer, such as capacity or time, and state it honestly.",
      ],
      [
        "Name it well",
        "A vague service called consulting makes customers shrug. Pia renames her offer to describe exactly the result it delivers and who it is for. People immediately see themselves in the description. A clear name does half of the selling.",
        "A clear name that states the result and the audience makes an offer easier to understand. Be specific.",
        "Rewrite the name of your offer so it states the result and who it is for.",
      ],
    ],
  }),
];
