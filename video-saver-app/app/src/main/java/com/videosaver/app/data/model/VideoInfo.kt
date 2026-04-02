package com.videosaver.app.data.model

data class VideoInfo(
    val videoUrl: String,
    val thumbnailUrl: String = "",
    val title: String = "",
    val duration: String = "",
    val platform: String = Platform.UNKNOWN,
    val contentType: String = ContentType.UNKNOWN,
    val quality: String = "HD"
)
