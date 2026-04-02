package com.videosaver.app.viewmodel

import android.app.Application
import android.content.Intent
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.videosaver.app.data.db.AppDatabase
import com.videosaver.app.data.model.DownloadItem
import com.videosaver.app.data.model.DownloadStatus
import com.videosaver.app.data.model.VideoInfo
import com.videosaver.app.data.repository.DownloadRepository
import com.videosaver.app.service.UrlValidator
import com.videosaver.app.service.VideoDownloadService
import com.videosaver.app.service.VideoExtractorFactory
import com.videosaver.app.util.FileManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MainUiState(
    val url: String = "",
    val isLoading: Boolean = false,
    val statusMessage: String = "",
    val statusType: StatusType = StatusType.IDLE,
    val progress: Int = 0,
    val videoInfo: VideoInfo? = null,
    val currentDownload: DownloadItem? = null,
    val showClipboardSuggestion: Boolean = false,
    val clipboardUrl: String = "",
    val showDuplicateDialog: Boolean = false,
    val duplicateUrl: String = "",
    val lastDownloadedFilePath: String = ""
)

enum class StatusType {
    IDLE, LOADING, SUCCESS, ERROR
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: DownloadRepository
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        val db = AppDatabase.getDatabase(application)
        repository = DownloadRepository(db.downloadDao())
    }

    fun updateUrl(url: String) {
        _uiState.value = _uiState.value.copy(url = url)
    }

    fun showClipboardSuggestion(url: String) {
        _uiState.value = _uiState.value.copy(
            showClipboardSuggestion = true,
            clipboardUrl = url
        )
    }

    fun dismissClipboardSuggestion() {
        _uiState.value = _uiState.value.copy(showClipboardSuggestion = false)
    }

    fun acceptClipboardSuggestion() {
        _uiState.value = _uiState.value.copy(
            url = _uiState.value.clipboardUrl,
            showClipboardSuggestion = false
        )
    }

    fun dismissDuplicateDialog() {
        _uiState.value = _uiState.value.copy(showDuplicateDialog = false)
    }

    fun startDownload(forceRedownload: Boolean = false) {
        val url = _uiState.value.url.trim()

        // Validate URL
        val validation = UrlValidator.validate(url)
        if (!validation.isValid) {
            _uiState.value = _uiState.value.copy(
                statusMessage = validation.errorMessage,
                statusType = StatusType.ERROR,
                isLoading = false
            )
            return
        }

        viewModelScope.launch {
            try {
                // Check for duplicates
                if (!forceRedownload) {
                    val existing = repository.getByUrl(url)
                    if (existing != null && existing.status == DownloadStatus.COMPLETED) {
                        _uiState.value = _uiState.value.copy(
                            showDuplicateDialog = true,
                            duplicateUrl = url
                        )
                        return@launch
                    }
                }

                _uiState.value = _uiState.value.copy(
                    isLoading = true,
                    statusMessage = "جاري التحقق من الرابط...",
                    statusType = StatusType.LOADING,
                    progress = 0,
                    videoInfo = null
                )

                // Extract video info
                _uiState.value = _uiState.value.copy(
                    statusMessage = "جاري استخراج معلومات الفيديو...",
                    progress = 10
                )

                val extractor = try {
                    VideoExtractorFactory.getExtractor(validation.platform)
                } catch (e: Exception) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        statusMessage = "منصة غير مدعومة",
                        statusType = StatusType.ERROR,
                        progress = 0
                    )
                    return@launch
                }

                val result = try {
                    extractor.extract(url)
                } catch (e: Exception) {
                    Result.failure<VideoInfo>(Exception("فشل استخراج الفيديو: ${e.message}"))
                }

                if (result.isFailure) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        statusMessage = result.exceptionOrNull()?.message ?: "فشل استخراج الفيديو",
                        statusType = StatusType.ERROR,
                        progress = 0
                    )
                    return@launch
                }

                val videoInfo = result.getOrNull()
                if (videoInfo == null) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        statusMessage = "فشل استخراج معلومات الفيديو",
                        statusType = StatusType.ERROR,
                        progress = 0
                    )
                    return@launch
                }

                if (videoInfo.videoUrl.isEmpty()) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        statusMessage = "تعذر الحصول على رابط التحميل",
                        statusType = StatusType.ERROR,
                        progress = 0
                    )
                    return@launch
                }

                _uiState.value = _uiState.value.copy(
                    videoInfo = videoInfo,
                    statusMessage = "جاري التحميل...",
                    progress = 20
                )

                // Create download record
                val fileName = FileManager.generateFileName(validation.platform)
                val downloadItem = DownloadItem(
                    url = url,
                    platform = validation.platform,
                    contentType = validation.contentType,
                    fileName = fileName,
                    thumbnailUrl = videoInfo.thumbnailUrl,
                    duration = videoInfo.duration,
                    status = DownloadStatus.DOWNLOADING,
                    progress = 20
                )
                val downloadId = repository.insert(downloadItem)

                _uiState.value = _uiState.value.copy(
                    currentDownload = downloadItem.copy(id = downloadId)
                )

                // Start download service
                try {
                    val intent = Intent(getApplication(), VideoDownloadService::class.java).apply {
                        putExtra(VideoDownloadService.EXTRA_DOWNLOAD_ID, downloadId)
                        putExtra(VideoDownloadService.EXTRA_VIDEO_URL, videoInfo.videoUrl)
                        putExtra(VideoDownloadService.EXTRA_FILE_NAME, fileName)
                        putExtra(VideoDownloadService.EXTRA_PLATFORM, validation.platform)
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        getApplication<Application>().startForegroundService(intent)
                    } else {
                        getApplication<Application>().startService(intent)
                    }

                    // Monitor download progress
                    monitorDownload(downloadId)
                } catch (e: Exception) {
                    repository.updateError(downloadId, "فشل بدء التحميل: ${e.message}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        statusMessage = "فشل بدء التحميل: ${e.message}",
                        statusType = StatusType.ERROR,
                        progress = 0
                    )
                }

            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    statusMessage = "خطأ غير متوقع: ${e.message}",
                    statusType = StatusType.ERROR,
                    progress = 0
                )
            }
        }
    }

    private fun monitorDownload(downloadId: Long) {
        viewModelScope.launch {
            try {
                var completed = false
                var attempts = 0
                val maxAttempts = 600 // 5 minutes max
                while (!completed && attempts < maxAttempts) {
                    kotlinx.coroutines.delay(500)
                    attempts++
                    val item = repository.getById(downloadId)
                    if (item != null) {
                        _uiState.value = _uiState.value.copy(
                            currentDownload = item,
                            progress = item.progress
                        )

                        when (item.status) {
                            DownloadStatus.COMPLETED -> {
                                _uiState.value = _uiState.value.copy(
                                    isLoading = false,
                                    statusMessage = "تم التحميل بنجاح",
                                    statusType = StatusType.SUCCESS,
                                    progress = 100,
                                    lastDownloadedFilePath = item.filePath
                                )
                                completed = true
                            }
                            DownloadStatus.FAILED -> {
                                _uiState.value = _uiState.value.copy(
                                    isLoading = false,
                                    statusMessage = item.errorMessage.ifEmpty { "فشل التحميل" },
                                    statusType = StatusType.ERROR,
                                    progress = 0
                                )
                                completed = true
                            }
                            else -> {
                                _uiState.value = _uiState.value.copy(
                                    statusMessage = FileManager.getStatusDisplayName(item.status),
                                    statusType = StatusType.LOADING
                                )
                            }
                        }
                    }
                }
                if (!completed) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        statusMessage = "انتهت مهلة التحميل",
                        statusType = StatusType.ERROR,
                        progress = 0
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    statusMessage = "خطأ في متابعة التحميل: ${e.message}",
                    statusType = StatusType.ERROR,
                    progress = 0
                )
            }
        }
    }

    fun retryDownload() {
        startDownload(forceRedownload = true)
    }

    fun clearState() {
        _uiState.value = MainUiState()
    }
}
