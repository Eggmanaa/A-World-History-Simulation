// Historical Context Data for Educational Pop-ups
// Provides rich historical information for each timeline event

export interface HistoricalContext {
  year: number
  title: string
  description: string
  whyItMatters: string
  realWorldImpact: string
  primarySources?: string[]
  keyFigures?: string[]
  geographicContext?: string
  modernConnection?: string
}

export const HISTORICAL_CONTEXTS: Record<number, HistoricalContext> = {
  [-50000]: {
    year: -50000,
    title: "The Paleolithic Era",
    description: "During the Old Stone Age, modern humans (Homo sapiens) spread across the globe from Africa. These hunter-gatherer societies developed tools, language, art, and social structures that laid the foundation for all future civilizations.",
    whyItMatters: "This era represents the longest period of human history - over 2.5 million years. It's when humans developed the cognitive abilities, social cooperation, and tool-making skills that would eventually lead to civilization.",
    realWorldImpact: "Cave paintings in Lascaux (France) and Altamira (Spain) show sophisticated artistic expression. The development of language allowed knowledge to be passed down through generations.",
    keyFigures: ["Early Homo sapiens", "Neanderthals (coexisted until ~40,000 BCE)"],
    geographicContext: "Humans migrated from Africa through Middle East to Europe, Asia, and eventually the Americas via Bering land bridge.",
    modernConnection: "The social cooperation and communication skills developed in this era are still fundamental to human society today. Our brains are essentially 'Stone Age brains in a modern world.'"
  },
  
  [-8500]: {
    year: -8500,
    title: "Mesolithic Period - The Middle Stone Age",
    description: "As the Ice Age ended and climate warmed, humans adapted by developing new technologies like microliths (small stone tools), fishing equipment, and the bow and arrow. The abundance of resources allowed population growth and the first permanent settlements.",
    whyItMatters: "This transitional period saw humans shift from nomadic hunting to more sedentary lifestyles. The warming climate and abundance of food enabled population growth, setting the stage for agriculture.",
    realWorldImpact: "The domestication of dogs began in this period, creating humanity's first partnership with another species. Permanent settlements like Jericho began to form.",
    primarySources: ["Archaeological evidence from Jericho shows continuous settlement from 9000 BCE", "Microliths found across Europe and Middle East"],
    geographicContext: "Climate warming was most dramatic in the 'Fertile Crescent' (modern Iraq, Syria, Turkey) where wild grains grew abundantly.",
    modernConnection: "The bow and arrow revolutionized hunting - similar to how technology today revolutionizes human capabilities."
  },
  
  [-4500]: {
    year: -4500,
    title: "The Agricultural Revolution",
    description: "The Neolithic Revolution transformed human society as people learned to domesticate plants and animals. In Egypt, the predictable flooding of the Nile created perfect conditions for agriculture. In Mesopotamia, between the Tigris and Euphrates rivers, irrigation systems enabled farming.",
    whyItMatters: "Agriculture is the single most important development in human history. It enabled food surpluses, which freed some people to specialize in other tasks (crafts, religion, governance), leading to complex civilizations.",
    realWorldImpact: "Egypt unified under the first Pharaohs. Sumerian cities like Uruk and Ur emerged in Mesopotamia with populations in the tens of thousands - the first true cities. The wheel and writing were invented.",
    primarySources: [
      "The Narmer Palette (c. 3100 BCE) shows the unification of Upper and Lower Egypt",
      "Sumerian cuneiform tablets from Uruk are the world's first writing system"
    ],
    keyFigures: ["Narmer (Menes) - First Pharaoh of unified Egypt", "Sumerian priest-kings"],
    geographicContext: "Egypt: The Nile's predictable flooding deposited nutrient-rich silt. Mesopotamia: Unpredictable Tigris and Euphrates required irrigation systems.",
    modernConnection: "Agriculture allowed specialization of labor - just as modern economies allow people to focus on specific careers rather than producing everything they need."
  },
  
  [-2750]: {
    year: -2750,
    title: "Early Bronze Age - The Age of Metal",
    description: "The discovery that copper and tin could be combined to create bronze revolutionized tools and weapons. Bronze was harder and more durable than stone, enabling more effective plows, weapons, and tools.",
    whyItMatters: "Bronze technology required trade networks (tin was rare), specialized metalworkers, and surplus resources to support non-farmers. This increased social complexity and military capability.",
    realWorldImpact: "Egyptian Old Kingdom built the Great Pyramids (2580-2560 BCE). Mesopotamian city-states competed for resources. Bronze weapons gave military advantages to civilizations that could afford them.",
    primarySources: ["The Great Pyramid of Giza remains one of the Seven Wonders", "Sumerian war chariots depicted on the Standard of Ur (2600 BCE)"],
    geographicContext: "Trade routes connected Egypt, Mesopotamia, Anatolia, and the Indus Valley. Tin sources were rare, making control of trade routes crucial.",
    modernConnection: "Like silicon in computer chips today, bronze was a 'strategic material' that gave technological superiority to those who controlled it."
  },
  
  [-2250]: {
    year: -2250,
    title: "Bronze Age - Writing, Floods, and Catastrophe",
    description: "Writing systems emerged independently in multiple civilizations. Egyptian hieroglyphics recorded religious texts and royal decrees. Mesopotamian cuneiform documented laws, trade, and literature. But nature struck back: legends of a 'Great Flood' appear in multiple cultures, possibly based on real catastrophic flooding.",
    whyItMatters: "Writing enabled civilizations to preserve knowledge, establish laws, and maintain complex bureaucracies. It marks the transition from 'prehistory' to 'history.'",
    realWorldImpact: "The Epic of Gilgamesh (Mesopotamia's flood story) influenced later texts including the Biblical flood narrative. Mount Paektu's eruption in China caused crop failures. Disease spread along new trade routes.",
    primarySources: [
      "The Epic of Gilgamesh: 'For six days and six nights the winds blew, torrent and tempest and flood overwhelmed the world'",
      "Egyptian Pyramid Texts: First religious literature",
      "Indus Valley seals: Undeciphered script from Harappa and Mohenjo-daro"
    ],
    geographicContext: "Writing emerged in: Egypt (hieroglyphics), Mesopotamia (cuneiform), Indus Valley (still undeciphered), and China (oracle bones).",
    modernConnection: "The internet today serves the same revolutionary purpose as writing did 4,000 years ago: preserving and transmitting knowledge across time and distance."
  },
  
  [-1850]: {
    year: -1850,
    title: "Middle Bronze Age - Rise of Greek Civilization",
    description: "Greek-speaking peoples established city-states across the Aegean. The Minoan civilization on Crete built elaborate palaces. Meanwhile, China's Xia Dynasty (possibly legendary) gave way to the Shang Dynasty, which left extensive written records on oracle bones.",
    whyItMatters: "Greek civilization would eventually dominate Mediterranean culture, spreading philosophy, democracy, and artistic traditions. China developed independent bronze-working and a unique writing system.",
    realWorldImpact: "The Palace of Knossos (Crete) shows advanced architecture with indoor plumbing. Chinese bronze vessels demonstrate sophisticated metallurgy. Floods in China's Yellow River basin caused massive population displacement.",
    keyFigures: ["Minoan civilization (named after legendary King Minos)", "Shang Dynasty kings"],
    geographicContext: "Greece: Mountainous terrain encouraged independent city-states. China: Yellow River floods were so destructive they're called 'China's Sorrow.'",
    modernConnection: "Greek city-states operated like modern nation-states: independent governments competing and cooperating."
  },
  
  [-1600]: {
    year: -1600,
    title: "Thera Eruption - Natural Catastrophe",
    description: "The volcanic island of Thera (Santorini) exploded with a force that may have inspired the Atlantis legend. The resulting tsunamis devastated the Minoan civilization on nearby Crete. Simultaneously, 'barbarian' invasions destabilized Egypt and Mesopotamia.",
    whyItMatters: "This demonstrates how natural disasters can destabilize even powerful civilizations. The Minoan civilization never fully recovered, allowing Mycenaean Greeks to dominate the Aegean.",
    realWorldImpact: "The Thera eruption was one of the largest volcanic events in human history - 4 times larger than Krakatoa (1883). Tsunamis up to 40 feet high struck Crete 70 miles away. Volcanic ash darkened skies across the Mediterranean.",
    primarySources: [
      "Archaeological evidence: Minoan palaces show destruction layers from this period",
      "Plato's Atlantis story (written 1,200 years later) may be inspired by Minoan collapse"
    ],
    geographicContext: "Thera (Santorini) is still a crescent-shaped island - the center blew out. The caldera (crater) is 4 miles across and 1,300 feet deep.",
    modernConnection: "Like Hurricane Katrina or the 2004 Indian Ocean tsunami, natural disasters can overwhelm even advanced societies."
  },
  
  [-1300]: {
    year: -1300,
    title: "Late Bronze Age - Wonders and Writing",
    description: "This was the height of Bronze Age civilization. Egypt's New Kingdom built massive monuments. The Hittites of Anatolia challenged Egyptian power at the Battle of Kadesh. Trade networks connected civilizations from Britain to India.",
    whyItMatters: "This era produced some of history's most famous monuments and established diplomatic relationships between major powers. The first recorded peace treaty was signed between Egypt and the Hittites.",
    realWorldImpact: "The Great Pyramids had already stood for 1,000+ years. Now came: Hanging Gardens of Babylon (maybe), Troy's defensive walls, Egypt's Abu Simbel temples. Writing spread across the Mediterranean.",
    primarySources: [
      "Egyptian-Hittite Peace Treaty (1259 BCE): 'Peace and brotherhood forever'",
      "Amarna Letters: Diplomatic correspondence between kingdoms",
      "Linear B tablets from Greece: Administrative records"
    ],
    keyFigures: ["Ramesses II (Egypt)", "Hattusili III (Hittite Empire)", "King Priam (Troy, possibly legendary)"],
    geographicContext: "Trade routes connected tin mines in Afghanistan to bronze workshops in Egypt. A single shipwreck off Turkey (Uluburun) contained cargo from 7 different civilizations.",
    modernConnection: "Like global supply chains today, Bronze Age civilizations depended on international trade. Disease also spread along trade routes - the first 'globalization.'"
  },
  
  [-1200]: {
    year: -1200,
    title: "Bronze Age Collapse - Catastrophic Systems Failure",
    description: "'Sea Peoples' (unidentified invaders from the sea) destroyed cities across the Mediterranean. The Hittite Empire collapsed completely. Egypt survived but was weakened. In the chaos, new peoples emerged: Israelites, Phoenicians, and Spartans.",
    whyItMatters: "This is one of history's great mysteries: within 50 years, almost every major Bronze Age civilization collapsed. Historians debate whether invasions, droughts, earthquakes, or systemic failure caused it. This is a warning about how interconnected systems can fail catastrophically.",
    realWorldImpact: "Troy destroyed. The Hittite capital Hattusa burned and abandoned. Mycenaean Greek palaces destroyed. Egypt's Pharaoh Ramesses III barely repelled the Sea Peoples. Writing disappeared in Greece for 400 years (the 'Dark Age').",
    primarySources: [
      "Ramesses III's mortuary temple: 'The foreign countries made a conspiracy... no land could stand before their arms'",
      "Archaeological evidence: Destruction layers in dozens of sites from Greece to Syria"
    ],
    keyFigures: ["Sea Peoples (identity unknown)", "Ramesses III (Egypt)", "The Exodus (possibly from this period)"],
    geographicContext: "Destruction spread from Greece through Turkey, Syria, and Lebanon. Only Egypt and Assyria survived intact.",
    modernConnection: "Like the 2008 financial crisis or climate change today, systemic shocks to interconnected systems can cascade catastrophically."
  },
  
  [-1000]: {
    year: -1000,
    title: "Iron Age Begins - New Metal, New Empires",
    description: "Iron-working spread after the collapse of Bronze Age trade networks (tin became scarce). Iron ore was common, democratizing metalworking. Major religions began to form: Judaism solidified its monotheistic tradition. Philosophy and ethics became central to civilization.",
    whyItMatters: "Iron was cheaper and more available than bronze, changing warfare and agriculture. This era saw the emergence of the Hebrew Bible, Zoroastrianism (Persia), and philosophical traditions in Greece, China, and India.",
    realWorldImpact: "King David established Jerusalem as Israel's capital. The Phoenicians created the alphabet (ancestor of our modern alphabet). Homer's Iliad and Odyssey were composed. Assyria rebuilt as a military powerhouse using iron weapons.",
    primarySources: [
      "Books of Samuel: 'David took the stronghold of Zion, which is now the city of David'",
      "The Phoenician alphabet: Gave rise to Greek, Latin, and modern alphabets",
      "Homer's epics: Cultural foundation of Western civilization"
    ],
    keyFigures: ["King David (Israel)", "Homer (Greece, possibly legendary)", "Phoenician traders"],
    geographicContext: "Iron ore deposits were widespread, unlike rare tin. This ended the monopoly Bronze Age empires had on advanced weapons.",
    modernConnection: "Like how plastic democratized manufacturing in the 20th century, iron democratized metalworking. Religions founded in this era (Judaism, Zoroastrianism) still influence billions today."
  },
  
  [-825]: {
    year: -825,
    title: "Neo-Assyrian Empire - Military Superpower",
    description: "Assyria became history's first true empire through ruthless military efficiency. Iron weapons, cavalry, siege engines, and psychological warfare (deportation of conquered peoples) made them seemingly invincible. But their brutality bred hatred.",
    whyItMatters: "Assyria demonstrated that military might could create empires, but also that fear alone cannot sustain them. They pioneered many military innovations that would be used for millennia.",
    realWorldImpact: "Assyria conquered from Egypt to Persia. They built massive cities (Nineveh had 100,000+ people). Libraries preserved Mesopotamian literature. But their cruelty (documented in their own reliefs) made them despised.",
    primarySources: [
      "Assyrian palace reliefs: Graphically depict torture, beheadings, and mass deportations",
      "Library of Ashurbanipal: 30,000+ clay tablets preserving Mesopotamian literature",
      "Biblical prophets condemned Assyrian cruelty: 'Woe to the city of blood, full of lies, full of plunder' (Nahum 3:1)"
    ],
    keyFigures: ["Tiglath-Pileser III", "Sargon II", "Ashurbanipal (the 'librarian king')"],
    geographicContext: "Assyria ruled from the Tigris River, using deportation to mix populations and prevent rebellion.",
    modernConnection: "Empires built purely on military force eventually collapse - a lesson repeated throughout history (Rome, Napoleon, Nazi Germany)."
  },
  
  [-670]: {
    year: -670,
    title: "Scythian Invasions - War is Declared",
    description: "Nomadic horse warriors from the Central Asian steppes (Scythians, Cimmerians) invaded settled civilizations. Their mobility and archery made them nearly impossible to defeat in open battle. This marks the beginning of conflicts between civilizations in our simulation.",
    whyItMatters: "Steppe nomads would terrorize settled civilizations for 2,500 years (until gunpowder). Their way of war - hit-and-run cavalry tactics - shaped how sedentary empires developed defenses (like the Great Wall of China).",
    realWorldImpact: "Scythian raids destabilized Anatolia and the Near East. They introduced trousers and cavalry warfare to the Mediterranean world. Archaeological evidence shows they practiced human sacrifice and drank from skull cups.",
    primarySources: [
      "Herodotus (500 years later): 'The Scythians blind all their slaves... and drink blood'",
      "Frozen tombs in Siberia (Pazyryk culture): Perfectly preserved mummies, horses, and elaborate tattoos"
    ],
    geographicContext: "Scythians controlled the Eurasian Steppe from Ukraine to Mongolia. Their horse-centered culture gave them strategic mobility.",
    modernConnection: "Like modern mechanized warfare, mounted nomads had a mobility advantage that took centuries to counter. The stirrup (invented later) would make cavalry even more effective."
  },
  
  [-560]: {
    year: -560,
    title: "Rise of Carthage and Decline of Assyria",
    description: "The Phoenician colony of Carthage became a Mediterranean power through trade and naval dominance. Meanwhile, the hated Assyrian Empire fell to a coalition of Babylonians and Medes, who burned Nineveh so completely that its location was lost for 2,500 years.",
    whyItMatters: "Carthage would challenge Rome for Mediterranean dominance 300 years later. Assyria's fall showed that even superpowers can collapse suddenly. The victorious Babylonians (Neo-Babylonian Empire) rebuilt Babylon to unprecedented glory.",
    realWorldImpact: "Carthage controlled trade routes from Spain to Sicily. Nebuchadnezzar II rebuilt Babylon with the Hanging Gardens and deported the Jews to Babylon (the 'Babylonian Captivity' 586 BCE). Assyria was destroyed so thoroughly that only ruins remained.",
    primarySources: [
      "Babylonian Chronicle: 'The city [Nineveh] they turned into mounds and heaps'",
      "Psalm 137: 'By the rivers of Babylon, there we sat down and wept'",
      "Archaeological evidence: Carthage's circular harbors could house 220 warships"
    ],
    keyFigures: ["Nebuchadnezzar II (Babylon)", "Hamilcar (Carthage)", "Last Assyrian king Ashur-uballit II"],
    geographicContext: "Carthage controlled the western Mediterranean. Babylon controlled Mesopotamia. Persia was rising in the east.",
    modernConnection: "Carthage's mercantile empire was like a modern trading corporation with colonies. Assyria's fall demonstrates that brutality breeds enemies."
  },
  
  [-480]: {
    year: -480,
    title: "Classical Period - Greece vs. Persia",
    description: "The Persian Empire (largest empire yet seen) invaded Greece, but was defeated at Marathon (490 BCE) and Salamis (480 BCE). These battles saved Greek independence and allowed Greek culture to flourish. Population growth intensified as cities grew.",
    whyItMatters: "If Persia had conquered Greece, Western civilization as we know it might not exist. Democracy, philosophy, and scientific thinking might not have spread. This shows how individual events can shape millennia.",
    realWorldImpact: "The Greek victories led to the Golden Age of Athens: Socrates, Plato, Aristotle, the Parthenon, democracy, theater, and scientific thinking. The Persians ruled from Egypt to India, but their failure to conquer Greece limited their influence on Western culture.",
    primarySources: [
      "Herodotus: 'The Spartans sent 300 men to Thermopylae... they held the pass for three days'",
      "Aeschylus (who fought at Marathon): 'The Greeks... dealt blow upon blow until our army was destroyed'",
      "Thucydides would later write about the Peloponnesian War (431-404 BCE)"
    ],
    keyFigures: ["Leonidas (Sparta)", "Themistocles (Athens)", "Xerxes (Persia)"],
    geographicContext: "Greece's mountainous terrain favored defenders. The narrow Straits of Salamis negated Persia's numerical superiority at sea.",
    modernConnection: "Like the Cold War, this was a clash between different political systems (Persian autocracy vs. Greek democracy). Ideas matter as much as military power."
  },
  
  [-375]: {
    year: -375,
    title: "Warring States Period and Greek Philosophy",
    description: "China fragmented into competing kingdoms (Warring States period), spurring military innovation and philosophical development (Confucius, Laozi). In Greece, Socrates, Plato, and later Aristotle revolutionized philosophy. Alexander the Great was born during this period (356 BCE).",
    whyItMatters: "Competition drives innovation. China's warfare accelerated military technology (crossbows, iron cavalry). Greek competition in ideas created Western philosophy. Both cultures developed ethical frameworks that still influence us.",
    realWorldImpact: "Confucius emphasized moral leadership and education. Plato envisioned ideal government in The Republic. Chinese states built walls (proto-Great Wall) and developed bureaucratic administration that would last 2,000 years.",
    primarySources: [
      "Confucius' Analects: 'The superior man understands righteousness; the inferior man understands profit'",
      "Plato's Republic: 'Until philosophers rule as kings... cities will never have rest from their evils'",
      "Sun Tzu's Art of War: Military strategy still studied today"
    ],
    keyFigures: ["Confucius", "Plato", "Socrates", "Sun Tzu"],
    geographicContext: "China's Warring States: Seven major kingdoms fought for supremacy. Greece: City-states remained independent but were weakening.",
    modernConnection: "Both Confucianism and Platonism ask: 'What is the best way to organize society?' Questions we still debate today."
  }
}

// Get historical context for a specific year
export function getHistoricalContext(year: number): HistoricalContext | null {
  return HISTORICAL_CONTEXTS[year] || null
}

// Get all available contexts
export function getAllHistoricalContexts(): HistoricalContext[] {
  return Object.values(HISTORICAL_CONTEXTS)
}
