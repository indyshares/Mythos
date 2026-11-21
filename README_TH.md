Mythos

ภาษาไทย · [English](README.md)

พื้นที่ทำงานสำหรับจัดการองค์ความรู้และงานเขียนบนคลาวด์ สำหรับการเขียนนิยาย การสร้างโลกสมมติ การค้นคว้า และการจัดการองค์ความรู้อย่างเป็นระบบ
ภาพรวม

Mythos คือพื้นที่ทำงานสมัยใหม่บนเว็บเบราว์เซอร์ สำหรับนักเขียนและผู้ที่ทำงานด้านการจัดการองค์ความรู้ โดยรวมความสามารถต่าง ๆ ไว้ในแพลตฟอร์มเดียว ได้แก่ ระบบจัดการไฟล์และโฟลเดอร์ตามลำดับชั้น การแก้ไข Markdown แบบเรียลไทม์ ลิงก์ WikiLinks ภายในระบบ กราฟองค์ความรู้ ไทม์ไลน์เหตุการณ์ตามลำดับเวลา เทมเพลต ประวัติเวอร์ชัน การนำเข้าและส่งออกข้อมูล การรองรับ PWA และผู้ช่วย AI สำหรับค้นหาความรู้ที่สามารถอ่านข้อมูลได้เท่านั้น

แอปพลิเคชันนี้พัฒนาด้วย React, TypeScript, Express, Vite และ Capacitor สามารถใช้งานได้ทั้งในรูปแบบเว็บแอปพลิเคชันและแอป Android ที่ผ่านการแพ็กเกจ

คุณสมบัติหลัก
พื้นที่ทำงานแบบลำดับชั้น (Hierarchical Workspaces) — แยกโปรเจกต์ออกเป็นโฟลเดอร์และบันทึก Markdown ที่สามารถซ้อนกันได้หลายระดับ
โปรแกรมแก้ไข Markdown แบบเรียลไทม์ (Live Markdown Editor) — แก้ไขและแสดงตัวอย่าง Markdown พร้อมระบบจัดการคุณสมบัติและ Frontmatter อย่างเป็นระบบ
ลิงก์ WikiLinks ภายในระบบ (Internal WikiLinks) — เชื่อมโยงแนวคิดต่าง ๆ เข้าด้วยกันโดยใช้ลิงก์รูปแบบ [[ชื่อบันทึก]]
กราฟองค์ความรู้ (Knowledge Graph) — แสดงภาพบันทึกและความสัมพันธ์ระหว่างบันทึกต่าง ๆ
ไทม์ไลน์เรื่องราว (Story Timeline) — จัดเรียงเหตุการณ์ตามลำดับเวลา พร้อมรองรับข้อมูลเมตาของวันที่ภายในเรื่องราว
เทมเพลตสำหรับงานเขียน (Writing Templates) — เริ่มต้นสร้างบันทึกใหม่จากเทมเพลตตัวละคร สถานที่ กลุ่มองค์กร เหตุการณ์ และเทมเพลตที่กำหนดเอง
ผู้ช่วย AI ด้านองค์ความรู้ (AI Knowledge Assistant) — ถามคำถามโดยอ้างอิงข้อมูลจากพื้นที่ทำงานที่เลือกไว้ ผ่าน Gemini หรือผู้ให้บริการที่รองรับ API รูปแบบ OpenAI
ระบบค้นคืนข้อมูลแบบอ่านอย่างเดียว (Read-only Retrieval) — ผู้ช่วยสามารถค้นหาและอ้างอิงบันทึกภายในพื้นที่ทำงานได้ โดยไม่แก้ไขหรือลบเนื้อหา
เซสชันการสนทนา (Chat Sessions) — จัดเก็บบทสนทนาแยกตามหัวข้อ พร้อมแหล่งอ้างอิงที่เกี่ยวข้อง
ถังขยะและประวัติเวอร์ชัน (Trash and Version History) — กู้คืนบันทึกที่ถูกลบ และเรียกคืนข้อมูลจากภาพบันทึกเวอร์ชันก่อนหน้า
การนำเข้าและส่งออกข้อมูล (Import and Export) — บันทึกข้อมูลพื้นที่ทำงานเป็นไฟล์ JSON หรือส่งออกเนื้อหา Markdown เป็นไฟล์ ZIP
การซิงก์ฐานข้อมูล (Database Synchronization) — รองรับการจัดเก็บข้อมูลแบบ JSON, SQLite, PostgreSQL/Supabase หรือ Cloudflare D1 ซึ่งสามารถเลือกใช้งานเพิ่มเติมได้
Progressive Web App (PWA) — ติดตั้งเป็น PWA ได้ พร้อมระบบแคชสำหรับใช้งานออฟไลน์และการอัปเดตอัตโนมัติ
แอป Android (Android Wrapper) — มีโปรเจกต์ Capacitor สำหรับสร้างไฟล์ APK หรือ AAB สำหรับ Android
เทคโนโลยีที่ใช้ (Technology Stack)
ส่วนประกอบ	เทคโนโลยี
Frontend	React 19, TypeScript, Tailwind CSS
ระบบ Build และ Bundling	Vite 8
Application Server	Express 4, TSX
AI	Google Gemini SDK, OpenAI-compatible Chat APIs
ระบบจัดเก็บข้อมูล	Local JSON, IndexedDB helpers, SQLite, PostgreSQL/Supabase, Cloudflare D1
Mobile	Capacitor 8 สำหรับ Android
PWA	vite-plugin-pwa
ข้อกำหนดของระบบ (Requirements)
Node.js เวอร์ชัน 20 หรือใหม่กว่า โดยแนะนำ Node.js 22 LTS
npm หรือ Bun
Gemini API Key หรือ API Key จากผู้ให้บริการที่รองรับ OpenAI-compatible API สำหรับใช้งานฟีเจอร์ AI
Android Studio และ Android SDK เฉพาะกรณีที่ต้องการ Build แอป Android แบบ Native
การติดตั้ง (Installation)
bash
git clone https://github.com/indyshares/Mythos.git
cd Mythos
npm install


หรือใช้ Bun:

bash
bun install

ตัวแปรสภาพแวดล้อม (Environment Variables)

สร้างไฟล์ Environment สำหรับใช้งานภายในเครื่อง:

bash
cp .env.example .env

dotenv
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="http://localhost:3000"

ตัวแปร	จำเป็นหรือไม่	คำอธิบาย
GEMINI_API_KEY	จำเป็นสำหรับ Gemini	API Key สำหรับการสร้างเนื้อหาด้วย Google Gemini และการค้นหารายชื่อโมเดล
APP_URL	ไม่บังคับ	URL พื้นฐานสาธารณะที่ใช้สำหรับ Callback และลิงก์ต่าง ๆ ของระบบที่ให้บริการบนโฮสต์

ห้าม Commit API Key, ข้อมูลรับรองฐานข้อมูล, Provider Token หรือไฟล์ .env ที่มีข้อมูลจริงลงใน Git โดยเด็ดขาด

การเรียกใช้งานภายในเครื่อง (Running Locally)

เริ่มต้นเซิร์ฟเวอร์สำหรับพัฒนาระบบ ซึ่งรวม Vite และ Express เข้าด้วยกัน:

bash
npm run dev


เปิดเบราว์เซอร์ไปที่:

text
http://localhost:3000


Express Server ทำหน้าที่ให้บริการ API Routes ภายใต้ /api ขณะที่ Vite ทำหน้าที่ให้บริการ Frontend และ Development Middleware

คำสั่งสำหรับจัดการโปรเจกต์ (Package Scripts)
คำสั่ง	คำอธิบาย
npm run dev	เริ่มต้น Development Server
npm run build	สร้าง Production Build ไว้ในโฟลเดอร์ dist/
npm start	เริ่มต้น Express Server
npm run preview	แสดงตัวอย่าง Vite Production Build
npm run lint	ตรวจสอบ TypeScript ด้วยคำสั่ง tsc --noEmit
npm test	เรียกใช้สคริปต์ test-e2e.ts

สามารถใช้คำสั่งที่เทียบเท่ากันผ่าน Bun ได้ เช่น bun run dev, bun run build และคำสั่งอื่น ๆ ตามสคริปต์ที่กำหนดไว้

การสร้าง Production Build (Production Build)
bash
npm run build
NODE_ENV=production npm start


เมื่อทำงานใน Production Mode, Express จะให้บริการไฟล์ที่สร้างขึ้นในโฟลเดอร์ dist/ และเปิดรับการเชื่อมต่อผ่านพอร์ต 3000

ผู้ช่วย AI ด้านองค์ความรู้ (AI Knowledge Assistant)

เซิร์ฟเวอร์รองรับการกำหนดค่าผู้ให้บริการ AI ได้หลายรูปแบบ ดังนี้:

Google Gemini ผ่าน GEMINI_API_KEY
OpenAI และบริการอื่น ๆ ที่รองรับ OpenAI-compatible API
OpenRouter, DeepSeek และ Custom Router Endpoints
API Key และ Base URL แบบกำหนดเอง ซึ่งสามารถตั้งค่าภายในแอปพลิเคชันได้

ข้อมูลที่ส่งให้ผู้ช่วย AI ประกอบด้วย:

คำถามของผู้ใช้
ประวัติการสนทนาล่าสุด
คำสั่งหรือแนวทางการทำงานของพื้นที่ทำงาน
เนื้อหาของบันทึกที่เลือกหรือกำลังโฟกัสอยู่
รายการแผนผังบันทึกทั้งหมดที่มีอยู่ในพื้นที่ทำงาน

ระบบจะค้นหาบันทึกที่เกี่ยวข้อง จำกัดจำนวนข้อมูลให้อยู่ในชุดบริบทขนาดเล็ก และนำข้อมูลเหล่านั้นมาใช้พร้อมระบุแหล่งอ้างอิง

ผู้ช่วย AI ถูกออกแบบมาให้ทำงานในลักษณะของผู้ช่วยด้านองค์ความรู้แบบอ่านอย่างเดียว (Read-only Knowledge Assistant) กล่าวคือ สามารถอ่าน สรุป อธิบาย และเสนอแนะเนื้อหาได้ แต่จะไม่แก้ไขบันทึกภายในพื้นที่ทำงานโดยที่ผู้ใช้ไม่รับทราบหรือไม่ได้สั่งการ

ระบบจัดเก็บและซิงก์ข้อมูล (Storage and Synchronization)

Mythos มีระบบจัดเก็บข้อมูลสำรองแบบ Local JSON และรองรับการซิงก์กับฐานข้อมูลเพิ่มเติม ดังนี้:

Local JSON: mythos_storage.json
IndexedDB: รองรับการใช้งานผ่านเครื่องมือจัดการข้อมูลภายในเบราว์เซอร์
SQLite: สามารถกำหนดค่าไฟล์ฐานข้อมูลภายในเครื่องได้
PostgreSQL: รองรับทั้งฐานข้อมูลภายในเครื่องและฐานข้อมูลบนเซิร์ฟเวอร์
Supabase: รองรับการเชื่อมต่อ PostgreSQL ผ่าน Connection String
Cloudflare D1: รองรับการกำหนดค่าบัญชี ฐานข้อมูล และ API Token

ข้อมูลรับรองสำหรับเชื่อมต่อฐานข้อมูลควรถูกจัดเก็บและส่งผ่านฝั่งเซิร์ฟเวอร์อย่างปลอดภัย ควรสำรองข้อมูลผลงานเขียนที่สำคัญก่อนเปลี่ยนผู้ให้บริการพื้นที่จัดเก็บข้อมูลทุกครั้ง

การติดตั้ง PWA (PWA Installation)

การกำหนดค่า Vite PWA ได้ตั้งชื่อแอปพลิเคชันที่สามารถติดตั้งได้เป็น Mythos พร้อมเปิดใช้งานการอัปเดต Service Worker โดยอัตโนมัติ

เบราว์เซอร์รุ่นใหม่สามารถรองรับความสามารถต่าง ๆ ดังนี้:

เพิ่มไปยังหน้าจอหลัก (Add to Home Screen)
ติดตั้งในรูปแบบแอปพลิเคชันแบบ Standalone
แคชไฟล์ Static Assets
แสดงสถานะการใช้งานออฟไลน์ภายในแอปพลิเคชัน

อย่างไรก็ตาม การทำงานในรูปแบบ PWA ไม่สามารถทดแทนการสำรองข้อมูลพื้นที่ทำงานเป็นประจำได้

การ Build แอป Android (Android Build)

Repository นี้มีโปรเจกต์ Android/Capacitor และไฟล์ capacitor.config.ts ซึ่งกำหนดค่าดังนี้:

typescript
appId: "app.indyshares.mythos"
appName: "Mythos"
webDir: "dist"


สร้างและซิงก์แอปพลิเคชัน Android ด้วยคำสั่งต่อไปนี้:

bash
npm run build
npx cap sync android
npx cap open android


สามารถดูรายละเอียดแนวทางการพัฒนา Native Application ได้ที่ ANDROID_APP_SPECIFICATION.md

โครงสร้างโปรเจกต์ (Project Structure)
text
.
├── android/                     # โปรเจกต์ Android ของ Capacitor
├── src/
│   ├── App.tsx                 # คอมโพเนนต์หลักสำหรับเริ่มต้นแอปพลิเคชัน
│   ├── assets/                 # ไฟล์ทรัพยากรของแอปพลิเคชัน
│   ├── components/             # คอมโพเนนต์ส่วนติดต่อผู้ใช้ (UI)
│   ├── context/                # Context Providers ของ React
│   ├── hooks/                  # Custom Hooks
│   ├── types/                  # TypeScript Types ที่ใช้ร่วมกัน
│   └── utils/                  # ฟังก์ชันและเครื่องมือช่วยต่าง ๆ
├── public/                     # ไฟล์ Static ที่เปิดให้เข้าถึงได้
├── scripts/                    # สคริปต์สำหรับดูแลและ Build โปรเจกต์
├── data/                       # ทรัพยากรข้อมูลภายในโปรเจกต์
├── server.ts                   # Express Server และ API Routes
├── test-e2e.ts                 # สคริปต์ทดสอบการทำงานแบบ End-to-End
├── vite.config.ts              # การกำหนดค่า Vite และ PWA
├── capacitor.config.ts         # การกำหนดค่าสำหรับแพ็กเกจ Android
├── package.json
└── mythos_storage.json         # ไฟล์ข้อมูลสำรองแบบ Local

ภาพรวม API (API Overview)

เซิร์ฟเวอร์มี Routes สำหรับรองรับการทำงานดังต่อไปนี้:

การตรวจสอบสถานะการทำงานของระบบ (Health Checks)
การทดสอบการเชื่อมต่อกับ Gemini หรือ Custom Provider
การสนทนาด้วย AI และการค้นคืนข้อมูลบริบทจากพื้นที่ทำงาน
การซิงก์ข้อมูลภายในเครื่องและฐานข้อมูล
การดึงประวัติการสนทนา
การให้บริการไฟล์ Frontend แบบ Static

ห้ามจัดเก็บ Provider Key ไว้ในไฟล์ Source Code ฝั่ง Frontend ควรใช้ Environment Variables ฝั่งเซิร์ฟเวอร์ หรือการตั้งค่าของผู้ใช้ที่มีระบบรักษาความปลอดภัยเหมาะสม

ความปลอดภัยและความเป็นส่วนตัว (Security and Privacy)
คำขอที่ส่งไปยัง AI อาจมีการส่งคำถามและเนื้อหาบันทึกที่เลือกไว้ไปยังผู้ให้บริการภายนอก
ห้าม Commit API Key ลงใน Git หรือฝัง API Key ไว้ใน Frontend Bundle ที่เผยแพร่สู่สาธารณะ
ข้อมูลที่จัดเก็บใน Local JSON, SQLite หรือ Browser Storage ควรได้รับการจัดการให้เหมาะสมกับระดับความอ่อนไหวของข้อมูล
ควรส่งออกหรือสำรองข้อมูลพื้นที่ทำงานอย่างสม่ำเสมอ
การทดสอบ (Testing)

เรียกใช้การตรวจสอบ TypeScript และสคริปต์ทดสอบแบบ End-to-End ด้วยคำสั่งต่อไปนี้:

bash
npm run lint
npm test
npm run build


เนื่องจากระบบทดสอบขึ้นอยู่กับการทำงานจริงของเบราว์เซอร์และเซิร์ฟเวอร์ รวมถึงผู้ให้บริการภายนอก จึงควรกำหนดค่าบริการที่จำเป็นให้เรียบร้อยก่อนเรียกใช้การทดสอบที่เกี่ยวข้องกับผู้ให้บริการเหล่านั้น

การมีส่วนร่วมในการพัฒนา (Contributing)
Fork Repository
สร้าง Branch สำหรับการพัฒนาฟีเจอร์โดยเฉพาะ:
bash
git switch -c feature/my-feature

จำกัดขอบเขตการเปลี่ยนแปลงให้ชัดเจน และจัดทำเอกสารสำหรับ Environment Variables ใหม่ หรือข้อกำหนดด้านการจัดเก็บข้อมูลที่เพิ่มเข้ามา
เรียกใช้ Lint, Tests และ Production Build
เปิด Pull Request พร้อมสรุปการเปลี่ยนแปลงและแผนการทดสอบอย่างชัดเจน
สัญญาอนุญาต (License)

ดูรายละเอียดสัญญาอนุญาตของ Repository ได้ที่ LICENSE.txt

ลิงก์ที่เกี่ยวข้อง (Links)
Repository: https://github.com/indyshares/Mythos
เอกสารภาษาไทย: README_TH.md
