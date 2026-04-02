package com.videosaver.app.service

import com.videosaver.app.data.model.ContentType
import com.videosaver.app.data.model.Platform

data class UrlValidationResult(
    val isValid: Boolean,
    val platform: String = "",
    val contentType: String = "",
    val errorMessage: String = ""
)

object UrlValidator {
    // Instagram patterns
    private val instagramReelPattern = Regex("""https?://(www\.)?instagram\.com/(reel|reels)/[A-Za-z0-9_-]+""")
    private val instagramStoryPattern = Regex("""https?://(www\.)?instagram\.com/stories/[^/]+/\d+""")
    private val instagramPostPattern = Regex("""https?://(www\.)?instagram\.com/p/[A-Za-z0-9_-]+""")
    private val instagramSharePattern = Regex("""https?://(www\.)?instagram\.com/share/(reel|p)/[A-Za-z0-9_-]+""")

    // TikTok patterns
    private val tiktokVideoPattern = Regex("""https?://(www\.|m\.)?tiktok\.com/@[^/]+/video/\d+""")
    private val tiktokShortPattern = Regex("""https?://(vm|vt)\.tiktok\.com/[A-Za-z0-9]+""")
    private val tiktokMobilePattern = Regex("""https?://(www\.)?tiktok\.com/t/[A-Za-z0-9]+""")
    private val tiktokGenericPattern = Regex("""https?://[a-z]+\.tiktok\.com/""")

    fun validate(url: String): UrlValidationResult {
        val trimmedUrl = url.trim()
        if (trimmedUrl.isBlank()) {
            return UrlValidationResult(false, errorMessage = "الرجاء إدخال رابط")
        }

        if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
            return UrlValidationResult(false, errorMessage = "الرابط غير صالح")
        }

        // Instagram Reel
        if (instagramReelPattern.containsMatchIn(trimmedUrl)) {
            return UrlValidationResult(true, Platform.INSTAGRAM, ContentType.REEL)
        }

        // Instagram Story
        if (instagramStoryPattern.containsMatchIn(trimmedUrl)) {
            return UrlValidationResult(true, Platform.INSTAGRAM, ContentType.STORY)
        }

        // Instagram Post
        if (instagramPostPattern.containsMatchIn(trimmedUrl)) {
            return UrlValidationResult(true, Platform.INSTAGRAM, ContentType.VIDEO)
        }

        // Instagram Share link
        if (instagramSharePattern.containsMatchIn(trimmedUrl)) {
            return UrlValidationResult(true, Platform.INSTAGRAM, ContentType.REEL)
        }

        // General Instagram URL (fallback)
        if (trimmedUrl.contains("instagram.com/")) {
            return UrlValidationResult(true, Platform.INSTAGRAM, ContentType.VIDEO)
        }

        // TikTok Video
        if (tiktokVideoPattern.containsMatchIn(trimmedUrl)) {
            return UrlValidationResult(true, Platform.TIKTOK, ContentType.VIDEO)
        }

        // TikTok Short URL
        if (tiktokShortPattern.containsMatchIn(trimmedUrl)) {
            return UrlValidationResult(true, Platform.TIKTOK, ContentType.VIDEO)
        }

        // TikTok Mobile URL
        if (tiktokMobilePattern.containsMatchIn(trimmedUrl)) {
            return UrlValidationResult(true, Platform.TIKTOK, ContentType.VIDEO)
        }

        // General TikTok URL (fallback)
        if (tiktokGenericPattern.containsMatchIn(trimmedUrl) || trimmedUrl.contains("tiktok.com")) {
            return UrlValidationResult(true, Platform.TIKTOK, ContentType.VIDEO)
        }

        return UrlValidationResult(false, errorMessage = "الرابط غير مدعوم. يرجى استخدام رابط من Instagram أو TikTok")
    }
}
