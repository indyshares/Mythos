import { NoteTemplate } from '../types';

export const TEMPLATE_LIBRARY: NoteTemplate[] = [
  {
    id: 'tpl-character',
    name: 'Character Profile',
    category: 'Novel',
    description: 'Complete protagonist or antagonist dossier with motivations, relationships, and arc.',
    icon: 'User',
    defaultFilename: 'New Character.md',
    templateContent: `---
id: CHAR-{{DATE_ID}}
title: Character Name
type: character
status: active
tags:
  - character
  - protagonist
related: []
created_at: {{ISO_DATE}}
updated_at: {{ISO_DATE}}
---

# Character Profile: [Character Name]

## 1. Basic Information
- **Full Name:**
- **Aliases / Epithets:**
- **Age & Birthplace:**
- **Faction / Affiliation:**
- **Role in Story:**

## 2. Appearance & Presence
- **Physical Features:**
- **Attire & Relics:**
- **Mannerisms / Voice:**

## 3. Psychology & Personality
- **Core Motivation:**
- **Fatal Flaw:**
- **What they want vs What they actually need:**
- **Moral Alignment:**

## 4. Abilities & Combat / Magic
- **Affinities:**
- **Known Techniques:**
- **Limitations & Costs:**

## 5. Key Relationships
- **[[Lysander]]:** Mentor and keeper of the ash vows.
- **Rivals / Enemies:**

## 6. Narrative Arc
- **Beginning State:**
- **Catalyst Event:**
- **Climax / Transformation:**
`,
  },
  {
    id: 'tpl-worldbuilding-location',
    name: 'Location & Geography',
    category: 'Worldbuilding',
    description: 'Detailed kingdom, citadel, sanctuary, or settlement worldbuilding note.',
    icon: 'MapPin',
    defaultFilename: 'New Location.md',
    templateContent: `---
id: LOC-{{DATE_ID}}
title: Location Name
type: location
status: active
tags:
  - worldbuilding
  - geography
related: []
created_at: {{ISO_DATE}}
updated_at: {{ISO_DATE}}
---

# Location: [Location Name]

## 1. Overview
- **Region:**
- **Dominant Governance:**
- **Primary Climate & Terrain:**

## 2. Atmosphere & Architecture
- **Sensory Impressions:** (Scents, ambient sounds, lighting)
- **Architectural Style:**
- **Prominent Landmarks:**

## 3. Culture & Society
- **Demographics:**
- **Customs & Taboos:**
- **Economy & Trade Goods:**

## 4. Secrets & Lore
- **Forgotten History:**
- **Active Conflicts:**
- **Associated Rumors:**
`,
  },
  {
    id: 'tpl-magic-system',
    name: 'Magic System / Artifact',
    category: 'Worldbuilding',
    description: 'Laws of sorcery, elemental filaments, artifacts, and cosmic costs.',
    icon: 'Sparkles',
    defaultFilename: 'New System.md',
    templateContent: `---
id: MAG-{{DATE_ID}}
title: Magic Discipline
type: worldbuilding
status: active
tags:
  - magic-system
  - worldbuilding
related: []
created_at: {{ISO_DATE}}
---

# Magic System: [Discipline Name]

## 1. The Fundamental Law
- **Source of Power:** (e.g., Celestial dust, bloodlines, runic resonance)
- **Initiation / Awakening:**

## 2. Mechanics of Casting
- **Required Medium:** (Words, incantations, ether filaments)
- **Speed & Scale:**

## 3. The Irrevocable Cost
- **Physical Toll:**
- **Mental / Spiritual Degradation:**
- **Forbidden Practices:**
`,
  },
  {
    id: 'tpl-story-event',
    name: 'Timeline Event',
    category: 'Story Planning',
    description: 'Chronological story milestone with story date, participants, and fallout.',
    icon: 'Calendar',
    defaultFilename: 'New Event.md',
    templateContent: `---
id: EVT-{{DATE_ID}}
title: Event Name
type: event
status: planned
story_date: "Year 420, Era of Embers"
tags:
  - event
  - timeline
related: []
created_at: {{ISO_DATE}}
---

# Event: [Event Name]

## 1. Chronology
- **Story Date / Timestamp:** Year 420
- **Location:** [[Worldbuilding/Aethelgard Citadel]]
- **Status:** Planned / Occurred / Concluded

## 2. Participants
- **Instigator:** [[Lucia]]
- **Witnesses / Opponents:**

## 3. What Transpires
Summary of actions and turning points.

## 4. Consequences & Fallout
- **Immediate Outcome:**
- **Long-term Ripple Effects:**
- **Subsequent Chain Reaction:**
`,
  },
  {
    id: 'tpl-writing-log',
    name: 'Writing Log & Session',
    category: 'Notes & Logs',
    description: 'Daily author writing sprint tracker with word count target and thoughts.',
    icon: 'PenTool',
    defaultFilename: '{{CURRENT_DATE}}_Writing_Log.md',
    templateContent: `---
id: LOG-{{DATE_ID}}
date: {{CURRENT_DATE}}
time: "{{CURRENT_TIME}}"
type: writing-log
status: completed
words_written: 0
tags:
  - writing-log
  - session
created_at: {{ISO_DATE}}
---

# Writing Session: {{CURRENT_DATE}}

## Goals for Today
- [ ] Draft Scene: 
- [ ] Target Words: 1,500 words
- [ ] Clarify [[Lucia]]'s conflict

## Progress Notes
- **Actual Words:** 
- **Time Spent:** 

## Breakthroughs & Ideas
Key revelations or phrasing discovered during this session.

## Next Scene Preview
Where does the pen start tomorrow?
`,
  },
  {
    id: 'tpl-journal-daily',
    name: 'Daily Note & Reflection',
    category: 'Notes & Logs',
    description: 'Quick stream-of-consciousness capture for daily thoughts and observations.',
    icon: 'BookOpen',
    defaultFilename: '{{CURRENT_DATE}}.md',
    templateContent: `---
id: NOTE-{{DATE_ID}}
date: {{CURRENT_DATE}}
type: journal
tags:
  - daily
  - journal
created_at: {{ISO_DATE}}
---

# Daily Note — {{CURRENT_DATE}}

## Quick Thoughts
- 

## Tasks & Focus
- [ ] 
- [ ] 

## Notes & Observations
Captured snippets from reading and research.
`,
  },
  {
    id: 'tpl-quest-promise',
    name: 'Oath / Quest Tracker',
    category: 'Story Planning',
    description: 'Track binding vows, covenants, character obligations, and task statuses.',
    icon: 'Shield',
    defaultFilename: 'New Oath.md',
    templateContent: `---
id: OATH-{{DATE_ID}}
title: The Ashbound Covenant
type: promise
status: active
story_date: "Year 418"
tags:
  - oath
  - promise
  - quest
related:
  - CHAR-0001
created_at: {{ISO_DATE}}
---

# Oath: [Oath Title]

- **Status:** Active / Fulfilled / Broken / Expired
- **Pledged By:** [[Lucia]]
- **Pledged To:** [[Lysander]]
- **The Terms:** What was promised?
- **The Penalty for Breach:**
- **Resolution Conditions:**
`,
  },
];

export function applyTemplate(template: NoteTemplate): { filename: string; content: string } {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const dateId = `${dateStr.replace(/-/g, '')}-${randomSuffix}`;
  const isoDate = now.toISOString();

  let filename = template.defaultFilename
    .replace(/\{\{CURRENT_DATE\}\}/g, dateStr)
    .replace(/\{\{CURRENT_TIME\}\}/g, timeStr.replace(':', '-'))
    .replace(/\{\{DATE_ID\}\}/g, dateId);

  let content = template.templateContent
    .replace(/\{\{CURRENT_DATE\}\}/g, dateStr)
    .replace(/\{\{CURRENT_TIME\}\}/g, timeStr)
    .replace(/\{\{DATE_ID\}\}/g, dateId)
    .replace(/\{\{ISO_DATE\}\}/g, isoDate);

  return { filename, content };
}
