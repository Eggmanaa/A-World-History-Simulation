/**
 * CIV HISTORICAL OUTCOMES - Ancient World Simulation
 *
 * For each of the 24 playable civilizations, a short factual account of
 * what actually happened in the 3000 BCE - 476 CE window the game covers.
 *
 * Used by the Reflection Turn to let students compare their simulation
 * trajectory to the historical record. Designed to be accurate, neutral,
 * and classroom-appropriate. Each entry is 3-5 sentences.
 */

export interface CivHistoricalOutcome {
  civId: string;
  realName: string;             // "Egypt", "Ancient Rome", etc.
  peakYear: string;             // e.g., "c. 1250 BCE (New Kingdom)"
  endState: string;             // one sentence: how did it end by 476 CE?
  narrative: string;            // 3-5 sentence factual summary
  primaryLegacy: string;        // what they gave the world
  comparisonPrompt: string;     // "How did YOUR [civ] compare?"
}

export const CIV_HISTORICAL_OUTCOMES: CivHistoricalOutcome[] = [
  {
    civId: 'egypt',
    realName: 'Ancient Egypt',
    peakYear: 'c. 1250 BCE (New Kingdom under Ramesses II)',
    endState: 'Conquered by Alexander the Great (332 BCE), then by Rome (30 BCE). By 476 CE, a Christian Roman province.',
    narrative:
      'Egypt was arguably the longest-continuous civilization in the ancient world, running roughly 3100 BCE to 30 BCE as an independent state. It built the Pyramids during the Old Kingdom, reached imperial peak under the New Kingdom pharaohs, and its religion, monumental architecture, and writing system shaped the entire Mediterranean. Cleopatra VII (d. 30 BCE) was the last independent ruler; Rome absorbed Egypt as its grain-basket for four centuries.',
    primaryLegacy:
      'Monumental architecture, hieroglyphic writing, an enduring religious imagination, and calendar innovations that still shape our 365-day year.',
    comparisonPrompt:
      'Did your Egypt build wonders like the real Egypt did? Did it survive as long, or fall earlier?',
  },
  {
    civId: 'greece',
    realName: 'Ancient Greece (Athens / city-states)',
    peakYear: 'c. 450 BCE (Periclean Athens)',
    endState: 'Conquered by Philip II of Macedon (338 BCE), absorbed into Rome (146 BCE), became Byzantine heartland.',
    narrative:
      'The Greek city-states never formed a single kingdom, yet they invented democracy, philosophy, history as a discipline, and theater. Athens peaked between the Persian Wars (490-479 BCE) and the Peloponnesian War (404 BCE). Though politically defeated by Macedon and Rome, Greek language, learning, and art dominated the Mediterranean for over a thousand years after.',
    primaryLegacy:
      'Democracy, philosophy (Socrates, Plato, Aristotle), geometry, medicine, drama, and the foundational vocabulary of science.',
    comparisonPrompt:
      'The real Greeks won culturally even when they lost militarily. How did your Greece balance military versus cultural investment?',
  },
  {
    civId: 'rome',
    realName: 'Ancient Rome',
    peakYear: 'c. 117 CE (Emperor Trajan\'s reign, maximum extent)',
    endState: 'Western Roman Empire fell in 476 CE when Odoacer deposed the last emperor. The Eastern half (Byzantium) lasted until 1453.',
    narrative:
      'Rome grew from a small Italian republic into an empire spanning three continents over about 700 years. Its peak was roughly 27 BCE to 180 CE — the Pax Romana. Civil wars, plague (Antonine, Cyprian), economic strain, and Germanic migrations eroded the Western half. The Western Empire ended in 476 CE; the Eastern Empire (Constantinople) survived another thousand years.',
    primaryLegacy:
      'Law, engineering (aqueducts, roads, concrete), Latin as the parent of the Romance languages, and the institutional template for Christianity.',
    comparisonPrompt:
      'Rome fell in the West but survived in the East. Did your Rome overextend itself? What choices could have prevented or delayed the fall?',
  },
  {
    civId: 'china',
    realName: 'Ancient China (Qin / Han dynasties)',
    peakYear: 'c. 100 CE (Later Han Dynasty)',
    endState: 'The Han collapsed in 220 CE, leading to the Three Kingdoms period. China then fragmented for centuries before the Sui-Tang reunification.',
    narrative:
      'Qin Shi Huang unified China in 221 BCE, building the first Great Wall and standardizing writing. The Han Dynasty (202 BCE - 220 CE) ran parallel to Rome, developing paper, the compass, and a Confucian-based civil service. Buddhism arrived from India in the 1st century CE. The Han fell roughly when Rome entered its Crisis of the Third Century.',
    primaryLegacy:
      'Paper, silk, the compass, Confucian governance, and a continuous written historical tradition that remains unbroken.',
    comparisonPrompt:
      'Real China unified under Qin after centuries of Warring States. Did your China unify or stay fragmented? What difference did it make?',
  },
  {
    civId: 'germania',
    realName: 'Germanic Tribes',
    peakYear: 'c. 400 CE (the Migration Period)',
    endState: 'Germanic peoples (Goths, Vandals, Franks, Anglo-Saxons) carved post-Roman kingdoms across Europe. By 476 CE, they controlled most of the former Western Empire.',
    narrative:
      'The Germanic peoples never formed one nation in the ancient world; they were a constellation of tribes — Cherusci, Marcomanni, Goths, Franks, Vandals, Saxons, and more. They defeated Rome at Teutoburg Forest (9 CE), held the frontier for centuries, then migrated en masse in the 4th and 5th centuries. Their successor kingdoms became the foundation of medieval Europe.',
    primaryLegacy:
      'Common law traditions, the ethnic-linguistic base of modern German, English, Dutch, and Scandinavian peoples, and the warrior-retinue (comitatus) model of medieval feudalism.',
    comparisonPrompt:
      'Germania started weak militarily in the game, but real Germanic tribes ended Roman power. Did your decisions reflect this long-arc strategy?',
  },
  {
    civId: 'phoenicia',
    realName: 'Phoenicia (Tyre, Sidon, Byblos)',
    peakYear: 'c. 900 BCE (height of Mediterranean trade network)',
    endState: 'Home cities conquered by Alexander (332 BCE); their colony Carthage fell to Rome (146 BCE). By 476 CE, the Levant was Roman/Byzantine.',
    narrative:
      'Phoenician city-states never unified but built the Mediterranean\'s most extensive trade network, founding colonies from Cyprus to Spain — including Carthage. They invented the first true alphabet around 1050 BCE, from which Greek, Latin, Hebrew, and Arabic scripts all descended. Alexander besieged Tyre for seven months in 332 BCE, ending Phoenician independence.',
    primaryLegacy:
      'The alphabet itself — the ancestor of nearly every writing system used in the world today. Also: purple dye, navigation, and the first Mediterranean-wide trade network.',
    comparisonPrompt:
      'Phoenicians won by trade, not conquest. Was your Phoenicia a trader or a warrior? Which paid off in the long run?',
  },
  {
    civId: 'india',
    realName: 'Ancient India (Maurya / Gupta Empires)',
    peakYear: 'c. 250 BCE (Ashoka the Great) and c. 380 CE (Gupta Golden Age)',
    endState: 'The Gupta Empire was still strong in 476 CE but would fragment under Hun invasions in the following century.',
    narrative:
      'India saw two great empires in the game\'s window: the Mauryan (322-185 BCE), unified by Chandragupta and reaching its peak under Ashoka the Great, who converted to Buddhism after the bloody Kalinga War; and the Gupta (c. 320-550 CE), which produced advances in mathematics (the decimal system, concept of zero), astronomy, and literature. Buddhism, Hinduism, and Jainism all flourished and spread along trade routes.',
    primaryLegacy:
      'The decimal number system, the concept of zero, Buddhism\'s spread across Asia, classical Sanskrit literature, and enduring philosophical traditions.',
    comparisonPrompt:
      'Ashoka renounced violence after victory. Did your India choose conquest or culture? Which move did the real Ashoka respect?',
  },
  {
    civId: 'mesopotamia',
    realName: 'Mesopotamia (Sumer, Akkad, Babylon, Assyria)',
    peakYear: 'c. 600 BCE (Neo-Babylonian Empire under Nebuchadnezzar II)',
    endState: 'Conquered by Cyrus the Great (539 BCE), later absorbed by Alexander, then the Seleucids, then Parthians/Sassanids. By 476 CE, a Sassanid Persian territory.',
    narrative:
      'Between the Tigris and Euphrates, civilizations rose and fell for 3,000 years — Sumer, Akkad, Babylon, Assyria, Neo-Babylonia. Writing (cuneiform) was invented here around 3200 BCE. Hammurabi wrote history\'s first law code around 1754 BCE. Babylon briefly dominated the region under Nebuchadnezzar before falling to Persia in 539 BCE.',
    primaryLegacy:
      'Writing itself (cuneiform), the wheel, the first cities, mathematical base-60 (our 60-minute hour), written law, and the Epic of Gilgamesh.',
    comparisonPrompt:
      'Mesopotamia invented civilization but rarely stayed united. Did your version dominate or fragment? What made the difference?',
  },
  {
    civId: 'persia',
    realName: 'Persia (Achaemenid / Sassanid)',
    peakYear: 'c. 500 BCE (Darius I) and c. 550 CE (Sassanid Khosrow I)',
    endState: 'The Achaemenids fell to Alexander (331 BCE). The Sassanids held strong in 476 CE and would fight Rome for another two centuries before falling to Arab conquest (651 CE).',
    narrative:
      'Cyrus the Great founded the Achaemenid Empire in 550 BCE and built the largest empire the world had yet seen. Darius I and Xerxes invaded Greece and lost. Alexander of Macedon crushed the empire in a decade (334-324 BCE). After a Parthian interregnum, the Sassanid Persians revived the empire in 224 CE; they were still battling Rome in 476 CE.',
    primaryLegacy:
      'Zoroastrianism (influential on Judaism, Christianity, Islam), the first imperial postal service, satrapies (provincial governance), and a tradition of religious tolerance (at least compared to Assyria).',
    comparisonPrompt:
      'Cyrus became legendary for humane empire. Did your Persia conquer harshly or rule wisely? What happened to each style long-term?',
  },
  {
    civId: 'sparta',
    realName: 'Sparta',
    peakYear: 'c. 404 BCE (victory over Athens)',
    endState: 'Defeated at Leuctra (371 BCE), reduced by the Hellenistic age, absorbed by Rome (146 BCE), a minor Roman town by 476 CE.',
    narrative:
      'Sparta\'s distinctive warrior-citizen culture peaked in the 5th century BCE, holding the pass at Thermopylae (480 BCE) and defeating Athens in the Peloponnesian War (404 BCE). But the city was never populous and never innovated economically. It lost decisively to Thebes at Leuctra in 371 BCE and slowly declined for centuries.',
    primaryLegacy:
      'The enduring cultural image of the disciplined warrior, the "Leonidas" archetype, and a cautionary tale about over-specialization (martial-only).',
    comparisonPrompt:
      'Real Sparta fielded elite soldiers but never grew. Did your Sparta invest in anything besides military? Did over-specialization limit you?',
  },
  {
    civId: 'anatolia',
    realName: 'Anatolia (Hittites / Lydia / Ionia)',
    peakYear: 'c. 1350 BCE (Hittite Empire) and c. 560 BCE (Lydian gold)',
    endState: 'Successively Persian, Macedonian, Seleucid, Roman. By 476 CE, the heart of the Eastern Roman (Byzantine) Empire.',
    narrative:
      'Anatolia (modern Turkey) saw the Hittite Empire rival Egypt in the 14th century BCE, collapse around 1180 BCE, then host the wealthy Lydian kingdom (Croesus\'s gold — first coinage c. 600 BCE) before Persian, Macedonian, and Roman conquest. It became the beating heart of the Byzantine Empire after Rome\'s western fall.',
    primaryLegacy:
      'Coined money (Lydia), the Hittite iron-working revolution, the Ionian philosophers (Thales, Anaximander) who started Western science, and Constantinople as the bridge to medieval Europe.',
    comparisonPrompt:
      'Anatolia was always a crossroads — conquered and reborn repeatedly. Did your Anatolia get caught between empires, or did it become one?',
  },
  {
    civId: 'crete',
    realName: 'Minoan Crete',
    peakYear: 'c. 1700 BCE (Minoan Thalassocracy)',
    endState: 'Mycenaean takeover (c. 1450 BCE); part of Greek world for the rest of the period; Roman province by 67 BCE.',
    narrative:
      'The Minoan civilization on Crete (c. 2700-1450 BCE) built elaborate palaces at Knossos, developed early writing (Linear A, still undeciphered), and ran a peaceful trade empire across the Aegean. The Thera eruption (c. 1600 BCE) weakened them; Mycenaean Greeks finished the job around 1450 BCE. Crete then cycled through Greek, Roman, and Byzantine rule.',
    primaryLegacy:
      'The first European civilization, sophisticated palace architecture, bull-leaping imagery, and Greek mythology\'s Labyrinth / Minotaur inherit their memory.',
    comparisonPrompt:
      'The real Minoans were likely destroyed by a natural disaster. Did your Crete survive the Thera eruption? If so, how?',
  },
  {
    civId: 'gaul',
    realName: 'Gaul (Celtic tribes)',
    peakYear: 'c. 300 BCE (La Tène culture at height)',
    endState: 'Conquered by Julius Caesar (58-50 BCE). A Roman province (Gallia) for five centuries, then overrun by Franks in the 5th century CE.',
    narrative:
      'The Celtic Gauls dominated western Europe for centuries before Rome arrived. They sacked Rome itself in 390 BCE and produced stunning La Tène art. Julius Caesar\'s brutal eight-year conquest (58-50 BCE) killed perhaps a million Gauls and enslaved another million. Gaul became thoroughly Romanized; Latin evolved into modern French.',
    primaryLegacy:
      'La Tène art, druidic traditions absorbed into Christian-era folklore, and the cautionary example of a culture destroyed by a single decisive military campaign.',
    comparisonPrompt:
      'Gaul was militarily strong but politically fragmented. Did your Gaul unite? If it had, could it have stopped Rome?',
  },
  {
    civId: 'carthage',
    realName: 'Carthage',
    peakYear: 'c. 240 BCE (pre-Second Punic War)',
    endState: 'Destroyed by Rome in 146 CE — the city razed, the ground salted metaphorically in Roman memory. Rebuilt as a Roman city; Vandal capital by 439 CE.',
    narrative:
      'A Phoenician colony founded (traditionally) in 814 BCE, Carthage became the western Mediterranean\'s greatest commercial power. It fought three wars with Rome (264-146 BCE). Hannibal famously crossed the Alps with elephants. Rome won and utterly destroyed the city in 146 BCE — one of history\'s clearest total defeats.',
    primaryLegacy:
      'Hannibal\'s military innovations (still taught at West Point), a Mediterranean mercantile tradition, and the lesson of what happens when a trading power cannot match a militarist rival\'s depth of manpower.',
    comparisonPrompt:
      'Hannibal won every battle but lost the war. Did your Carthage focus on battles or on long-term strategy? What would have saved it?',
  },
  {
    civId: 'macedon',
    realName: 'Macedon',
    peakYear: 'c. 326 BCE (Alexander at the Indus)',
    endState: 'After Alexander\'s death, his empire split. Macedon itself was annexed by Rome (148 BCE). A Roman province for the rest of the period.',
    narrative:
      'Macedon was a northern Greek kingdom that Philip II transformed into a military superpower. His son Alexander conquered Persia, Egypt, and reached India between 334 and 323 BCE — the largest empire the West had yet seen. Alexander died at 32 in Babylon. His generals (the Diadochi) split the empire; Macedon itself lasted as an independent kingdom until Rome absorbed it in 148 BCE.',
    primaryLegacy:
      'The Hellenistic spread of Greek culture from Egypt to Afghanistan, the founding of Alexandria (and its Library), and Alexander himself as history\'s model of youthful military genius.',
    comparisonPrompt:
      'Alexander conquered everything but left no heir. Did your Macedon plan for succession? What happens to your civ when its leader dies?',
  },
  {
    civId: 'assyria',
    realName: 'Assyria (Neo-Assyrian Empire)',
    peakYear: 'c. 660 BCE (under Ashurbanipal)',
    endState: 'Crushed by Babylonians and Medes (612 BCE, Fall of Nineveh). Never recovered as an independent state; Roman/Sassanid territory by 476 CE.',
    narrative:
      'The Neo-Assyrian Empire (911-609 BCE) built the ancient world\'s first true military superpower. They invented professional standing armies, siege warfare, and deliberate terror as statecraft (deporting whole populations). They reached from Egypt to the Persian Gulf. Their brutality earned them universal enemies — a coalition of Medes and Babylonians destroyed Nineveh in 612 BCE. No one mourned.',
    primaryLegacy:
      'The imperial administration template (provinces, roads, mounted messengers), the world\'s first real library (Ashurbanipal\'s at Nineveh), and the cautionary example of terror as unsustainable policy.',
    comparisonPrompt:
      'Assyria terrorized everyone and then everyone allied against it. Did your Assyria make enemies or allies? Which strategy paid off?',
  },
  {
    civId: 'cush',
    realName: 'Kush / Nubia (Meroe)',
    peakYear: 'c. 720 BCE (25th Dynasty pharaohs ruling Egypt) and c. 100 CE (Meroitic peak)',
    endState: 'Meroitic Kingdom declined from the 3rd century CE, conquered by Aksum (Ethiopia) around 350 CE.',
    narrative:
      'The Kingdom of Kush in modern Sudan was Egypt\'s southern neighbor and rival for 2,500 years. Its 25th Dynasty pharaohs ruled Egypt itself (c. 747-656 BCE). After the capital moved to Meroe, Kush became a major iron-working and trading civilization connecting sub-Saharan Africa to the Mediterranean. It developed its own script (Meroitic, still largely undeciphered).',
    primaryLegacy:
      'A thousand years of Nubian pyramids (more than Egypt built!), iron-working in Africa, the Meroitic script, and a reminder that ancient Africa had its own literate, imperial cultures.',
    comparisonPrompt:
      'Kush ruled Egypt for a century before being pushed back. Did your Kush overshadow its rivals or get overshadowed? What turned the tide?',
  },
  {
    civId: 'israel',
    realName: 'Ancient Israel / Judea',
    peakYear: 'c. 960 BCE (reign of Solomon) and the First Jewish Revolt (66-70 CE)',
    endState: 'Judea destroyed by Rome (70 CE, Temple destroyed; 135 CE, Bar Kokhba revolt crushed). Jewish people dispersed through the Mediterranean.',
    narrative:
      'A small Iron Age kingdom split into Israel (north) and Judah (south). Israel fell to Assyria (722 BCE); Judah fell to Babylon (586 BCE) and the First Temple was destroyed. After Persian, Greek, and Roman rule, a series of revolts against Rome ended in the destruction of the Second Temple (70 CE) and the dispersal of the Jewish people. In the 1st century CE, Christianity emerged from Jewish roots and began spreading through the empire.',
    primaryLegacy:
      'Monotheism itself — the direct ancestor of Judaism, Christianity, and Islam. The Hebrew Bible, which has shaped Western literature, law, and ethics for 2,500 years.',
    comparisonPrompt:
      'Israel was politically small but religiously vast. Did your Israel invest in faith or in other stats? What did that trade-off produce?',
  },
  {
    civId: 'troy',
    realName: 'Troy (Wilusa)',
    peakYear: 'c. 1250 BCE (late Bronze Age city)',
    endState: 'Destroyed (the archaeological "Troy VIIa" burn layer, c. 1180 BCE), rebuilt as a Greek then Roman city, minor by 476 CE.',
    narrative:
      'Troy (Hittite "Wilusa") stood at the mouth of the Hellespont, controlling access between the Aegean and Black Sea. The archaeological city had many levels; the one usually identified with Homer\'s Trojan War burned around 1180 BCE. Homer\'s Iliad preserved its memory in Greek epic, shaping Western literature forever. The later classical city was a tourist site in Roman times.',
    primaryLegacy:
      'The Iliad and the Odyssey — founding texts of Western literature. The concept of epic heroism. And the reminder that a single event\'s cultural memory can outlive whole empires.',
    comparisonPrompt:
      'Troy lost the war but won the story. Did your Troy survive? If it fell, did its memory endure in other civs\' cultures?',
  },
  {
    civId: 'scythia',
    realName: 'Scythia (steppe nomads)',
    peakYear: 'c. 500 BCE (height of Scythian dominion)',
    endState: 'Displaced by Sarmatians (c. 200 BCE); absorbed into the Hunnic confederation (4th century CE) that would attack Rome.',
    narrative:
      'The Scythians were Iranian-speaking nomads dominating the Eurasian steppe from modern Ukraine to Central Asia. They mastered mounted archery — a revolutionary military technology — and terrorized settled civilizations from Egypt to China. Herodotus devoted a book of his Histories to them. They declined by 200 BCE but their cultural imprint on steppe peoples lasted millennia.',
    primaryLegacy:
      'The mounted archer military tradition (inherited by Parthians, Huns, Mongols), stunning gold metalwork, and a reminder that nomadic peoples could defeat settled empires.',
    comparisonPrompt:
      'Scythia fought settled civs their whole existence and won often. Did your Scythia settle down or stay mobile? Which paid off?',
  },
  {
    civId: 'olmec',
    realName: 'Olmec Civilization',
    peakYear: 'c. 1200 BCE (San Lorenzo phase)',
    endState: 'Declined by c. 400 BCE; successor cultures (Maya, Zapotec) carried forward their innovations; unknown to the Mediterranean world.',
    narrative:
      'The Olmec of southern Mexico (c. 1500-400 BCE) were the "mother culture" of Mesoamerica. They carved colossal basalt heads — up to 40 tons, portraying rulers. They developed early writing, a sophisticated calendar, and religious imagery that later fed the Maya, Aztec, and other civilizations. They collapsed or transformed before 400 BCE for reasons still debated.',
    primaryLegacy:
      'The foundational cultural template for Mesoamerica — the ball game, the numbering system, the gods, the political iconography — all inherited and elaborated by the Maya and later Aztec civilizations.',
    comparisonPrompt:
      'The Olmec were unknown to ancient Mediterranean peoples. Did your Olmec ever contact other civs? What might have happened if they had?',
  },
  {
    civId: 'korea',
    realName: 'Ancient Korea (Gojoseon / Three Kingdoms)',
    peakYear: 'c. 400 CE (Goguryeo expansion)',
    endState: 'The Three Kingdoms (Goguryeo, Baekje, Silla) still contested the peninsula in 476 CE; Silla would unify Korea in 668 CE.',
    narrative:
      'Korea\'s recorded history traditionally begins with Gojoseon (legendary founding 2333 BCE, but solid archaeology from c. 400 BCE). Han China conquered the north in 108 BCE; the Three Kingdoms period (Goguryeo, Baekje, Silla) rose in the 1st century CE. Buddhism arrived from China in the 4th century. Goguryeo was the dominant power in 476 CE.',
    primaryLegacy:
      'A distinctive cultural identity preserved despite constant Chinese pressure, hanja-based literature, and early agricultural and metallurgical innovations transmitted to Japan.',
    comparisonPrompt:
      'Korea lived next to mighty China and kept its distinct identity. Did your Korea resist larger neighbors or absorb into them?',
  },
  {
    civId: 'khmer',
    realName: 'Khmer / Funan (proto-Cambodia)',
    peakYear: 'Funan Kingdom peak, c. 200-500 CE',
    endState: 'Funan was absorbed by the Chenla kingdom around 550 CE, which in turn would give rise to the great Khmer Empire of Angkor (9th-15th centuries).',
    narrative:
      'In the game\'s window, the Funan kingdom (c. 1st-6th centuries CE) controlled the Mekong delta and became Southeast Asia\'s first major trading state, connecting India and China. Hindu and Buddhist influences arrived from India. Funan\'s successor states would eventually produce the magnificent temple complex at Angkor Wat — but that was centuries after 476 CE.',
    primaryLegacy:
      'The foundation of Indianized Southeast Asian civilization, maritime trade routes linking the Mediterranean world to China, and the cultural base for later Angkor.',
    comparisonPrompt:
      'The Khmer were far from the game\'s Mediterranean focus. Did that isolation protect your Khmer, or did they miss cross-cultural benefits?',
  },
  {
    civId: 'ethiopia',
    realName: 'Aksum (Ethiopia)',
    peakYear: 'c. 350 CE (conversion of King Ezana to Christianity)',
    endState: 'Still a great regional power in 476 CE; would decline after 700 CE due to Islamic expansion cutting trade routes.',
    narrative:
      'The Kingdom of Aksum (c. 100-940 CE) in the Ethiopian highlands was one of the four great powers of its day — alongside Rome, Persia, and China. Aksum controlled the Red Sea trade, minted its own coins, built stone obelisks, and converted to Christianity under King Ezana around 330 CE. It conquered Kush in the 4th century.',
    primaryLegacy:
      'One of the world\'s oldest Christian kingdoms (Ethiopian Orthodox Church still exists), the Ge\'ez script (ancestor of modern Amharic), the oldest continuous Christian civilization in Africa.',
    comparisonPrompt:
      'Aksum converted to Christianity and outlasted Rome. Did your Ethiopia pick a religion? Did faith help or hurt the civ\'s survival?',
  },
];

export function getCivHistoricalOutcome(civId: string): CivHistoricalOutcome | null {
  return CIV_HISTORICAL_OUTCOMES.find((c) => c.civId === civId) || null;
}
