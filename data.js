/* LAUNCH ROOM · Boardroom Wars: The EV Race — Sample Play
   data.js — ALL content lives here (cases, seat cards, questions, personas).
   Classroom simulation · cases simplified from public reports. */
window.LR_DATA = (function () {
  var STAGES = ['Basic research', 'Applied research', 'Development', 'Technology enhancement'];
  var STAGE_SHORT = ['BR', 'AR', 'DEV', 'TE'];
  var ROUTES = ['Own use', 'Contract out', 'Joint venture', 'License out'];
  var SEATS = [
    { id: 'CTO', label: 'CTO' },
    { id: 'CMO', label: 'CMO' },
    { id: 'CFO', label: 'CFO' },
    { id: 'ALLY', label: 'Alliances head' }
  ];
  /* one factor -> seat map, used everywhere (deciding card) */
  var FACTOR_SEAT = { urgency: 'CMO', lifecycle: 'CMO', category: 'CTO', standing: 'CTO', commitment: 'CFO', support: 'ALLY' };
  var FACTOR_LABEL = {
    urgency: 'Urgency', lifecycle: 'Life-cycle position', category: 'Category', standing: 'Technological standing',
    commitment: 'Commitment', support: 'Need for support technologies'
  };
  var KHALIL_STAGE = 'Khalil pp.306–307';

  var COMPANIES = [
    {
      id: 'ather', name: 'Ather Energy', short: 'ATHER', when: '9 Aug 2021', verify: false,
      card: 'Bengaluru e-scooter maker; its 450X and 450 Plus fast-charge on Ather’s own public network of 200+ chargers.',
      plug: { role: 'owner', side: 'LECCS', lean: 'LECCS' },
      natureLicenseOut: true,
      fits: { LO: ['ultraviolette', 'tvs', 'yulu', 'bajaj', 'sun', 'indianoil', 'exide'], LI: [], CM: ['exide'], MF: [], JV: [] },
      seats: {
        CTO: 'Our connector is proprietary, designed in-house for the 450 — we could make it open.',
        CMO: 'We are already in talks with multiple makers about our connector.',
        CFO: 'Opening it means no fees; a small team would help others integrate it.',
        ALLY: 'Our public network gains when other makers’ scooters can plug in.'
      },
      m1: {
        q: '9 Aug 2021 — what stage is Ather’s fast-charging connector at?',
        key: 3, near: 2, decider: 'CTO', votes: { CTO: 3, CMO: 2, CFO: 2, ALLY: 3 },
        why: 'Already on the 450 and 200+ chargers — improving a working technology is technology enhancement (' + KHALIL_STAGE + ').',
        real: 'The connector was already in use on the 450 and Ather’s 200+ public chargers.'
      },
      m2: {
        q: 'Ather’s connector: how should the board exploit it?',
        options: ROUTES.slice(), key: 3, partial: 2, keepOpt: 0, decider: 'CMO', factor: 'urgency',
        stances: { CTO: 'KEEP', CMO: 'SHARE', CFO: 'SHARE', ALLY: 'SHARE' },
        readings: { CTO: 'Category · proprietary', CMO: 'Urgency · highest', CFO: 'Commitment · lowest', ALLY: 'Application · widest' },
        why: 'High standing, highest urgency, widest application, lowest commitment: license out widely (Khalil Fig. 10-2 p.305; urgency rule p.306). JVC licensed VHS widely and beat Betamax (White & Bruton p.208).',
        src: 'Khalil Fig. 10-2 p.305; p.306',
        real: 'Opened it free (‘not a penny’); Hero’s Vida adopted it (Oct 2022); BIS made it the LECCS standard (Oct 2023); joint Hero–Ather network of 1,900+ points (Dec 2023).'
      },
      m3: {
        whatif: 'A rival plug alliance launches to sign makers.', factor: 'urgency',
        options: ['Keep: License out', 'Switch: Own use', 'Switch: Joint venture'], key: 0, partial: null, decider: 'CMO',
        cards: {
          CTO: { t: 'A rival alliance proves plugs matter — close ours and protect it.', s: 'SWITCH' },
          CMO: { t: 'Urgency just went up: sign makers faster, keep licensing out.', s: 'KEEP' },
          CFO: { t: 'A single JV partner could fund more chargers.', s: 'SWITCH' },
          ALLY: { t: 'Makers already on board would be confused by a U-turn.', s: 'KEEP' }
        },
        why: 'Urgency rises further — keep licensing out widely (urgency rule p.306; VHS lesson, White & Bruton p.208).',
        next: 'Bharat Charge Alliance launched Apr 2024 backing Type 6.'
      }
    },
    {
      id: 'ultraviolette', name: 'Ultraviolette', short: 'ULTRAVIOLETTE', when: '15 Mar 2024', verify: false,
      card: 'Bengaluru maker of the F77 electric motorcycle (launched Nov 2022); TVS, Exor and Zoho are investors.',
      plug: { role: 'owner', side: 'TYPE6', lean: 'TYPE6' },
      natureLicenseOut: false,
      fits: { LO: [], LI: ['ather'], CM: ['exide'], MF: [], JV: ['tvs'] },
      seats: {
        CTO: 'Battery architecture and thermal management are ours, built in-house.',
        CMO: 'Our top F77 claims 300 km; the rival LECCS plug got BIS approval in Oct 2023.',
        CFO: 'Phase 1 plans 100+ of our own fast-charging stations, with HPCL fuel pumps in 12 states.',
        ALLY: 'The rival LECCS network already spans 100 cities and 1,900+ points.'
      },
      m1: {
        q: '15 Mar 2024 — what stage is Ultraviolette’s fast-charging network at?',
        key: 2, near: 3, decider: 'CFO', votes: { CTO: 2, CMO: 3, CFO: 2, ALLY: 3 },
        why: 'Its first network — turning know-how into a new product system is development, the link to commercial use (' + KHALIL_STAGE + ').',
        real: 'SUPERNOVA Type-6 chargers were its first network (Mar 2024).'
      },
      m2: {
        q: 'Ultraviolette’s Type-6 chargers: how should the board exploit them?',
        options: ROUTES.slice(), key: 0, partial: 1, keepOpt: 0, decider: 'CTO', factor: 'category',
        stances: { CTO: 'KEEP', CMO: 'SHARE', CFO: 'KEEP', ALLY: 'SHARE' },
        readings: { CTO: 'Category · most distinctive', CMO: 'Urgency · rival approved', CFO: 'Commitment · highest', ALLY: 'Standing · low in charging' },
        why: 'Low standing in charging, most distinctive product, highest commitment, narrowest application (F77 only): employ it in your own products (Fig. 10-2 own-use row).',
        src: 'Khalil Fig. 10-2 p.305',
        real: 'Launched SUPERNOVA Type-6 chargers (Mar 2024), at first compatible only with the F77.'
      },
      m3: {
        whatif: 'A Type-6 alliance offers its chargers to your riders.', factor: 'support',
        options: ['Keep: Own use', 'Switch: Joint venture (alliance)', 'Switch: License out'], key: 1, partial: null, decider: 'ALLY',
        cards: {
          CTO: { t: 'Our chargers were built for the F77 — keep them ours.', s: 'KEEP' },
          CMO: { t: 'Our brand is about being distinct — stay exclusive.', s: 'KEEP' },
          CFO: { t: 'Building every station alone is a heavy commitment.', s: 'SWITCH' },
          ALLY: { t: 'We lack charging sites; an alliance brings the support we need.', s: 'SWITCH' }
        },
        why: 'High need for support technologies (sites, chargers) points to the JV/alliance row (Fig. 10-2 p.305).',
        next: ''
      }
    },
    {
      id: 'tvs', name: 'TVS Motor', short: 'TVS', when: '25 Jan 2020', verify: false,
      card: 'Two-wheeler maker launching its first electric scooter, the iQube Electric, in Bengaluru; battery packs built at Hosur.',
      plug: { role: 'chooser', side: null, lean: 'TYPE6' },
      natureLicenseOut: false,
      fits: { LO: [], LI: ['ather'], CM: ['exide'], MF: [], JV: ['ultraviolette'] },
      seats: {
        CTO: 'Our SmartXonnect platform is proprietary; pack and battery-management system are designed and made in-house.',
        CMO: 'We start in one city — we are not into claiming big numbers.',
        CFO: 'The iQube project began about four years before launch.',
        ALLY: 'Bosch supplies the hub motor and LG the cells; we install home chargers.'
      },
      m1: {
        q: '25 Jan 2020 — what stage is TVS’s electric-scooter technology at?',
        key: 2, near: 3, decider: 'CFO', votes: { CTO: 2, CMO: 3, CFO: 2, ALLY: 3 },
        why: 'Its first electric scooter, years in the making — development (' + KHALIL_STAGE + ').',
        real: 'The iQube Electric launched in Bengaluru as TVS’s first electric scooter.'
      },
      m2: {
        q: 'The iQube platform: how should the board exploit it?',
        options: ROUTES.slice(), key: 0, partial: 1, keepOpt: 0, decider: 'CTO', factor: 'category',
        stances: { CTO: 'KEEP', CMO: 'KEEP', CFO: 'KEEP', ALLY: 'SHARE' },
        readings: { CTO: 'Category · most distinctive', CMO: 'Urgency · lowest', CFO: 'Commitment · highest', ALLY: 'Support · suppliers exist' },
        why: 'Most distinctive platform, highest commitment, lowest urgency, narrowest application: own use (Fig. 10-2).',
        src: 'Khalil Fig. 10-2 p.305',
        real: 'Launched iQube in-house; by Oct 2023 TVS also co-developed and built BMW’s CE 02.'
      },
      m3: {
        whatif: 'A subsidy cut raises your scooter’s price.', factor: 'commitment',
        options: ['Keep: Own use', 'Switch: Joint venture', 'Switch: Contract out'], key: 0, partial: 1, decider: 'CFO',
        cards: {
          CTO: { t: 'Our platform is still ours — a partner would dilute it.', s: 'KEEP' },
          CMO: { t: 'A pricier scooter needs a partner to share costs.', s: 'SWITCH' },
          CFO: { t: 'We are already committed for years; stay the course and absorb it.', s: 'KEEP' },
          ALLY: { t: 'A JV could cut costs through shared parts.', s: 'SWITCH' }
        },
        why: 'Commitment is already made and the platform is distinctive — keep own use; a JV is only partly right (Fig. 10-2).',
        next: 'FAME-II subsidy cut, 1 Jun 2023.'
      }
    },
    {
      id: 'yulu', name: 'Yulu', short: 'YULU', when: '27 Feb 2023', verify: false,
      card: 'Shared electric-mobility operator; its fleet runs on swappable batteries from Yuma Energy, its JV with Magna.',
      plug: { role: 'neutral', side: null, lean: 'NEUTRAL', note: 'swapping' },
      natureLicenseOut: false,
      fits: { LO: [], LI: ['ather', 'sun'], CM: ['bajaj'], MF: [], JV: ['sun', 'indianoil'] },
      seats: {
        CTO: 'We bring an AI-led technology stack; earlier e-bikes came from Chinese makers.',
        CMO: 'Target: 100,000 e-bikes by end-2023.',
        CFO: 'Magna committed US$77 million in Sep 2022.',
        ALLY: 'Bajaj would do the R&D and be our exclusive manufacturer.'
      },
      m1: {
        q: '27 Feb 2023 — what stage are Yulu’s e-bikes at?',
        key: 3, near: 2, decider: 'CTO', votes: { CTO: 3, CMO: 2, CFO: 2, ALLY: 3 },
        why: 'Third-generation vehicles improve an existing technology — technology enhancement (' + KHALIL_STAGE + ').',
        real: 'The new platform was Yulu’s third generation of vehicles.'
      },
      m2: {
        q: 'Yulu’s next-generation vehicles: how should the board get them built?',
        options: ROUTES.slice(), key: 1, partial: 2, keepOpt: 0, decider: 'ALLY', factor: 'support',
        stances: { CTO: 'KEEP', CMO: 'SHARE', CFO: 'KEEP', ALLY: 'SHARE' },
        readings: { CTO: 'Standing · low in vehicle R&D', CMO: 'Urgency · high', CFO: 'Commitment · funded', ALLY: 'Support · high need' },
        why: 'Lower standing in vehicle R&D, high urgency, high need for support technologies: contract out manufacture (Fig. 10-2 contract-out row).',
        src: 'Khalil Fig. 10-2 p.305',
        real: 'Bajaj does R&D and exclusive manufacturing; Chetak Technology rolls out the vehicles.'
      },
      m3: {
        whatif: 'New battery-safety rules add BMS and traceability requirements.', factor: 'support',
        options: ['Keep: Contract out', 'Switch: Own use', 'Switch: Joint venture'], key: 0, partial: null, decider: 'ALLY',
        cards: {
          CTO: { t: 'New rules need new BMS work — maybe build in-house now.', s: 'SWITCH' },
          CMO: { t: 'Fleet growth cannot pause for a rebuild.', s: 'KEEP' },
          CFO: { t: 'A JV would share the cost of compliance.', s: 'SWITCH' },
          ALLY: { t: 'More support technologies needed — exactly why we keep contracting out.', s: 'KEEP' }
        },
        why: 'The need for support technologies goes up, not down — keep contracting out (Fig. 10-2 contract-out row).',
        next: 'AIS-156 Amendment 3, Sep 2022.'
      }
    },
    {
      id: 'bajaj', name: 'Bajaj Auto', short: 'BAJAJ', when: '27 Feb 2023', verify: false, mirrorOf: 'Yulu',
      card: 'Pune maker whose electric Chetak has been on sale since Jan 2020; new Akurdi EV plant (500,000 a year).',
      plug: { role: 'chooser', side: null, lean: 'LECCS' },
      natureLicenseOut: false,
      fits: { LO: [], LI: ['ather', 'sun'], CM: ['exide'], MF: ['yulu'], JV: ['sun', 'indianoil'] },
      seats: {
        CTO: 'Our strong R&D built the electric Chetak; the R&D centre sits beside the Akurdi plant.',
        CMO: '14,000+ Chetaks sold and 16,000+ bookings pending (Jun 2022).',
        CFO: 'Nearly ₹750 crore invested at Akurdi with suppliers.',
        ALLY: 'Yulu wants R&D plus exclusive manufacturing from us.'
      },
      m1: {
        q: '27 Feb 2023 — what stage is Bajaj’s electric-scooter technology at?',
        key: 3, near: 2, decider: 'CMO', votes: { CTO: 2, CMO: 3, CFO: 2, ALLY: 3 },
        why: 'The Chetak has been on sale since 2020 — improving it is technology enhancement (' + KHALIL_STAGE + ').',
        real: 'The electric Chetak had been on sale since Jan 2020.'
      },
      m2: {
        q: 'Yulu (the owner) wants a builder. What is Bajaj’s move?',
        options: ['Contract-manufacture for the owner', 'Licence in the owner’s tech', 'JV with the owner', 'Build our own'],
        key: 0, partial: 2, keepOpt: 3, decider: 'ALLY', factor: 'support', mirror: true,
        stances: { CTO: 'KEEP', CMO: 'KEEP', CFO: 'SHARE', ALLY: 'SHARE' },
        readings: { CTO: 'Standing · strong R&D', CMO: 'Urgency · own demand high', CFO: 'Commitment · capacity built', ALLY: 'Support · owner needs a maker' },
        why: 'Yulu (the owner) contracts out; Bajaj’s mirror move is to be its contract developer-manufacturer, using spare EV capacity (Fig. 10-2 contract-out row, owner’s side).',
        src: 'Khalil Fig. 10-2 p.305',
        real: 'Exclusive R&D and manufacture for Yulu’s new platform.'
      },
      m3: {
        whatif: 'A new national subsidy lifts EV demand.', factor: 'urgency',
        options: ['Keep: Contract-manufacture for the owner', 'Switch: Build our own', 'Switch: JV with the owner'], key: 0, partial: null, decider: 'CMO',
        cards: {
          CTO: { t: 'With demand rising, build our own fleet scooters instead.', s: 'SWITCH' },
          CMO: { t: 'Demand is surging — keep the contract and deliver now.', s: 'KEEP' },
          CFO: { t: 'A JV would let us share Yulu’s upside.', s: 'SWITCH' },
          ALLY: { t: 'Exclusive deals reward partners who deliver on time.', s: 'KEEP' }
        },
        why: 'Higher urgency rewards the route already running — keep contract-manufacturing (Fig. 10-2).',
        next: 'PM E-DRIVE, Sep 2024.'
      }
    },
    {
      id: 'sun', name: 'SUN Mobility', short: 'SUN', when: '5 Jun 2024', verify: false,
      card: 'Battery-swapping company founded 2017; 630+ stations, 50,000+ smart batteries, 25,000+ EVs in 20 cities.',
      plug: { role: 'neutral', side: null, lean: 'NEUTRAL', note: 'swapping' },
      natureLicenseOut: false,
      fits: { LO: ['yulu', 'bajaj', 'indianoil'], LI: ['ather'], CM: [], MF: [], JV: ['indianoil', 'yulu', 'bajaj'] },
      seats: {
        CTO: 'Ours is an open-architecture platform serving several makers’ vehicles.',
        CMO: 'Four years since our first IndianOil swap-station pilot (Jun 2020).',
        CFO: 'A 50:50 JV would share the investment.',
        ALLY: 'IndianOil brings 37,000+ fuel stations.'
      },
      m1: {
        q: '5 Jun 2024 — what stage is SUN Mobility’s swapping technology at?',
        key: 3, near: 2, decider: 'CMO', votes: { CTO: 3, CMO: 3, CFO: 2, ALLY: 2 },
        why: '630+ stations already run on it — improving and scaling it is technology enhancement (' + KHALIL_STAGE + ').',
        real: '630+ stations and 50,000+ smart batteries were already in use.'
      },
      m2: {
        q: 'SUN’s swapping platform: how should the board exploit it?',
        options: ROUTES.slice(), key: 2, partial: 3, keepOpt: 0, decider: 'ALLY', factor: 'support',
        stances: { CTO: 'SHARE', CMO: 'KEEP', CFO: 'SHARE', ALLY: 'SHARE' },
        readings: { CTO: 'Standing · high', CMO: 'Urgency · low', CFO: 'Commitment · shared', ALLY: 'Support · needs sites' },
        why: 'High standing, low urgency, high need for support technologies (sites), shared commitment, wide application: joint venture (Fig. 10-2 JV row).',
        src: 'Khalil Fig. 10-2 p.305',
        real: '50:50 JV with IndianOil targeting 10,000+ swap stations in 40+ cities.'
      },
      m3: {
        whatif: 'A final national swapping policy sets interoperability standards.', factor: 'urgency',
        options: ['Keep: Joint venture', 'Switch: License out', 'Switch: Own use'], key: 1, partial: null, decider: 'CMO',
        cards: {
          CTO: { t: 'Our open architecture is already built for many makers.', s: 'SWITCH' },
          CMO: { t: 'A national standard is coming — license out widely before rivals do.', s: 'SWITCH' },
          CFO: { t: 'The JV already funds stations; why change?', s: 'KEEP' },
          ALLY: { t: 'IndianOil’s sites still matter to us.', s: 'KEEP' }
        },
        why: 'Urgency rule p.306: dominant urgency plus high standing — license out.',
        next: ''
      }
    },
    {
      id: 'indianoil', name: 'IndianOil', short: 'INDIANOIL', when: '5 Jun 2024', verify: false, mirrorOf: 'SUN Mobility',
      card: 'Fuel retailer with 37,000+ stations; hosted SUN Mobility’s first swap station in Chandigarh (Jun 2020).',
      plug: { role: 'neutral', side: null, lean: 'NEUTRAL' },
      natureLicenseOut: false,
      fits: { LO: [], LI: ['sun', 'ather'], CM: [], MF: [], JV: ['sun', 'yulu', 'bajaj'] },
      seats: {
        CTO: 'In the JV, SUN handles R&D, manufacturing and the swapping technology.',
        CMO: 'In 2020 our chairman said we would consider swapping to scale EV infrastructure.',
        CFO: 'A 50:50 JV, and we also invest in SUN Mobility.',
        ALLY: 'Joint target: 10,000+ stations in 40+ cities within three years.'
      },
      m1: {
        q: '5 Jun 2024 — what stage is the swapping technology IndianOil is joining?',
        key: 3, near: 2, decider: 'CTO', votes: { CTO: 3, CMO: 1, CFO: 2, ALLY: 2 },
        why: 'Swapping has run at IndianOil sites since the 2020 pilot — technology enhancement (' + KHALIL_STAGE + ').',
        real: 'SUN’s first swap station at an IndianOil site opened in Chandigarh (Jun 2020).'
      },
      m2: {
        q: 'SUN (the owner) forms a JV. What is IndianOil’s move?',
        options: ['JV with the owner', 'Licence in the owner’s tech', 'Contract the owner to build it', 'Build our own'],
        key: 0, partial: 2, keepOpt: 3, decider: 'ALLY', factor: 'support', mirror: true,
        stances: { CTO: 'SHARE', CMO: 'KEEP', CFO: 'SHARE', ALLY: 'SHARE' },
        readings: { CTO: 'Standing · owner has the tech', CMO: 'Urgency · considered since 2020', CFO: 'Commitment · shared 50:50', ALLY: 'Support · our sites' },
        why: 'The owner forms a JV; IndianOil’s mirror move is the JV, bringing sites and capital (Fig. 10-2 JV row, owner’s side).',
        src: 'Khalil Fig. 10-2 p.305',
        real: 'Formed the 50:50 JV (Jun 2024).'
      },
      m3: {
        whatif: 'Government funds 48,400 fast chargers, a rival to swapping.', factor: 'urgency',
        options: ['Keep: JV with the owner', 'Switch: Build our own', 'Switch: Licence in the owner’s tech'], key: 0, partial: null, decider: 'CMO',
        cards: {
          CTO: { t: 'Fast chargers are simpler — build our own instead.', s: 'SWITCH' },
          CMO: { t: 'Rivals are funded; keep the JV and move faster with it.', s: 'KEEP' },
          CFO: { t: 'Our investment in the JV is already committed.', s: 'KEEP' },
          ALLY: { t: 'Licensing in the tech would give us full control.', s: 'SWITCH' }
        },
        why: 'Urgency rises — the JV already running is the fastest way to scale; keep it (Fig. 10-2 JV row).',
        next: 'PM E-DRIVE, Sep 2024.'
      }
    },
    {
      id: 'exide', name: 'Exide Industries', short: 'EXIDE', when: '10 Mar 2022', verify: false, mirrorOf: 'SVOLT (China)',
      card: 'Indian lead-acid battery leader moving into lithium-ion cells; earlier made packs through Nexcharge, a JV with Leclanché.',
      plug: { role: 'neutral', side: null, lean: 'NEUTRAL' },
      natureLicenseOut: false,
      fits: { LO: [], LI: ['ather'], CM: [], MF: ['ather', 'ultraviolette', 'tvs', 'bajaj'], JV: [] },
      seats: {
        CTO: 'SVOLT offers an irrevocable right and licence to its cell know-how plus help building a turnkey plant.',
        CMO: 'India imports all its lithium-ion cells; we have bid for the cell subsidy.',
        CFO: 'Plan: a multi-gigawatt plant through a wholly owned subsidiary.',
        ALLY: 'Two popular chemistries in three formats; SVOLT brings R&D and manufacturing experience.'
      },
      m1: {
        q: '10 Mar 2022 — what stage is the lithium-ion cell technology Exide is acquiring?',
        key: 3, near: 2, decider: 'CTO', votes: { CTO: 3, CMO: 2, CFO: 2, ALLY: 3 },
        why: 'The cell know-how already exists and is being improved into Exide’s own capability — technology enhancement (' + KHALIL_STAGE + ').',
        real: 'SVOLT already had the cell know-how and manufacturing experience; Exide licensed it in.'
      },
      m2: {
        q: 'SVOLT (the owner) licenses out. What is Exide’s move?',
        options: ['Licence in', 'Build our own', 'JV with the owner', 'Contract R&D'],
        key: 0, partial: 2, keepOpt: 1, decider: 'CTO', factor: 'standing', mirror: true,
        stances: { CTO: 'SHARE', CMO: 'KEEP', CFO: 'KEEP', ALLY: 'SHARE' },
        readings: { CTO: 'Standing · owner’s is high', CMO: 'Urgency · all cells imported', CFO: 'Commitment · own subsidiary', ALLY: 'Support · owner’s experience' },
        why: 'The owner licenses out (high standing, lowest commitment, widest application); Exide’s mirror move is to licence in, the fastest acquisition route (Khalil p.303).',
        src: 'Khalil p.303',
        real: 'Took the SVOLT licence; building a 12 GWh plant in Karnataka.'
      },
      m3: {
        whatif: 'You are wait-listed for the cell subsidy.', factor: 'commitment',
        options: ['Keep: Licence in', 'Switch: JV with the owner', 'Switch: Build our own'], key: 1, partial: 0, decider: 'CFO',
        cards: {
          CTO: { t: 'The licence already gives us the know-how.', s: 'KEEP' },
          CMO: { t: 'The market will not wait for our plant.', s: 'SWITCH' },
          CFO: { t: 'Without the subsidy the plant is too big a commitment alone — share it.', s: 'SWITCH' },
          ALLY: { t: 'A JV means sharing control with SVOLT.', s: 'KEEP' }
        },
        why: 'Commitment jumps without the subsidy — a JV shares it (Fig. 10-2 JV row); keeping the licence is partly right.',
        next: 'Exide was wait-listed (24 Mar 2022) and kept the licence, funding the plant itself — textbook vs reality.'
      }
    }
  ];

  var PERSONAS = [
    { id: 'yash', name: 'Yash', title: 'The Gatekeeper', mono: 'Y', color: '#4FD1FF', topics: 'Stages · Stage-Gate · TRL', attack: 'STAGE CHECK', meeting: 1 },
    { id: 'nachiket', name: 'Nachiket', title: 'The Dealbreaker', mono: 'N', color: '#FF7A3D', topics: 'Routes · licensing', attack: 'TERM-SHEET SLAM', meeting: 2 },
    { id: 'palash', name: 'Palash', title: 'The Analyst', mono: 'P', color: '#34D399', topics: 'Ford’s factors · urgency rule', attack: 'FACTOR SCAN', meeting: 3 },
    { id: 'ebhanan', name: 'Ebhanan', title: 'The Incumbent', mono: 'E', color: '#E6C76E', topics: 'Plug war · exam traps', attack: 'EXAM TRAP', meeting: 0 }
  ];

  /* question bank — fmt: mcq | tf | order | multi.  a = answer (index | true/false | indices) */
  var QUESTIONS = [
    { head: 'yash', fmt: 'mcq', q: 'Which stage creates new knowledge with no specific practical aim?', o: STAGES, a: 0, src: 'Khalil pp.306–307' },
    { head: 'yash', fmt: 'mcq', q: 'Research directed to a specific practical aim is…', o: STAGES, a: 1, src: 'Khalil pp.306–307' },
    { head: 'yash', fmt: 'mcq', q: 'The connecting link between research and commercial use is…', o: STAGES, a: 2, src: 'Khalil pp.306–307' },
    { head: 'yash', fmt: 'mcq', q: 'Continuous improvement of an existing technology that lengthens its life cycle is…', o: STAGES, a: 3, src: 'Khalil pp.306–307' },
    { head: 'yash', fmt: 'order', q: 'Put the four stages of technology development in order.', o: STAGES, a: [0, 1, 2, 3], src: 'Khalil pp.306–307' },
    { head: 'yash', fmt: 'mcq', q: 'At a Stage-Gate gate, which of these is NOT a gate decision?', o: ['Go', 'Kill', 'Hold', 'Patent'], a: 3, src: 'Cetindamar et al. p.163' },
    { head: 'yash', fmt: 'multi', q: 'Pick ALL the decisions a Stage-Gate gate can make.', o: ['Go', 'Kill', 'Hold', 'Recycle', 'Patent'], a: [0, 1, 2, 3], src: 'Cetindamar et al. p.163' },
    { head: 'yash', fmt: 'tf', q: 'A gate decides on the evidence produced by the previous stage.', a: true, src: 'Cetindamar et al. p.163' },
    { head: 'yash', fmt: 'mcq', q: 'TRL 1 means…', o: ['Basic principles observed', 'Technology concept and application formulated', 'Analytical and experimental proof of concept', 'Product on sale'], a: 0, src: 'Course slides (TRL)' },
    { head: 'yash', fmt: 'mcq', q: '‘Technology concept and application formulated’ is TRL…', o: ['TRL 1', 'TRL 2', 'TRL 3', 'TRL 4'], a: 1, src: 'Course slides (TRL)' },
    { head: 'yash', fmt: 'mcq', q: '‘Analytical and experimental proof of concept’ is TRL…', o: ['TRL 1', 'TRL 2', 'TRL 3', 'TRL 4'], a: 2, src: 'Course slides (TRL)' },
    { head: 'nachiket', fmt: 'mcq', q: 'Which is NOT one of Khalil’s five acquisition methods?', o: ['Internal R&D', 'Joint venture', 'Licensing in', 'Licensing out'], a: 3, src: 'Khalil p.303' },
    { head: 'nachiket', fmt: 'multi', q: 'Pick ALL of Khalil’s five acquisition methods.', o: ['Internal R&D', 'Joint venture', 'Contracting out R&D', 'Licensing in', 'Buying', 'Licensing out'], a: [0, 1, 2, 3, 4], src: 'Khalil p.303' },
    { head: 'nachiket', fmt: 'tf', q: 'One firm’s licensing out is another firm’s licensing in.', a: true, src: 'Khalil p.303' },
    { head: 'nachiket', fmt: 'mcq', q: 'Hero’s Vida adopting Ather’s connector was, for Hero…', o: ['Licensing in', 'Licensing out', 'Own use', 'Contract out'], a: 0, src: 'Khalil p.303' },
    { head: 'nachiket', fmt: 'mcq', q: 'Which route carries the LOWEST commitment in Ford’s matrix?', o: ROUTES, a: 3, src: 'Khalil Fig. 10-2 p.305' },
    { head: 'nachiket', fmt: 'mcq', q: 'Which route fits the most distinctive product, kept for your own brand?', o: ROUTES, a: 0, src: 'Khalil Fig. 10-2 p.305' },
    { head: 'palash', fmt: 'mcq', q: 'Urgency is dominant and technological standing is high. The urgency rule says…', o: ROUTES, a: 3, src: 'Khalil p.306' },
    { head: 'palash', fmt: 'mcq', q: 'Which route sits at the LOWEST need for support technologies?', o: ROUTES, a: 0, src: 'Khalil Fig. 10-2 p.305' },
    { head: 'palash', fmt: 'mcq', q: 'Which route goes with the EARLIEST life-cycle position?', o: ROUTES, a: 0, src: 'Khalil Fig. 10-2 p.305' },
    { head: 'palash', fmt: 'mcq', q: 'Which route has the WIDEST application?', o: ROUTES, a: 3, src: 'Khalil Fig. 10-2 p.305' },
    { head: 'palash', fmt: 'tf', q: 'A joint venture goes with high standing, low urgency and a high need for support technologies.', a: true, src: 'Khalil Fig. 10-2 p.305' },
    { head: 'palash', fmt: 'multi', q: 'Pick ALL the readings that point to LICENSE OUT.', o: ['Highest urgency', 'Lowest commitment', 'Least distinctive', 'Earliest life cycle', 'Narrowest application'], a: [0, 1, 2], src: 'Khalil Fig. 10-2 p.305' },
    { head: 'palash', fmt: 'mcq', q: 'Where does CONTRACT OUT sit in Ford’s matrix?', o: ['High urgency + high need for support technologies', 'Lowest urgency + highest commitment', 'Low urgency + widest application', 'Highest urgency + lowest commitment'], a: 0, src: 'Khalil Fig. 10-2 p.305' },
    { head: 'ebhanan', fmt: 'tf', q: 'First to market guarantees the standard.', a: false, src: 'White & Bruton p.208 (Betamax came first and lost)' },
    { head: 'ebhanan', fmt: 'mcq', q: 'Why did VHS beat Betamax?', o: ['JVC licensed VHS widely to other makers', 'VHS reached the market first', 'Sony licensed Betamax widely', 'Betamax had no tapes'], a: 0, src: 'White & Bruton p.208' },
    { head: 'ebhanan', fmt: 'mcq', q: 'Roughly how much earlier did Betamax reach the market than VHS?', o: ['About 18 months', 'About 5 years', 'The same month', 'About 1 week'], a: 0, src: 'White & Bruton p.208' },
    { head: 'ebhanan', fmt: 'multi', q: 'Pick ALL the makers JVC licensed VHS to.', o: ['Matsushita', 'Hitachi', 'Mitsubishi', 'Sony'], a: [0, 1, 2], src: 'White & Bruton p.208' },
    { head: 'ebhanan', fmt: 'tf', q: 'Sony licensed Betamax widely to rival makers.', a: false, src: 'White & Bruton p.208' },
    { head: 'ebhanan', fmt: 'mcq', q: 'In this game’s plug war, which board owns the LECCS plug?', o: ['Ather Energy', 'Ultraviolette', 'SUN Mobility', 'Exide Industries'], a: 0, src: 'Case: Ather (BIS LECCS, Oct 2023)' },
    { head: 'ebhanan', fmt: 'mcq', q: 'Ultraviolette’s SUPERNOVA chargers (Mar 2024) use which connector?', o: ['Type 6', 'LECCS', 'Battery swapping', 'None'], a: 0, src: 'Case: Ultraviolette' }
  ];

  var WHISPERS = ['Our standing is high', 'We need cells', 'Back our plug?', 'Seeking a JV partner', 'We will license out widely', 'Not interested', 'Deal?', 'Watch [Company]'];

  var BOT_NAMES = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Isha', 'Vihaan', 'Anaya', 'Arjun', 'Saanvi', 'Reyansh', 'Myra', 'Ayaan', 'Kiara', 'Dhruv', 'Tara', 'Neel', 'Riya', 'Advait', 'Zara', 'Ishaan', 'Avni', 'Krish', 'Navya', 'Yuvan', 'Siya', 'Aditi', 'Kian', 'Mahi', 'Veer', 'Aadhya', 'Shaurya', 'Ira', 'Laksh', 'Anvi', 'Om', 'Trisha', 'Rudra', 'Jiya', 'Nirav'];

  var SCORING = [
    ['Start', 'Every company starts at ₹100 cr EV.'],
    ['M1 stage call', 'right +20 · near +6 · wrong −8'],
    ['M2 route', 'right +30 · partly +10 · wrong −10'],
    ['M3 keep / switch', 'right +25 · partly +8 · wrong −10'],
    ['Every meeting', 'aligned board (≥¾ private calls right) +5 · speed 0..+3 · missed window −5'],
    ['Deals (M2)', 'fitting deal +6 each side (licensor +8 if it licenses out by nature) · misfit −5 to the side that didn’t need it'],
    ['Plug War (M3)', 'more backers wins: owner +20, backers +5 · losing owner −10, its backers −3'],
    ['Final battle', 'pool = 20% of class EV split by damage share (half if the boss survives) · wrong answer −(5 ÷ board size) · finishing blow +5 · boss falls +5 all'],
    ['Class board', 'private call right = 100 + 50×time left · deciding card +50 · battle right = 10×damage · deal signer +25']
  ];

  return {
    STAGES: STAGES, STAGE_SHORT: STAGE_SHORT, ROUTES: ROUTES, SEATS: SEATS, FACTOR_SEAT: FACTOR_SEAT, FACTOR_LABEL: FACTOR_LABEL,
    COMPANIES: COMPANIES, PERSONAS: PERSONAS, QUESTIONS: QUESTIONS, WHISPERS: WHISPERS, BOT_NAMES: BOT_NAMES, SCORING: SCORING,
    FOOTER: 'Classroom simulation · cases simplified from public reports · deals between boards are in-game what-ifs · sample build: case facts being verified',
    BOOT: ['> BOARD PROTOCOL v2', '> LOADING CASE FILES ………… 8/8', '> DIRECTORS ONLINE 4/4', '> CHAIR: PROF. A. RAO', '> TARGET: THE CLOSED PLUG — PROPRIETARY · UNLICENSED', '> ALL BOARDS: ATTACK ON SIGNAL']
  };
})();
