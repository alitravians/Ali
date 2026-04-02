package com.videosaver.app.data.repository

import com.videosaver.app.data.db.DownloadDao
import com.videosaver.app.data.model.DownloadItem
import com.videosaver.app.data.model.DownloadStatus
import kotlinx.coroutines.flow.Flow

class DownloadRepository(private val dao: DownloadDao) {

    val allDownloads: Flow<List<DownloadItem>> = dao.getAllDownloads()

    suspend fun insert(item: DownloadItem): Long = dao.insert(item)

    suspend fun update(item: DownloadItem) = dao.update(item)

    suspend fun delete(item: DownloadItem) = dao.delete(item)

    suspend fun deleteAll() = dao.deleteAll()

    suspend fun getByUrl(url: String): DownloadItem? = dao.getDownloadByUrl(url)

    suspend fun getById(id: Long): DownloadItem? = dao.getDownloadById(id)

    suspend fun updateStatus(id: Long, status: String, progress: Int) =
        dao.updateStatus(id, status, progress)

    suspend fun updateError(id: Long, error: String) =
        dao.updateError(id, DownloadStatus.FAILED, error)

    suspend fun updateCompleted(id: Long, path: String) =
        dao.updateCompleted(id, path, DownloadStatus.COMPLETED)
}
