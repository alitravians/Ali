package com.videosaver.app.util

import com.videosaver.app.data.model.Platform
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object FileManager {

    fun generateFileName(platform: String, extension: String = "mp4"): String {
        val dateFormat = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US)
        val timestamp = dateFormat.format(Date())
        val random = (100..999).random()
        return "${platform}_${timestamp}_${random}.$extension"
    }

    fun getPlatformDisplayName(platform: String): String {
        return when (platform) {
            Platform.INSTAGRAM -> "انستقرام"
            Platform.TIKTOK -> "تيك توك"
            else -> "غير معروف"
        }
    }

    fun getContentTypeDisplayName(contentType: String): String {
        return when (contentType) {
            "Reel" -> "ريلز"
            "Story" -> "ستوري"
            "Video" -> "فيديو"
            else -> "فيديو"
        }
    }

    fun getStatusDisplayName(status: String): String {
        return when (status) {
            "pending" -> "في الانتظار"
            "validating" -> "جاري التحقق من الرابط..."
            "extracting" -> "جاري استخراج الفيديو..."
            "downloading" -> "جاري التحميل..."
            "saving" -> "جاري الحفظ..."
            "completed" -> "تم التحميل بنجاح ✓"
            "failed" -> "فشل التحميل"
            else -> status
        }
    }
}
