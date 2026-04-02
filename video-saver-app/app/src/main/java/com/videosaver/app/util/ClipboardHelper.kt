package com.videosaver.app.util

import android.content.ClipboardManager
import android.content.Context

object ClipboardHelper {
    fun getClipboardText(context: Context): String? {
        return try {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip
            if (clip != null && clip.itemCount > 0) {
                val text = clip.getItemAt(0).text?.toString()
                return text
            }
            null
        } catch (_: Exception) {
            null
        }
    }

    fun extractUrl(text: String?): String? {
        if (text.isNullOrBlank()) return null
        val urlPattern = Regex("https?://[^\\s]+")
        val match = urlPattern.find(text)
        return match?.value?.trim()
    }

    fun hasUrl(context: Context): Boolean {
        val text = getClipboardText(context) ?: return false
        val url = extractUrl(text) ?: return false

        val patterns = listOf(
            Regex("instagram\\.com", RegexOption.IGNORE_CASE),
            Regex("tiktok\\.com", RegexOption.IGNORE_CASE),
            Regex("vm\\.tiktok\\.com", RegexOption.IGNORE_CASE),
            Regex("vt\\.tiktok\\.com", RegexOption.IGNORE_CASE)
        )

        return patterns.any { it.containsMatchIn(url) }
    }

    fun getVideoUrl(context: Context): String? {
        val text = getClipboardText(context) ?: return null
        val url = extractUrl(text) ?: return null
        if (url.contains("instagram.com") || url.contains("tiktok.com")) {
            return url
        }
        return null
    }
}
