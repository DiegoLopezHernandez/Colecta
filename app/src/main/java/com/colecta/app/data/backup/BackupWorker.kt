package com.colecta.app.data.backup

import android.content.Context
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.colecta.app.data.prefs.BackupSettingsRepository
import com.colecta.app.data.repo.BackupRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first

/**
 * Worker que se ejecuta periódicamente para volcar la colección al directorio
 * elegido por el usuario. Si no hay carpeta configurada, sale sin hacer nada.
 * Mantiene los últimos 7 backups (rotación simple por nombre).
 */
@HiltWorker
class BackupWorker @AssistedInject constructor(
    @Assisted private val ctx: Context,
    @Assisted params: WorkerParameters,
    private val backup: BackupRepository,
    private val prefs: BackupSettingsRepository,
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result {
        val cfg = prefs.config.first()
        val folder = cfg.folderUri?.let { runCatching { Uri.parse(it) }.getOrNull() } ?: return Result.success()
        val tree = DocumentFile.fromTreeUri(ctx, folder) ?: return Result.success()
        return runCatching {
            val timestamp = java.time.LocalDateTime.now().toString().replace(":", "-").take(19)
            val name = "colecta-$timestamp.json"
            val file = tree.createFile("application/json", name) ?: error("No se pudo crear el archivo")
            val res = backup.exportTo(file.uri)
            res.getOrThrow()
            rotateOld(tree, keep = 7)
            Result.success()
        }.getOrElse { Result.retry() }
    }

    /** Borra backups antiguos, conservando los `keep` más recientes (por nombre alfabético). */
    private fun rotateOld(tree: DocumentFile, keep: Int) {
        val files = tree.listFiles()
            .filter { it.name?.startsWith("colecta-") == true && it.name?.endsWith(".json") == true }
            .sortedByDescending { it.name }
        if (files.size > keep) {
            files.drop(keep).forEach { runCatching { it.delete() } }
        }
    }
}
