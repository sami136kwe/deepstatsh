import { book } from "./helpers";

const T = ["investissements-marches"];

export const INVESTMENT_BOOKS = [
  book({
    slug: "the-psychology-of-money",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    year: 2020,
    topics: [...T, "argent-reussite"],
    featured: true,
    summary:
      "How you behave with money matters more than how much you know about it. Six short stories on luck, patience, enough, and the quiet habits that let ordinary people build lasting wealth.",
    ideas: [
      [
        "The neighbor who never looked rich",
        "Hana admires her neighbor Pedro's new sports car every morning. Over coffee he admits it is leased and the payments eat a third of his salary. Her own old hatchback sits quietly next to it, fully paid, while her savings account grows a little every month. She suddenly sees which of them is actually getting richer.",
        "Wealth is what you do not spend and cannot see. A flashy purchase shows spending, not riches, so judge your progress by what you keep.",
        "Check your savings total today and write it down next to last month's number.",
      ],
      [
        "Enough is a number you choose",
        "Ravi gets a raise and promptly upgrades his apartment, his phone and his weekends. A year later he feels exactly as stretched as before. His friend Meera picked a number years ago, the income that covers a good life, and she stopped chasing beyond it. She sleeps better than he does, with less money.",
        "Without a definition of enough, the goalposts keep moving as you earn more. Knowing your number protects you from risks that are not worth taking.",
        "Write the monthly amount that would make you feel comfortable, then compare it with what you spend.",
      ],
      [
        "Luck wrote half the story",
        "Two students start businesses the same year. One launches just before a boom and gets famous, the other opens right as a crisis hits and quietly closes. Both worked equally hard. Anna reads their stories and realizes she has been copying the winner's playbook without asking how much was timing.",
        "Success and failure both contain luck and risk that nobody can see from outside. Study broad patterns, not single heroes, and be kind to your own results.",
        "Pick one success story you admire and list two things that probably went their way by chance.",
      ],
      [
        "The slow snowball",
        "Tomas starts putting a small amount into an index fund at twenty-two and forgets about it. Friends laugh at the tiny deposits. Decades later the balance is far bigger than anything he could have earned by timing the market, mostly because he never stopped and never touched it. Time did the heavy lifting.",
        "Compounding rewards patience more than brilliance. Staying invested for a very long time beats chasing the perfect moment.",
        "Set up an automatic monthly transfer to your savings or investments, even a small one, and leave it alone.",
      ],
      [
        "Save for no reason at all",
        "Lucia keeps a cash cushion that has no purpose. Friends tease her, since the money could earn more elsewhere. Then her car dies the same week her hours get cut, and she pays for everything without panic or debt. The cushion bought her something money rarely advertises: calm and choices.",
        "Savings are for more than goals. They give you flexibility and protect you from the surprises you could not predict.",
        "Open a separate savings account and name it with the word surprises.",
      ],
      [
        "Plan to be wrong",
        "Kenji builds a spreadsheet predicting his next ten years down to the cent. Within a year a layoff and a move break half the assumptions. His colleague Ola left generous margins in her plan, so the same shocks barely scratch it. Kenji learns something simple. A plan with slack outlives a perfect plan, because nothing ever goes exactly as drawn.",
        "The future will not match your forecast. Leave room for error so a bad year cannot knock you out of the game.",
        "Add a margin of ten percent to one budget or plan you are working on.",
      ],
    ],
  }),
  book({
    slug: "the-simple-path-to-wealth",
    title: "The Simple Path to Wealth",
    author: "JL Collins",
    year: 2016,
    topics: [...T, "argent-reussite"],
    summary:
      "A plain-spoken guide to getting out of debt, building a cushion and letting low-cost index funds do the work. Six stories about keeping your finances simple and your nerves steady.",
    ideas: [
      [
        "Debt is a leash",
        "Noor looks at her payslip and realizes a big slice disappears before she touches it. Credit card interest, a car loan, a store card. She cannot quit her job, change cities or take risks because every month is already spoken for. She decides the first goal is not investing but cutting the leash.",
        "Debt makes your future income belong to someone else. Clearing it buys freedom before any investment can.",
        "List your debts from highest interest to lowest and pick the one to attack first.",
      ],
      [
        "Freedom money",
        "Marc stays in a job he dislikes because rent is due on the first. A friend with a modest nest egg turns down a bad offer and takes a break to retrain. Marc notices the difference is not income but a buffer. He starts building his own, and the job suddenly feels less like a trap.",
        "Money is valuable because it lets you say no. A growing cushion turns work into a choice instead of a requirement.",
        "Set a first target of one month of expenses and write the date you want to reach it.",
      ],
      [
        "One boring fund",
        "Elena spends evenings reading stock tips and trying to pick winners. Her results are mixed and her stress is high. Her uncle just buys one broad low-cost fund each month and goes fishing. After a few years his returns beat hers, and he has far more free evenings.",
        "A broad index fund owns a slice of the whole market at tiny cost. For most people, boring and consistent beats clever and busy.",
        "Look up the fees on your current investments and write down the number.",
      ],
      [
        "Markets fall, you shrug",
        "When the market drops by a third, Hugo's phone fills with alarming headlines. Panic whispers that he should sell everything. He remembers that the market has recovered from every drop before, and that selling would lock the loss in. He closes the app and goes for a walk.",
        "Crashes are a normal part of investing. The damage comes from selling in fear, not from the fall itself.",
        "Write a one-line rule for yourself about what you will do when markets drop sharply.",
      ],
      [
        "Pay yourself first",
        "Imani used to save whatever was left at month's end, which was usually nothing. Now her savings leave her account the day her salary lands. She adjusts her spending to the rest without noticing. Within a year she has more saved than in the previous five.",
        "Money that is moved automatically gets saved. Treat saving as the first bill, not the leftover.",
        "Schedule a transfer to your savings for the day after payday.",
      ],
      [
        "Ignore the noise",
        "Carlos's cousin keeps texting hot tips about a new coin, a new stock, a new trend. Each one sounds urgent and sure. Carlos sticks with his simple plan and looks at his accounts a couple of times a year. The cousin's portfolio swings wildly, while his quietly climbs.",
        "Constant tips and headlines tempt you into action you do not need. A simple plan followed for years beats a sharp reaction to each day's news.",
        "Unfollow one source that makes you want to trade or panic.",
      ],
    ],
  }),
  book({
    slug: "the-little-book-of-common-sense-investing",
    title: "The Little Book of Common Sense Investing",
    author: "John C. Bogle",
    year: 2007,
    topics: [...T],
    summary:
      "The case for owning the whole market through low-cost index funds. Six stories about fees, patience and why trying to beat the market usually costs more than it earns.",
    ideas: [
      [
        "The invisible toll",
        "Priya compares two funds that earn the same before costs. One charges a tiny fee, the other charges about a hundred times more, in percentage terms. She calculates both over thirty years and gapes at the result. The expensive fund quietly takes a huge share of her final balance.",
        "Small yearly fees compound against you just like returns compound for you. Over decades, costs are one of the few things you can control.",
        "Find the annual fee of one fund you own and multiply it by thirty years of your balance.",
      ],
      [
        "Own the haystack",
        "Dara tries to find the needle, the one stock that will soar. For every winner she picks, two disappoint her. A friend simply buys the whole haystack through an index fund and gets the winners automatically. He never has to know in advance which one they will be.",
        "An index fund owns thousands of companies at once, so you do not have to pick the winners. You capture the market's growth without betting on single names.",
        "Name one index fund that tracks a broad market and note its fee.",
      ],
      [
        "Most pros lose to average",
        "A fund manager sits in a glass office with analysts and fancy software. Year after year, most managers in his field fall behind the plain market average once fees are counted. Their clients pay a lot for the privilege of underperforming. A simple index fund just keeps pace.",
        "After costs, the average active investor earns less than the market. You beat most professionals by matching the market cheaply.",
        "Check how your actively managed fund did against its index over the past ten years.",
      ],
      [
        "Time is the real edge",
        "Sven jumps in and out of the market, chasing the best weeks. Missing a few big up days hurts him badly, and he can never predict which ones they are. His sister stays invested through bad and good, and ends up far ahead. Her edge was simply time in the market.",
        "Nobody can reliably time the market. Staying invested over long stretches lets you catch the gains that appear unannounced.",
        "Pick one long-term investment and write down the earliest date you would allow yourself to touch it.",
      ],
      [
        "Speculation is a tax on you",
        "Min buys and sells often, believing every trade adds an edge. Her broker's fees and taxes eat a little each time, and the gains rarely keep up. Her neighbor's single purchase, held for years, has done better with less effort. Frequent trading was costing Min more than she thought.",
        "Every trade carries costs, and many trades cancel each other out. Less activity usually means more of the return stays with you.",
        "Count how many trades you made last year and write down the cost of each.",
      ],
      [
        "Stay the course",
        "When the market sinks, Ahmed's friends bail out and swear never to return. He keeps buying his index fund. Month after month, he feels uneasy but stays steady. The rebound arrives while the others are still waiting on the sidelines. His discipline turns out to be worth more than any forecast anyone ever offered him, and it cost nothing.",
        "Consistent, low-cost investing through good and bad times is a strategy that beats most clever ones. The hardest part is doing nothing at the right moment.",
        "Write a short promise to yourself about not selling during a downturn.",
      ],
    ],
  }),
  book({
    slug: "a-random-walk-down-wall-street",
    title: "A Random Walk Down Wall Street",
    author: "Burton G. Malkiel",
    year: 1973,
    topics: [...T],
    summary:
      "Why stock prices are so hard to predict, how bubbles form and why a diversified, low-cost approach tends to serve ordinary investors best. Six stories on manias, patterns and humility.",
    ideas: [
      [
        "The dart-throwing monkey",
        "A newspaper asks a blindfolded monkey to throw darts at a stock page, and compares the picks with a pro's portfolio. The two end up close. Lena laughs but also notices how hard it is to find reliable skill. She starts to doubt anyone who promises certainty.",
        "Short-term price moves are close to random, so consistent prediction is rare. Treat confident forecasts with suspicion, including your own.",
        "Next time you hear a stock tip, ask what evidence shows the person can repeat their success.",
      ],
      [
        "The tulip fever",
        "Centuries ago people paid the price of a house for a single tulip bulb, sure it would rise forever. Then the market collapsed within weeks. Jo reads the story and thinks of the latest craze among her friends. The names change, but the excitement feels the same.",
        "Bubbles form when people buy because prices are rising, not because of value. A hot asset everyone is talking about is a warning sign for you, not a promise.",
        "Write down one asset that is hyped right now and one reason it might be overpriced.",
      ],
      [
        "Patterns in the clouds",
        "Omar studies charts and sees shapes: heads, shoulders, flags. He is sure the pattern predicts the next move. When he tests his rules against old data they work only half the time, and the other half looks like luck. Seeing shapes in noise is a human habit.",
        "People find patterns even in random data. A chart that looks meaningful may just be noise, so test any rule against evidence.",
        "Pick one trading rule you believe in and check it against past data before using it.",
      ],
      [
        "Spread your eggs",
        "Rosa puts all her savings in her employer's stock because she believes in it. When the company stumbles, her job and her savings sink together. Her friend owns a little of many companies and barely feels the same blow. Diversification looks dull until the day it saves you.",
        "Spreading money across many assets reduces the damage if one fails. You cannot predict which holdings will disappoint.",
        "Look at your largest holding and write down what share of your total it represents.",
      ],
      [
        "The stage of life",
        "Twenty-five-year-old Kai can wait decades, so he takes more risk with stocks. His father, near retirement, holds more stable assets because he will need the money soon. Both choices are sensible for their own horizon. Kai sees that the right mix depends on when you need the cash.",
        "Your investment mix should match your time horizon and your ability to stomach swings. What suits a twenty-five-year-old may not suit a sixty-year-old.",
        "Write the year you expect to need your investments and match it to your level of risk.",
      ],
      [
        "Humility pays",
        "Greta used to feel clever each time a pick rose. After a few reverses she realizes luck had played a part in her wins as well. She now invests with a plan that assumes she can be wrong, and keeps costs low. Her results become boringly steady.",
        "Markets humble almost everyone. Assuming you can be wrong pushes you toward low costs, diversification and patience.",
        "Write down one past investment win and honestly list the part luck may have played.",
      ],
    ],
  }),
  book({
    slug: "the-intelligent-investor",
    title: "The Intelligent Investor",
    author: "Benjamin Graham",
    year: 1949,
    topics: [...T],
    summary:
      "A classic on temperament over cleverness: how to treat stocks as pieces of businesses, keep a margin of safety and avoid being swayed by a moody market. Six stories on calm decisions.",
    ideas: [
      [
        "Mr. Market's mood swings",
        "Imagine a business partner called Mr. Market who knocks on your door daily with a price for your shares. Some days he is euphoric and demands a fortune, other days he is gloomy and offers peanuts. Sana learns she is free to ignore him. She only trades when his price is silly in her favor.",
        "The market is there to serve you, not to instruct you. Its daily mood tells you little about what a business is really worth.",
        "When you see a sharp price move today, ask whether the business itself changed.",
      ],
      [
        "A cushion for error",
        "A builder designs a bridge to carry far more weight than any truck will ever bring. Arjun applies the same idea to buying shares: he only pays well below what he thinks the company is worth. If he is wrong a little, the gap still protects him. He sleeps more soundly than his friends.",
        "A margin of safety means paying less than your estimate of value so errors do not ruin you. It protects against both bad luck and bad judgment.",
        "Before any purchase, write your estimate of fair value and the price you would pay with a cushion.",
      ],
      [
        "You own a business",
        "When Lia buys shares, she imagines buying a small shop with a share of its earnings. She asks how the shop makes money, how stable it is and how it might fail. Her friends only talk about whether the price will go up tomorrow. Lia's habit makes her calmer and slower to chase trends.",
        "A share is a piece of a real business, not a lottery ticket. Thinking like an owner keeps you focused on earnings and durability.",
        "Describe in two sentences how one company you own actually makes money.",
      ],
      [
        "Defensive or enterprising",
        "Both Dev and Tessa want to invest, but their lives differ. Dev has little time, so he picks a simple, diversified, defensive approach. Tessa enjoys research and accepts more work for possible extra returns. They stop competing. Each picks the style that fits their own life, and neither feels behind.",
        "Choose how much effort you are willing to put into investing and match your strategy to it. Extra work does not always bring extra return.",
        "Decide honestly how many hours a month you will spend on investing and write it down.",
      ],
      [
        "Your worst enemy is you",
        "After a big gain, Bo feels brilliant and doubles his bets. After a loss, he panics and sells at the bottom. Over the years he realizes his temperament has cost him more than any wrong analysis. He writes rules that stop his emotions from deciding.",
        "Investors usually hurt themselves with emotional decisions more than with bad information. Rules written in calm moments protect you in tense ones.",
        "Write two rules for buying or selling that you will follow regardless of how you feel.",
      ],
      [
        "Price is not value",
        "Yuki sees a stock soaring and assumes it must be a great company. Then she compares its price with what the business actually earns and finds it laughably high. Another quiet company sits ignored at a modest price. Yuki decides that what you pay matters as much as what you buy.",
        "A great business can be a poor investment if you overpay. Always compare the price with what the company earns.",
        "Pick one company and compare its price with its yearly earnings.",
      ],
    ],
  }),
  book({
    slug: "the-bitcoin-standard",
    title: "The Bitcoin Standard",
    author: "Saifedean Ammous",
    year: 2018,
    topics: ["investissements-marches", "argent-reussite"],
    summary:
      "A history of money and an argument for why Bitcoin might act as a hard, scarce form of it. Six stories on scarcity, inflation and trust. These are ideas to examine critically, not investment advice.",
    ideas: [
      [
        "What makes something money",
        "On a small island, villagers trade shells, grain and favors. Over time they favor whatever holds value, is easy to carry and cannot be faked. Pia sees how a good money emerges from its qualities, not from a decree. She starts asking what those qualities are today.",
        "Good money is hard to fake, easy to move and holds its value. Asking what qualities your money has helps you judge it.",
        "List three qualities you would want in money and rate the cash in your wallet on each.",
      ],
      [
        "The printing press problem",
        "A king debases his coins by mixing in cheaper metal to pay for wars. Prices creep up. Ordinary people feel poorer without knowing why, and Nico recognizes the same pattern in modern price rises. He starts to pay attention to how money supply is created.",
        "When more money is created without more goods, each unit buys less. Inflation quietly takes purchasing power from your savings.",
        "Compare the price of one everyday item today with its price a few years ago.",
      ],
      [
        "A fixed supply",
        "Gold is scarce because digging more is hard. Bitcoin has a fixed cap by design, written into its rules. Amara reads both ideas and notes that scarcity is the feature people value. She also notes that scarcity alone does not guarantee that people will want it.",
        "A limited supply can protect value, but demand and trust still matter to you as a buyer. Scarcity is a quality, not a guarantee of price.",
        "Write one reason an asset with limited supply might still lose value.",
      ],
      [
        "Time preference",
        "Seb and Leo are neighbors, yet they face different incentives. Seb expects his savings to lose value, so he spends now. Leo expects his savings to hold, so he plans for years ahead and thinks in decades. Their habits mirror what the money rewards.",
        "When saving seems pointless, people think shorter term. Money that holds its value encourages patience and long-term planning.",
        "Write one purchase you could postpone to invest in something that lasts.",
      ],
      [
        "Hold your own keys",
        "Jun leaves his coins on an exchange and sleeps fine until it freezes withdrawals. His friend keeps her coins in her own wallet and has to guard her backup carefully. Each choice carries a cost: trust in someone else, or responsibility for yourself. Jun resolves to understand the trade-off before buying more.",
        "Holding digital assets means choosing between convenience and control. Whichever you choose, know the risks you have taken on.",
        "Write down who controls access to each of your digital assets.",
      ],
      [
        "Ideas to test, not to worship",
        "Mia reads a passionate argument and feels convinced. Then she reads a critic who points to price swings, energy use and regulation. She decides that a good idea survives hard questions. She sizes any holding so that a total loss would sting but not wreck her.",
        "Strong arguments deserve strong counterarguments. Only risk an amount you could afford to lose entirely on a volatile asset.",
        "Write the maximum amount you could lose on a risky asset without harming your life.",
      ],
    ],
  }),
  book({
    slug: "the-big-short",
    title: "The Big Short",
    author: "Michael Lewis",
    year: 2010,
    topics: ["investissements-marches", "psychologie"],
    summary:
      "The true story of a handful of outsiders who saw the housing crisis coming while the experts shrugged. Six stories on contrarian thinking, incentives and the cost of being early.",
    ideas: [
      [
        "Read the boring documents",
        "While others trust the ratings, Cora actually reads the thick documents behind a pile of home loans. She finds that many borrowers had no income checks at all. The risk everyone calls safe is built on loans that were never verified. Her edge is simply reading what others skip.",
        "Real advantages often come from doing the dull homework others avoid. Look at the underlying facts instead of the label.",
        "Pick one thing you rely on and read the actual document behind it.",
      ],
      [
        "When everyone agrees",
        "Everyone around Teo is certain that house prices only go up. Banks, brokers and neighbors say it with the same calm confidence. Teo notices that the more certain the crowd, the less anyone checks the numbers. He becomes cautious exactly when the mood is loudest.",
        "Strong consensus can hide shared mistakes. When nobody questions an assumption, it deserves a closer look.",
        "Write one belief that everyone in your circle shares and one way it might be wrong.",
      ],
      [
        "Follow the incentives",
        "A broker earns a fee for every loan he sells. Whether it is ever repaid is not his problem. A rating agency is paid by the banks whose products it rates. Ali spots that nobody in the chain is rewarded for saying no. Ali stops asking whether people are lying and starts asking what they are paid for. It explains almost everything.",
        "People respond to how they are paid. To understand a decision, look at the incentives behind it.",
        "Pick one advice-giver in your life and write how they are paid.",
      ],
      [
        "Right and early is hard",
        "Ben bets against the market and then watches prices keep rising for months. Investors in his fund grow impatient and some demand their money back. He feels the pain of being right too soon. Conviction costs something before it pays.",
        "Being correct is not enough if your timing breaks your resolve. A contrarian bet needs the staying power to survive waiting.",
        "Before taking a bold position, write how long you could be wrong without getting hurt.",
      ],
      [
        "Complexity as a disguise",
        "Slides full of Greek letters and tangled products make Una feel foolish for asking basic questions. But when she presses for a simple explanation, nobody can give one. Complexity can protect weak ideas from scrutiny. She learns to treat I do not understand it as a red flag.",
        "If a product cannot be explained simply, be wary of buying it. Confusion is often where risk hides.",
        "Next time you meet a complicated financial product, ask for a two-sentence explanation.",
      ],
      [
        "Insiders miss the obvious",
        "People deep inside the system keep dismissing the warning signs. Their salary depends on the story staying true. Outsiders like Iris, with nothing to lose from being skeptical, see the cracks first. She decides to seek out views from people who are not paid to agree.",
        "Insiders often have the strongest reasons to ignore bad news. Seek perspectives from those who gain nothing by agreeing.",
        "Ask someone outside your field to critique a plan you are confident about.",
      ],
    ],
  }),
  book({
    slug: "unshakable",
    title: "Unshakable",
    author: "Tony Robbins",
    year: 2017,
    topics: [...T],
    summary:
      "A practical guide to building a resilient financial life: knowing the fees, spreading risk and keeping steady when markets wobble. Six stories on protecting your future self.",
    ideas: [
      [
        "Know what you pay",
        "Camila opens her retirement statement. One line she never read shows annual fees far higher than she expected. Over decades they could swallow a large share of her savings, and nobody ever warned her. She picks up the phone.",
        "Fees are often hidden in plain sight and compound against you. Ask exactly what you pay and what you receive for it.",
        "Find the total yearly fee on one of your accounts and write it down.",
      ],
      [
        "Winter always ends",
        "A farmer does not panic when winter arrives, because he knows spring follows. Drops in the market feel the same to Remy now. He tells himself that corrections are part of the seasons, not the end of the year. He keeps planting while others hide indoors.",
        "Market declines come regularly and have historically passed. Treat them as a season to prepare for, not an emergency.",
        "Write a calm message to yourself to read the next time the market drops.",
      ],
      [
        "Asymmetric risk",
        "Elias asks a simple question before every decision: how much can I lose, and how much can I gain? He prefers opportunities where the possible gain is much bigger than the possible loss. He avoids ones where a bad day could ruin him. His choices become quieter and safer.",
        "Look for situations where the downside is limited and the upside is large. Avoid bets where one mistake could wipe you out.",
        "For your next financial decision, write the best case, the worst case and which is bigger.",
      ],
      [
        "Different buckets",
        "Ines divides her money into three buckets: one for safety, one for growth and one for dreams. When the growth bucket dips, the safety bucket still pays the bills. She no longer feels she must sell at the wrong moment. Her plan holds steady while markets move.",
        "Separating money by purpose reduces panic. Safe money covers needs while growth money has time to recover.",
        "Label your savings by purpose: safety, growth and dreams.",
      ],
      [
        "Automatic beats willpower",
        "Pablo knows he will skip saving if he has to decide each month. So he sets automatic transfers on the first of the month and increases them with each raise. Willpower is never needed again. His savings rate climbs without a single dramatic decision.",
        "Automation makes good habits default. Increase your savings rate each time your income rises.",
        "Raise an automatic saving by one percent of your income this month.",
      ],
      [
        "Income you do not trade for time",
        "Zoe works long hours and notices that the day she stops, the income stops. She begins building a small second source, from a modest investment and a skill she can offer. It does not replace her job, but it gives her options. Over time her income stops depending on one thing.",
        "Relying on a single income source is fragile. Build a second source that does not require all your hours.",
        "Write one idea for a second income stream and the first small step toward it.",
      ],
    ],
  }),
  book({
    slug: "the-trading-game",
    title: "The Trading Game",
    author: "Ryan Jones",
    year: 1999,
    topics: [...T, "psychologie"],
    summary:
      "A trader's look at risk, discipline and money management as the real core of trading. Six stories on position sizing, losses and process. For learning how professionals think, not a promise of profit.",
    ideas: [
      [
        "Protect the bankroll first",
        "A poker player never bets her whole stack on one hand, even with strong cards. Vik treats his trading account the same way. He risks only a tiny slice per trade so no single loss can end his game. Staying alive matters more than any one win.",
        "Survival comes before profit. Risking a small slice per trade keeps one mistake from ending your game.",
        "Decide the maximum percentage of your capital you will risk on any single position.",
      ],
      [
        "Losses are the cost of doing business",
        "A shop owner expects some goods to spoil and plans for it. Mara expects some trades to lose, and she plans the size of each loss before she enters. When a trade fails, she shrugs and moves on instead of chasing it. Losing becomes information, not insult.",
        "Losses are unavoidable. Planning them in advance keeps emotion from turning a small loss into a large one.",
        "Before any trade, write the exact point where you will accept being wrong.",
      ],
      [
        "Plan the exit before the entry",
        "Gus used to buy first and think later, then freeze when prices moved. Now he writes down where he will take profit and where he will cut loss before he buys. When prices swing, he already knows what to do. The plan handles the moment so his feelings do not have to.",
        "Decide your exit before you enter, when your head is clear. A written plan beats improvising under pressure.",
        "Write the entry, exit and stop for any position before committing money.",
      ],
      [
        "Size is the strategy",
        "Two traders use the same signal. One bets modestly each time and survives a losing streak. The other bets big, hits the same streak and is wiped out. Nell sees that position size, more than the signal, decided who stayed in the game.",
        "How much you bet matters as much as what you bet on. Smaller, consistent sizing helps you survive losing streaks.",
        "Calculate how many losses in a row you could take with your current position size.",
      ],
      [
        "Keep a journal",
        "Otto writes down every trade, the reason for it and how he felt. After a few months the pattern is plain: he loses money when he is bored and trades impulsively. He never would have noticed without the notes. The journal shows him his own habits.",
        "Recording decisions and feelings exposes repeated mistakes. You cannot fix what you do not track.",
        "Start a simple journal: write reason, outcome and mood for your next five decisions.",
      ],
      [
        "Do not revenge-trade",
        "After a painful loss, Ria feels the urge to win it back immediately with a bigger bet. She pauses and shuts the screen for the day. The next morning the urge has faded and she sees the loss for what it was. She learns that stepping away is a position too.",
        "The urge to recover a loss quickly leads to larger mistakes. Take a break after a bad outcome before deciding again.",
        "Set a rule: after a significant loss, wait at least a day before your next decision.",
      ],
    ],
  }),
  book({
    slug: "a-beginners-guide-to-the-stock-market",
    title: "A Beginner's Guide to the Stock Market",
    author: "Matthew R. Kratter",
    year: 2019,
    topics: [...T],
    summary:
      "A plain introduction to how stocks work, why people buy them and how beginners can avoid common traps. Six stories on the basics of owning part of a company.",
    ideas: [
      [
        "What a share really is",
        "Bea's friend runs a bakery and sells small slices of ownership to raise money for a new oven. Each slice entitles the owner to a share of the profits. Bea realizes that a stock is exactly this, only for large companies. Buying one makes her a part-owner.",
        "A share is a small slice of ownership in a company. When the company earns, shareholders can benefit.",
        "Pick a company you use and write what you would be buying a slice of.",
      ],
      [
        "Why prices move",
        "At the market stall, apples cost more when many people want them and fewer are available. Stock prices move in the same way, through buyers and sellers agreeing on a price. Theo sees that news changes how many people want to buy. He stops reading each price move as a verdict.",
        "Prices rise and fall with the balance of buyers and sellers. A daily move shows opinion, not necessarily what your slice is worth.",
        "Next time a stock jumps or drops, write one possible reason for the shift in demand.",
      ],
      [
        "Start with a fund",
        "Lina feels overwhelmed by thousands of stocks to choose from. A mentor suggests starting with a fund that holds many companies at once. She buys a small amount and learns by watching it, with little risk from any one name. Starting simple gets her started.",
        "A broad fund gives you instant diversification and takes the pressure off picking. It is a gentle way to begin.",
        "Look up one broad market fund and note what it holds and what it costs.",
      ],
      [
        "Money you will need soon stays out",
        "Gary puts his rent money into stocks because he saw a good tip. The market dips the week the rent is due, and he sells at a loss to pay. Money needed soon does not belong in assets that can swing. He now invests only what he can leave alone for years.",
        "Only invest money you will not need for several years. Short-term needs belong in safer places.",
        "Write what money you need within the next two years and keep it out of the market.",
      ],
      [
        "Dividends and growth",
        "Some companies share profits with owners as regular payments, others reinvest to grow. Faye owns a bit of both and notices they reward her differently. One pays her along the way, the other raises the value of her slice. She learns to ask which she wants.",
        "Returns come from payouts or from growth in value. Knowing which one a company offers helps you match it to your goals.",
        "Look up whether a company you know pays dividends and how much.",
      ],
      [
        "Beginner mistakes to skip",
        "New investors like Jed often chase the hottest stock, trade constantly and sell at the first scare. Each mistake feels logical in the moment. Jed writes them in a list and tapes it above his desk. Avoiding the usual errors, he finds, beats trying to find magic.",
        "Chasing hype, overtrading and panic selling are the common traps. Avoiding them matters more than finding a secret.",
        "Write your own list of three beginner mistakes you want to avoid.",
      ],
    ],
  }),
  book({
    slug: "rich-dad-poor-dad",
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    year: 1997,
    topics: ["argent-reussite", "investissements-marches"],
    summary:
      "A story-driven argument that financial education, assets and mindset matter more than a high salary. Six stories to examine critically; some claims are debated, so treat it as a conversation starter.",
    ideas: [
      [
        "Assets and liabilities",
        "Sam believes his new car is an investment. His friend Ivy asks whether it puts money in his pocket each month or takes it out. The car takes money out through payments, fuel and repairs. Sam begins to sort what he owns by whether it feeds him or drains him.",
        "An asset puts money in your pocket, a liability takes it out. Sorting your belongings this way changes what you choose to buy.",
        "List five things you own and mark each as feeding or draining your finances.",
      ],
      [
        "Don't just work for money",
        "Noa has a good salary, and every raise goes straight into a bigger life. She wonders why she feels no richer. A mentor suggests she start buying small assets and let them earn for her. Slowly her pay becomes only one of her income sources.",
        "A salary alone can keep you running in place. Use some of your income to buy assets that produce more income.",
        "Choose one small amount from this month's pay to put toward an income-producing asset.",
      ],
      [
        "School skips money class",
        "Leo graduates with top grades and no idea how taxes, credit or investing work. His self-taught friend knows all three. She feels far less afraid of money than he does. Leo starts reading and attending free sessions on the topic. Financial knowledge, he sees, is a skill he can learn at any age.",
        "Schools often teach little about money, so you may need to teach yourself. Financial education compounds like any other learning.",
        "Pick one money topic you do not understand and read one article about it this week.",
      ],
      [
        "Fear and greed",
        "Ayo notices two feelings steering his money: fear of losing and desire for a quick win. Each makes him act before he thinks. He tries to name the feeling before any financial decision. Naming it makes space for a calmer choice.",
        "Fear and greed drive many poor money choices. Naming the feeling helps you decide with a clearer head.",
        "Before your next money decision, write down which emotion you feel.",
      ],
      [
        "Your circle shapes you",
        "Paola spends time with friends who joke about being broke and never talk about investing. When she begins attending a local investing club, the conversation changes. She picks up new habits and questions. Her surroundings quietly raise or lower her expectations.",
        "The people around you shape what feels normal about money. Spend time with people who grow their knowledge.",
        "Join one conversation, group or newsletter about personal finance this week.",
      ],
      [
        "Test the advice yourself",
        "Rich Dad style claims sound bold, and some experts disagree with the details. Vera decides to check each idea with a simple test: does it make sense with real numbers? She keeps what survives and drops what does not. She remains the judge of her own money choices.",
        "Any financial book mixes useful ideas with debatable ones. Check claims against numbers and other sources before acting.",
        "Pick one claim from a money book and test it with real numbers from your life.",
      ],
    ],
  }),
];
