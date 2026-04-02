package com.videosaver.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "downloads")
data class DownloadItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val url: String,
    val platform: String,
    val contentType: String,
    val fileName: String,
    val filePath: String = "",
    val thumbnailUrl: String = "",
    val duration: String = "",
    val status: String = DownloadStatus.PENDING,
    val progress: Int = 0,
    val fileSize: Long = 0,
    val downloadedAt: Long = System.currentTimeMillis(),
    val errorMessage: String = ""
)

object DownloadStatus {
    const val PENDING = "pending"
    const val VALIDATING = "validating"
    const val EXTRACTING = "extracting"
    const val DOWNLOADING = "downloading"
    const val SAVING = "saving"
    const val COMPLETED = "completed"
    const val FAILED = "failed"
}

object Platform {
    const val INSTAGRAM = "Instagram"
    const val TIKTOK = "TikTok"
    const val UNKNOWN = "Unknown"
}

object ContentType {
    const val REEL = "Reel"
    const val STORY = "Story"
    const val VIDEO = "Video"
    const val UNKNOWN = "Unknown"
}
