# เอกสารสเปกและสถาปัตยกรรมสำหรับพัฒนา Android App 100%
# Mythos Workspace — Worldbuilding & Markdown Knowledge Base for Android

เอกสารฉบับนี้จัดทำขึ้นเพื่อให้คุณนำไปใช้ใน **Google AI Studio** (หรือโปรเจกต์ Android Studio) เพื่อสั่งให้ AI พัฒนาแอปพลิเคชัน Android แบบ Native (Kotlin + Jetpack Compose) ให้มีฟีเจอร์และรูปแบบการทำงานเหมือนกับระบบ **Mythos Workspace (Web & Mobile Preview)** ครบถ้วน 100% ทุกประการ

---

## สารบัญ (Table of Contents)
1. [ภาพรวมของแอปพลิเคชัน (App Overview & Vision)](#1-ภาพรวมของแอปพลิเคชัน-app-overview--vision)
2. [สถาปัตยกรรมเทคโนโลยี Native Android (Tech Stack)](#2-สถาปัตยกรรมเทคโนโลยี-native-android-tech-stack)
3. [โครงสร้าง UI/UX และระบบ Mobile Device Preview (3-Panel Swipe Layout)](#3-โครงสร้าง-uiux-และระบบ-mobile-device-preview-3-panel-swipe-layout)
4. [รายละเอียดฟังก์ชันงาน 100% (Detailed Feature Specifications)](#4-รายละเอียดฟังก์ชันงาน-100-detailed-feature-specifications)
   - 4.1 ระบบจัดการ Multi-Workspace
   - 4.2 ระบบแฟ้มและโฟลเดอร์แบบลำดับชั้น (Hierarchical File Tree)
   - 4.3 โปรแกรมแก้ไข Markdown & Live WYSIWYG Editor
   - 4.4 การจัดการ Frontmatter & Inline Title Editing
   - 4.5 แถบเครื่องมือ Mobile Sticky Toolbar & 3-Dots Overflow Menu
   - 4.6 ลิงก์ภายใน [[WikiLink]] และ ลิงก์ภายนอก WebLink พร้อม Context Menu
   - 4.7 ผู้ช่วย AI Worldbuilding Assistant (Gemini 2.5 Flash + Auto Retry + Error Fallback)
   - 4.8 กราฟความรู้ (Knowledge Graph View)
   - 4.9 เส้นเวลาเรื่องราว (Chronological Timeline View)
   - 4.10 ระบบแม่แบบ (Templates Engine & Save as Template)
   - 4.11 ถังขยะและประวัติเวอร์ชัน (Trash & Snapshot History)
   - 4.12 การนำเข้าและส่งออก (ZIP & JSON Export/Import)
5. [การออกแบบฐานข้อมูล Room Database (Room Entities & DAOs)](#5-การออกแบบฐานข้อมูล-room-database-room-entities--daos)
6. [โค้ดโครงร่างส่วนประกอบสำคัญ (Jetpack Compose Component Blueprints)](#6-โค้ดโครงร่างส่วนประกอบสำคัญ-jetpack-compose-component-blueprints)
7. [Master System Prompt สำหรับส่งให้ Google AI Studio พัฒนาต่อทันที](#7-master-system-prompt-สำหรับส่งให้-google-ai-studio-พัฒนาต่อทันที)

---

## 1. ภาพรวมของแอปพลิเคชัน (App Overview & Vision)

**Mythos Workspace for Android** คือแอปพลิเคชันจดบันทึกและสร้างโลก (Worldbuilding & Lore Management) ระดับมืออาชีพที่ทำงานแบบ **Offline-First**:
- ใช้งานไฟล์ Markdown (.md) ร่วมกับ YAML Frontmatter
- เชื่อมโยงบันทึกข้ามกันด้วยไวยากรณ์ `[[WikiLink]]`
- มีระบบ AI Assistant ที่ขับเคลื่อนด้วย **Google Gemini API** สำหรับช่วยระดมความคิด แต่งเนื้อเรื่อง ตรวจสอบความสมเหตุสมผลของ Lore และอ้างอิงเนื้อหาในไฟล์ของ Workspace
- หน้าตาแอปออกแบบตามหลัก **Mobile-First Touch UX** โดยมี 3 หน้าจอหลักที่สามารถปัดซ้าย-ขวาได้ลื่นไหล (3-Panel Swipe Carousel) แถบเครื่องมือลอยแบบไม่เลื่อนหลุดหน้าจอ (Sticky Toolbar) และ Bottom Sheets สำหรับการตั้งค่าต่าง ๆ

---

## 2. สถาปัตยกรรมเทคโนโลยี Native Android (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่เลือกใช้ | รายละเอียดและเหตุผล |
|---|---|---|
| **Language** | Kotlin 2.0+ | ทันสมัย ปลอดภัยจาก Null-pointer และรองรับ Coroutines |
| **UI Framework** | Jetpack Compose + Material 3 | การประกาศ UI แบบ Reactive ปรับแต่งแอนิเมชันและการปัดหน้าจอได้สมบูรณ์แบบ |
| **Architecture** | Clean Architecture + MVVM | ViewModel, StateFlow, Kotlin Coroutines เพื่อจัดการ Single Source of Truth |
| **Local Database** | Room Database + SQLite | บันทึกข้อมูล Workspace, Folder, Note, Template, Chat History ลงในเครื่อง 100% |
| **Key-Value Storage** | Jetpack DataStore Preferences | บันทึกค่าการตั้งค่า, ธีมสี (Dark/Light + Accent Color), และ Active Session |
| **Markdown Engine** | RichText Compose / Custom VisualTransformation | สำหรับการเรนเดอร์ Markdown, Syntax Highlighting, และ Shortcode Inline Parsing |
| **AI Integration** | Google Gen AI SDK for Kotlin / Ktor Client | เรียกใช้งานโมเดล `gemini-2.5-flash` รองรับ Server-Sent Events (SSE) Streaming |
| **File I/O & Export** | Android Storage Access Framework (SAF) + `java.util.zip` | ส่งออกและนำเข้า Workspace ออกมาเป็นไฟล์ `.zip` ตามโครงสร้างโฟลเดอร์จริง |

---

## 3. โครงสร้าง UI/UX และระบบ Mobile Device Preview (3-Panel Swipe Layout)

ในโปรเจกต์เว็บต้นแบบ หน้าจอบนมือถือใช้โครงสร้าง **3 แผงปัดแบบแนวนอน (Horizontal Swipe Carousel)** ซึ่งใน Android จะใช้ `HorizontalPager` ของ Compose ดังนี้:

```
+-------------------------------------------------------------------------------+
|                             HorizontalPager (3 Panels)                        |
|                                                                               |
|  [ Panel 0: File Explorer ]  |  [ Panel 1: Center Canvas ]  |  [ Panel 2: AI Assistant ]  |
|  - Workspace Selector        |  - Markdown Editor           |  - Chat Messages Stream |
|  - Folder & File Tree        |  - Properties Header         |  - Quick Prompt Presets |
|  - Create Note/Folder        |  - Sticky Editing Toolbar    |  - Reference Context    |
|  - Mobile Bottom Dock Bar    |  - Timeline / Graph Views    |  - Session Switcher     |
+-------------------------------------------------------------------------------+
```

### การควบคุมและการสลับมุมมอง (Navigation & Dock Bar)
1. **Swipe Gesture**: ผู้ใช้สามารถใช้นิ้วปัดซ้าย-ขวาเพื่อเปลี่ยนระหว่าง **Files (แผง 0)**, **Editor (แผง 1)**, และ **AI Chat (แผง 2)** ได้ทันที
2. **Mobile Dock Bar (ลอยอยู่ด้านล่างแผงซ้ายหรือจอด้านล่าง)**:
   - ปุ่มลัด 6 ตัว: `Editor`, `Timeline`, `Graph`, `Templates`, `History`, `AI Chat`
   - เมื่อกดไอคอน `AI Chat` -> อนิเมตเลื่อนไปยัง Panel 2 ทันที
   - เมื่อกดไอคอนอื่นๆ -> เปลี่ยน Active View แล้วอนิเมตกลับมาที่ Panel 1
3. **Bottom Sheets (แทนป๊อปอัปแบบ Desktop)**:
   - `MobileInspectorSheet`: เปิดดู Backlinks, Outgoing Links, Word Count, วันที่สร้าง/แก้ไข
   - `MobileMoreSheet`: เปิดเมนูสลับธีม สลับสีเน้น (Accent), Export ZIP, ไปหน้าถังขยะ
   - `MobileWorkspaceSheet`: เลื่อนดู Workspace ทั้งหมด และกดสร้าง Workspace ใหม่

---

## 4. รายละเอียดฟังก์ชันงาน 100% (Detailed Feature Specifications)

### 4.1 ระบบจัดการ Multi-Workspace
- สร้าง, แก้ไขชื่อ, เปลี่ยนคำอธิบาย, และลบ Workspace ได้
- ข้อมูลของแต่ละ Workspace ถูกแยกส่วนกันอย่างเด็ดขาด ทั้งไฟล์ บันทึก แท็ก และประวัติแชต AI
- มีปุ่ม **Export Workspace as Markdown ZIP** ดาวน์โหลดไฟล์ทั้งหมดใน Workspace จัดเป็นโฟลเดอร์จริงพร้อม metadata

### 4.2 ระบบแฟ้มและโฟลเดอร์แบบลำดับชั้น (Hierarchical File Tree)
- โครงสร้างต้นไม้แบบซ้อนได้ไม่จำกัดชั้น (`parentId: String?`)
- การลากย้าย (Drag & Drop) หรือเปิด `MoveDialog` เพื่อย้ายไฟล์/โฟลเดอร์ไปยังโฟลเดอร์ปลายทาง
- คำสั่งบนรายการไฟล์: **Rename**, **Duplicate**, **Move**, **Save as Template**, **Delete (Soft delete ไปที่ถังขยะ)**
- **Quick Switcher (Ctrl/Cmd+K หรือปุ่มค้นหา)**: พิมพ์ค้นหาชื่อไฟล์แบบเรียลไทม์ พร้อมเปิดทันที

### 4.3 โปรแกรมแก้ไข Markdown & Live WYSIWYG Editor
- การพิมพ์ทางลัดแบบ Inline:
  - พิมพ์ `# ` -> แปลงเป็น Heading 1
  - พิมพ์ `## ` -> แปลงเป็น Heading 2
  - พิมพ์ `*text*` -> ทำข้อความเอียง (*Italic*)
  - พิมพ์ `**text**` -> ทำข้อความหนา (**Bold**)
  - พิมพ์ `==text==` -> ไฮไลต์สีเหลือง (==Highlight==)
  - พิมพ์ `~~text~~` -> ขีดฆ่า (~~Strikethrough~~)
  - พิมพ์ `[[ชื่อไฟล์]]` -> สร้างลิงก์ภายใน
  - พิมพ์ `[ข้อความ](https://...)` -> สร้างลิงก์ภายนอก
  - พิมพ์ `- [ ] ` -> สร้าง Checkbox ที่สามารถแตะเพื่อสลับติ๊กถูกได้
- รองรับการกดปุ่ม **Tab (แทรกเว้นวรรค 4 เคาะ)** และ **Shift+Tab (ลดการเยื้อง)**

### 4.4 การจัดการ Frontmatter & Inline Title Editing (ตามภาพอัปเดตล่าสุด)
- ระบบอ่านและเขียน YAML Frontmatter ส่วนหัวของไฟล์อัตโนมัติ (`--- ... ---`)
- **การ์ด Properties Header เหนือตัวแก้ไข**:
  - **ไอคอนวงกลมย่อชื่อ (Initial Avatar)**: ดึงอักษร 2 ตัวแรกของชื่อโน้ต
  - **Inline Title Editing**: ชื่อหัวเรื่องสามารถแตะเพื่อพิมพ์แก้ไขชื่อไฟล์/หัวเรื่องได้โดยตรง เมื่อแก้ไขเสร็จจะบันทึกทั้งใน `frontmatter.title` และชื่อไฟล์พร้อมกัน
  - **Badge ประเภทโน้ต**: แสดงแท็กประเภท เช่น `CHARACTER`, `LOCATION`, `FACTION`, `EVENT` เป็นสีกรอบเฉพาะ
  - **Badge สถานะ**: เช่น `active`, `draft`, `archived`
  - **รหัสอ้างอิง (ID)**: เช่น `ID: CHAR-20261103-3368`
  - **ปุ่ม "+ Add Property"**: เปิด Modal สำหรับเพิ่มคีย์ใหม่ เช่น `age`, `alias`, `affiliation`, `tags`
  - ช่อง `title` จะไม่แสดงซ้ำในตาราง Properties ทั่วไป เพราะแสดงที่ส่วนหัวเรื่องแบบ Inline แล้ว

### 4.5 แถบเครื่องมือ Mobile Sticky Toolbar & 3-Dots Overflow Menu
- **ไม่เลื่อนหลุดหน้าจอ (Sticky)** ติดอยู่เหนือแป้นพิมพ์เสมือน (Software Keyboard)
- **เครื่องมือหลัก (Primary Icons)**:
  1. `Mode` (Edit / Preview toggle)
  2. `H1` (Heading 1)
  3. `H2` (Heading 2)
  4. `B` (Bold)
  5. `I` (Italic)
  6. `Tab` (เว้นวรรค 4 เคาะ)
  7. `List` (Unordered bullet list)
- **ปุ่ม 3 จุดแนวตั้ง (`MoreVertical`)**:
  - เมื่อกดจะแสดงเมนูเลื่อนขึ้นมา (Dropdown / Bottom Sheet) สำหรับเครื่องมือรอง:
    - `Highlight` (`==ข้อความ==`)
    - `Strikethrough` (`~~ข้อความ~~`)
    - `Quote` (`> ข้อความ`)
    - `Inline Code` (`` `code` ``)
    - `Table` (แทรกตาราง Markdown 3x3)
    - `WikiLink` (`[[ลิงก์โน้ต]]`)
    - `WebLink` (`[ชื่อ](url)`)
    - `Checkbox` (`- [ ] สิ่งที่ต้องทำ`)
    - `Horizontal Rule` (`---`)
    - `Clear Formatting` (ลบล้างรูปแบบ)

### 4.6 ลิงก์ภายใน [[WikiLink]] และ ลิงก์ภายนอก WebLink พร้อม Context Menu
- เมื่อผู้ใช้ **คลิกขวา (บนเดสก์ท็อป) หรือกดค้าง (Long Press บนมือถือ)** ที่คำที่เป็น `[[WikiLink]]` หรือ `[WebLink](url)`:
  - จะแสดง **Tip UI Context Menu**:
    - กรณี `WikiLink`: แสดงชื่อไฟล์เป้าหมาย, โฟลเดอร์ที่อยู่, สถานะ (พบไฟล์ หรือ ยังไม่ได้สร้าง), และปุ่ม **"เปิดโน้ต (Open Note)"**
    - กรณี `WebLink`: แสดง URL ปลายทาง พร้อมปุ่ม **"คัดลอกลิงก์ (Copy Link)"** และปุ่ม **"เปิดในเบราว์เซอร์ (Open External)"**
  - **คลิกที่อื่นเพื่อปิด**: หากผู้ใช้แตะหรือคลิกพื้นที่อื่นใดนอกกรอบ Tip UI ตัวกล่องข้อความจะปิดลงทันทีอัตโนมัติ

### 4.7 ผู้ช่วย AI Worldbuilding Assistant (Gemini 2.5 Flash + Auto Retry + Error Fallback)
- **การจัดการบริบท (Context Management)**:
  - แนบไฟล์ปัจจุบัน (`Active Note`)
  - แนบคำสั่งโลกของ Workspace (`Workspace Lore Instructions`)
  - ค้นหาและคัดเลือกเนื้อหาโน้ตที่เกี่ยวข้องผ่าน `@mentions` หรือ Focus Files
- **การสตรีมคำตอบ (Streaming)**:
  - แสดงคำตอบแบบ Token-by-token พร้อมปุ่ม "หยุดพิมพ์ (Stop)"
- **ระบบ Auto Retry & Error Fallback (สำคัญมาก)**:
  - ตรวจจับ Error `503 UNAVAILABLE` (Model is currently experiencing high demand) หรือ Network Timeout
  - เมื่อพบ 503 ทำ Exponential Backoff Retry อัตโนมัติ (เช่น รอ 1.5 วินาที -> ลองใหม่สูงสุด 3 ครั้ง)
  - **หากไม่สำเร็จ**: ห้ามแสดง JSON Error ดิบ หรือรหัสแดงน่ากลัวต่อผู้ใช้ ให้ส่งข้อความสำรองแบบสุภาพและเป็นธรรมชาติ เช่น:
    > *"ขณะนี้ระบบ AI กำลังมีผู้ใช้งานหนาแน่นชั่วคราว ข้อมูลของคุณยังปลอดภัย โปรดกดปุ่มลองใหม่อีกครั้งในอีกสักครู่ครับ"*
  - มีปุ่ม **"ลองอีกครั้ง (Retry)"** ให้แตะได้ทันที
- **ฟังก์ชันข้อความ**:
  - คัดลอกข้อความคำตอบ
  - บันทึกคำตอบเข้าไปที่ท้ายโน้ตปัจจุบัน (`Insert to Note`)
  - แก้ไขข้อความคำถามเดิมแล้วกดส่งใหม่ (Branching edit)

### 4.8 กราฟความรู้ (Knowledge Graph View)
- แสดงโหนด (Nodes) เป็นไฟล์โน้ตต่าง ๆ
- แสดงเส้นเชื่อม (Edges) ตามความสัมพันธ์ของการใช้ `[[WikiLink]]`
- โหนดมีสีตามประเภท (เช่น ตัวละครสีฟ้า, สถานที่สีเขียว, องค์กรสีม่วง)
- รองรับการซูม (Pinch-to-zoom) การเลื่อนผืนผ้าใบ (Pan) และการแตะโหนดเพื่อเปิดอ่านบันทึกทันที

### 4.9 เส้นเวลาเรื่องราว (Chronological Timeline View)
- ค้นหาโน้ตที่มีคีย์ `story_date` หรือหมวดหมู่ `event`
- เรียงลำดับตามกาลเวลาของโลกนิยาย แสดงเป็นการ์ด Timeline สวยงามตามแกนตั้ง

### 4.10 ระบบแม่แบบ (Templates Engine & Save as Template)
- แม่แบบเริ่มต้น: ตัวละคร (Character Dossier), สถานที่ (Location Guide), องค์กร (Faction Profile), โครงเรื่อง (Quest Log)
- ฟีเจอร์ **"Save as Template"**: บันทึกโน้ตปัจจุบันที่ออกแบบไว้ให้กลายเป็นแม่แบบส่วนตัวได้ทันที

### 4.11 ถังขยะและประวัติเวอร์ชัน (Trash & Snapshot History)
- โน้ตที่ลบจะถูกย้ายไปที่ถังขยะ (Soft Delete) สามารถกู้คืน (Restore) หรือลบถาวร (Permanent Delete)
- บันทึก Snapshot อัตโนมัติทุกครั้งที่มีการบันทึกสำคัญ สามารถกดย้อนกลับ (Revert) ได้

### 4.12 การนำเข้าและส่งออก (ZIP & JSON Export/Import)
- สร้างไฟล์ `.zip` บรรจุไฟล์ `.md` ครบถ้วนตามโฟลเดอร์จริงเพื่อนำไปเปิดใน Obsidian หรือโปรแกรมแก้ไขอื่นได้ทันที

---

## 5. การออกแบบฐานข้อมูล Room Database (Room Entities & DAOs)

### 5.1 Entities หลักในภาษา Kotlin

```kotlin
package com.mythos.workspace.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "workspaces")
data class WorkspaceEntity(
    @PrimaryKey val id: String,
    val name: String,
    val description: String,
    val icon: String,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(
    tableName = "folders",
    foreignKeys = [
        ForeignKey(
            entity = WorkspaceEntity::class,
            parentColumns = ["id"],
            childColumns = ["workspaceId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("workspaceId"), Index("parentId")]
)
data class FolderEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val parentId: String?, // null คือ Root
    val name: String,
    val createdAt: Long,
    val updatedAt: Long,
    val deletedAt: Long? = null
)

@Entity(
    tableName = "notes",
    foreignKeys = [
        ForeignKey(
            entity = WorkspaceEntity::class,
            parentColumns = ["id"],
            childColumns = ["workspaceId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("workspaceId"), Index("parentId")]
)
data class NoteEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val parentId: String?,
    val name: String, // e.g. "Lucia.md"
    val content: String,
    val size: Long,
    val version: Int,
    val frontmatterJson: String, // แปลง Map<String, Any> เป็น JSON string
    val createdAt: Long,
    val updatedAt: Long,
    val deletedAt: Long? = null
)

@Entity(tableName = "ai_sessions")
data class AISessionEntity(
    @PrimaryKey val id: String,
    val workspaceId: String,
    val title: String,
    val agentMode: String = "ask",
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(
    tableName = "ai_messages",
    foreignKeys = [
        ForeignKey(
            entity = AISessionEntity::class,
            parentColumns = ["id"],
            childColumns = ["sessionId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("sessionId")]
)
data class AIMessageEntity(
    @PrimaryKey val id: String,
    val sessionId: String,
    val role: String, // "user" หรือ "assistant"
    val content: String,
    val timestamp: Long,
    val citationsJson: String? = null
)

@Entity(tableName = "templates")
data class TemplateEntity(
    @PrimaryKey val id: String,
    val name: String,
    val category: String,
    val description: String,
    val icon: String,
    val defaultFilename: String,
    val templateContent: String,
    val isCustom: Boolean = true
)
```

---

## 6. โค้ดโครงร่างส่วนประกอบสำคัญ (Jetpack Compose Component Blueprints)

### 6.1 โครงสร้าง 3-Panel Swipe Pager (`MythosMainScreen.kt`)

```kotlin
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MythosMainScreen(
    viewModel: WorkspaceViewModel = viewModel()
) {
    val pagerState = rememberPagerState(initialPage = 1, pageCount = { 3 })
    val coroutineScope = rememberCoroutineScope()
    val activeView by viewModel.activeView.collectAsState()

    Scaffold(
        bottomBar = {
            // แสดงเฉพาะบน Panel 0 เพื่อความสะอาดตา หรือแถบเครื่องมือลอย
        }
    ) { paddingValues ->
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) { pageIndex ->
            when (pageIndex) {
                0 -> FileExplorerPanel(
                    onSelectNote = { noteId ->
                        viewModel.openNote(noteId)
                        coroutineScope.launch { pagerState.animateScrollToPage(1) }
                    },
                    onOpenAIChat = {
                        coroutineScope.launch { pagerState.animateScrollToPage(2) }
                    }
                )
                1 -> CenterContentPanel(
                    activeView = activeView,
                    onOpenAI = {
                        coroutineScope.launch { pagerState.animateScrollToPage(2) }
                    }
                )
                2 -> AIAssistantPanel(
                    onOpenNoteFromCitation = { noteId ->
                        viewModel.openNote(noteId)
                        coroutineScope.launch { pagerState.animateScrollToPage(1) }
                    }
                )
            }
        }
    }
}
```

### 6.2 การ์ด Properties Header พร้อม Inline Title Editing (`PropertiesHeader.kt`)

```kotlin
@Composable
fun PropertiesHeader(
    title: String,
    noteType: String,
    status: String,
    noteId: String,
    onTitleChange: (String) -> Unit,
    onAddPropertyClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(10.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                // Initial Avatar (2 ตัวอักษรแรก)
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(8.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = title.take(2).uppercase(),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontSize = 13.sp
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Inline Editable Title
                        BasicTextField(
                            value = title,
                            onValueChange = onTitleChange,
                            textStyle = TextStyle(
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            ),
                            singleLine = true,
                            cursorBrush = SolidColor(MaterialTheme.colorScheme.primary)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        // Type Badge
                        Surface(
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = noteType.uppercase(),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    Text(
                        text = "ID: $noteId",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // ปุ่ม + Add Property
            FilledTonalButton(
                onClick = onAddPropertyClick,
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = "Add Property", fontSize = 11.sp)
            }
        }
    }
}
```

### 6.3 แถบเครื่องมือ Mobile Sticky Editor Toolbar & 3-Dots Overflow (`MobileEditorToolbar.kt`)

```kotlin
@Composable
fun MobileEditorToolbar(
    onAction: (EditorAction) -> Unit,
    modifier: Modifier = Modifier
) {
    var isOverflowOpen by remember { mutableStateOf(false) }

    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 3.dp,
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // ปุ่มหลักแบบกระชับ (Primary Buttons)
            IconButton(onClick = { onAction(EditorAction.ToggleMode) }) {
                Icon(Icons.Default.Visibility, contentDescription = "Mode")
            }
            IconButton(onClick = { onAction(EditorAction.Heading1) }) {
                Text("H1", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
            IconButton(onClick = { onAction(EditorAction.Heading2) }) {
                Text("H2", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
            IconButton(onClick = { onAction(EditorAction.Bold) }) {
                Icon(Icons.Default.FormatBold, contentDescription = "Bold")
            }
            IconButton(onClick = { onAction(EditorAction.Italic) }) {
                Icon(Icons.Default.FormatItalic, contentDescription = "Italic")
            }
            IconButton(onClick = { onAction(EditorAction.InsertTab) }) {
                Icon(Icons.Default.KeyboardTab, contentDescription = "Tab")
            }
            IconButton(onClick = { onAction(EditorAction.BulletList) }) {
                Icon(Icons.Default.FormatListBulleted, contentDescription = "List")
            }

            // ปุ่ม 3 จุดแนวตั้งสำหรับเครื่องมือรอง (More Menu)
            Box {
                IconButton(onClick = { isOverflowOpen = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "More Tools")
                }
                DropdownMenu(
                    expanded = isOverflowOpen,
                    onDismissRequest = { isOverflowOpen = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Highlight (==text==)") },
                        onClick = { onAction(EditorAction.Highlight); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("Strikethrough (~~text~~)") },
                        onClick = { onAction(EditorAction.Strikethrough); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("Quote (> text)") },
                        onClick = { onAction(EditorAction.Quote); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("Code (`code`)") },
                        onClick = { onAction(EditorAction.InlineCode); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("Table (3x3)") },
                        onClick = { onAction(EditorAction.InsertTable); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("WikiLink ([[Note]])") },
                        onClick = { onAction(EditorAction.InsertWikiLink); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("WebLink ([Name](URL))") },
                        onClick = { onAction(EditorAction.InsertWebLink); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("Checkbox Task (- [ ])") },
                        onClick = { onAction(EditorAction.Checkbox); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("Horizontal Rule (---)") },
                        onClick = { onAction(EditorAction.HorizontalRule); isOverflowOpen = false }
                    )
                    DropdownMenuItem(
                        text = { Text("Clear Formatting") },
                        onClick = { onAction(EditorAction.ClearFormatting); isOverflowOpen = false }
                    )
                }
            }
        }
    }
}
```

### 6.4 การเชื่อมต่อ Gemini API พร้อม Auto Retry และ Error Fallback (`GeminiClient.kt`)

```kotlin
class GeminiRepository(private val client: HttpClient) {
    suspend fun generateLoreResponse(
        prompt: String,
        workspaceContext: String,
        maxRetries: Int = 3
    ): Result<Flow<String>> {
        var currentAttempt = 0
        var backoffMs = 1500L

        while (currentAttempt < maxRetries) {
            try {
                // เรียก Gemini API
                val responseFlow = client.streamGeminiResponse(
                    model = "gemini-2.5-flash",
                    systemPrompt = "You are the Mythos Worldbuilding AI Assistant...\nContext:\n$workspaceContext",
                    userMessage = prompt
                )
                return Result.success(responseFlow)
            } catch (e: Exception) {
                currentAttempt++
                val isServerBusy = e.message?.contains("503") == true || e.message?.contains("UNAVAILABLE") == true
                if (isServerBusy && currentAttempt < maxRetries) {
                    delay(backoffMs)
                    backoffMs *= 2 // Exponential backoff
                } else {
                    // หากเกินจำนวนครั้ง หรือไม่ใช่ Error ที่ลองใหม่ได้ ให้แปลงเป็นมิตรต่อผู้ใช้
                    val friendlyMessage = if (isServerBusy) {
                        "ขณะนี้มีผู้ใช้งาน AI จำนวนมาก ทำให้เซิร์ฟเวอร์ตอบสนองล่าช้าชั่วคราว ข้อมูลของคุณยังอยู่ครบถ้วน กรุณากดปุ่มลองอีกครั้งได้เลยครับ"
                    } else {
                        "ไม่สามารถเชื่อมต่อกับผู้ช่วย AI ได้ในขณะนี้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้งครับ"
                    }
                    return Result.failure(Exception(friendlyMessage))
                }
            }
        }
        return Result.failure(Exception("ระบบกำลังยุ่งชั่วคราว กรุณากดลองอีกครั้งในภายหลังครับ"))
    }
}
```

---

## 7. Master System Prompt สำหรับส่งให้ Google AI Studio พัฒนาต่อทันที

คุณสามารถคัดลอกข้อความด้านล่างนี้ทั้งหมด นำไปวางในช่องคำสั่งของ **Google AI Studio** เมื่อเริ่มต้นสร้างโปรเจกต์ Android ใหม่ เพื่อให้ AI รับทราบและเริ่มสร้างโค้ดตามสเปก 100%:

```markdown
คุณคือ Senior Android Architect & Kotlin Specialist ที่ได้รับมอบหมายให้พัฒนาแอปพลิเคชัน Android Native (Kotlin + Jetpack Compose) ชื่อ "Mythos Workspace" ให้เสร็จสมบูรณ์ 100% ตามข้อกำหนดด้านล่างนี้ โดยจำลองรูปแบบและประสบการณ์แบบ Mobile Preview ของเว็บแอป Mythos Workspace ทั้งหมด

[สเปกหลักของแอปพลิเคชัน]
1. โครงสร้าง UI และการเคลื่อนไหว (3-Panel Horizontal Pager):
   - ใช้ HorizontalPager ใน Jetpack Compose แบ่งเป็น 3 หน้าจอหลักที่ผู้ใช้ปัดสลับได้ลื่นไหล:
     - แผง 0 (Panel 0): หน้าสำรวจไฟล์ (FileExplorer) จัดการโฟลเดอร์/ไฟล์แบบต้นไม้, ตัวสลับ Workspace, การค้นหาด่วน QuickSwitcher, ถังขยะ, และแถบ Dock Bar ลอยด้านล่าง
     - แผง 1 (Panel 1): ผืนผ้าใบตรงกลาง (Center Canvas) มีโหมด Markdown Editor, Interactive Knowledge Graph, Chronological Timeline, Templates Manager, และ Snapshot History
     - แผง 2 (Panel 2): แผงผู้ช่วย AI (Gemini 2.5 Flash Assistant) รองรับแชตแยกตาม Workspace, แนบบริบทไฟล์, สตรีมข้อความ, และประวัติการสนทนา

2. การแก้ไข Markdown & Live Visual Shortcuts:
   - ตรวจจับการพิมพ์แบบ inline shortcuts ทันที:
     - `# ` และ `## ` สำหรับ Heading
     - `**ข้อความ**` เป็นตัวหนา, `*ข้อความ*` เป็นตัวเอียง
     - `==ข้อความ==` ไฮไลต์เหลือง, `~~ข้อความ~~` ขีดฆ่า
     - `[[ชื่อไฟล์]]` เป็นลิงก์ภายใน, `[ชื่อ](url)` เป็นลิงก์เว็บภายนอก
     - ปุ่ม Tab เว้นวรรค 4 เคาะ
   - แถบเครื่องมือ Mobile Sticky Toolbar ไม่เลื่อนหลุดหน้าจอ โดยแสดงเครื่องมือหลัก (Mode, H1, H2, B, I, Tab, List) และปุ่ม 3 จุดแนวตั้ง (MoreVertical) ที่เปิด DropdownMenu สำหรับเครื่องมือรอง (Highlight, Strikethrough, Quote, Code, Table, WikiLink, WebLink, Checkbox, HR, Clear)
   - ลิงก์ [[WikiLink]] และ WebLink เมื่อกดค้าง (Long Press) ให้แสดง Tip UI Context Menu พร้อมคำสั่งคัดลอกลิงก์หรือเปิดโน้ต และแตะที่ว่างภายนอกเพื่อปิดทันที

3. ส่วนหัวของบันทึก (Frontmatter Card & Inline Title):
   - จัดการ YAML Frontmatter อัตโนมัติ (`--- ... ---`)
   - มีการ์ด Properties Header:
     - Avatar อักษรย่อ 2 ตัวแรก
     - Inline Title Editing ที่แตะเพื่อแก้ไขชื่อเรื่องและชื่อไฟล์ได้โดยตรง
     - Type Badge (เช่น CHARACTER, LOCATION) และ Status Badge
     - รหัสอ้างอิง ID
     - ปุ่ม "+ Add Property" สำหรับเพิ่มฟิลด์ใหม่ (ช่อง title จะไม่แสดงซ้ำในตารางทั่วไป)

4. AI Integration (Gemini 2.5 Flash):
   - เชื่อมต่อผ่าน Google Gen AI SDK for Kotlin
   - มีระบบ Exponential Backoff Auto-Retry สูงสุด 3 ครั้งเมื่อพบ 503 UNAVAILABLE
   - แปลง Error ทั้งหมดให้เป็นข้อความภาษาไทยที่สุภาพ เป็นมิตร และให้คำแนะนำที่เข้าใจง่ายแทนข้อความขัดข้องทางเทคนิค
   - มีปุ่ม Retry และปุ่ม Insert to Note

5. ฐานข้อมูล Room Database:
   - โต๊ะข้อมูล: Workspaces, Folders, Notes (พร้อม frontmatterJson), Templates, AISessions, AIMessages
   - ทำงานแบบ 100% Offline-First
   - มีฟังก์ชัน Export Workspace ออกมาเป็นไฟล์ .zip จัดโครงสร้างโฟลเดอร์ตรงตาม hierarchy

ขอให้เริ่มสร้างไฟล์สถาปัตยกรรมหลัก (Room Entities, Repository, ViewModel, Navigation, และ Compose Screens) พร้อมคำอธิบายและแนวทางการคอมไพล์ใน Android Studio ให้ครบถ้วนสมบูรณ์
```

---

## 8. การใช้งาน Progressive Web App (PWA) และ Capacitor สำหรับ Android Wrapper

โปรเจกต์ Mythos ได้รับการติดตั้งระบบ **PWA** และ **Capacitor Android** ไว้อย่างสมบูรณ์:

### 8.1 ข้อมูลแอปและการตั้งค่า (App Identity & Config)
- **App Name**: `Mythos`
- **App ID / Package ID**: `app.indyshares.com/mythos` (ในระบบ Android ใช้ `app.indyshares.mythos`)
- **Capacitor Configuration (`capacitor.config.ts`)**:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.indyshares.mythos',
  appName: 'Mythos',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
```

### 8.2 คุณสมบัติ PWA (Progressive Web App)
- **Web App Manifest**: กำหนดชื่อ `Mythos`, Theme color `#090d16`, โหมด `standalone` พร้อมไอคอนความละเอียดสูง (192x192, 512x512, Maskable 512x512, Apple Touch Icon 180x180)
- **Service Worker Caching**: ทำงานแบบ Offline-First บันทึก cache ไฟล์ static และ asset ทันทีผ่าน `vite-plugin-pwa`
- **In-App Install Prompt**: มีปุ่ม "Install App" ใน TopBar และแผ่นเมนู More เพื่อให้ผู้ใช้สามารถติดตั้งลงบนหน้าจอหลัก (Home Screen) ของมือถือได้โดยตรง ทั้งบน Android (Native prompt) และ iOS Safari (Share -> Add to Home Screen)
- **Offline Indicator**: แสดงสถานะการเชื่อมต่อเครือข่ายอย่างนุ่มนวลและไม่รบกวนผู้ใช้

### 8.3 คำสั่งสำหรับ Sync และ Build เป็นไฟล์ APK/AAB ด้วย Capacitor
1. คอมไพล์โปรเจกต์เว็บ:
   ```bash
   npm run build
   ```
2. อัปเดตและซิงก์โค้ดไปยังโฟลเดอร์เนทีฟ Android:
   ```bash
   npx cap sync android
   ```
3. เปิดโปรเจกต์ใน Android Studio เพื่อสร้าง Release APK หรือทดสอบใน Emulator/อุปกรณ์จริง:
   ```bash
   npx cap open android
   ```

---

*เอกสารฉบับนี้ถูกสร้างและเก็บไว้ที่ `/ANDROID_APP_SPECIFICATION.md` ของโปรเจกต์ Mythos Workspace เพื่อให้ผู้พัฒนาสามารถนำไปประยุกต์ใช้งานหรือต่อยอดได้ทันที*

