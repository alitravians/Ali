package com.videosaver.app.util

import android.content.Context
import android.content.SharedPreferences

class SettingsManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("video_saver_settings", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_AUTO_DETECT_CLIPBOARD = "auto_detect_clipboard"
        private const val KEY_OPEN_AFTER_DOWNLOAD = "open_after_download"
        private const val KEY_SHOW_NOTIFICATIONS = "show_notifications"
        private const val KEY_FOLDER_NAME = "folder_name"
        private const val KEY_AUTO_PASTE = "auto_paste"
    }

    var autoDetectClipboard: Boolean
        get() = prefs.getBoolean(KEY_AUTO_DETECT_CLIPBOARD, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_DETECT_CLIPBOARD, value).apply()

    var openAfterDownload: Boolean
        get() = prefs.getBoolean(KEY_OPEN_AFTER_DOWNLOAD, false)
        set(value) = prefs.edit().putBoolean(KEY_OPEN_AFTER_DOWNLOAD, value).apply()

    var showNotifications: Boolean
        get() = prefs.getBoolean(KEY_SHOW_NOTIFICATIONS, true)
        set(value) = prefs.edit().putBoolean(KEY_SHOW_NOTIFICATIONS, value).apply()

    var folderName: String
        get() = prefs.getString(KEY_FOLDER_NAME, "Video Saver") ?: "Video Saver"
        set(value) = prefs.edit().putString(KEY_FOLDER_NAME, value).apply()

    var autoPaste: Boolean
        get() = prefs.getBoolean(KEY_AUTO_PASTE, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_PASTE, value).apply()
}
