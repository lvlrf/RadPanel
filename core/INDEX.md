# MegaPrompt V8 - فایل‌های پروژه

## 📦 محتویات پکیج

این پکیج شامل **11 فایل** است که MegaPrompt V8 را تشکیل می‌دهند.

---

## 📋 فایل‌های اصلی

### 1. MEGAPROMPT_V8_FINAL.md
**سایز**: ~150 KB  
**زبان**: English  
**هدف**: مرجع کامل MegaPrompt V8

**محتوا**:
- تمام فازها (Discovery → Planning → Build → Delivery)
- ساختار فایل‌ها (30+ فایل documentation)
- قوانین تصمیم‌گیری
- Multi-agent coordination
- Cost optimization
- Quality gates
- Security checklist

**استفاده**:
- مرجع اصلی برای هر AI model
- راهنمای کامل workflow
- شامل تمام تصمیمات طراحی

---

### 2. AGENT_START_PROMPT.md
**سایز**: ~30 KB  
**زبان**: English  
**هدف**: راه‌اندازی سریع برای هر agent

**محتوا**:
- Quick setup (30 ثانیه)
- Core principles
- File structure overview
- First message template
- Quality checklist

**استفاده**:
- اولین فایلی که agent می‌خواند
- راهنمای سریع شروع
- مناسب برای onboarding

---

## 🤖 فایل‌های خاص هر Model

### 3. CLAUDE.md
**سایز**: ~45 KB  
**زبان**: English + Persian examples  
**هدف**: راهنمای Claude AI

**محتوا**:
- Claude-specific instructions
- Persian conversation patterns
- Evidence-based recommendations
- Critical thinking approach
- Deep technical review

**استفاده**:
- Claude Sonnet 4.5
- Claude Opus 4.1
- Claude Haiku 4.5

---

### 4. CODEX.md
**سایز**: ~55 KB  
**زبان**: English  
**هدف**: راهنمای GPT models

**محتوا**:
- GPT-specific instructions
- UI/UX excellence patterns
- Creative problem-solving
- Code generation best practices
- Multi-model coordination

**استفاده**:
- GPT-4o
- GPT o1
- GPT o1-mini

---

### 5. GEMINI.md
**سایز**: ~35 KB  
**زبان**: English  
**هدف**: راهنمای Gemini models

**محتوا**:
- Gemini-specific instructions
- Speed optimization
- Multimodal processing
- Bulk operations
- Cost efficiency

**استفاده**:
- Gemini 2.0 Pro
- Gemini 2.0 Flash
- Gemini 1.5 Pro

---

## 🛠️ فایل‌های Integration

### 6. .cursorrules
**سایز**: ~42 KB  
**زبان**: English  
**هدف**: Cursor IDE integration

**محتوا**:
- Coding standards
- Security rules
- File operations
- Decision protocols
- Testing requirements
- Error handling

**استفاده**:
- قرار بده در root پروژه
- Cursor IDE خودکار می‌خونه
- راهنمای coding assistant

---

### 7. README.md
**سایز**: ~58 KB  
**زبان**: English  
**هدف**: GitHub documentation

**محتوا**:
- Project overview
- Features list
- Quick start guide
- File structure
- Multi-model strategy
- Security features
- Cost tracking
- Quality standards

**استفاده**:
- GitHub repository
- Project introduction
- Public documentation

---

## 📚 فایل‌های مثال

### 8. example-claude.md
**سایز**: ~48 KB  
**زبان**: Persian + English  
**هدف**: مثال‌های واقعی برای Claude

**محتوا**:
- Example 1: Simple Task Manager (Persian)
- Example 2: Override Warning
- Example 3: Multi-Agent Suggestion
- Complete conversation flows
- Decision patterns
- Proactive suggestions

**استفاده**:
- یاد بگیر چطور کار کنی
- الگوهای conversation
- Best practices

---

### 9. example-codex.md
**سایز**: ~61 KB  
**زبان**: English  
**هدف**: مثال‌های واقعی برای GPT

**محتوا**:
- Example 1: E-Commerce Product Page
- Example 2: Override Warning
- Example 3: UI Enhancement Suggestions
- Example 4: Multi-Model Coordination
- UI/UX patterns
- Technical architecture decisions

**استفاده**:
- Learn GPT workflow
- UI/UX excellence examples
- Professional patterns

---

## 📊 فایل‌های خلاصه

### 10. V8_CHANGES_SUMMARY.md
**سایز**: ~40 KB  
**زبان**: Persian  
**هدف**: خلاصه تغییرات اولیه V8

**محتوا**:
- همه تغییرات V8 vs V7
- توضیح هر feature جدید
- دلایل تغییرات
- فایل‌های جدید

**استفاده**:
- فهم تغییرات
- مقایسه نسخه‌ها
- تاریخچه تصمیمات

---

### 11. V8_FINAL_UPDATE_SUMMARY.md
**سایز**: ~45 KB  
**زبان**: Persian  
**هدف**: خلاصه آپدیت نهایی V8

**محتوا**:
- تمام تغییرات اعمال شده
- 30+ نقش اضافه شده
- Template extraction prompt
- PRD_IMPLEMENTATION_MATRIX شرطی
- Override warning system
- NO UNAUTHORIZED CHANGES
- لیست کامل مدل‌ها

**استفاده**:
- آخرین تغییرات
- مرجع سریع
- Changelog کامل

---

## 🎯 چطور استفاده کنم؟

### برای AI Models

**1. شناسایی model**:
```
من Claude هستم → CLAUDE.md بخون
من GPT هستم → CODEX.md بخون
من Gemini هستم → GEMINI.md بخون
```

**2. بارگذاری framework**:
```
1. AGENT_START_PROMPT.md (سریع)
2. MEGAPROMPT_V8_FINAL.md (کامل)
3. فایل model خودت (CLAUDE/CODEX/GEMINI)
```

**3. مطالعه مثال‌ها**:
```
example-claude.md or example-codex.md
```

**4. شروع کار**:
```
با Phase 0 greeting شروع کن
```

---

### برای Developers

**1. Clone/Download پروژه**

**2. فایل‌ها رو بخون**:
```
1. README.md (overview)
2. MEGAPROMPT_V8_FINAL.md (complete guide)
```

**3. Setup برای Cursor IDE**:
```
cp .cursorrules /path/to/your/project/
```

**4. استفاده از AI**:
```
- Claude: بهش بگو بخونه CLAUDE.md
- GPT: بهش بگو بخونه CODEX.md
- Gemini: بهش بگو بخونه GEMINI.md
```

---

### برای Users (غیرفنی)

**1. انتخاب AI**:
```
□ Claude Sonnet (متوازن)
□ Claude Opus (قوی‌ترین)
□ GPT-4o (UI/UX عالی)
□ Gemini Flash (سریع، ارزان)
```

**2. شروع مکالمه**:
```
"می‌خوام یه [idea] بسازم"
```

**3. AI راهنماییت می‌کنه**:
```
- سوال می‌پرسه
- گزینه‌ها می‌ده
- تو تصمیم می‌گیری
- AI می‌سازه
```

**4. دریافت نتیجه**:
```
- کد کامل
- Documentation
- Tests
- README
- ZIP package
```

---

## 📁 ساختار نهایی پروژه

```
MEGAPROMPT_V8_COMPLETE.zip
│
├── MEGAPROMPT_V8_FINAL.md         # Core framework
├── AGENT_START_PROMPT.md          # Quick start
│
├── CLAUDE.md                      # Claude guide
├── CODEX.md                       # GPT guide
├── GEMINI.md                      # Gemini guide
│
├── .cursorrules                   # Cursor integration
├── README.md                      # GitHub docs
│
├── example-claude.md              # Claude examples
├── example-codex.md               # GPT examples
│
├── V8_CHANGES_SUMMARY.md          # Initial changes
└── V8_FINAL_UPDATE_SUMMARY.md     # Final updates
```

---

## 🔗 منابع خارجی مفید

### Cloudflare VibeSDK
**GitHub**: https://github.com/cloudflare/vibesdk

**چی یاد می‌گیری**:
- Phase-wise code generation
- Container-based execution
- Real-time preview
- Durable Objects patterns
- WebSocket communication

**کاربرد**:
اگه می‌خوای یه vibe coding platform بسازی مثل VibeSDK خودشون

---

### Cloudflare Agents
**GitHub**: https://github.com/cloudflare/agents

**چی یاد می‌گیری**:
- Stateful AI agents
- Persistent memory systems
- WebSocket real-time communication
- Multi-agent coordination
- Agent hibernation/awakening

**کاربرد**:
اگه می‌خوای AI agents بسازی که state دارن و می‌تونن با همدیگه کار کنن

---

## ⚡ نکات مهم

### 1. قانون "بدون اجازه"
```
این قانون برای ChatBot هست که از MegaPrompt استفاده می‌کنه
نه برای خود MegaPrompt

MegaPrompt می‌تونه:
✅ تصمیم بگیره فایل‌ها چطور باشن
✅ بهترین format رو انتخاب کنه
✅ Optimize کنه workflow رو

ChatBot نمی‌تونه (بدون اجازه):
❌ فیچر اضافه کنه
❌ تکنولوژی عوض کنه
❌ scope تغییر بده
```

### 2. PRD_IMPLEMENTATION_MATRIX
```
فقط اگه tasks > 20 ساخته می‌شه
پروژه‌های کوچیک نیاز ندارن
```

### 3. Multi-Model
```
برای پروژه‌های بزرگ (20+ tasks):
- سریع‌تر (موازی)
- هزینه بهتر (هر model روی قوتش)
- کیفیت بالاتر (تخصصی)
```

### 4. Cost Tracking
```
Real-time dashboard
Budget alerts (80%, 90%)
Per-model breakdown
```

### 5. Security
```
Auto-check قبل از delivery
.env usage
Password hashing
SQL injection prevention
```

---

## 📞 سوالات متداول

### س: کدوم فایل رو اول بخونم؟
ج: AGENT_START_PROMPT.md برای شروع سریع

### س: همه فایل‌ها لازمه؟
ج: بله، هر کدوم نقش خاصی دارن

### س: می‌تونم فقط یکی از model ها رو استفاده کنم؟
ج: بله کاملاً! فقط فایل اون model رو بخون

### س: فرق CLAUDE.md با CODEX.md چیه؟
ج: هر کدوم برای قوت‌های خاص اون model نوشته شده

### س: .cursorrules کجا بذارم؟
ج: توی root directory پروژه‌ات

---

## ✅ چک‌لیست استفاده

**برای شروع**:
- [ ] فایل‌ها رو extract کردی
- [ ] INDEX.md رو خوندی (این فایل)
- [ ] README.md رو خوندی
- [ ] Model خودت رو شناسایی کردی
- [ ] فایل مخصوص model ات رو خوندی

**برای AI**:
- [ ] AGENT_START_PROMPT.md خوندی
- [ ] MEGAPROMPT_V8_FINAL.md خوندی
- [ ] example فایل خوندی
- [ ] آماده شروع کار

**برای Development**:
- [ ] .cursorrules کپی کردی
- [ ] README.md خوندی
- [ ] MEGAPROMPT_V8_FINAL.md مرور کردی

---

## 🎉 آماده شروع!

همه چیز آماده است. انتخاب کن:

**اگه AI هستی**:
1. Model ات رو شناسایی کن
2. AGENT_START_PROMPT.md بخون
3. فایل model ات رو بخون
4. شروع کن!

**اگه Developer هستی**:
1. README.md بخون
2. .cursorrules setup کن
3. AI ات رو راه‌اندازی کن
4. Build کن!

**اگه User هستی**:
1. AI انتخاب کن
2. شروع صحبت کن
3. سوالات رو جواب بده
4. پروژه رو دریافت کن!

---

**موفق باشی! 🚀**

*Version 8.0 - 2024-12-31*
