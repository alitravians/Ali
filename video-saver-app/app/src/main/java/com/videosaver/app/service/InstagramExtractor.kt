package com.videosaver.app.service

import com.videosaver.app.data.model.ContentType
import com.videosaver.app.data.model.Platform
import com.videosaver.app.data.model.VideoInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.net.URI
import java.util.concurrent.TimeUnit

class InstagramExtractor : VideoExtractor {
    override val platform = Platform.INSTAGRAM

    private val client = OkHttpClient.Builder()
        .followRedirects(true)
        .followSslRedirects(true)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val userAgents = listOf(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; Google/google; Pixel 7; panther; panther; en_US; 458229258)"
    )

    // Cobalt v7 instances (no auth required)
    private val cobaltV7Instances = listOf(
        "https://downloadapi.stuff.solutions/api/json"
    )

    override suspend fun extract(url: String): Result<VideoInfo> = withContext(Dispatchers.IO) {
        try {
            val cleanedUrl = cleanInstagramUrl(url)
            val contentType = detectContentType(cleanedUrl)
            val shortcode = extractShortcode(cleanedUrl)

            // Step 1: Check content availability via oEmbed API
            val availabilityError = checkContentAvailability(cleanedUrl)
            if (availabilityError != null) {
                return@withContext Result.failure(Exception(availabilityError))
            }

            // Step 2: Try cobalt API with multiple URL formats
            // Cobalt stream URLs are trusted proxy endpoints - do NOT verify with HEAD
            // HEAD requests break cobalt stream URLs (they don't support HEAD)
            val urlVariants = buildUrlVariants(cleanedUrl, shortcode)
            var videoInfo: VideoInfo? = null
            for (variant in urlVariants) {
                videoInfo = tryCobaltApi(variant, contentType)
                if (videoInfo != null) break
            }

            // Step 3: Try GraphQL method
            if (videoInfo == null) {
                videoInfo = tryGraphQLMethod(cleanedUrl, contentType)
            }

            // Step 4: Try Instagram API v1 with mobile user agent
            if (videoInfo == null && shortcode != null) {
                videoInfo = tryInstagramApiV1(shortcode, contentType)
            }

            // Step 5: Try embed method
            if (videoInfo == null) {
                videoInfo = tryEmbedMethod(cleanedUrl, contentType)
            }

            // Step 6: Try HTML scraping
            if (videoInfo == null) {
                videoInfo = tryHtmlScraping(cleanedUrl, contentType)
            }

            if (videoInfo != null) {
                Result.success(videoInfo)
            } else {
                Result.failure(Exception("تعذر استخراج الفيديو من Instagram.\nتأكد أن الرابط صحيح وأن المحتوى عام وغير مقيد."))
            }
        } catch (e: Exception) {
            Result.failure(Exception("خطأ في الاتصال: ${e.message}"))
        }
    }

    private fun cleanInstagramUrl(url: String): String {
        var cleaned = url.trim()
        try {
            val uri = URI(cleaned)
            val path = uri.path.trimEnd('/')
            cleaned = "https://www.instagram.com$path/"
        } catch (_: Exception) {
            val queryIndex = cleaned.indexOf('?')
            if (queryIndex > 0) {
                cleaned = cleaned.substring(0, queryIndex)
            }
            if (!cleaned.endsWith("/")) {
                cleaned += "/"
            }
        }
        cleaned = cleaned.replace("://instagram.com", "://www.instagram.com")
        cleaned = cleaned.replace("://m.instagram.com", "://www.instagram.com")
        return cleaned
    }

    private fun buildUrlVariants(cleanedUrl: String, shortcode: String?): List<String> {
        val variants = mutableListOf(cleanedUrl)
        if (shortcode != null) {
            if (cleanedUrl.contains("/reel/")) {
                variants.add("https://www.instagram.com/p/$shortcode/")
            }
            if (cleanedUrl.contains("/p/") && !cleanedUrl.contains("/reel/")) {
                variants.add("https://www.instagram.com/reel/$shortcode/")
            }
            variants.add("https://instagram.com/reel/$shortcode/")
        }
        return variants.distinct()
    }

    private fun checkContentAvailability(url: String): String? {
        return try {
            val oembedUrl = "https://www.instagram.com/api/v1/oembed/?url=$url"
            val request = Request.Builder()
                .url(oembedUrl)
                .header("User-Agent", userAgents[0])
                .header("Accept", "application/json")
                .build()

            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return null

            try {
                val json = JSONObject(body)
                val status = json.optString("status", "")
                val message = json.optString("message", "")

                when {
                    status == "fail" && message == "geoblock_required" -> {
                        val description = json.optString("description", "")
                        if (description.contains("15 years old", ignoreCase = true)) {
                            "هذا المحتوى مقيد بالعمر ويتطلب تسجيل الدخول في Instagram للوصول إليه.\nجرّب فتح الرابط في متصفح الهاتف أولاً."
                        } else {
                            "هذا المحتوى مقيد جغرافياً أو يتطلب تسجيل الدخول."
                        }
                    }
                    status == "fail" && message.contains("login", ignoreCase = true) -> {
                        "هذا المحتوى يتطلب تسجيل الدخول في Instagram. تأكد أن الحساب عام."
                    }
                    status == "fail" && message.contains("not found", ignoreCase = true) -> {
                        "المحتوى غير موجود. قد يكون تم حذفه أو أن الرابط غير صحيح."
                    }
                    status == "fail" -> null
                    else -> null
                }
            } catch (_: Exception) {
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun tryCobaltApi(url: String, contentType: String): VideoInfo? {
        for (instance in cobaltV7Instances) {
            try {
                val jsonBody = JSONObject().apply {
                    put("url", url)
                    put("videoQuality", "720")
                }

                val requestBody = jsonBody.toString()
                    .toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url(instance)
                    .post(requestBody)
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "VideoSaver/1.0 (+https://github.com/user/videosaver)")
                    .build()

                val response = client.newCall(request).execute()
                if (!response.isSuccessful) continue

                val body = response.body?.string() ?: continue
                val json = JSONObject(body)
                val status = json.optString("status", "")

                when (status) {
                    "tunnel", "redirect", "stream" -> {
                        val videoUrl = json.optString("url", "")
                        if (videoUrl.isNotEmpty()) {
                            return VideoInfo(
                                videoUrl = videoUrl,
                                thumbnailUrl = "",
                                platform = Platform.INSTAGRAM,
                                contentType = contentType
                            )
                        }
                    }
                    "picker" -> {
                        val picker = json.optJSONArray("picker")
                        if (picker != null && picker.length() > 0) {
                            for (i in 0 until picker.length()) {
                                val item = picker.getJSONObject(i)
                                if (item.optString("type") == "video") {
                                    val videoUrl = item.optString("url", "")
                                    val thumb = item.optString("thumb", "")
                                    if (videoUrl.isNotEmpty()) {
                                        return VideoInfo(
                                            videoUrl = videoUrl,
                                            thumbnailUrl = thumb,
                                            platform = Platform.INSTAGRAM,
                                            contentType = contentType
                                        )
                                    }
                                }
                            }
                            val firstItem = picker.getJSONObject(0)
                            val videoUrl = firstItem.optString("url", "")
                            if (videoUrl.isNotEmpty()) {
                                return VideoInfo(
                                    videoUrl = videoUrl,
                                    thumbnailUrl = firstItem.optString("thumb", ""),
                                    platform = Platform.INSTAGRAM,
                                    contentType = contentType
                                )
                            }
                        }
                    }
                    "error" -> {
                        continue
                    }
                }

                if (status.isEmpty()) {
                    val videoUrl = json.optString("url", "")
                    if (videoUrl.isNotEmpty()) {
                        return VideoInfo(
                            videoUrl = videoUrl,
                            thumbnailUrl = "",
                            platform = Platform.INSTAGRAM,
                            contentType = contentType
                        )
                    }
                }
            } catch (_: Exception) {
                continue
            }
        }
        return null
    }

    private fun detectContentType(url: String): String {
        return when {
            url.contains("/reel/") || url.contains("/reels/") -> ContentType.REEL
            url.contains("/stories/") -> ContentType.STORY
            else -> ContentType.VIDEO
        }
    }

    private fun tryGraphQLMethod(url: String, contentType: String): VideoInfo? {
        return try {
            val shortcode = extractShortcode(url) ?: return null
            val graphqlUrl = "https://www.instagram.com/p/$shortcode/?__a=1&__d=dis"

            val request = Request.Builder()
                .url(graphqlUrl)
                .header("User-Agent", userAgents[0])
                .header("Accept", "application/json")
                .header("X-IG-App-ID", "936619743392459")
                .header("X-Requested-With", "XMLHttpRequest")
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return null

            val body = response.body?.string() ?: return null
            val json = JSONObject(body)

            val items = json.optJSONArray("items")
            if (items != null && items.length() > 0) {
                val item = items.getJSONObject(0)
                val videoVersions = item.optJSONArray("video_versions")
                if (videoVersions != null && videoVersions.length() > 0) {
                    val videoUrl = videoVersions.getJSONObject(0).getString("url")
                    val thumbnail = item.optJSONObject("image_versions2")
                        ?.optJSONArray("candidates")
                        ?.optJSONObject(0)
                        ?.optString("url") ?: ""
                    val duration = item.optDouble("video_duration", 0.0)

                    return VideoInfo(
                        videoUrl = videoUrl,
                        thumbnailUrl = thumbnail,
                        platform = Platform.INSTAGRAM,
                        contentType = contentType,
                        duration = formatDuration(duration)
                    )
                }
            }
            null
        } catch (_: Exception) {
            null
        }
    }

    private fun tryInstagramApiV1(shortcode: String, contentType: String): VideoInfo? {
        return try {
            val mediaId = shortcodeToMediaId(shortcode) ?: return null
            val apiUrl = "https://i.instagram.com/api/v1/media/${mediaId}/info/"

            val request = Request.Builder()
                .url(apiUrl)
                .header("User-Agent", userAgents[3])
                .header("X-IG-App-ID", "936619743392459")
                .header("X-IG-Capabilities", "3brTvw8=")
                .header("X-IG-Connection-Type", "WIFI")
                .header("Accept-Language", "en-US")
                .header("Accept", "*/*")
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return null

            val body = response.body?.string() ?: return null
            val json = JSONObject(body)

            if (json.optString("status") == "fail") return null

            val items = json.optJSONArray("items")
            if (items != null && items.length() > 0) {
                val item = items.getJSONObject(0)
                val videoVersions = item.optJSONArray("video_versions")
                if (videoVersions != null && videoVersions.length() > 0) {
                    val videoUrl = videoVersions.getJSONObject(0).getString("url")
                    val thumbnail = item.optJSONObject("image_versions2")
                        ?.optJSONArray("candidates")
                        ?.optJSONObject(0)
                        ?.optString("url") ?: ""
                    val duration = item.optDouble("video_duration", 0.0)

                    return VideoInfo(
                        videoUrl = videoUrl,
                        thumbnailUrl = thumbnail,
                        platform = Platform.INSTAGRAM,
                        contentType = contentType,
                        duration = formatDuration(duration)
                    )
                }
            }
            null
        } catch (_: Exception) {
            null
        }
    }

    private fun tryEmbedMethod(url: String, contentType: String): VideoInfo? {
        return try {
            val shortcode = extractShortcode(url) ?: return null
            val embedUrl = "https://www.instagram.com/p/$shortcode/embed/"

            val request = Request.Builder()
                .url(embedUrl)
                .header("User-Agent", userAgents[1])
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return null

            val html = response.body?.string() ?: return null

            val videoUrlPattern = Regex(""""video_url":"([^"]+)"""")
            val match = videoUrlPattern.find(html)
            if (match != null) {
                val videoUrl = match.groupValues[1]
                    .replace("\\u0026", "&")
                    .replace("\\/", "/")

                val thumbPattern = Regex(""""display_url":"([^"]+)"""")
                val thumbMatch = thumbPattern.find(html)
                val thumbnail = thumbMatch?.groupValues?.get(1)
                    ?.replace("\\u0026", "&")
                    ?.replace("\\/", "/") ?: ""

                return VideoInfo(
                    videoUrl = videoUrl,
                    thumbnailUrl = thumbnail,
                    platform = Platform.INSTAGRAM,
                    contentType = contentType
                )
            }
            null
        } catch (_: Exception) {
            null
        }
    }

    private fun tryHtmlScraping(url: String, contentType: String): VideoInfo? {
        return try {
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", userAgents[2])
                .header("Accept", "text/html,application/xhtml+xml")
                .header("Accept-Language", "en-US,en;q=0.9")
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return null

            val html = response.body?.string() ?: return null

            val ogVideoPattern = Regex("""<meta\s+property="og:video"\s+content="([^"]+)"""")
            val ogMatch = ogVideoPattern.find(html)
            if (ogMatch != null) {
                val videoUrl = ogMatch.groupValues[1].replace("&amp;", "&")

                val ogImagePattern = Regex("""<meta\s+property="og:image"\s+content="([^"]+)"""")
                val imgMatch = ogImagePattern.find(html)
                val thumbnail = imgMatch?.groupValues?.get(1)?.replace("&amp;", "&") ?: ""

                return VideoInfo(
                    videoUrl = videoUrl,
                    thumbnailUrl = thumbnail,
                    platform = Platform.INSTAGRAM,
                    contentType = contentType
                )
            }

            val jsonPattern = Regex(""""video_url"\s*:\s*"([^"]+)"""")
            val jsonMatch = jsonPattern.find(html)
            if (jsonMatch != null) {
                val videoUrl = jsonMatch.groupValues[1]
                    .replace("\\u0026", "&")
                    .replace("\\/", "/")

                return VideoInfo(
                    videoUrl = videoUrl,
                    platform = Platform.INSTAGRAM,
                    contentType = contentType
                )
            }

            null
        } catch (_: Exception) {
            null
        }
    }

    private fun extractShortcode(url: String): String? {
        val patterns = listOf(
            Regex("""/reel/([A-Za-z0-9_-]+)"""),
            Regex("""/reels/([A-Za-z0-9_-]+)"""),
            Regex("""/p/([A-Za-z0-9_-]+)"""),
            Regex("""/tv/([A-Za-z0-9_-]+)"""),
            Regex("""/stories/[^/]+/(\d+)""")
        )
        for (pattern in patterns) {
            val match = pattern.find(url)
            if (match != null) return match.groupValues[1]
        }
        return null
    }

    private fun shortcodeToMediaId(shortcode: String): String? {
        return try {
            val alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
            var mediaId = 0L
            for (char in shortcode) {
                val index = alphabet.indexOf(char)
                if (index < 0) return null
                mediaId = mediaId * 64 + index
            }
            mediaId.toString()
        } catch (_: Exception) {
            null
        }
    }

    private fun formatDuration(seconds: Double): String {
        if (seconds <= 0) return ""
        val mins = (seconds / 60).toInt()
        val secs = (seconds % 60).toInt()
        return if (mins > 0) "${mins}:${secs.toString().padStart(2, '0')}"
        else "0:${secs.toString().padStart(2, '0')}"
    }
}
