package com.videosaver.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class VideoSaverApp : Application() {

    companion object {
        const val CHANNEL_ID = "video_download_channel"
        const val FOLDER_NAME = "Video Saver"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "تحميل الفيديو",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "إشعارات تحميل مقاطع الفيديو"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
