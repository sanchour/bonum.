/* ============================================
   BONUM — App Logic & Data Model
   ============================================ */

// ── Wisdom Data (extracted from PDFs) ──
const PILLARS = {
  relatio: {
    id: 'relatio',
    icon: '🧡',
    name: 'Relatio',
    subtitle: 'Relationships',
    category: 'Social',
    color: '--color-relatio',
    sections: [
      {
        title: '💏 Romanticism',
        entries: [
          {
            id: 'rel-1',
            title: 'Meaningful Words & Gifts',
            body: `Flowers, compliments, messages, actions, stories. Let them be surprising and thoughtful. They should feel like they are for her, making her feel special.`,
          },
          {
            id: 'rel-2',
            title: 'Beautiful Experiences',
            body: `Something romantic like dancing or singing to songs, seeing the sunset alone, reading a poem. These moments create a bond that goes beyond words.`,
          },
          {
            id: 'rel-3',
            title: 'Thoughtful Touches',
            body: `Make her feel safe and loved.\n\n• Massaging her shoulders or brushing her hair slowly\n• Holding her hand silently during a meaningful moment\n• Tucking her in and kissing her forehead when she's sleepy`,
          },
          {
            id: 'rel-4',
            title: 'Loving Acts',
            body: `• Cooking her favorite meal while she sits and watches you\n• Making a playlist of songs that remind you of her\n• Planning a small surprise—even just a detour to see a sunset`,
          },
          {
            id: 'rel-5',
            title: 'Deep Presence',
            body: `• Listening to her talk about her day without distractions\n• Looking at her and saying, "I'm just really grateful you exist."\n• Saying "I love you" when she least expects it, but most needs it`,
          },
        ]
      },
      {
        title: '🌸 Femininity',
        entries: [
          {
            id: 'rel-6',
            title: 'Be Masculine Yourself',
            body: `Be calm, clear, and confident in yourself — she feels safe to let go and just be.\n\n• Speak and move slowly, with intention\n• Be decisive—"Let's do this" instead of "What do you wanna do?"\n• Don't react emotionally to her emotional waves — be the rock in the storm, not another wave`,
          },
          {
            id: 'rel-7',
            title: 'Give Her Presence & Attention',
            body: `Women feel most feminine when they feel seen and felt.\n\n• Make deep eye contact — not creepy, just honest\n• Listen without rushing to fix\n• Touch her with intention, not just to get something\n• Genuinely pay attention and listen\n• Make her feel like the most important person in the room — and mean it\n\nFeminine energy is chaotic, emotional, expressive. If you meet that with grounded presence, she will feel like she can breathe.`,
          },
          {
            id: 'rel-8',
            title: 'Invite Her Into Beauty',
            body: `Plan things that spark emotion and sensuality:\n\n• A slow walk at sunset, music she loves, dancing, massages\n• Ask questions like, "What makes you feel most alive?" or "What moment this week made you feel beautiful?"\n• Never shame her emotions. If she's crying, don't say "You're too much." Say "It's okay—let it out."\n• Stay present in conflict. Don't shut down, ghost, or withdraw. Stay, breathe, listen.\n• Be consistent. Show up when you say you will. Keep your word. Be stable.`,
          },
          {
            id: 'rel-9',
            title: 'Praise Her Essence',
            body: `Instead of "you look hot," try:\n\n• "You have this energy that lights me up."\n• "You have a way of making things feel warm."\n• "I love how soft you are with people."`,
          },
          {
            id: 'rel-10',
            title: 'Create Softness & Sensuality',
            body: `The feminine is awakened in beauty, slowness, and intimacy. You're not just offering love — you're offering experience.\n\n• Dance with her. In the kitchen. On the street. Anywhere.\n• Walk in nature together. Watch the sunset in silence.\n• Play music and lie together, just touching, breathing.\n\nShe'll feel feminine because she's invited to feel everything.`,
          },
        ]
      },
      {
        title: '⚡ Self-Sabotaging Behaviors',
        entries: [
          {
            id: 'rel-11',
            title: 'Sources of Distance',
            body: `Feelings of distance come from many sources — it's almost always just feelings. You love her.\n\n• When she speaks about another guy or ex\n• When you don't feel like you're getting enough attention\n• When you don't feel appreciated\n• When she is doing something fun, and not you\n• When you feel insecure compared to her\n• When you feel like connecting but can't\n• When you are in different moods\n• When she acts differently from what you expect\n• When she doesn't react on time\n\nRemember: Listen to her, give thoughtful gifts, words and touches. Be decisive, make plans, surprise her. Allow, support and encourage her when she is emotional.`,
          },
        ]
      }
    ]
  },

  habitus: {
    id: 'habitus',
    icon: '🪄',
    name: 'Habitus',
    subtitle: 'Habits',
    category: 'Self',
    color: '--color-habitus',
    sections: [
      {
        title: '👍 Good Habits',
        entries: [
          {
            id: 'hab-1',
            title: 'Always Say Thanks',
            body: `Always say thank you, even to smaller things. So many times we often forget to say thank you, because we take things for granted, but this is no way to live.\n\nWe should thank each other, even for the smaller things. If a stranger holds the door open for you, say thanks. If your mom brings you tea, say thanks. If someone gives you an item you bought, say thanks.\n\nFor more significant things we should give honest and sincere appreciation, showing we care. This makes the other person feel better, but also ourselves. Say thank you, and giving a smile goes a very long way.\n\nTry each time to make it seem genuine, and not as an habitual saying sounding like a robot. Someone routinely does something for you? Then take a small moment, look the person in the eyes and tell him/her your appreciation. People will always appreciate it, and as a bonus they will like you more.\n\nTry to find moments throughout the day where someone does something for you and which you always took for granted — it can be anything — but try now to say a genuine thank you.\n\nA state of gratitude, even for smaller things, is one of the most important things in a happy and good life.`,
          },
          {
            id: 'hab-2',
            title: 'Being Playful & Childlike',
            body: `Staying playful and childlike is one of the best ways to keep your spirit light, creative, and full of joy — especially in a world that often rewards seriousness and structure.\n\n🌱 Cultivate Curiosity\nAsk questions like a kid would: Why is the sky blue? What happens if I do this? Let yourself explore without needing a "productive" outcome.\n\n🎨 Play Without Purpose\nDraw, dance, build things, or play music just because it feels good. Play games: board games, card games, or even simple made-up games with friends. Try silly things without caring how they look — like walking backwards or making weird sounds.\n\n🧠 Let Go of Self-Judgment\nKids don't ask "Is this stupid?" — they just do it. Don't be afraid to look goofy or make mistakes. That's where magic happens.\n\n🦶 Be Present Like a Child\nChildren live in the now. Try to feel your surroundings deeply — the texture of grass, the warmth of the sun. Meditate, but playfully. Smile while breathing, giggle at your thoughts.\n\n👀 Hang Out with Kids or Playful Adults\nThey remind you of how little we actually need to have fun.\n\n🛠 Break Routine Occasionally\nDo random stuff: eat breakfast for dinner, jump on your bed, take a different route home. Surprise your senses. New stimuli wake up the "child brain."\n\n💬 Use Your Imagination Daily\nTell stories, imagine other lives, talk to yourself in funny voices. Let your inner world be as real as your outer world sometimes.\n\n🙏 Don't Over-Spiritualize It\nBeing playful is spiritual. Laughter is a sacred thing. Let fun be a form of freedom — not another thing you have to "achieve."`,
          },
          {
            id: 'hab-3',
            title: 'Social Confidence',
            body: `Don't be afraid to greet and look at old acquaintances. You are socially confident.\n\nAsk people more often to do things, like making plans together. Be social, be yourself.\n\nTrying to let your curiosity flow outwards without the feeling of it having to be productive. It's a form of freedom, don't stress it.`,
          },
          {
            id: 'hab-4',
            title: 'Stay Mindful',
            body: `Don't self-doubt. Stay mindful. You are doing okay, and the future will only be better.\n\nImagine, fantasise and do playful stuff without reason.`,
          },
        ]
      },
      {
        title: '👎 Bad Habits',
        entries: [
          {
            id: 'hab-5',
            title: 'Lying — From The Brothers Karamazov',
            body: `"Don't lie to yourself. A person who lies to himself and believes his own lies comes to a point where he can no longer distinguish between truth and lies — either in himself or in others. And because of this, he loses all respect for himself and for his fellow man.\n\nThen the ability to love disappears from his soul, and without love he shrinks from no sin. The person who lies to himself always feels insulted; he knows very well that nobody intends to insult him, but that he exaggerates everything himself, deceiving himself and feeling offended because it's a pleasant feeling for him…\n\nThen he harbors revenge and hostility in his soul…"\n\n— Fyodor Dostoevsky, The Brothers Karamazov`,
          },
        ]
      }
    ]
  },

  'bonus-affectus': {
    id: 'bonus-affectus',
    icon: '🌈',
    name: 'Bonus Affectus',
    subtitle: 'Good Emotions',
    category: 'Self',
    color: '--color-bonus-affectus',
    sections: [
      {
        title: '🌈 Positive Emotions',
        entries: [
          {
            id: 'ba-1',
            title: 'Cultivating Good Feelings',
            body: `Good emotions are the foundation of a meaningful life. They are not just reactions — they are practices.\n\nJoy, gratitude, serenity, interest, hope, pride, amusement, inspiration, awe, and love — these are the ten positive emotions identified by research that broaden our awareness and build lasting resources.\n\nThe key is not to chase them, but to create the conditions where they naturally arise. Pay attention to moments of beauty. Express gratitude daily. Allow yourself to be moved.`,
          },
        ]
      }
    ]
  },

  'malus-affectus': {
    id: 'malus-affectus',
    icon: '💢',
    name: 'Malus Affectus',
    subtitle: 'Negative Emotions',
    category: 'Self',
    color: '--color-malus-affectus',
    sections: [
      {
        title: '💢 Emotions to Understand',
        entries: [
          {
            id: 'ma-1',
            title: 'Anger',
            body: `Anger is a signal, not a solution. It tells you something matters to you — a boundary has been crossed, an expectation unmet, a value violated.\n\nThe key is not to suppress anger, but to understand its root. Ask yourself: What am I really feeling beneath this anger? Often it's hurt, fear, or helplessness.\n\nUse anger as fuel for change, not destruction.`,
          },
          {
            id: 'ma-2',
            title: 'Jealousy',
            body: `Jealousy reveals your deepest desires and insecurities. When you feel jealous, ask: What do I really want? What am I afraid of losing?\n\nJealousy is not a character flaw — it's information. Use it to understand yourself better, communicate your needs, and work on your sense of security from within.`,
          },
          {
            id: 'ma-3',
            title: 'Hatred',
            body: `Hatred is a poison you drink hoping the other person will suffer. It binds you to the very thing you despise.\n\nUnderstanding hatred requires looking at the wound beneath it. What pain created this feeling? Can you hold space for that pain without letting it define you?\n\nThe antidote to hatred is not love — it's understanding.`,
          },
        ]
      }
    ]
  },

  ingenia: {
    id: 'ingenia',
    icon: '🤾',
    name: 'Ingenia et Virtutes',
    subtitle: 'Talents & Virtues',
    category: 'Self',
    color: '--color-ingenia',
    sections: [
      {
        title: '⚔️ Core Virtues',
        entries: [
          {
            id: 'ing-1',
            title: 'Courage',
            body: `The courage to think independently, to act for yourself, to create your own meaning. To get what you want.\n\nCourage is not the absence of fear — it's the decision that something else is more important than fear. It's the willingness to step into uncertainty because your values demand it.\n\nTrue courage is quiet. It's the voice at the end of the day that says, "I will try again tomorrow."`,
          },
          {
            id: 'ing-2',
            title: 'Discipline',
            body: `Discipline is the bridge between where you are and where you want to be. It's not punishment — it's self-respect in action.\n\nDiscipline means showing up when motivation fades. It means choosing the harder right over the easier wrong. It means being consistent, not perfect.\n\nThe disciplined mind is free because it has mastered itself.`,
          },
        ]
      }
    ]
  },

  philosophorum: {
    id: 'philosophorum',
    icon: '🤔',
    name: 'Philosophorum',
    subtitle: 'Philosophy',
    category: 'Mundo',
    color: '--color-philosophorum',
    sections: [
      {
        title: '📚 Philosophical Reflections',
        entries: [
          {
            id: 'phi-1',
            title: 'Marcel Proust — The Art of Seeing',
            body: `Meaning and beauty can be taken from becoming like a child. To appreciate the simple things and to look curiously at the world, to stop seeking stronger and stronger stimulants but to feel grateful for the smell of coffee or the shadow of a tree.\n\nArt shows us what that can be like. To escape the feeling of habit and routine, but to still find something new to enjoy every day.\n\nThe trick is to recover the powers of appreciation of a child.`,
          },
        ]
      }
    ]
  },

  sanctuaria: {
    id: 'sanctuaria',
    icon: '⛩',
    name: 'Sanctuaria',
    subtitle: 'Sacred Places',
    category: 'Journey',
    color: '--color-sanctuaria',
  }
};

// ── Religious Establishments Data ──
const RELIGIOUS_PLACES = [
  {
    name: "Zen met Madeleine",
    type: "Zen Buddhism",
    typeClass: "zen",
    price: "Unknown",
    notes: "Small-scale zen spot, warm setting. Cultural center. Rating 5.0 (5 reviews). Wed-Sat open.",
    address: "Boterdiep 111, 9712 LM Groningen",
    website: "https://zenmetmadeleine.nl"
  },
  {
    name: "Zen Meditatie Centrum Groningen",
    type: "Zen Buddhism",
    typeClass: "zen",
    price: "Donations",
    notes: "Founded by Tom van Dijk (5 years in Japanese Zen Temple). Quiet deepening atmosphere, small groups. Rating 5.0 (20 reviews). Mon-Fri 09:00-21:00.",
    address: "Nieuwstraat 106, 9724 KR Groningen",
    website: "https://zengroningen.nl"
  },
  {
    name: "Zen Boat — Meditation in Groningen",
    type: "Zen Buddhism",
    typeClass: "zen",
    price: "Unknown",
    notes: "Buddhist meditation center on a boat. Daily meditation (07:00-21:00 most days). Small devoted sangha. Rating 4.6.",
    address: "Winschoterdiep 1027, 9724 GT Groningen",
    website: "http://www.zenrivertemple.org/zen-river-boat-groningen/"
  },
  {
    name: "Vipassana Meditation Center",
    type: "Theravada Buddhism",
    typeClass: "theravada",
    price: "Donations (no fixed costs)",
    notes: "Active for 40 years, fully volunteer-run. Weekly meditation Wed 19:30-21:30, Sunday morning 10:00-12:30. English instructions available last Wednesday of the month.",
    address: "Kamerlingh Onnesstraat 71, 9727 HG Groningen",
    website: "https://www.vipassana-groningen.nl"
  },
  {
    name: "Zen.nl Groningen — Learn to Meditate",
    type: "Zen Buddhism",
    typeClass: "zen",
    price: "€42.50-€75/month",
    notes: "Modern zen center with courses. Introduction course €49.50-€75/month, advanced course €42.50-€69/month. Subsidy possible (80%). LGBTQ+ friendly. Online + physical.",
    address: "Nieuwe Ebbingestraat 56b, 9712 NM Groningen",
    website: "https://zen.nl/groningen"
  },
  {
    name: "Zen Spirit Groningen",
    type: "Zen Buddhism",
    typeClass: "zen",
    price: "Donations",
    notes: "Buddhist temple and meditation center, also group accommodation. Small groups for zen meditation and retreats.",
    address: "Kamerlingh Onnesstraat 71, 9727 HG Groningen",
    website: "https://dewerkschuur.nl"
  },
  {
    name: "Karma Kagyu Diamond Way",
    type: "Tibetan Buddhism",
    typeClass: "tibetan",
    price: "Free meditations, donations welcome",
    notes: "Karma Kagyu tradition. Tuesday 20:00 introduction + 16th Karmapa meditation. Weekly meditations free. Donations are tax-deductible. Rating 4.7.",
    address: "Petrus Hendrikszstraat 1, 9714 EA Groningen",
    website: "https://www.diamantweg-boeddhisme.nl/groningen/"
  },
  {
    name: "Tai Chi Groningen Zuanshi",
    type: "Tai Chi / Daoist",
    typeClass: "tai-chi",
    price: "Unknown",
    notes: "Tai Chi Tao, Qi Gong, Chinese Massage and TCM. Free trial lesson possible. Health and gentle martial arts.",
    address: "Het Hogeland / Usquert, Groningen Province",
    website: "https://tai-chi-groningen.weebly.com"
  },
  {
    name: "YIN LIFE — Yoga & Breathwork",
    type: "Yoga / Breathwork",
    typeClass: "yoga",
    price: "Unknown",
    notes: "Yoga, breathwork and inner work. Small-scale setting with personal guidance. Rating 4.9 (60 reviews). Mon-Fri 09:00-17:00.",
    address: "Zuiderpark 20, 9724 AH Groningen",
    website: "http://www.yinlife.nl"
  },
  {
    name: "Yun Hwa Dharma Sah Groningen",
    type: "Zen Buddhism",
    typeClass: "zen",
    price: "Unknown",
    notes: "Yun Hwa Sangha center for gathering and joint practice. Students of Supreme Matriarch Ji Kwang Dae Poep Sa Nim. Smaller community.",
    address: "Near Stadspark, cycling distance from center",
    website: "https://yunhwasangha.org/centers/groningen/"
  },
  {
    name: "ITCCA — Tai Chi Chuan School",
    type: "Tai Chi / Daoist",
    typeClass: "tai-chi",
    price: "Unknown",
    notes: "Traditional Tai Chi Chuan and Chi Kung. Meditative setting, internal martial arts. Good fit for Daoism interest.",
    address: "Groningen, Noorderplantsoen/center",
    website: "https://www.itcca.nl/groningen"
  },
  {
    name: "Elohim Centre",
    type: "Spiritual Center",
    typeClass: "spiritual",
    price: "Retreats",
    notes: "Spiritual center and living-work community. 'Power place' for Awakened Being and New Earth. Gardens, crystals, retreat feeling. Further away but interesting for multi-day experiences.",
    address: "Veelerveen, East Groningen Province",
    website: "https://hipsy.nl/elohim-centre"
  },
  {
    name: "MARGRET — Spiritual Life Coach",
    type: "Spiritual Center",
    typeClass: "spiritual",
    price: "Individual sessions",
    notes: "Spiritual life coach, grief & loss, medium sessions/trajectories. New insights and personal transformation. Rating 5.0 (134 reviews). Mon-Sat 10:00-16:00.",
    address: "Berkenlaan 121f, 9741 JL Groningen",
    website: "http://www.margretcoaching.com"
  },
  {
    name: "Bureau de Bezieling",
    type: "Spiritual Center",
    typeClass: "spiritual",
    price: "Individual sessions",
    notes: "Paranormal medium and coach. Spiritual guidance. Open, warm and loving approach. Rating 4.7 (21 reviews). Mon-Fri open.",
    address: "Orchideestraat 177, 9731 GG Groningen",
    website: "http://www.bureaudebezieling.nl"
  },
  {
    name: "De Poort — Center for Spirituality",
    type: "Spiritual Center",
    typeClass: "spiritual",
    price: "Per activity",
    notes: "Monastery with activities around deepening, Christian mysticism, zen, yoga, tai chi, mandalas. Small groups, exchange. Combines traditions.",
    address: "Moesstraat (monastery), Groningen",
    website: ""
  },
  {
    name: "Pauli van Engelen — Meditation & Inner Growth",
    type: "Spiritual Center",
    typeClass: "spiritual",
    price: "Unknown",
    notes: "Meditation center for inner growth, retreats and spiritual psychology training. Available 24/7. Rating 5.0 (10 reviews).",
    address: "Noorderhaven 32, 9712 VK Groningen",
    website: "https://www.meditatie-en-innerlijke-groei.nl"
  },
  {
    name: "Yantra",
    type: "Spiritual Shop",
    typeClass: "shop",
    price: "Shop (no membership)",
    notes: "Spiritual shop with books, incense, statues, stones from Buddhist/Hindu/esoteric traditions. Community atmosphere, like-minded people. Rating 4.6 (303 reviews). Tue-Sat open.",
    address: "Oude Ebbingestraat 61, 9712 HD Groningen",
    website: "http://www.yantra.nl"
  },
  {
    name: "Adelea — Esoteric Webshop",
    type: "Spiritual Shop",
    typeClass: "shop",
    price: "Shop (no membership)",
    notes: "Esoteric shop (physical + online) around spirituality, crystals, ritual items. LGBTQ+ friendly. Rating 4.8 (14 reviews). Mon-Fri 09:00-17:00.",
    address: "Wasaweg 11-2, 9723 JD Groningen",
    website: "https://esoterischewebwinkel.nl"
  },
  {
    name: "Oosterkerk",
    type: "Protestant Church",
    typeClass: "protestant",
    price: "Free (donations welcome)",
    notes: "Protestant neighborhood church with diverse activities. Accessible atmosphere. Services Sun 09:30, weekday gatherings. Wheelchair accessible. Rating 4.5 (81 reviews).",
    address: "E. Thomassen à Thuessinklaan 1, 9713 JP Groningen",
    website: "https://www.oosterkerkgroningen.nl"
  },
  {
    name: "De Fontein",
    type: "Protestant Church",
    typeClass: "protestant",
    price: "Free (donations welcome)",
    notes: "Protestant church with modern appearance. Spacious, very friendly people. Neighborhood-oriented and community-focused. Wheelchair accessible. Rating 4.3 (16 reviews).",
    address: "Eikenlaan 255, 9741 EZ Groningen",
    website: "https://defontein.info"
  },
  {
    name: "Martinikerk",
    type: "Protestant Church",
    typeClass: "protestant",
    price: "Free (donations welcome)",
    notes: "Historic protestant church with large baroque organ. Many cultural evenings, concerts, moments of silence. Open daily 10:00-22:00. Impressive space. Rating 4.6 (1097 reviews).",
    address: "Martinikerkhof 3, 9712 JG Groningen",
    website: "http://www.martinikerk.nl"
  },
  {
    name: "Sint Martinusparochie Groningen",
    type: "Catholic Church",
    typeClass: "catholic",
    price: "Free (donations welcome)",
    notes: "Catholic cathedral. Services Sat 08:30, 16:30 and Sun 10:30, 16:00. Active faith community, volunteer work. Wheelchair accessible. Rating 4.7 (376 reviews).",
    address: "Radesingel 4, 9711 EJ Groningen",
    website: "https://www.stmartinusparochie.nl"
  },
  {
    name: "Pelstergasthuiskerk",
    type: "Protestant Church",
    typeClass: "protestant",
    price: "Free (donations welcome)",
    notes: "Small historic protestant church in city center. Concerts and contemplation moments. Intimate, atmospheric setting. Rating 4.6 (20 reviews).",
    address: "Pelsterstraat 39, 9711 KJ Groningen",
    website: "http://www.waalsekerkgroningen.nl"
  },
  {
    name: "Nieuwe Kerk",
    type: "Protestant Church",
    typeClass: "protestant",
    price: "Free (donations welcome)",
    notes: "Protestant church with friendly congregation. Open and welcoming to new people. Open daily 10:00-17:00. Rating 4.4 (274 reviews).",
    address: "Nieuwe Kerkhof 1, 9712 PT Groningen",
    website: "http://nieuwekerkgroningen.nl"
  },
  {
    name: "Vineyard Groningen",
    type: "Protestant Church",
    typeClass: "protestant",
    price: "Free (donations welcome)",
    notes: "International, multicultural, English-speaking church. Various nationalities and denominations. Prayer weeks and activities at 'De Bloeiplaats - Modernday Monastery'. Small community, lots of eating/talking/studying together.",
    address: "Jeruzalemkerk, Groningen",
    website: "https://vineyardgroningen.com"
  },
  {
    name: "Grace Church Groningen",
    type: "Anglican Church",
    typeClass: "anglican",
    price: "Free (donations welcome)",
    notes: "International Anglican congregation (since 2012). English-language services 2nd Sun 10:30 (Service of the Word) and 4th Sun 10:30 (Holy Communion), Sep-Jun. Prayer groups, Bible studies, social activities. Small community-focused congregation.",
    address: "Witte de Withstraat 2, Groningen",
    website: "https://gracechurchgroningen.com"
  },
];

// ── App State ──
const state = {
  currentView: 'home',
  currentPillar: null,
  currentEntry: null,
  meditatio: {
    active: false,
    index: 0,
  },
  sanctuariaFilter: 'All',
  userEntries: JSON.parse(localStorage.getItem('bonum-user-entries') || '[]'),
};

// ── Helper: Get all wisdom entries flat ──
function getAllEntries() {
  const entries = [];
  Object.values(PILLARS).forEach(pillar => {
    if (pillar.sections) {
      pillar.sections.forEach(section => {
        section.entries.forEach(entry => {
          entries.push({ ...entry, pillarId: pillar.id, pillarName: pillar.name, pillarIcon: pillar.icon });
        });
      });
    }
  });
  // Add user entries
  state.userEntries.forEach(entry => {
    entries.push(entry);
  });
  return entries;
}

// ── Helper: Get greeting based on time ──
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return { label: 'Late Night', title: 'Reflect & Rest' };
  if (hour < 12) return { label: 'Good Morning', title: 'Begin with Wisdom' };
  if (hour < 17) return { label: 'Good Afternoon', title: 'Stay Present' };
  if (hour < 21) return { label: 'Good Evening', title: 'Wind Down Gently' };
  return { label: 'Good Night', title: 'Find Your Peace' };
}

// ── Helper: Get daily wisdom ──
function getDailyWisdom() {
  const entries = getAllEntries();
  if (entries.length === 0) return null;
  // Use date as seed for "daily" consistency
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % entries.length;
  return entries[index];
}

// ── Helper: Get pillar entry count ──
function getEntryCount(pillar) {
  if (!pillar.sections) return 0;
  let count = 0;
  pillar.sections.forEach(s => count += s.entries.length);
  // Add user entries for this pillar
  count += state.userEntries.filter(e => e.pillarId === pillar.id).length;
  return count;
}

// ── Helper: Get type class for places ──
function getTypeClass(type) {
  const map = {
    'Zen Buddhism': 'zen',
    'Tibetan Buddhism': 'tibetan',
    'Theravada Buddhism': 'theravada',
    'Tai Chi / Daoist': 'tai-chi',
    'Yoga / Breathwork': 'yoga',
    'Spiritual Center': 'spiritual',
    'Spiritual Shop': 'shop',
    'Protestant Church': 'protestant',
    'Catholic Church': 'catholic',
    'Anglican Church': 'anglican',
  };
  return map[type] || 'spiritual';
}

// ── Helper: Get unique place types ──
function getPlaceTypes() {
  const types = new Set(RELIGIOUS_PLACES.map(p => p.type));
  return ['All', ...Array.from(types)];
}

// ── Render: Home View ──
function renderHome() {
  const greeting = getGreeting();
  const daily = getDailyWisdom();
  const pillarKeys = Object.keys(PILLARS);

  let html = `
    <div class="home-greeting animate-in">
      <div class="greeting-label">${greeting.label}</div>
      <div class="greeting-title">${greeting.title}</div>
    </div>
  `;

  if (daily) {
    const preview = daily.body.split('\n')[0].substring(0, 120) + (daily.body.length > 120 ? '…' : '');
    html += `
      <div class="daily-wisdom glass-panel animate-in stagger-1" onclick="openMeditatio()">
        <div class="wisdom-eyebrow">
          <span class="dot"></span>
          Daily Reflection
        </div>
        <div class="wisdom-quote">"${preview}"</div>
        <div class="wisdom-source">— ${daily.pillarName}</div>
        <div class="wisdom-glow"></div>
      </div>
    `;
  }

  html += `
    <div class="section-header animate-in stagger-2">
      <div class="section-title">Pillars of Wisdom</div>
    </div>
    <div class="pillars-grid">
  `;

  pillarKeys.forEach((key, i) => {
    const p = PILLARS[key];
    const count = key === 'sanctuaria' ? RELIGIOUS_PLACES.length : getEntryCount(p);
    const isFullWidth = key === 'sanctuaria';
    
    html += `
      <div class="pillar-card glass-panel animate-in stagger-${i + 3} ${isFullWidth ? 'full-width' : ''}" 
           data-pillar="${p.id}" 
           onclick="openPillar('${key}')">
        <span class="pillar-icon">${p.icon}</span>
        ${isFullWidth ? '<div class="pillar-info">' : ''}
        <div>
          <div class="pillar-name">${p.name}</div>
          <div class="pillar-subtitle">${p.subtitle}</div>
          <div class="pillar-count">${count} ${key === 'sanctuaria' ? 'places' : 'entries'}</div>
        </div>
        ${isFullWidth ? '</div>' : ''}
        <div class="pillar-glow"></div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// ── Render: Pillar Detail ──
function renderPillarDetail(pillarKey) {
  const pillar = PILLARS[pillarKey];
  if (!pillar) return '<div class="empty-state"><span class="empty-icon">🔍</span><div class="empty-text">Pillar not found</div></div>';

  if (pillarKey === 'sanctuaria') {
    return renderSanctuaria();
  }

  let html = `
    <div class="pillar-header animate-in">
      <span class="pillar-icon-large">${pillar.icon}</span>
      <div class="pillar-title">${pillar.name}</div>
      <span class="pillar-category-badge">${pillar.category}</span>
    </div>
  `;

  if (pillar.sections) {
    pillar.sections.forEach((section, si) => {
      html += `
        <div class="subsection-header animate-in stagger-${si + 1}">
          <span class="subsection-title">${section.title}</span>
        </div>
      `;
      section.entries.forEach((entry, ei) => {
        const preview = entry.body.split('\n').filter(l => l.trim()).slice(0, 2).join(' ').substring(0, 100) + '…';
        html += `
          <div class="entry-card glass-panel animate-in stagger-${si + ei + 2}" 
               onclick="openEntry('${pillarKey}', '${entry.id}')">
            <div class="entry-title">${entry.title}</div>
            <div class="entry-preview">${preview}</div>
            <div class="entry-meta">
              <span class="entry-tag">${pillar.category}</span>
            </div>
          </div>
        `;
      });
    });
  }

  // User entries for this pillar
  const userEntries = state.userEntries.filter(e => e.pillarId === pillarKey);
  if (userEntries.length > 0) {
    html += `
      <div class="subsection-header animate-in">
        <span class="subsection-title">✍️ Your Entries</span>
      </div>
    `;
    userEntries.forEach((entry, i) => {
      const preview = entry.body.substring(0, 100) + '…';
      html += `
        <div class="entry-card glass-panel animate-in stagger-${i + 1}" 
             onclick="openUserEntry('${entry.id}')">
          <div class="entry-title">${entry.title}</div>
          <div class="entry-preview">${preview}</div>
          <div class="entry-meta">
            <span class="entry-tag">Personal</span>
          </div>
        </div>
      `;
    });
  }

  return html;
}

// ── Render: Sanctuaria (Religious Places) ──
function renderSanctuaria() {
  const types = getPlaceTypes();
  const filtered = state.sanctuariaFilter === 'All' 
    ? RELIGIOUS_PLACES 
    : RELIGIOUS_PLACES.filter(p => p.type === state.sanctuariaFilter);

  let html = `
    <div class="pillar-header animate-in">
      <span class="pillar-icon-large">⛩</span>
      <div class="pillar-title">Sanctuaria</div>
      <span class="pillar-category-badge">A Religious Journey — Groningen</span>
    </div>
    <div class="sanctuaria-filters animate-in stagger-1">
  `;

  types.forEach(type => {
    const isActive = state.sanctuariaFilter === type;
    const label = type === 'All' ? 'All' : type.replace(' / ', '/');
    html += `<button class="filter-chip ${isActive ? 'active' : ''}" onclick="filterSanctuaria('${type}')">${label}</button>`;
  });

  html += `</div>`;

  filtered.forEach((place, i) => {
    html += `
      <div class="place-card glass-panel animate-in stagger-${Math.min(i + 2, 7)}">
        <span class="place-type-badge ${place.typeClass}">${place.type}</span>
        <div class="place-name">${place.name}</div>
        <div class="place-address">
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${place.address}
        </div>
        <div class="place-notes">${place.notes}</div>
        <div class="place-footer">
          <span class="place-price">${place.price}</span>
          ${place.website ? `<a href="${place.website}" target="_blank" rel="noopener" class="place-link" onclick="event.stopPropagation()">
            Visit
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>` : ''}
        </div>
      </div>
    `;
  });

  if (filtered.length === 0) {
    html += `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <div class="empty-text">No places found for this category</div>
      </div>
    `;
  }

  return html;
}

// ── Render: Entry Detail ──
function renderEntryDetail(pillarKey, entryId) {
  const pillar = PILLARS[pillarKey];
  if (!pillar || !pillar.sections) return '';

  let entry = null;
  for (const section of pillar.sections) {
    entry = section.entries.find(e => e.id === entryId);
    if (entry) break;
  }

  if (!entry) {
    // Check user entries
    entry = state.userEntries.find(e => e.id === entryId);
  }

  if (!entry) return '<div class="empty-state"><span class="empty-icon">🔍</span><div class="empty-text">Entry not found</div></div>';

  // Format body text with paragraphs
  const bodyHtml = formatBody(entry.body);

  return `
    <div class="entry-detail animate-in">
      <div class="entry-detail-title">${entry.title}</div>
      <div class="entry-detail-body">${bodyHtml}</div>
    </div>
  `;
}

// ── Helper: Format body text ──
function formatBody(text) {
  if (!text) return '';
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split('\n\n');
  
  return paragraphs.map(p => {
    // Check for list items
    if (p.includes('\n•') || p.startsWith('•')) {
      const lines = p.split('\n');
      let html = '';
      let inList = false;
      
      lines.forEach(line => {
        if (line.startsWith('•')) {
          if (!inList) { html += '<ul>'; inList = true; }
          html += `<li>${line.substring(1).trim()}</li>`;
        } else {
          if (inList) { html += '</ul>'; inList = false; }
          if (line.trim()) html += `<p>${line}</p>`;
        }
      });
      if (inList) html += '</ul>';
      return html;
    }
    
    // Check for quote (starts with ")
    if (p.startsWith('"') || p.startsWith('"')) {
      return `<blockquote>${p}</blockquote>`;
    }
    
    // Check for emoji headers
    if (/^[🌱🎨🧠🦶👀🛠💬🙏⚔️📚🌈💢⚡]/u.test(p)) {
      const lines = p.split('\n');
      const title = lines[0];
      const rest = lines.slice(1).join('\n');
      return `<h3>${title}</h3>${rest ? `<p>${rest}</p>` : ''}`;
    }
    
    // Regular paragraph
    if (p.trim()) {
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }
    return '';
  }).join('');
}

// ── Navigation ──
function navigateTo(view, updateNav = true) {
  const contentEl = document.getElementById('main-content');
  const navBack = document.getElementById('nav-back');
  const navTitle = document.getElementById('nav-title');

  // Fade out
  contentEl.style.opacity = '0';
  contentEl.style.transform = 'translateY(8px)';

  setTimeout(() => {
    state.currentView = view;
    let html = '';

    switch (view) {
      case 'home':
        html = renderHome();
        navTitle.textContent = 'Bonum';
        navBack.classList.remove('visible');
        setActiveTab('home');
        break;
      case 'pillar':
        html = renderPillarDetail(state.currentPillar);
        navTitle.textContent = PILLARS[state.currentPillar]?.name || '';
        navBack.classList.add('visible');
        break;
      case 'entry':
        html = renderEntryDetail(state.currentPillar, state.currentEntry);
        navTitle.textContent = '';
        navBack.classList.add('visible');
        break;
    }

    contentEl.innerHTML = html;
    
    // Fade in
    requestAnimationFrame(() => {
      contentEl.style.opacity = '1';
      contentEl.style.transform = 'translateY(0)';
    });
  }, 150);
}

function openPillar(key) {
  state.currentPillar = key;
  state.sanctuariaFilter = 'All';
  navigateTo('pillar');
}

function openEntry(pillarKey, entryId) {
  state.currentPillar = pillarKey;
  state.currentEntry = entryId;
  navigateTo('entry');
}

function openUserEntry(entryId) {
  const entry = state.userEntries.find(e => e.id === entryId);
  if (entry) {
    state.currentPillar = entry.pillarId;
    state.currentEntry = entryId;
    navigateTo('entry');
  }
}

function goBack() {
  if (state.currentView === 'entry') {
    navigateTo('pillar');
  } else {
    state.currentPillar = null;
    state.currentEntry = null;
    navigateTo('home');
  }
}

function setActiveTab(tab) {
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const active = document.querySelector(`.tab-item[data-tab="${tab}"]`);
  if (active) active.classList.add('active');
}

// ── Sanctuaria Filter ──
function filterSanctuaria(type) {
  state.sanctuariaFilter = type;
  const contentEl = document.getElementById('main-content');
  contentEl.innerHTML = renderSanctuaria();
}

// ── Meditatio Mode ──
function openMeditatio() {
  const entries = getAllEntries();
  if (entries.length === 0) return;
  
  state.meditatio.active = true;
  state.meditatio.index = Math.floor(Math.random() * entries.length);
  
  const overlay = document.getElementById('meditatio-overlay');
  overlay.classList.add('active');
  renderMeditatio();
  setActiveTab('meditatio');
}

function closeMeditatio() {
  state.meditatio.active = false;
  const overlay = document.getElementById('meditatio-overlay');
  overlay.classList.remove('active');
  setActiveTab('home');
}

function nextMeditatio() {
  const entries = getAllEntries();
  state.meditatio.index = (state.meditatio.index + 1) % entries.length;
  renderMeditatio();
}

function prevMeditatio() {
  const entries = getAllEntries();
  state.meditatio.index = (state.meditatio.index - 1 + entries.length) % entries.length;
  renderMeditatio();
}

function renderMeditatio() {
  const entries = getAllEntries();
  const entry = entries[state.meditatio.index];
  if (!entry) return;

  const quote = entry.body.split('\n').filter(l => l.trim() && !l.startsWith('•'))[0] || entry.body.substring(0, 150);
  const displayQuote = quote.length > 180 ? quote.substring(0, 180) + '…' : quote;

  document.getElementById('meditatio-quote').textContent = `"${displayQuote}"`;
  document.getElementById('meditatio-quote').style.animation = 'none';
  requestAnimationFrame(() => {
    document.getElementById('meditatio-quote').style.animation = 'quoteIn 0.8s var(--ease-out-expo)';
  });
  document.getElementById('meditatio-source').textContent = `— ${entry.pillarName || 'Bonum'} · ${entry.title}`;

  // Update dots
  const dotsContainer = document.getElementById('meditatio-dots');
  const totalDots = Math.min(entries.length, 8);
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalDots; i++) {
    const dot = document.createElement('div');
    dot.className = `meditatio-dot ${i === state.meditatio.index % totalDots ? 'active' : ''}`;
    dotsContainer.appendChild(dot);
  }
}

// ── Add Entry Modal ──
function openAddModal() {
  document.getElementById('add-modal').classList.add('active');
}

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('active');
}

function saveEntry() {
  const title = document.getElementById('entry-title-input').value.trim();
  const body = document.getElementById('entry-body-input').value.trim();
  const pillarId = document.getElementById('entry-pillar-select').value;

  if (!title || !body) {
    showToast('Please fill in title and content');
    return;
  }

  const pillar = PILLARS[pillarId];
  const newEntry = {
    id: 'user-' + Date.now(),
    title,
    body,
    pillarId,
    pillarName: pillar?.name || 'Unknown',
    pillarIcon: pillar?.icon || '📝',
    createdAt: new Date().toISOString(),
  };

  state.userEntries.push(newEntry);
  localStorage.setItem('bonum-user-entries', JSON.stringify(state.userEntries));

  // Reset form
  document.getElementById('entry-title-input').value = '';
  document.getElementById('entry-body-input').value = '';
  closeAddModal();
  showToast('Wisdom saved ✨');

  // Refresh view
  if (state.currentView === 'home') {
    navigateTo('home');
  } else if (state.currentView === 'pillar' && state.currentPillar === pillarId) {
    navigateTo('pillar');
  }
}

// ── Toast ──
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ── Search View ──
function openSearch() {
  const contentEl = document.getElementById('main-content');
  const navBack = document.getElementById('nav-back');
  const navTitle = document.getElementById('nav-title');

  navTitle.textContent = 'Search';
  navBack.classList.add('visible');
  state.currentView = 'search';

  contentEl.innerHTML = `
    <div class="search-container animate-in">
      <div class="search-input-wrapper">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" class="search-input" id="search-field" placeholder="Search your wisdom…" oninput="handleSearch(this.value)" autofocus>
      </div>
    </div>
    <div id="search-results"></div>
  `;
}

function handleSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!query.trim()) {
    resultsEl.innerHTML = '';
    return;
  }

  const q = query.toLowerCase();
  const entries = getAllEntries();
  const matches = entries.filter(e => 
    e.title.toLowerCase().includes(q) || 
    e.body.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    resultsEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <div class="empty-text">No results for "${query}"</div>
      </div>
    `;
    return;
  }

  let html = '';
  matches.forEach((entry, i) => {
    const preview = entry.body.split('\n').filter(l => l.trim())[0]?.substring(0, 100) + '…';
    html += `
      <div class="entry-card glass-panel animate-in stagger-${Math.min(i + 1, 7)}" 
           onclick="openEntry('${entry.pillarId}', '${entry.id}')">
        <div class="entry-title">${entry.pillarIcon || '📝'} ${entry.title}</div>
        <div class="entry-preview">${preview}</div>
        <div class="entry-meta">
          <span class="entry-tag">${entry.pillarName}</span>
        </div>
      </div>
    `;
  });

  resultsEl.innerHTML = html;
}

// ── Tab Navigation ──
function handleTab(tab) {
  switch (tab) {
    case 'home':
      state.currentPillar = null;
      state.currentEntry = null;
      navigateTo('home');
      break;
    case 'meditatio':
      openMeditatio();
      break;
    case 'add':
      openAddModal();
      break;
    case 'search':
      openSearch();
      break;
  }
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  // Add transition style to main content
  const contentEl = document.getElementById('main-content');
  contentEl.style.transition = 'opacity 150ms ease, transform 150ms ease';

  navigateTo('home');
});
