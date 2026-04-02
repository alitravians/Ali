package com.videosaver.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.videosaver.app.data.db.AppDatabase
import com.videosaver.app.data.model.DownloadItem
import com.videosaver.app.data.repository.DownloadRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class HistoryViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: DownloadRepository

    val downloads: StateFlow<List<DownloadItem>>

    init {
        val db = AppDatabase.getDatabase(application)
        repository = DownloadRepository(db.downloadDao())
        downloads = repository.allDownloads.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )
    }

    fun deleteItem(item: DownloadItem) {
        viewModelScope.launch {
            repository.delete(item)
        }
    }

    fun clearHistory() {
        viewModelScope.launch {
            repository.deleteAll()
        }
    }
}
