/**
 * PRIMARY SOURCES - Ancient World Simulation
 *
 * One primary source snippet per world event turn (1-24). All excerpts are
 * drawn from public-domain translations of classical and ancient texts, or
 * from short paraphrased descriptions of artifacts where no contemporary
 * text exists.
 *
 * Pedagogical framework: Stanford History Education Group's "Reading Like a
 * Historian" (Wineburg). Each source is paired with:
 *   - sourcingQuestion (Who wrote this? When? For what purpose?)
 *   - contextQuestion (What was happening when this was written?)
 *   - analysisPrompt (close reading / corroboration / what does language
 *     choice reveal?)
 *
 * Tagged for classroom use against NCSS C3, AP World History, and Common
 * Core ELA Reading Standards for Literacy in History/Social Studies (RH).
 */

import type { PrimarySource } from './types';

export const PRIMARY_SOURCES: PrimarySource[] = [
  // ===== TURN 1 — First Settlements (8500 BC) =====
  {
    turn: 1,
    excerpt:
      '"After the kingship descended from heaven, the kingship was in Eridu. In Eridu, Alulim became king; he ruled for 28,800 years."',
    attribution: 'Sumerian King List, c. 2100 BCE (Weld-Blundell Prism translation)',
    sourceType: 'inscription',
    sourcingQuestion:
      'Sumerian scribes wrote this list nearly 6,000 years after the events it claims to describe. What does that gap tell us about its reliability?',
    contextQuestion:
      'Why might a later civilization need a list connecting its kings back to the gods?',
    analysisPrompt:
      'A 28,800-year reign is impossible. Is this source useless, or does the exaggeration itself teach us something about what Sumerians believed about kingship?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 2 — Agricultural Revolution (4500 BC) =====
  {
    turn: 2,
    excerpt:
      '"When you are about to cultivate your field, take care to open the irrigation works so that the water does not rise too high in it. When you have emptied it of water, watch the field\'s wet ground that it stays even."',
    attribution: 'Sumerian Farmer\'s Almanac, c. 1700 BCE (Kramer translation)',
    sourceType: 'literary',
    sourcingQuestion:
      'This was written long after farming began. Why might a Sumerian scribe still need to record instructions farmers had been following for thousands of years?',
    contextQuestion:
      'What does the careful attention to water levels tell us about the geography of Mesopotamia?',
    analysisPrompt:
      'Compare the technical detail here to how a modern farming manual reads. What do farmers always have to learn, regardless of century?',
    historicalThinkingTag: 'close_reading',
  },

  // ===== TURN 3 — Age of Walls (2750 BC) =====
  {
    turn: 3,
    excerpt:
      '"Climb upon the wall of Uruk; walk along it, I say; regard the foundation terrace and examine the masonry. Is it not burnt brick and good? Did not the Seven Sages lay its foundations?"',
    attribution: 'Epic of Gilgamesh, Tablet I, c. 2100 BCE',
    sourceType: 'literary',
    sourcingQuestion:
      'The narrator addresses YOU directly. Who is the intended audience, and why open the epic with a tour of the city walls?',
    contextQuestion:
      'Walls cost enormous labor. What did building them mean for the people of Uruk politically and economically?',
    analysisPrompt:
      'The text credits the "Seven Sages" — divine beings — with the foundations. What is the writer claiming about the city by linking its walls to the gods?',
    historicalThinkingTag: 'close_reading',
  },

  // ===== TURN 4 — The Great Flood (2250 BC) =====
  {
    turn: 4,
    excerpt:
      '"For six days and seven nights came the wind and flood, the storm flattening the land. When the seventh day arrived, the storm was pounding... Quiet as the dead, the people choked the sea."',
    attribution: 'Epic of Gilgamesh, Tablet XI (Flood Tablet), c. 2100 BCE',
    sourceType: 'literary',
    sourcingQuestion:
      'This flood story was written more than a thousand years before the Hebrew Bible. What might explain similar stories appearing in different cultures?',
    contextQuestion:
      'Mesopotamia experienced devastating river floods. How might survivors of real floods have shaped the story?',
    analysisPrompt:
      'Compare this account with Genesis 6-9. List two specific similarities and one difference. What does each suggest about the relationship between the texts?',
    historicalThinkingTag: 'corroboration',
  },

  // ===== TURN 5 — Bronze Age Dawns (1850 BC) =====
  {
    turn: 5,
    excerpt:
      '"If a man has put out the eye of a free man, his eye shall be put out. If he has shattered the limb of a free man, his limb shall be shattered. If he has put out the eye of a commoner, he shall pay one mina of silver."',
    attribution: 'Code of Hammurabi, Laws 196-198, c. 1754 BCE (Babylon)',
    sourceType: 'legal',
    sourcingQuestion:
      'Hammurabi had this code carved on a stone pillar in a public square. Who could read it? Who was it really for?',
    contextQuestion:
      'Bronze Age cities were getting larger and more complex. Why might written laws matter more in a city than in a small village?',
    analysisPrompt:
      'Notice how punishment depends on the social class of the victim. What does that tell us about Babylonian society — and what would change if these laws applied equally to everyone?',
    historicalThinkingTag: 'close_reading',
  },

  // ===== TURN 6 — Eruption of Thera (1600 BC) =====
  {
    turn: 6,
    excerpt:
      '"There occurred violent earthquakes and floods; and in a single day and night... the island of Atlantis disappeared into the depths of the sea."',
    attribution: 'Plato, Timaeus 25c-d, c. 360 BCE',
    sourceType: 'literary',
    sourcingQuestion:
      'Plato wrote this more than a thousand years after the Thera eruption. How could a memory survive that long, and what would change in the retelling?',
    contextQuestion:
      'Plato lived in Athens, which had absorbed many older Aegean traditions. What might have made the Atlantis story useful to him as a teacher?',
    analysisPrompt:
      'Many historians now connect Atlantis to the real eruption of Thera. Should we treat Plato\'s account as history, myth, or both? Defend your answer.',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 7 — Age of Wonders (1300 BC) =====
  {
    turn: 7,
    excerpt:
      '"I was alone; no prince was with me, no charioteer, no officer of infantry. My troops had abandoned me; not one of my chariotry looked toward me. But I called out to my father Amun: \'What of these Asiatics, O Amun? They know not god!\'"',
    attribution: 'Pharaoh Ramesses II, Kadesh Inscription, c. 1274 BCE',
    sourceType: 'inscription',
    sourcingQuestion:
      'This inscription was carved on temple walls across Egypt. Who was Ramesses trying to convince — his enemies, his subjects, or the gods?',
    contextQuestion:
      'The Battle of Kadesh against the Hittites was likely a draw, not a victory. Why would Ramesses spend so much temple space describing it?',
    analysisPrompt:
      'Compare this Egyptian version with the surviving Hittite account. What does the difference reveal about the limits of any single source?',
    historicalThinkingTag: 'corroboration',
  },

  // ===== TURN 8 — Bronze Age Collapse (1200 BC) =====
  {
    turn: 8,
    excerpt:
      '"The foreign countries made a conspiracy in their islands. All at once the lands were on the move, scattered in war. No land could stand before their arms, from Hatti, Kode, Carchemish, Arzawa, and Alasiya on, being cut off at one time."',
    attribution: 'Pharaoh Ramesses III, Medinet Habu inscription, c. 1175 BCE',
    sourceType: 'inscription',
    sourcingQuestion:
      'Ramesses III recorded this on his mortuary temple. What does it mean that one of our few accounts of the Bronze Age Collapse comes from the king claiming to have stopped it?',
    contextQuestion:
      'Within a generation, almost every major city of the eastern Mediterranean fell. What might cause that many civilizations to collapse at once?',
    analysisPrompt:
      'The text names places that no longer existed in any meaningful form. What does the inscription tell us about how Egypt experienced the Sea Peoples — and what does it leave out?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 9 — Iron Age & Religions (1000 BC) =====
  {
    turn: 9,
    excerpt:
      '"Hear, O Israel: The LORD our God, the LORD is one. You shall love the LORD your God with all your heart and with all your soul and with all your might."',
    attribution: 'Hebrew Bible, Deuteronomy 6:4-5 (the Shema), text c. 7th century BCE recording earlier tradition',
    sourceType: 'religious',
    sourcingQuestion:
      'Who first said this, and who first wrote it down? Why does the gap between the two matter to historians but not to believers?',
    contextQuestion:
      'Most Iron Age peoples worshipped many gods. What was radical about the claim that there is only one?',
    analysisPrompt:
      'Compare the Shema with the opening line of the Rig Veda or the Confucian Analects. What different relationship between humans and the divine does each describe?',
    historicalThinkingTag: 'corroboration',
  },

  // ===== TURN 10 — Empires Rise (825 BC) =====
  {
    turn: 10,
    excerpt:
      '"I built a pillar over against his city gate and I flayed all the chiefs who had revolted, and I covered the pillar with their skins. Some I impaled upon the pillar on stakes. Many within the border of my own land I flayed."',
    attribution: 'King Ashurnasirpal II of Assyria, royal annals, c. 875 BCE',
    sourceType: 'inscription',
    sourcingQuestion:
      'The king himself ordered these annals carved. Why would a ruler want to record this kind of cruelty, and who was meant to read it?',
    contextQuestion:
      'The Assyrians built one of the first true empires by terrorizing rebels into submission. Was this account meant to be true, exaggerated, or strategic propaganda?',
    analysisPrompt:
      'Modern dictators still threaten brutal punishment publicly. What does the persistence of this strategy across 3,000 years tell us about how power works?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 11 — Age of Conquest (670 BC) =====
  {
    turn: 11,
    excerpt:
      '"I laid siege to the city of Memphis, the royal residence. I conquered it in half a day by means of mines, breaches, and assault ladders. The king of Egypt fled from before my arrows."',
    attribution: 'King Esarhaddon of Assyria, victory stele, 671 BCE',
    sourceType: 'inscription',
    sourcingQuestion:
      'Esarhaddon conquered Egypt — the world\'s oldest civilization. Why might he stress the speed of his victory ("half a day")?',
    contextQuestion:
      'In 670 BCE, the Assyrian Empire was the largest the world had ever seen. What kept it together besides military force?',
    analysisPrompt:
      'Within sixty years of this inscription, Assyria itself collapsed. What does that tell us about the limits of empire built on conquest alone?',
    historicalThinkingTag: 'contextualization',
  },

  // ===== TURN 12 — Power Shifts (560 BC) =====
  {
    turn: 12,
    excerpt:
      '"I am Cyrus, king of the world, great king, legitimate king, king of Babylon... I returned to these sacred cities the images of the gods which had used to live there, and established for them permanent sanctuaries. I gathered all their inhabitants and returned to them their dwellings."',
    attribution: 'Cyrus Cylinder, Cyrus the Great, 539 BCE',
    sourceType: 'inscription',
    sourcingQuestion:
      'Cyrus had this written in Babylonian, not Persian. What does that choice tell us about who he wanted to persuade?',
    contextQuestion:
      'The Assyrians had deported peoples to break their identities. How is Cyrus\'s policy of returning peoples and gods a deliberate contrast?',
    analysisPrompt:
      'Some call this "the first declaration of human rights." Others call it sophisticated propaganda. Read it once each way — which interpretation does the text actually support?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 13 — The Persian Wars (480 BC) =====
  {
    turn: 13,
    excerpt:
      '"Forward, sons of the Hellenes! Free your fatherland, free your children, your wives, the temples of your fathers\' gods, the tombs of your ancestors. The struggle is for all!"',
    attribution: 'Aeschylus, The Persians, lines 402-405, performed 472 BCE',
    sourceType: 'literary',
    sourcingQuestion:
      'Aeschylus fought at the Battle of Salamis himself. How does that change how you read his play about it eight years later?',
    contextQuestion:
      'The play was performed in Athens, where the audience included Salamis veterans. Why stage the enemy\'s defeat as theater?',
    analysisPrompt:
      'This speech defines Greek identity by what it is NOT (Persian). How does defining yourself against an enemy still shape national identity today?',
    historicalThinkingTag: 'close_reading',
  },

  // ===== TURN 14 — Hellenism Spreads (375 BC) =====
  {
    turn: 14,
    excerpt:
      '"The unexamined life is not worth living for a human being."',
    attribution: 'Socrates, quoted in Plato\'s Apology 38a, c. 399 BCE',
    sourceType: 'literary',
    sourcingQuestion:
      'Socrates wrote nothing himself; everything we have is from his student Plato. How does that complicate calling these "the words of Socrates"?',
    contextQuestion:
      'Socrates said this at his trial, after being condemned to death. What does it mean that he chose this argument as his final defense?',
    analysisPrompt:
      'Plato could have written anything he wanted Socrates to say. Why preserve a line that didn\'t save him? What is Plato trying to teach the next generation?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 15 — Alexander the Great (325 BC) =====
  {
    turn: 15,
    excerpt:
      '"It is my will that you should all be at peace with one another and that Macedonians and Persians should rule together as partners in empire... I pray for harmony and partnership in rule between Macedonians and Persians."',
    attribution: 'Alexander the Great at Opis, reported in Arrian, Anabasis 7.11, c. 324 BCE',
    sourceType: 'historical',
    sourcingQuestion:
      'Arrian wrote this 400 years after Alexander died, drawing on lost earlier sources. What survives of Alexander\'s actual voice in this report?',
    contextQuestion:
      'Alexander\'s Macedonian soldiers were mutinying because they hated his policy of treating Persians as equals. What does that conflict tell us about the cost of empire?',
    analysisPrompt:
      'Alexander ruled the largest empire the West had yet seen but died at 32 with no plan for succession. Was his vision of Greco-Persian unity realistic, or was it always going to fail?',
    historicalThinkingTag: 'contextualization',
  },

  // ===== TURN 16 — Successor Wars (301 BC) =====
  {
    turn: 16,
    excerpt:
      '"After the battle of Ipsus, the body of Antigonus, pierced by countless javelins, lay in the dust. His son Demetrius fled with what cavalry he could gather. Thus the empire of Alexander, divided once more, was divided again."',
    attribution: 'Plutarch, Life of Demetrius, c. 100 CE (describing 301 BCE)',
    sourceType: 'historical',
    sourcingQuestion:
      'Plutarch wrote biographies for moral instruction, not pure history. How does that purpose shape what he chooses to include?',
    contextQuestion:
      'Within twenty years of Alexander\'s death, his generals fought four major wars over his empire. Why couldn\'t any of them hold it together?',
    analysisPrompt:
      'The Hellenistic kingdoms that emerged spread Greek culture across three continents. Did Alexander\'s "failure" of succession actually multiply his impact?',
    historicalThinkingTag: 'contextualization',
  },

  // ===== TURN 17 — Punic Wars Begin (270 BC) =====
  {
    turn: 17,
    excerpt:
      '"The two cities met for the first time in open conflict over Sicily, and that island became the stage of their long and obstinate quarrel. From that moment, neither would yield, and the war ran on for twenty-four years."',
    attribution: 'Polybius, Histories Book 1, c. 140 BCE (describing 264-241 BCE)',
    sourceType: 'historical',
    sourcingQuestion:
      'Polybius was a Greek hostage in Rome who lived through the Third Punic War. How does his outsider-insider position shape his account?',
    contextQuestion:
      'Why would two cities — Rome and Carthage — fight for 24 straight years over a single island?',
    analysisPrompt:
      'Polybius\'s explanation focuses on rivalry. What economic, military, and political reasons might also explain why the conflict could not be resolved short of war?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 18 — Roman Expansion (220 BC) =====
  {
    turn: 18,
    excerpt:
      '"The snow already lying on the ground made everything look alike, and the tracks of those who had passed before had been completely lost. Beasts of burden and many of the men slipped and fell down the precipices."',
    attribution: 'Polybius, Histories Book 3, on Hannibal crossing the Alps, c. 218 BCE',
    sourceType: 'historical',
    sourcingQuestion:
      'Polybius interviewed survivors and walked parts of Hannibal\'s route. How does that on-the-ground research change our trust in his account?',
    contextQuestion:
      'Hannibal lost about half his army crossing the Alps. Why attempt a route this dangerous instead of attacking by sea?',
    analysisPrompt:
      'Hannibal won every major battle in Italy for fifteen years and still lost the war. What does that tell us about the difference between winning battles and winning wars?',
    historicalThinkingTag: 'corroboration',
  },

  // ===== TURN 19 — Imperial Consolidation (145 BC) =====
  {
    turn: 19,
    excerpt:
      '"Scipio, looking upon Carthage burning, wept openly... and turning to me he took my hand and said, \'A glorious moment, Polybius — and yet I am seized with fear that one day someone will give the same order about my own country.\'"',
    attribution: 'Polybius, Histories Book 38, eyewitness to the destruction of Carthage, 146 BCE',
    sourceType: 'eyewitness',
    sourcingQuestion:
      'Polybius is one of very few classical historians who recorded a private moment he personally witnessed. What changes when an account is firsthand instead of secondhand?',
    contextQuestion:
      'Rome had just won total victory. Why would the conqueror weep at his enemy\'s destruction?',
    analysisPrompt:
      'Scipio\'s fear came true: Rome was sacked four centuries later. Was he wise, or did he speak a self-fulfilling prophecy?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 20 — Age of Heroes (74 BC) =====
  {
    turn: 20,
    excerpt:
      '"Spartacus was a Thracian... a man not only brave and strong, but also, in intelligence and gentleness, superior to his fortune, and more like a Greek than one would expect of a barbarian."',
    attribution: 'Plutarch, Life of Crassus 8, c. 100 CE (describing 73 BCE)',
    sourceType: 'historical',
    sourcingQuestion:
      'Plutarch was a Roman citizen writing about a slave who terrified Rome. What biases would you expect in his portrait?',
    contextQuestion:
      'At its peak, Spartacus\'s revolt included 70,000 enslaved people. What does the size of the rebellion tell us about Roman society?',
    analysisPrompt:
      'Plutarch admits Spartacus was admirable. Why would a Roman writer praise an enemy of Rome — and how does the phrase "more like a Greek than a barbarian" still reveal his prejudice?',
    historicalThinkingTag: 'close_reading',
  },

  // ===== TURN 21 — Civil War (44 BC) =====
  {
    turn: 21,
    excerpt:
      '"Some have written that when Marcus Brutus rushed at him, he said in Greek, \'You too, my child?\' Then, drawing his toga over his head, he sank down with twenty-three wounds."',
    attribution: 'Suetonius, Life of Julius Caesar 82, c. 121 CE (describing the Ides of March, 44 BCE)',
    sourceType: 'historical',
    sourcingQuestion:
      'Suetonius wrote 165 years after the assassination. He also says "some have written" — what does that hedge tell you about the source\'s reliability?',
    contextQuestion:
      'Caesar was killed by senators who feared he would become king. Why did the assassination not save the Republic?',
    analysisPrompt:
      'Shakespeare gave us "Et tu, Brute?" but Suetonius records Caesar speaking Greek. Which version do most people remember, and what does that say about how history gets told?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 22 — Imperial Zenith & Christianity (14 AD) =====
  {
    turn: 22,
    excerpt:
      '"At the age of nineteen, on my own initiative and at my own expense, I raised an army by means of which I liberated the Republic, which was oppressed by the tyranny of a faction... I waged many wars throughout the whole world, and I spared all citizens who asked for pardon."',
    attribution: 'Augustus, Res Gestae Divi Augusti (My Achievements), composed before 14 CE',
    sourceType: 'inscription',
    sourcingQuestion:
      'Augustus wrote his own list of accomplishments. Where would you expect him to exaggerate, and where might he be telling the truth?',
    contextQuestion:
      'The "tyranny of a faction" was Mark Antony. Augustus crushed his rivals to end the civil wars — but he kept the title "Princeps" (first citizen) instead of "King." Why?',
    analysisPrompt:
      'Augustus claims to have "restored the Republic." His successors held absolute power for the next 400 years. Was this a lie, a useful fiction, or a brilliant compromise?',
    historicalThinkingTag: 'sourcing',
  },

  // ===== TURN 23 — Plague and Crisis (138 AD) =====
  {
    turn: 23,
    excerpt:
      '"Of human life, the time is a point, the substance a flux, the perception dim, the composition of the body corruptible, the soul a whirl, fortune hard to predict, and fame uncertain. To put it briefly: all things of the body are a stream, all things of the soul a dream and vapor."',
    attribution: 'Marcus Aurelius, Meditations 2.17, c. 170-180 CE (during the Antonine Plague)',
    sourceType: 'literary',
    sourcingQuestion:
      'Marcus Aurelius was Emperor of Rome at its peak — and wrote this private diary while the empire was being ravaged by plague. Why write privately if you have absolute power?',
    contextQuestion:
      'The Antonine Plague killed perhaps 5 million people, including the co-emperor. How would constant funerals reshape an emperor\'s view of his own greatness?',
    analysisPrompt:
      'Stoic philosophy taught acceptance of death and impermanence. Did this make Marcus Aurelius a better emperor, or did it make him passive in the face of crisis?',
    historicalThinkingTag: 'contextualization',
  },

  // ===== TURN 24 — The Fall (362 AD) =====
  {
    turn: 24,
    excerpt:
      '"The most glorious city of God I have undertaken to defend against those who prefer their own gods to the Founder of this city... when the savage Goths sacked the city of Rome, all those who blasphemed Christ blamed the Christian religion for the disaster."',
    attribution: 'Augustine of Hippo, City of God, Book 1 Preface, written 413-426 CE (after the Sack of Rome 410 CE)',
    sourceType: 'religious',
    sourcingQuestion:
      'Augustine wrote this in North Africa, not Rome. Why would a bishop on the edge of the empire write the most influential explanation of why Rome fell?',
    contextQuestion:
      'For a thousand years, Romans believed the gods would always protect Rome. What needed to change in their thinking after 410 CE?',
    analysisPrompt:
      'Pagan Romans blamed Christians for the fall. Christians blamed pagans. Modern historians blame economics, climate, disease, and military overstretch. Which explanation is best supported — or do they all matter together?',
    historicalThinkingTag: 'corroboration',
  },
];

/** Look up the primary source for a given turn (1-24). Returns null if none. */
export function getPrimarySourceForTurn(turn: number): PrimarySource | null {
  return PRIMARY_SOURCES.find((s) => s.turn === turn) || null;
}
