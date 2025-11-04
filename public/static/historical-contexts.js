// Historical Context Data - Shared across student and teacher interfaces
// Educational content for timeline events

const HISTORICAL_CONTEXTS = {
  '-50000': {
    title: "The Paleolithic Era",
    description: "During the Old Stone Age, modern humans (Homo sapiens) spread across the globe from Africa. These hunter-gatherer societies developed tools, language, art, and social structures that laid the foundation for all future civilizations.",
    whyItMatters: "This era represents the longest period of human history - over 2.5 million years. It's when humans developed the cognitive abilities, social cooperation, and tool-making skills that would eventually lead to civilization.",
    realWorldImpact: "Cave paintings in Lascaux (France) and Altamira (Spain) show sophisticated artistic expression. The development of language allowed knowledge to be passed down through generations.",
    keyFigures: ["Early Homo sapiens", "Neanderthals (coexisted until ~40,000 BCE)"],
    modernConnection: "The social cooperation and communication skills developed in this era are still fundamental to human society today. Our brains are essentially 'Stone Age brains in a modern world.'"
  },
  '-8500': {
    title: "Mesolithic Period - The Middle Stone Age",
    description: "As the Ice Age ended and climate warmed, humans adapted by developing new technologies like microliths (small stone tools), fishing equipment, and the bow and arrow. The abundance of resources allowed population growth and the first permanent settlements.",
    whyItMatters: "This transitional period saw humans shift from nomadic hunting to more sedentary lifestyles. The warming climate and abundance of food enabled population growth, setting the stage for agriculture.",
    realWorldImpact: "The domestication of dogs began in this period, creating humanity's first partnership with another species. Permanent settlements like Jericho began to form.",
    modernConnection: "The bow and arrow revolutionized hunting - similar to how technology today revolutionizes human capabilities."
  },
  '-4500': {
    title: "The Agricultural Revolution",
    description: "The Neolithic Revolution transformed human society as people learned to domesticate plants and animals. In Egypt, the predictable flooding of the Nile created perfect conditions for agriculture. In Mesopotamia, between the Tigris and Euphrates rivers, irrigation systems enabled farming.",
    whyItMatters: "Agriculture is the single most important development in human history. It enabled food surpluses, which freed some people to specialize in other tasks (crafts, religion, governance), leading to complex civilizations.",
    realWorldImpact: "Egypt unified under the first Pharaohs. Sumerian cities like Uruk and Ur emerged in Mesopotamia with populations in the tens of thousands - the first true cities. The wheel and writing were invented.",
    primarySources: [
      "The Narmer Palette (c. 3100 BCE) shows the unification of Upper and Lower Egypt",
      "Sumerian cuneiform tablets from Uruk are the world's first writing system"
    ],
    keyFigures: ["Narmer (Menes) - First Pharaoh of unified Egypt", "Sumerian priest-kings"],
    modernConnection: "Agriculture allowed specialization of labor - just as modern economies allow people to focus on specific careers rather than producing everything they need."
  },
  '-2750': {
    title: "Early Bronze Age - The Age of Metal",
    description: "The discovery that copper and tin could be combined to create bronze revolutionized tools and weapons. Bronze was harder and more durable than stone, enabling more effective plows, weapons, and tools.",
    whyItMatters: "Bronze technology required trade networks (tin was rare), specialized metalworkers, and surplus resources to support non-farmers. This increased social complexity and military capability.",
    realWorldImpact: "Egyptian Old Kingdom built the Great Pyramids (2580-2560 BCE). Mesopotamian city-states competed for resources. Bronze weapons gave military advantages to civilizations that could afford them.",
    modernConnection: "Like silicon in computer chips today, bronze was a 'strategic material' that gave technological superiority to those who controlled it."
  },
  '-2250': {
    title: "Bronze Age - Writing, Floods, and Catastrophe",
    description: "Writing systems emerged independently in multiple civilizations. Egyptian hieroglyphics recorded religious texts and royal decrees. Mesopotamian cuneiform documented laws, trade, and literature. But nature struck back: legends of a 'Great Flood' appear in multiple cultures.",
    whyItMatters: "Writing enabled civilizations to preserve knowledge, establish laws, and maintain complex bureaucracies. It marks the transition from 'prehistory' to 'history.'",
    realWorldImpact: "The Epic of Gilgamesh (Mesopotamia's flood story) influenced later texts including the Biblical flood narrative. Mount Paektu's eruption in China caused crop failures. Disease spread along new trade routes.",
    primarySources: [
      "The Epic of Gilgamesh: 'For six days and six nights the winds blew, torrent and tempest and flood overwhelmed the world'"
    ],
    modernConnection: "The internet today serves the same revolutionary purpose as writing did 4,000 years ago: preserving and transmitting knowledge across time and distance."
  },
  '-1850': {
    title: "Middle Bronze Age - Rise of Greek Civilization",
    description: "Greek-speaking peoples established city-states across the Aegean. The Minoan civilization on Crete built elaborate palaces. Meanwhile, China's Xia Dynasty (possibly legendary) gave way to the Shang Dynasty.",
    whyItMatters: "Greek civilization would eventually dominate Mediterranean culture, spreading philosophy, democracy, and artistic traditions. China developed independent bronze-working and a unique writing system.",
    realWorldImpact: "The Palace of Knossos (Crete) shows advanced architecture with indoor plumbing. Chinese bronze vessels demonstrate sophisticated metallurgy. Floods in China's Yellow River basin caused massive population displacement.",
    keyFigures: ["Minoan civilization", "Shang Dynasty kings"],
    modernConnection: "Greek city-states operated like modern nation-states: independent governments competing and cooperating."
  },
  '-1600': {
    title: "Thera Eruption - Natural Catastrophe",
    description: "The volcanic island of Thera (Santorini) exploded with a force that may have inspired the Atlantis legend. The resulting tsunamis devastated the Minoan civilization on nearby Crete. Simultaneously, 'barbarian' invasions destabilized Egypt and Mesopotamia.",
    whyItMatters: "This demonstrates how natural disasters can destabilize even powerful civilizations. The Minoan civilization never fully recovered, allowing Mycenaean Greeks to dominate the Aegean.",
    realWorldImpact: "The Thera eruption was one of the largest volcanic events in human history - 4 times larger than Krakatoa (1883). Tsunamis up to 40 feet high struck Crete 70 miles away. Volcanic ash darkened skies across the Mediterranean.",
    modernConnection: "Like Hurricane Katrina or the 2004 Indian Ocean tsunami, natural disasters can overwhelm even advanced societies."
  },
  '-1300': {
    title: "Late Bronze Age - Wonders and Writing",
    description: "This was the height of Bronze Age civilization. Egypt's New Kingdom built massive monuments. The Hittites of Anatolia challenged Egyptian power at the Battle of Kadesh. Trade networks connected civilizations from Britain to India.",
    whyItMatters: "This era produced some of history's most famous monuments and established diplomatic relationships between major powers. The first recorded peace treaty was signed between Egypt and the Hittites.",
    realWorldImpact: "The Great Pyramids had already stood for 1,000+ years. Now came: Hanging Gardens of Babylon, Troy's defensive walls, Egypt's Abu Simbel temples. Writing spread across the Mediterranean.",
    primarySources: [
      "Egyptian-Hittite Peace Treaty (1259 BCE): 'Peace and brotherhood forever'",
      "Amarna Letters: Diplomatic correspondence between kingdoms"
    ],
    keyFigures: ["Ramesses II (Egypt)", "Hattusili III (Hittite Empire)", "King Priam (Troy)"],
    modernConnection: "Like global supply chains today, Bronze Age civilizations depended on international trade. Disease also spread along trade routes - the first 'globalization.'"
  },
  '-1200': {
    title: "Bronze Age Collapse - Catastrophic Systems Failure",
    description: "'Sea Peoples' (unidentified invaders from the sea) destroyed cities across the Mediterranean. The Hittite Empire collapsed completely. Egypt survived but was weakened. In the chaos, new peoples emerged: Israelites, Phoenicians, and Spartans.",
    whyItMatters: "This is one of history's great mysteries: within 50 years, almost every major Bronze Age civilization collapsed. This is a warning about how interconnected systems can fail catastrophically.",
    realWorldImpact: "Troy destroyed. The Hittite capital Hattusa burned and abandoned. Mycenaean Greek palaces destroyed. Egypt's Pharaoh Ramesses III barely repelled the Sea Peoples. Writing disappeared in Greece for 400 years (the 'Dark Age').",
    primarySources: [
      "Ramesses III's mortuary temple: 'The foreign countries made a conspiracy... no land could stand before their arms'"
    ],
    keyFigures: ["Sea Peoples (identity unknown)", "Ramesses III (Egypt)"],
    modernConnection: "Like the 2008 financial crisis or climate change today, systemic shocks to interconnected systems can cascade catastrophically."
  },
  '-1000': {
    title: "Iron Age Begins - New Metal, New Empires",
    description: "Iron-working spread after the collapse of Bronze Age trade networks. Iron ore was common, democratizing metalworking. Major religions began to form: Judaism solidified its monotheistic tradition.",
    whyItMatters: "Iron was cheaper and more available than bronze, changing warfare and agriculture. This era saw the emergence of the Hebrew Bible, Zoroastrianism, and philosophical traditions in Greece, China, and India.",
    realWorldImpact: "King David established Jerusalem as Israel's capital. The Phoenicians created the alphabet. Homer's Iliad and Odyssey were composed. Assyria rebuilt as a military powerhouse using iron weapons.",
    keyFigures: ["King David (Israel)", "Homer (Greece)", "Phoenician traders"],
    modernConnection: "Like how plastic democratized manufacturing, iron democratized metalworking. Religions founded in this era (Judaism, Zoroastrianism) still influence billions today."
  },
  '-825': {
    title: "Neo-Assyrian Empire - Military Superpower",
    description: "Assyria became history's first true empire through ruthless military efficiency. Iron weapons, cavalry, siege engines, and psychological warfare (deportation of conquered peoples) made them seemingly invincible. But their brutality bred hatred.",
    whyItMatters: "Assyria demonstrated that military might could create empires, but also that fear alone cannot sustain them. They pioneered many military innovations that would be used for millennia.",
    realWorldImpact: "Assyria conquered from Egypt to Persia. They built massive cities (Nineveh had 100,000+ people). Libraries preserved Mesopotamian literature. But their cruelty made them despised.",
    keyFigures: ["Tiglath-Pileser III", "Sargon II", "Ashurbanipal"],
    modernConnection: "Empires built purely on military force eventually collapse - a lesson repeated throughout history."
  },
  '-670': {
    title: "Scythian Invasions - War is Declared",
    description: "Nomadic horse warriors from the Central Asian steppes (Scythians, Cimmerians) invaded settled civilizations. Their mobility and archery made them nearly impossible to defeat in open battle. This marks the beginning of conflicts between civilizations in our simulation.",
    whyItMatters: "Steppe nomads would terrorize settled civilizations for 2,500 years (until gunpowder). Their way of war - hit-and-run cavalry tactics - shaped how sedentary empires developed defenses (like the Great Wall of China).",
    realWorldImpact: "Scythian raids destabilized Anatolia and the Near East. They introduced trousers and cavalry warfare to the Mediterranean world.",
    keyFigures: ["Scythian warriors", "Steppe nomad cultures"],
    modernConnection: "Like modern mechanized warfare, mounted nomads had a mobility advantage that took centuries to counter."
  },
  '-560': {
    title: "Rise of Carthage and Decline of Assyria",
    description: "The Phoenician colony of Carthage became a Mediterranean power through trade and naval dominance. Meanwhile, the hated Assyrian Empire fell to a coalition of Babylonians and Medes.",
    whyItMatters: "Carthage would challenge Rome for Mediterranean dominance 300 years later. Assyria's fall showed that even superpowers can collapse suddenly.",
    realWorldImpact: "Carthage controlled trade routes from Spain to Sicily. Nebuchadnezzar II rebuilt Babylon with the Hanging Gardens. Assyria was destroyed so thoroughly that only ruins remained.",
    keyFigures: ["Nebuchadnezzar II (Babylon)", "Hamilcar (Carthage)"],
    modernConnection: "Carthage's mercantile empire was like a modern trading corporation with colonies."
  },
  '-480': {
    title: "Classical Period - Greece vs. Persia",
    description: "The Persian Empire (largest empire yet seen) invaded Greece, but was defeated at Marathon (490 BCE) and Salamis (480 BCE). These battles saved Greek independence and allowed Greek culture to flourish. Population growth intensified as cities grew.",
    whyItMatters: "If Persia had conquered Greece, Western civilization as we know it might not exist. Democracy, philosophy, and scientific thinking might not have spread.",
    realWorldImpact: "The Greek victories led to the Golden Age of Athens: Socrates, Plato, Aristotle, the Parthenon, democracy, theater, and scientific thinking. Houses now support 2 population as cities grow larger.",
    primarySources: [
      "Herodotus: 'The Spartans sent 300 men to Thermopylae... they held the pass for three days'"
    ],
    keyFigures: ["Leonidas (Sparta)", "Themistocles (Athens)", "Xerxes (Persia)"],
    modernConnection: "Like the Cold War, this was a clash between different political systems. Ideas matter as much as military power."
  },
  '-375': {
    title: "Warring States Period and Greek Philosophy",
    description: "China fragmented into competing kingdoms (Warring States period), spurring military innovation and philosophical development. In Greece, Socrates, Plato, and later Aristotle revolutionized philosophy.",
    whyItMatters: "Competition drives innovation. China's warfare accelerated military technology. Greek competition in ideas created Western philosophy. Both cultures developed ethical frameworks that still influence us.",
    realWorldImpact: "Confucius emphasized moral leadership and education. Plato envisioned ideal government. Chinese states built walls (proto-Great Wall) and developed bureaucratic administration.",
    keyFigures: ["Confucius", "Plato", "Socrates", "Sun Tzu"],
    modernConnection: "Both Confucianism and Platonism ask: 'What is the best way to organize society?' Questions we still debate today."
  }
};
