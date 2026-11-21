import { Workspace, Folder, FileItem, WorkspaceInstructions } from '../types';

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-dust-of-sorcery',
    name: 'ธุลีมนตรา (Dust of Sorcery)',
    description: 'Dark fantasy novel workspace exploring embercraft, ancient vows, and forgotten citadels.',
    icon: 'Flame',
    createdAt: '2026-10-25T08:00:00Z',
    updatedAt: '2026-10-31T09:00:00Z',
  },
  {
    id: 'ws-personal-knowledge',
    name: 'Personal Knowledge',
    description: 'Second brain, technical research papers, daily reading notes, and atomic thoughts.',
    icon: 'Brain',
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-31T07:15:00Z',
  },
  {
    id: 'ws-project-alpha',
    name: 'Project Alpha',
    description: 'System architecture specifications, sprint agendas, and technical documentation.',
    icon: 'Layers',
    createdAt: '2026-10-29T14:30:00Z',
    updatedAt: '2026-10-30T16:20:00Z',
  },
];

export const INITIAL_INSTRUCTIONS: Record<string, WorkspaceInstructions> = {
  'ws-dust-of-sorcery': {
    workspaceId: 'ws-dust-of-sorcery',
    content: `# Workspace Instructions: ธุลีมนตรา

You are an assistant for this fantasy novel workspace.

## Role
Act as a novel development, worldbuilding consistency, and narrative continuity assistant.

## Rules
- Use the current workspace files as the primary knowledge source.
- Distinguish confirmed facts from assumptions.
- Proactively identify character continuity conflicts, timeline discrepancies, or magic system violations.
- Cite source file paths whenever answering (e.g. "[Characters/Lucia.md]").
- Never suggest destructive actions; you are strictly read-only.

## Response Style
- Respond in Thai (or English if prompted in English).
- Be analytical, evocative, and precise.
- Highlight relationships and unresolved narrative threads.`,
    updatedAt: '2026-10-31T08:00:00Z',
  },
  'ws-personal-knowledge': {
    workspaceId: 'ws-personal-knowledge',
    content: `# Workspace Instructions: Personal Knowledge

Act as an executive research companion. Synthesize notes across domains, identify common mental models, and cite original entry timestamps.`,
    updatedAt: '2026-10-28T10:00:00Z',
  },
};

export const INITIAL_FOLDERS: Folder[] = [
  // ธุลีมนตรา Folders
  {
    id: 'f-chars',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: null, // Root
    name: 'Characters',
    createdAt: '2026-10-25T08:05:00Z',
    updatedAt: '2026-10-25T08:05:00Z',
  },
  {
    id: 'f-world',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: null, // Root
    name: 'Worldbuilding',
    createdAt: '2026-10-25T08:10:00Z',
    updatedAt: '2026-10-25T08:10:00Z',
  },
  {
    id: 'f-planning',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: null, // Root
    name: 'Story Planning',
    createdAt: '2026-10-25T08:15:00Z',
    updatedAt: '2026-10-25T08:15:00Z',
  },
  {
    id: 'f-notes',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: null, // Root
    name: 'Notes',
    createdAt: '2026-10-25T08:20:00Z',
    updatedAt: '2026-10-25T08:20:00Z',
  },
  {
    id: 'f-manuscript',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: null, // Root
    name: 'Manuscript',
    createdAt: '2026-10-25T08:25:00Z',
    updatedAt: '2026-10-25T08:25:00Z',
  },

  // Personal Knowledge Folders
  {
    id: 'f-pk-research',
    workspaceId: 'ws-personal-knowledge',
    parentId: null,
    name: 'Research',
    createdAt: '2026-10-28T10:05:00Z',
    updatedAt: '2026-10-28T10:05:00Z',
  },
  {
    id: 'f-pk-journal',
    workspaceId: 'ws-personal-knowledge',
    parentId: null,
    name: 'Journal',
    createdAt: '2026-10-28T10:10:00Z',
    updatedAt: '2026-10-28T10:10:00Z',
  },
];

export const INITIAL_FILES: FileItem[] = [
  // ธุลีมนตรา Root File
  {
    id: 'file-overview',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: null, // Root
    name: 'Overview.md',
    extension: 'md',
    size: 940,
    version: 1,
    createdAt: '2026-10-25T08:30:00Z',
    updatedAt: '2026-10-31T07:00:00Z',
    content: `---
id: WS-OVERVIEW
title: ธุลีมนตรา Master Codex
type: general
status: active
tags:
  - novel
  - master-plan
---

# ธุลีมนตรา (Dust of Sorcery)

ยินดีต้อนรับสู่พื้นที่ทำงานหลักของนิยายแฟนตาซี *ธุลีมนตรา*

## แก่นเรื่อง (Core Logline)
เมื่อเถ้าธุลีเวทมนตร์โบราณที่เคยหลับใหลใต้ป้อมปราการ [[Aethelgard Citadel]] เริ่มปะทุขึ้นมาอีกครั้ง [[Lucia]] เด็กสาวผู้ถือครองรอยสักอักขระอัคคี ต้องเลือกระหว่างการรักษาสัตย์สาบานกับผู้ชี้นำ [[Lysander]] หรือการปลดปล่อยพลังต้องห้ามเพื่อปกป้องผู้คน

## โครงสร้างสารบัญ (Index)
- **ตัวละครหลัก:** [[Lucia]], [[Lysander]]
- **โลกและสถานที่:** [[Aethelgard Citadel]], [[Magic System]], [[History]]
- **เหตุการณ์สำคัญ:** ดูรายละเอียดใน [[Timeline]]
- **ร่างบทแรก:** [[Chapter 01 - The Ember Awakening]]
- **บันทึกประจำวัน:** ดูในโฟลเดอร์ \`Notes/\`

> "ในโลกที่เวทมนตร์ต้องแลกด้วยเถ้าธุลีวิญญาณ ผู้ที่จุดประกายไฟย่อมถูกเผาไหม้เป็นคนแรก"
`,
  },

  // Characters / Lucia.md
  {
    id: 'file-lucia',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: 'f-chars',
    name: 'Lucia.md',
    extension: 'md',
    size: 1420,
    version: 2,
    createdAt: '2026-10-25T08:35:00Z',
    updatedAt: '2026-10-31T08:12:00Z',
    content: `---
id: CHAR-0001
title: Lucia (ลูเซีย)
type: character
status: active
story_date: "Year 420, Era of Embers"
tags:
  - character
  - protagonist
  - embercraft
related:
  - CHAR-0002
  - LOC-0001
---

# Lucia of the Ashen Gate (ลูเซีย)

## ข้อมูลพื้นฐาน (Basic Info)
- **สถานะ:** ตัวเอก (Protagonist)
- **อายุ:** 19 ปี
- **สังกัด:** อดีตผู้ดูแลหอสังเกตการณ์ทิศประจิม ปัจจุบันเป็นผู้สืบทอดอักขระอัคคี
- **ที่อยู่ปัจจุบัน:** เขตชั้นนอกของ [[Aethelgard Citadel]]

## รูปลักษณ์และบุคลิกภาพ (Appearance & Traits)
ลูเซียมีผมสีดำขลับตัดสั้น ดวงตาสีอำพันสว่างวาบราวกับถ่านที่คุกรุ่น แขนขวาพันด้วยผ้าลินินสีครามเพื่อบดบังสัญลักษณ์ "รอยสักอักขระอัคคี (The Ember Rune)" 

เธอเป็นคนสุขุม พูดน้อย แต่เด็ดขาดในยามวิกฤต มีความหวาดกลัวลึก ๆ ว่าพลังในตัวจะกลืนกินสติสัมปชัญญะของตนเอง

## ความสัมพันธ์ (Relationships)
- **[[Lysander]]:** ผู้มีพระคุณและอาจารย์ ผู้ช่วยชีวิตเธอจากกองซากปรักหักพังเมื่อสิบปีก่อน ลูเซียให้สัจจะว่าจะไม่ใช้อักขระขั้นที่สามโดยไม่ได้รับอนุญาต
- **พันธนาการ:** ติดหนี้บุญคุณและคำสาบานที่มีต่อภาคีเถ้าธุลี

## พลังและความสามารถ (Abilities)
- ความเข้าใจในระบบ [[Magic System]]: สามารถสัมผัส "เส้นใยอีเธอร์ (Ether Filaments)" ที่ลอยอยู่ในอากาศ
- การควบคุมเปลวเพลิงไร้ควัน: จุดประกายไฟโดยไม่ทิ้งกลิ่นหรือร่องรอยควัน
`,
  },

  // Characters / Lysander.md
  {
    id: 'file-lysander',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: 'f-chars',
    name: 'Lysander.md',
    extension: 'md',
    size: 1280,
    version: 1,
    createdAt: '2026-10-25T08:40:00Z',
    updatedAt: '2026-10-30T14:10:00Z',
    content: `---
id: CHAR-0002
title: Lysander the Chronicler (ไลแซนเดอร์)
type: character
status: active
story_date: "Year 420, Era of Embers"
tags:
  - character
  - mentor
  - archivist
related:
  - CHAR-0001
  - LOC-0001
---

# Lysander (ไลแซนเดอร์)

## ข้อมูลทั่วไป
- **บทบาท:** นักบันทึกพงศาวดารและจอมเวทผู้รักษาพันธสัญญาโบราณ
- **อายุ:** 54 ปี
- **ตำแหน่ง:** หัวหน้าหอสมุดศิลาแห่ง [[Aethelgard Citadel]]

## อดีตและความลับ
ในอดีตไลแซนเดอร์เคยเป็นหนึ่งในคณะผู้ผนึกรอยแยกแห่งสงครามมหาหายนะ (ดู [[History]]) การผนึกครั้งนั้นทำให้ดวงตาข้างซ้ายของเขามืดบอดถาวรและกลายเป็นผลึกแก้วสีเทา

เขาคอยปกป้อง [[Lucia]] จากสายตาของสภาสูง เพราะรู้ดีว่าสายเลือดของเธอเชื่อมโยงกับปฐมกาลแห่งเถ้าธุลี

## คำสอนสำคัญ
> "จงอย่าเชื่อเสียงกระซิบที่ลอยมากับลมหนาว เพราะมันคือเสียงสะท้อนของเปลวไฟที่ดับสูญไปแล้ว"
`,
  },

  // Worldbuilding / Aethelgard Citadel.md
  {
    id: 'file-aethelgard',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: 'f-world',
    name: 'Aethelgard Citadel.md',
    extension: 'md',
    size: 1150,
    version: 1,
    createdAt: '2026-10-25T08:50:00Z',
    updatedAt: '2026-10-29T11:00:00Z',
    content: `---
id: LOC-0001
title: Aethelgard Citadel (ป้อมปราการเอเธลการ์ด)
type: location
status: active
tags:
  - worldbuilding
  - location
  - fortress
related:
  - CHAR-0001
  - CHAR-0002
---

# Aethelgard Citadel (ป้อมปราการเอเธลการ์ด)

ป้อมปราการหินทมิฬขนาดมหึมาที่สร้างขึ้นคร่อมสันเขาศิลาดำ เป็นปราการด่านสุดท้ายที่ปกป้องหุบเขาแห่งแม่น้ำอันเยียบเย็น

## เขตสำคัญ
1. **The Ash Gate (ประตูด้านหน้า):** ประตูเหล็กกล้าสูง 20 เมตรที่สลักรูนกันภัย
2. **หอสมุดศิลา (The Obsidian Archives):** ที่พำนักและห้องทำงานของ [[Lysander]]
3. **The Undercroft (ห้องใต้ดินโบราณ):** รังของเศษซากเวทมนตร์จากสงครามครั้งก่อน เป็นสถานที่ที่ [[Lucia]] มักแอบไปฝึกควบคุมเปลวไฟ

## บรรยากาศ
ท้องฟ้าเหนือป้อมมักปกคลุมด้วยหมอกหม่นและละอองเถ้าเบาบาง อากาศแห้งและเย็นยะเยือก เสียงกระดิ่งลมสำริดดังกังวานทุกครั้งที่กระแสลมเวทมนตร์ผันผวน
`,
  },

  // Worldbuilding / Magic System.md
  {
    id: 'file-magic',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: 'f-world',
    name: 'Magic System.md',
    extension: 'md',
    size: 1320,
    version: 1,
    createdAt: '2026-10-25T08:55:00Z',
    updatedAt: '2026-10-31T06:30:00Z',
    content: `---
id: MAG-0001
title: The Filament Resonance (ระบบการถักทอเส้นใยอีเธอร์)
type: worldbuilding
status: active
tags:
  - magic-system
  - worldbuilding
---

# กฎเกณฑ์แห่งมนตรา: การถักทอเส้นใยอีเธอร์

## 1. หลักการพื้นฐาน
เวทมนตร์ในโลกนี้มิได้เกิดขึ้นจากความว่างเปล่า แต่ต้องอาศัยการดึง **"เส้นใยอีเธอร์ (Ether Filaments)"** ซึ่งเป็นเศษพลังงานตกค้างจากการสร้างโลกมาร้อยเรียงเข้ากับพลังปราณของผู้ร่าย

## 2. อักขระสามระดับ (The Three Runes)
- **ระดับที่หนึ่ง (Spark):** การสร้างประกายไฟและความร้อนพื้นฐาน ปลอดภัยต่อร่างกาย
- **ระดับที่สอง (Flame Weaving):** การขึ้นรูปเปลวเพลิงเป็นอาวุธหรือม่านป้องกัน ต้องใช้สมาธิสูง
- **ระดับที่สาม (The Ashbound Cataclysm):** การสละเนื้อเยื่อเพื่อแลกกับพลังทำลายล้างขั้นสุด เป็นวิชาต้องห้ามที่ [[Lysander]] สั่งห้ามไม่ให้ [[Lucia]] เรียกใช้

## 3. ต้นทุนและผลข้างเคียง (The Cost)
ทุกครั้งที่ใช้เวทมนตร์ เลือดของผู้ใช้จะค่อย ๆ ตกผลึกเป็นเถ้าถ่าน หากใช้เกินขีดจำกัด ผิวหนังจะเปลี่ยนเป็นสีเทาและไร้ความรู้สึก
`,
  },

  // Worldbuilding / History.md
  {
    id: 'file-history',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: 'f-world',
    name: 'History.md',
    extension: 'md',
    size: 1100,
    version: 1,
    createdAt: '2026-10-25T09:00:00Z',
    updatedAt: '2026-10-28T09:00:00Z',
    content: `---
id: HIST-0001
title: ลำดับประวัติศาสตร์มหาภัยพิบัติ (The Great Sundering)
type: worldbuilding
status: active
tags:
  - history
  - lore
---

# ประวัติศาสตร์โลก: มหาภัยพิบัติแห่งเถ้าธุลี

- **ปี 380 (ก่อนหายนะ):** ยุคทองแห่งการหลอมศิลาเวทมนตร์
- **ปี 400 (The Great Sundering):** รอยแยกใต้หุบเขาเปิดออก เผ่าพันธุ์อสูรเถ้าถ่านทะลักเข้าสู่แผ่นดิน คณะจอมเวทรวมถึง [[Lysander]] ในวัยหนุ่มต้องทำการสะกดวิญญาณ
- **ปี 410:** [[Lucia]] ถูกพบท่ามกลางหมู่บ้านที่ถูกเผาทำลาย
- **ปี 420 (ปัจจุบัน):** สัญญาณการปะทุของรอยแยกเริ่มปรากฏขึ้นอีกครั้งใน [[Aethelgard Citadel]]
`,
  },

  // Story Planning / Timeline.md
  {
    id: 'file-timeline',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: 'f-planning',
    name: 'Timeline.md',
    extension: 'md',
    size: 1540,
    version: 1,
    createdAt: '2026-10-25T09:10:00Z',
    updatedAt: '2026-10-31T08:30:00Z',
    content: `---
id: PLAN-TIMELINE
title: Master Story Timeline
type: event
status: ongoing
story_date: "Year 420"
tags:
  - timeline
  - story-planning
---

# ลำดับเหตุการณ์หลักในนิยาย (Story Timeline)

### เหตุการณ์ที่ 1: การตื่นขึ้นของรอยสักอักขระ
- **Story Date:** Year 420, วันที่ 12 เดือนเพลิง
- **สถานที่:** [[Aethelgard Citadel]] ห้องใต้ดิน
- **ตัวละคร:** [[Lucia]]
- **สถานะ:** Occurred (เกิดขึ้นแล้ว)
- **สรุป:** แขนขวาของลูเซียเริ่มเปล่งแสงสีทองเป็นครั้งแรกในรอบสามปี บ่งชี้ว่าผนึกโบราณกำลังคลายตัว

---

### เหตุการณ์ที่ 2: คำเตือนในหอสมุดศิลา
- **Story Date:** Year 420, วันที่ 14 เดือนเพลิง
- **สถานที่:** หอสมุดศิลา
- **ตัวละคร:** [[Lucia]], [[Lysander]]
- **สถานะ:** Occurred (เกิดขึ้นแล้ว)
- **สรุป:** ไลแซนเดอร์ค้นพบคัมภีร์ที่บันทึกว่ารอยแยกเถ้าธุลีจะเปิดออกในคืนจันทรคราส เขาเตือนลูเซียเรื่องคำสาบาน

---

### เหตุการณ์ที่ 3: การบุกจู่โจมของเงาเถ้า
- **Story Date:** Year 420, คืนจันทรคราส
- **สถานที่:** The Ash Gate
- **ตัวละคร:** [[Lucia]], [[Lysander]]
- **สถานะ:** Planned (วางโครงเรื่องไว้)
- **สรุป:** กองทัพเถ้าถ่านบุกประชิดประตูใหญ่ ลูเซียต้องตัดสินใจว่าจะใช้อักขระระดับสามหรือไม่
`,
  },

  // Story Planning / Chapter 01
  {
    id: 'file-ch01',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: 'f-planning',
    name: 'Chapter 01 - The Ember Awakening.md',
    extension: 'md',
    size: 1850,
    version: 1,
    createdAt: '2026-10-26T10:00:00Z',
    updatedAt: '2026-10-31T08:45:00Z',
    content: `---
id: MANUSCRIPT-CH01
title: Chapter 01 - The Ember Awakening
type: general
status: in-progress
tags:
  - manuscript
  - draft
---

# บทที่ 1: ประกายไฟใต้หิมะดำ

ลมหนาวพัดพาละอองเถ้าจากยอดหอคอยร่วงกราวลงบนผืนหิน ลูเซียกระชับผ้าลินินสีครามรอบแขนขวาแน่นขึ้น ไอร้อนที่แผ่ออกมาจากใต้เนื้อผ้าเต้นตุบ ๆ เหมือนชีพจรของสิ่งมีชีวิตที่ถูกขังไว้

เบื้องล่างของ [[Aethelgard Citadel]] คือทะเลหมอกที่ทอดยาวไปจนสุดขอบฟ้า ทุกสิ่งเงียบสงัดจนได้ยินเสียงลมหายใจของตนเอง

"เจ้ามายืนรับลมหนาวตรงนี้นานเกินไปแล้ว ลูเซีย" เสียงคุ้นเคยดังมาจากด้านหลัง

ลูเซียหันกลับไปพบ [[Lysander]] ร่างสูงในชุดคลุมกำมะหยี่สีเทาเข้มยืนพิงเสาศิลา ดวงตาแก้วข้างซ้ายสะท้อนแสงจันทร์สลัว

"ข้าสัมผัสได้ถึงมันค่ะ ท่านอาจารย์" ลูเซียกระซิบ "เส้นใยอีเธอร์ในอากาศมันสั่นไหว... ไม่ใช่แบบปกติ แต่มันเหมือนกำลังกรีดร้อง"

ไลแซนเดอร์ขมวดคิ้ว มือที่จับไม้เท้ากวัดแกว่งอย่างระมัดระวัง เขาเดินเข้ามาใกล้พลางทอดสายตามองลงไปยังความมืดมิดของหุบเขา
`,
  },

  // Notes / 2026-10-31_10-30.md
  {
    id: 'file-note-1',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: 'f-notes',
    name: '2026-10-31_10-30.md',
    extension: 'md',
    size: 620,
    version: 1,
    createdAt: '2026-10-31T10:30:00Z',
    updatedAt: '2026-10-31T10:30:00Z',
    content: `---
id: NOTE-0001
date: 2026-10-31
time: "10:30"
type: writing-log
status: active
related:
  - CHAR-0001
tags:
  - writing-log
  - ideas
---

# บันทึกยามเช้า: Lucia และขีดจำกัดของเปลวไฟ

วันนี้คิดไอเดียเพิ่มเกี่ยวกับฉากที่ [[Lucia]] ปะทะกับเงาเถ้า:
- ต้องการให้เธอรู้สึกถึงความเจ็บปวดจริงเมื่อใช้ไฟ
- ปลายนิ้วต้องชาและเปลี่ยนเป็นเถ้าถ่านสีเทาชั่วคราว
- [[Lysander]] ต้องมีปฏิกิริยาตกใจเมื่อเห็นรอยไหม้ เพราะมันหมายความว่าคำสาปเริ่มต้นแล้ว
`,
  },

  // Personal Knowledge File
  {
    id: 'file-pk-1',
    workspaceId: 'ws-personal-knowledge',
    parentId: 'f-pk-research',
    name: 'Zettelkasten Method.md',
    extension: 'md',
    size: 780,
    version: 1,
    createdAt: '2026-10-28T10:20:00Z',
    updatedAt: '2026-10-30T11:00:00Z',
    content: `---
id: PK-0001
title: Zettelkasten Note Taking
type: general
tags:
  - knowledge
  - productivity
---

# The Zettelkasten Method

Atomic notes interconnected through hyperlinks rather than rigid taxonomies.
- Single concept per card
- Bidirectional linking
- Organic bottom-up synthesis
`,
  },

  // Android App Specification Note
  {
    id: 'file-android-spec',
    workspaceId: 'ws-dust-of-sorcery',
    parentId: null,
    name: 'ANDROID_APP_SPECIFICATION.md',
    extension: 'md',
    size: 15400,
    version: 1,
    createdAt: '2026-11-03T00:00:00Z',
    updatedAt: '2026-11-03T00:00:00Z',
    content: `---
id: DOC-ANDROID-SPEC-100
title: Android App Specification (100% Native)
type: general
status: active
tags:
  - android
  - jetpack-compose
  - mobile
  - architecture
  - specification
---

# เอกสารสเปกสำหรับพัฒนา Android App 100%
# Mythos Workspace — Worldbuilding & Markdown Knowledge Base for Android

เอกสารฉบับนี้จัดทำขึ้นเพื่อให้คุณนำไปใช้ใน **Google AI Studio** (หรือโปรเจกต์ Android Studio) เพื่อสั่งให้ AI พัฒนาแอปพลิเคชัน Android แบบ Native (Kotlin + Jetpack Compose) ให้มีฟีเจอร์และรูปแบบการทำงานเหมือนกับระบบ **Mythos Workspace (Web & Mobile Preview)** ครบถ้วน 100% ทุกประการ

*(ดูไฟล์ฉบับเต็มได้ที่ root directory: \`/ANDROID_APP_SPECIFICATION.md\`)*

---

## 1. ภาพรวมของแอปพลิเคชัน (App Overview & Vision)
- **Mythos Workspace for Android** คือแอปพลิเคชันจดบันทึกและสร้างโลก (Worldbuilding) ทำงานแบบ **Offline-First** 100%
- ใช้โครงสร้างไฟล์ Markdown (.md) + YAML Frontmatter
- เชื่อมโยงบันทึกข้ามกันด้วยไวยากรณ์ \`[[WikiLink]]\`
- มีผู้ช่วย AI Assistant ที่ขับเคลื่อนด้วย **Google Gemini API** (Streaming, Auto-Retry, Friendly Error Message)
- หน้าตาแอปออกแบบตามหลัก **Mobile-First Touch UX** โดยมี 3 หน้าจอหลักที่สามารถปัดซ้าย-ขวาได้ลื่นไหล (3-Panel Swipe Carousel)

---

## 2. สถาปัตยกรรมเทคโนโลยี Native Android
- **Language**: Kotlin 2.0+
- **UI Framework**: Jetpack Compose + Material 3 (Dark/Light + Accent Color)
- **Architecture**: Clean Architecture + MVVM (ViewModel, StateFlow, Coroutines)
- **Local Database**: Room Database + SQLite
- **AI Integration**: Google Gen AI SDK for Kotlin / Ktor Client (gemini-2.5-flash with SSE streaming)
- **File Export**: Android Storage Access Framework (SAF) + java.util.zip (ZIP export matching folder tree)

---

## 3. หน้าจอหลัก 3 แผงปัด (3-Panel Swipe Layout)
- **Panel 0 (Left)**: File Explorer, Workspace Selector, Quick Switcher, Recycle Bin, Mobile Bottom Dock Bar
- **Panel 1 (Center)**: Markdown Editor, Properties Header (พร้อม Inline Title Editing), Sticky Keyboard Toolbar, Knowledge Graph, Timeline, Templates
- **Panel 2 (Right)**: AI Chat Assistant พร้อม Context References (@file), Quick Prompt Presets, Auto-Retry เมื่อเจอ 503

---

## 4. แถบเครื่องมือ Mobile Sticky Toolbar
- เครื่องมือหลัก: \`Mode\`, \`H1\`, \`H2\`, \`B\`, \`I\`, \`Tab\` (4 spaces), \`List\`
- เมนู 3 จุดแนวตั้ง (\`MoreVertical\`): \`Highlight (==text==)\`, \`Strikethrough (~~text~~)\`, \`Quote (>)\`, \`Inline Code (\`code\`)\`, \`Table (3x3)\`, \`WikiLink ([[...]])\`, \`WebLink ([...](...))\`, \`Checkbox (- [ ])\`, \`Horizontal Rule (---)\`, \`Clear Formatting\`

---

## 5. การ์ด Properties Header & Inline Title
- Avatar ตัวย่อ 2 ตัวแรก
- **Inline Title Editing**: แตะเพื่อแก้ไขชื่อเรื่องและชื่อไฟล์ได้โดยตรง
- Type Badge (CHARACTER, LOCATION, ฯลฯ)
- Status Badge (active, draft)
- ปุ่ม **+ Add Property**

---

## 6. Master Prompt สำหรับ Google AI Studio
คัดลอก Master Prompt ในหัวข้อที่ 7 ของไฟล์ \`/ANDROID_APP_SPECIFICATION.md\` ไปวางใน Google AI Studio เพื่อเริ่มต้นการพัฒนาได้ทันที!
`,
  },
];

