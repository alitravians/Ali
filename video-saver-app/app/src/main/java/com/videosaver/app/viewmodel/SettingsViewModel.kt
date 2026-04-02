package com.videosaver.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.videosaver.app.util.SettingsManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class SettingsUiState(
    val autoDetectClipboard: Boolean = true,
    val openAfterDownload: Boolean = false,
    val showNotifications: Boolean = true,
    val folderName: String = "Video Saver",
    val autoPaste: Boolean = true
)

class SettingsViewModel(application: Application) : AndroidViewModel(application) {

    private val settingsManager = SettingsManager(application)
    private val _uiState = MutableStateFlow(loadSettings())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    private fun loadSettings(): SettingsUiState {
        return SettingsUiState(
            autoDetectClipboard = settingsManager.autoDetectClipboard,
            openAfterDownload = settingsManager.openAfterDownload,
            showNotifications = settingsManager.showNotifications,
            folderName = settingsManager.folderName,
            autoPaste = settingsManager.autoPaste
        )
    }

    fun setAutoDetectClipboard(enabled: Boolean) {
        settingsManager.autoDetectClipboard = enabled
        _uiState.value = _uiState.value.copy(autoDetectClipboard = enabled)
    }

    fun setOpenAfterDownload(enabled: Boolean) {
        settingsManager.openAfterDownload = enabled
        _uiState.value = _uiState.value.copy(openAfterDownload = enabled)
    }

    fun setShowNotifications(enabled: Boolean) {
        settingsManager.showNotifications = enabled
        _uiState.value = _uiState.value.copy(showNotifications = enabled)
    }

    fun setFolderName(name: String) {
        settingsManager.folderName = name
        _uiState.value = _uiState.value.copy(folderName = name)
    }

    fun setAutoPaste(enabled: Boolean) {
        settingsManager.autoPaste = enabled
        _uiState.value = _uiState.value.copy(autoPaste = enabled)
    }
}
