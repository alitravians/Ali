# Discord API — مرجع سريع لمطوّري BOON

هذا الملف مرجع endpoints الـ Discord API الأكثر فائدة لكتابة plugins.
المرجع الرسمي الكامل في [docs.discord.com/developers/reference](https://docs.discord.com/developers/reference).

> ⚠️ BOON تستخدم Discord API بـ **token المستخدم نفسه** (مش bot token).
> هذا "self-bot" usage وهو **مخالف لشروط Discord**. استخدم BOON على حسابك
> الشخصي على مسؤوليتك. لا تنشر plugin يتجاوز ٢ طلب في الثانية لتجنّب الحظر.

---

## ١. كيف تستخدم API من داخل plugin

```typescript
import { definePlugin } from "../../core/types.js";

export default definePlugin({
    manifest: { id: "myPlugin", /* ... */ },
    onStart(ctx) {
        async function api<T>(path: string, init?: RequestInit): Promise<T> {
            const token = (window as unknown as { localStorage: Storage }).localStorage.token
                ?.replace(/^"/, "").replace(/"$/, "");
            if (!token) throw new Error("لا يوجد token");
            const res = await fetch(`https://discord.com/api/v9${path}`, {
                ...init,
                headers: {
                    "content-type": "application/json",
                    authorization: token,
                    ...init?.headers,
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return (await res.json()) as T;
        }

        ctx.registerCommand({
            name: "uinfo",
            description: "اعرض معلومات المستخدم الحالي.",
            async execute() {
                const me = await api<{ id: string; username: string }>("/users/@me");
                ctx.toast(`أنت ${me.username} (${me.id})`, "info");
            },
        });
    },
});
```

> ملاحظة أمنية: `getUserToken()` موجودة بالفعل في `serverTools` plugin (raw fetch
> من localStorage). لا ترسل الـ token لأي خادم خارجي أبداً.

---

## ٢. Endpoints الأكثر استخداماً

### Users

| Method | Path | الوصف |
|--------|------|------|
| GET | `/users/@me` | معلومات حسابي |
| GET | `/users/{id}` | معلومات مستخدم |
| GET | `/users/@me/guilds` | السيرفرات التي أنا فيها |
| GET | `/users/@me/channels` | DMs |

### Messages

| Method | Path | الوصف |
|--------|------|------|
| GET | `/channels/{channelId}/messages?limit=50` | آخر رسائل |
| GET | `/channels/{channelId}/messages?before={id}&limit=50` | رسائل قبل id |
| GET | `/channels/{channelId}/messages?around={id}&limit=50` | رسائل حول id |
| GET | `/channels/{channelId}/messages/{messageId}` | رسالة محددة |
| POST | `/channels/{channelId}/messages` | إرسال رسالة (body: `{ content }`) |
| PATCH | `/channels/{channelId}/messages/{messageId}` | تعديل |
| DELETE | `/channels/{channelId}/messages/{messageId}` | حذف |
| POST | `/channels/{channelId}/messages/bulk-delete` | حذف جماعي (bots only) |
| PUT | `/channels/{channelId}/pins/{messageId}` | تثبيت |
| DELETE | `/channels/{channelId}/pins/{messageId}` | إلغاء تثبيت |
| PUT | `/channels/{channelId}/messages/{messageId}/reactions/{emoji}/@me` | reaction |

### Channels

| Method | Path | الوصف |
|--------|------|------|
| GET | `/channels/{id}` | معلومات القناة |
| PATCH | `/channels/{id}` | تعديل (name, topic, …) |
| DELETE | `/channels/{id}` | حذف |
| POST | `/channels/{id}/typing` | "يكتب الآن…" |
| GET | `/channels/{id}/invites` | الدعوات |
| POST | `/channels/{id}/invites` | إنشاء دعوة |

### Guilds (السيرفرات)

| Method | Path | الوصف |
|--------|------|------|
| GET | `/guilds/{id}` | معلومات السيرفر |
| GET | `/guilds/{id}/channels` | كل القنوات |
| GET | `/guilds/{id}/members/{userId}` | معلومات عضو |
| GET | `/guilds/{id}/members?limit=1000` | كل الأعضاء |
| GET | `/guilds/{id}/roles` | كل الأدوار |
| GET | `/guilds/{id}/emojis` | الإيموجي |
| GET | `/guilds/{id}/audit-logs` | سجل التعديلات (إن كان لك صلاحية) |

### Voice

| Method | Path | الوصف |
|--------|------|------|
| GET | `/voice/regions` | المناطق المتاحة |
| PATCH | `/guilds/{id}/voice-states/@me` | تعديل حالتي الصوتية |

---

## ٣. Rate limits

كل استجابة فيها headers مهمّة:

```
x-ratelimit-limit:      عدد الطلبات المسموحة في النافذة
x-ratelimit-remaining:  المتبقي قبل التوقّف
x-ratelimit-reset:      timestamp الـ Unix للتجديد
x-ratelimit-reset-after: ثواني للتجديد
```

عند تجاوز الحد ترجع HTTP 429 مع `retry_after` في الـ body. **توقّف عند 429
دائماً** ولا تجرّب فوراً (يزيد الحظر).

نموذج للالتفاف على rate limits:

```typescript
async function rateLimitedFetch(url: string, init?: RequestInit): Promise<Response> {
    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url, init);
        if (res.status !== 429) return res;
        const retryAfter = Number(res.headers.get("retry-after") ?? "1");
        await new Promise(r => setTimeout(r, retryAfter * 1000));
    }
    throw new Error("rate limit too aggressive");
}
```

---

## ٤. ممنوعات صريحة في BOON plugins

| ✗ ممنوع | السبب |
|---------|------|
| إرسال token المستخدم لخادم خارجي | حظر فوري + خرق ثقة |
| spam رسائل (>5/ثانية) | حظر سريع من Discord |
| automation كامل (auto-respond، auto-react لكل رسالة) | self-bot detection |
| تسجيل كل رسالة لـ logging خارجي | خصوصية |
| التحايل على rate limits بـ retry فوري | يضاعف العقوبة |

---

## ٥. أمثلة عملية في BOON

### مثال: عدد الأعضاء في السيرفر الحالي
```typescript
ctx.registerCommand({
    name: "membercount",
    description: "عدد أعضاء السيرفر الحالي.",
    async execute() {
        const guildId = location.pathname.match(/\/channels\/(\d+)/)?.[1];
        if (!guildId) return ctx.toast("افتح سيرفراً", "error");
        const guild = await api<{ approximate_member_count: number; name: string }>(`/guilds/${guildId}?with_counts=true`);
        ctx.toast(`${guild.name}: ${guild.approximate_member_count} عضو`, "info");
    },
});
```

### مثال: التحقّق من رسالة قبل تثبيتها
```typescript
ctx.contextMenu.patch("message", (m, addItem) => {
    if (!m.messageId || !m.channelId) return;
    addItem({
        id: "pinFromContext",
        label: "ثبّت الرسالة",
        icon: "📌",
        async onClick() {
            await api(`/channels/${m.channelId}/pins/${m.messageId}`, { method: "PUT" });
            ctx.toast("تم التثبيت", "success");
        },
    });
});
```

---

## ٦. خدمات Discord الإضافية (مفيدة لـ plugins متقدّمة)

- **Gateway WebSocket**: `wss://gateway.discord.gg/?v=10&encoding=json` — لتلقي
  أحداث realtime (typing, presence). BOON يستخدم DOM observation حالياً ولا
  يتصل بـ Gateway مباشرة (يتجنب double connection مع Discord client نفسه).
- **CDN**: `https://cdn.discordapp.com/avatars/{userId}/{hash}.png` — مفيد
  للـ themes/badges.
- **OAuth2** (للـ bots فقط): `https://discord.com/api/oauth2/authorize` — غير
  مستخدم في BOON.

---

## ٧. مراجع رسمية

- [Discord Developer Documentation](https://docs.discord.com/developers/reference)
- [Discord API Versions](https://docs.discord.com/developers/reference#api-versioning)
- [Discord Rate Limits](https://docs.discord.com/developers/topics/rate-limits)
- [Discord Gateway](https://docs.discord.com/developers/topics/gateway)
- [Vencord source](https://github.com/Vendicated/Vencord) — أمثلة عملية كثيرة
