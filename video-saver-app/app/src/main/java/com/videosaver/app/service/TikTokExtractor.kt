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
import java.util.concurrent.TimeUnit

class TikTokExtractor : VideoExtractor {
    override val platform = Platform.TIKTOK

    private val client = OkHttpClient.Builder()
        .followRedirects(true)
        .followSslRedirects(true)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val mobileUserAgent =
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"

    private val desktopUserAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    // Cobalt v7 instances (no auth required, use /api/json endpoint)
    private val cobaltInstances = listOf(
        "https://downloadapi.stuff.solutions/api/json"
    )

    override suspend fun extract(url: String): Result<VideoInfo> = withContext(Dispatchers.IO) {
        try {
            // Clean URL first
            val cleanedUrl = cleanTikTokUrl(url)

            // Step 1: Try cobalt API + verify stream URL actually works
            var videoInfo = tryCobaltApiWithVerification(cleanedUrl)

            // Step 2: If cobalt failed, try tikwm.com API (reliable, returns working CDN URLs)
            if (videoInfo == null) {
                videoInfo = tryTikWmApi(cleanedUrl)
            }

            // Step 3: If tikwm failed, try scraping fallbacks
            if (videoInfo == null) {
                val resolvedUrl = resolveShortUrl(cleanedUrl)
                videoInfo = tryOEmbedMethod(resolvedUrl)
                    ?: tryHtmlScraping(resolvedUrl)
                    ?: tryApiMethod(resolvedUrl)
            }

            if (videoInfo != null) {
                Result.success(videoInfo)
            } else {
                Result.failure(Exception("تعذر استخراج الفيديو من TikTok. تأكد أن الرابط صحيح."))
            }
        } catch (e: Exception) {
            Result.failure(Exception("خطأ في الاتصال: ${e.message}"))
        }
    }

    /**
     * Try cobalt API and verify the returned stream URL actually works.
     * Cobalt sometimes returns 200 with a stream URL, but the stream proxy fails with 500.
     */
    private fun tryCobaltApiWithVerification(url: String): VideoInfo? {
        for (instance in cobaltInstances) {
            try {
                val jsonBody = JSONObject().apply {
                    put("url", url)
                    put("videoQuality", "720")
                    put("tiktokFullAudio", true)
                    put("isNoTTWatermark", true)
                }

                val requestBody = jsonBody.toString()
                    .toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url(instance)
                    .post(requestBody)
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "VideoSaver/1.0")
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
                            // For stream URLs, verify with a small GET request
                            // (HEAD doesn't work on cobalt streams)
                            if (status == "stream" && !verifyStreamUrl(videoUrl)) {
                                continue // Stream proxy broken, skip
                            }
                            return VideoInfo(
                                videoUrl = videoUrl,
                                thumbnailUrl = "",
                                platform = Platform.TIKTOK,
                                contentType = ContentType.VIDEO
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
                                            platform = Platform.TIKTOK,
                                            contentType = ContentType.VIDEO
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
                                    platform = Platform.TIKTOK,
                                    contentType = ContentType.VIDEO
                                )
                            }
                        }
                    }
                }
            } catch (_: Exception) {
                continue
            }
        }
        return null
    }

    /**
     * Verify a cobalt stream URL works by doing a small GET request.
     * Returns true if the stream is working, false if it returns 500.
     */
    private fun verifyStreamUrl(url: String): Boolean {
        return try {
            val verifyClient = OkHttpClient.Builder()
                .followRedirects(true)
                .followSslRedirects(true)
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build()

            val request = Request.Builder()
                .url(url)
                .header("User-Agent", mobileUserAgent)
                .header("Range", "bytes=0-1023")
                .build()

            val response = verifyClient.newCall(request).execute()
            val code = response.code
            response.close()
            code in 200..299 || code == 206
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Try tikwm.com API - reliable free TikTok video extraction.
     * Returns direct TikTok CDN URLs that work for downloading.
     */
    private fun tryTikWmApi(url: String): VideoInfo? {
        return try {
            val requestBody = "url=$url&hd=1"
                .toRequestBody("application/x-www-form-urlencoded".toMediaType())

            val request = Request.Builder()
                .url("https://www.tikwm.com/api/")
                .post(requestBody)
                .header("User-Agent", mobileUserAgent)
                .header("Accept", "application/json")
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return null

            val body = response.body?.string() ?: return null
            val json = JSONObject(body)

            if (json.optInt("code", -1) != 0) return null

            val data = json.optJSONObject("data") ?: return null

            // Prefer HD, then no-watermark play, then watermark play
            val videoUrl = data.optString("hdplay", "").ifEmpty {
                data.optString("play", "").ifEmpty {
                    data.optString("wmplay", "")
                }
            }

            if (videoUrl.isEmpty()) return null

            val thumbnailUrl = data.optString("cover", "")
            val duration = data.optInt("duration", 0)
            val title = data.optString("title", "")

            VideoInfo(
                videoUrl = videoUrl,
                thumbnailUrl = thumbnailUrl,
                title = title,
                platform = Platform.TIKTOK,
                contentType = ContentType.VIDEO,
                duration = if (duration > 0) formatDuration(duration) else ""
            )
        } catch (_: Exception) {
            null
        }
    }

    private fun cleanTikTokUrl(url: String): String {
        var cleaned = url.trim()
        // Remove tracking parameters
        try {
            val uri = java.net.URI(cleaned)
            val path = uri.path.trimEnd('/')
            val host = uri.host ?: return cleaned
            cleaned = "https://$host$path"
        } catch (_: Exception) {
            val queryIndex = cleaned.indexOf('?')
            if (queryIndex > 0) {
                cleaned = cleaned.substring(0, queryIndex)
            }
        }
        return cleaned
    }

    private fun resolveShortUrl(url: String): String {
        if (!url.contains("vm.tiktok.com") && !url.contains("vt.tiktok.com") && !url.contains("/t/")) {
            return url
        }

        return try {
            val noRedirectClient = OkHttpClient.Builder()
                .followRedirects(false)
                .followSslRedirects(false)
                .connectTimeout(15, TimeUnit.SECONDS)
                .build()

            val request = Request.Builder()
                .url(url)
                .header("User-Agent", mobileUserAgent)
                .build()

            val response = noRedirectClient.newCall(request).execute()
            response.header("Location") ?: url
        } catch (_: Exception) {
            url
        }
    }

    private fun tryOEmbedMethod(url: String): VideoInfo? {
        return try {
            val oembedUrl = "https://www.tiktok.com/oembed?url=$url"
            val request = Request.Builder()
                .url(oembedUrl)
                .header("User-Agent", desktopUserAgent)
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return null

            val body = response.body?.string() ?: return null
            val json = JSONObject(body)

            val title = json.optString("title", "")
            val thumbnailUrl = json.optString("thumbnail_url", "")

            val videoInfo = tryHtmlScraping(url)
            videoInfo?.copy(
                thumbnailUrl = thumbnailUrl.ifEmpty { videoInfo.thumbnailUrl },
                title = title.ifEmpty { videoInfo.title }
            )
        } catch (_: Exception) {
            null
        }
    }

    private fun tryHtmlScraping(url: String): VideoInfo? {
        return try {
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", desktopUserAgent)
                .header("Accept", "text/html,application/xhtml+xml")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Accept-Encoding", "identity")
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return null

            val html = response.body?.string() ?: return null

            var videoUrl: String? = null
            var thumbnailUrl = ""
            var duration = ""

            val sigiPattern = Regex("""<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>""", RegexOption.DOT_MATCHES_ALL)
            val sigiMatch = sigiPattern.find(html)
            if (sigiMatch != null) {
                try {
                    val jsonStr = sigiMatch.groupValues[1]
                    val json = JSONObject(jsonStr)
                    val defaultScope = json.optJSONObject("__DEFAULT_SCOPE__")
                    val videoDetail = defaultScope?.optJSONObject("webapp.video-detail")
                    val itemInfo = videoDetail?.optJSONObject("itemInfo")
                    val itemStruct = itemInfo?.optJSONObject("itemStruct")
                    val video = itemStruct?.optJSONObject("video")

                    if (video != null) {
                        videoUrl = video.optString("downloadAddr", "").ifEmpty {
                            video.optString("playAddr", "")
                        }
                        thumbnailUrl = video.optString("cover", "")
                        val dur = video.optInt("duration", 0)
                        if (dur > 0) duration = formatDuration(dur)
                    }
                } catch (_: Exception) {
                    // Continue
                }
            }

            if (videoUrl.isNullOrEmpty()) {
                val sigiState = Regex("""<script\s+id="SIGI_STATE"[^>]*>(.*?)</script>""", RegexOption.DOT_MATCHES_ALL)
                val stateMatch = sigiState.find(html)
                if (stateMatch != null) {
                    try {
                        val json = JSONObject(stateMatch.groupValues[1])
                        val itemModule = json.optJSONObject("ItemModule")
                        if (itemModule != null) {
                            val keys = itemModule.keys()
                            if (keys.hasNext()) {
                                val firstItem = itemModule.getJSONObject(keys.next())
                                val video = firstItem.optJSONObject("video")
                                if (video != null) {
                                    videoUrl = video.optString("downloadAddr", "").ifEmpty {
                                        video.optString("playAddr", "")
                                    }
                                    thumbnailUrl = video.optString("cover", "")
                                }
                            }
                        }
                    } catch (_: Exception) {
                        // Continue
                    }
                }
            }

            if (videoUrl.isNullOrEmpty()) {
                val downloadPattern = Regex(""""downloadAddr"\s*:\s*"([^"]+)"""")
                val downloadMatch = downloadPattern.find(html)
                if (downloadMatch != null) {
                    videoUrl = downloadMatch.groupValues[1]
                        .replace("\\u0026", "&")
                        .replace("\\u002F", "/")
                        .replace("\\/", "/")
                }
            }

            if (videoUrl.isNullOrEmpty()) {
                val playPattern = Regex(""""playAddr"\s*:\s*"([^"]+)"""")
                val playMatch = playPattern.find(html)
                if (playMatch != null) {
                    videoUrl = playMatch.groupValues[1]
                        .replace("\\u0026", "&")
                        .replace("\\u002F", "/")
                        .replace("\\/", "/")
                }
            }

            if (videoUrl.isNullOrEmpty()) {
                val ogPattern = Regex("""<meta\s+property="og:video(?::url)?"\s+content="([^"]+)"""")
                val ogMatch = ogPattern.find(html)
                if (ogMatch != null) {
                    videoUrl = ogMatch.groupValues[1].replace("&amp;", "&")
                }
            }

            if (thumbnailUrl.isEmpty()) {
                val ogImgPattern = Regex("""<meta\s+property="og:image"\s+content="([^"]+)"""")
                val imgMatch = ogImgPattern.find(html)
                if (imgMatch != null) {
                    thumbnailUrl = imgMatch.groupValues[1].replace("&amp;", "&")
                }
            }

            if (!videoUrl.isNullOrEmpty()) {
                VideoInfo(
                    videoUrl = videoUrl,
                    thumbnailUrl = thumbnailUrl,
                    platform = Platform.TIKTOK,
                    contentType = ContentType.VIDEO,
                    duration = duration
                )
            } else null
        } catch (_: Exception) {
            null
        }
    }

    private fun tryApiMethod(url: String): VideoInfo? {
        return try {
            val videoId = extractVideoId(url) ?: return null
            val apiUrl = "https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id=$videoId"

            val request = Request.Builder()
                .url(apiUrl)
                .header("User-Agent", mobileUserAgent)
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return null

            val body = response.body?.string() ?: return null
            val json = JSONObject(body)
            val awemeList = json.optJSONArray("aweme_list") ?: return null

            if (awemeList.length() == 0) return null

            val aweme = awemeList.getJSONObject(0)
            val video = aweme.optJSONObject("video") ?: return null

            val playAddr = video.optJSONObject("play_addr")
            val videoUrl = playAddr?.optJSONArray("url_list")?.optString(0) ?: return null

            val cover = video.optJSONObject("cover")
            val thumbnailUrl = cover?.optJSONArray("url_list")?.optString(0) ?: ""

            val dur = video.optInt("duration", 0)

            VideoInfo(
                videoUrl = videoUrl,
                thumbnailUrl = thumbnailUrl,
                platform = Platform.TIKTOK,
                contentType = ContentType.VIDEO,
                duration = if (dur > 0) formatDuration(dur / 1000) else ""
            )
        } catch (_: Exception) {
            null
        }
    }

    private fun extractVideoId(url: String): String? {
        val pattern = Regex("""/video/(\d+)""")
        val match = pattern.find(url)
        return match?.groupValues?.get(1)
    }

    private fun formatDuration(seconds: Int): String {
        if (seconds <= 0) return ""
        val mins = seconds / 60
        val secs = seconds % 60
        return if (mins > 0) "${mins}:${secs.toString().padStart(2, '0')}"
        else "0:${secs.toString().padStart(2, '0')}"
    }
}
