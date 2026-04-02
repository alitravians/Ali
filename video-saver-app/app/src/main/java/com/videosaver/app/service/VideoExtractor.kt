package com.videosaver.app.service

import com.videosaver.app.data.model.Platform
import com.videosaver.app.data.model.VideoInfo

interface VideoExtractor {
    val platform: String
    suspend fun extract(url: String): Result<VideoInfo>
}

object VideoExtractorFactory {
    fun getExtractor(platform: String): VideoExtractor {
        return when (platform) {
            Platform.INSTAGRAM -> InstagramExtractor()
            Platform.TIKTOK -> TikTokExtractor()
            else -> throw IllegalArgumentException("منصة غير مدعومة: $platform")
        }
    }
}
