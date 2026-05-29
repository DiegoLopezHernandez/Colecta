package com.colecta.app.data.repo

import android.content.Context
import android.net.Uri
import com.colecta.app.data.db.CoinDao
import com.colecta.app.data.db.CoinEntity
import com.colecta.app.data.db.ObjectDao
import com.colecta.app.data.db.ObjectEntity
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.BufferedReader
import java.io.InputStreamReader
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Export / import de la colección a JSON. Usa Storage Access Framework: el
 * llamante provee la `Uri` (de un `CreateDocument` o `OpenDocument`) y aquí
 * leemos/escribimos vía `ContentResolver`.
 *
 * Formato del backup (versionado):
 * ```
 * { "app": "colecta", "version": 1, "exportedAt": "ISO", "coins": [...], "objects": [...] }
 * ```
 *
 * Importar es destructivo: vacía las tablas antes de insertar. Si quieres mantener
 * lo existente, exporta primero el actual y haz un merge externo.
 */
@Singleton
class BackupRepository @Inject constructor(
    private val coinDao: CoinDao,
    private val objectDao: ObjectDao,
    private val moshi: Moshi,
    @ApplicationContext private val context: Context,
) {
    private val adapter = moshi.adapter(BackupFile::class.java).indent("  ")

    suspend fun exportTo(uri: Uri): Result<Int> = withContext(Dispatchers.IO) {
        runCatching {
            val coins = coinDao.allOnce()
            val objects = objectDao.allOnce()
            val payload = BackupFile(
                app = APP_TAG,
                version = VERSION,
                exportedAt = com.colecta.app.util.nowIso(),
                coins = coins,
                objects = objects,
            )
            val json = adapter.toJson(payload)
            context.contentResolver.openOutputStream(uri, "w")?.use { os ->
                os.write(json.toByteArray(Charsets.UTF_8))
            } ?: error("No se pudo abrir el destino para escribir.")
            coins.size + objects.size
        }
    }

    suspend fun importFrom(uri: Uri): Result<Pair<Int, Int>> = withContext(Dispatchers.IO) {
        runCatching {
            val text = context.contentResolver.openInputStream(uri)?.use { input ->
                BufferedReader(InputStreamReader(input, Charsets.UTF_8)).readText()
            } ?: error("No se pudo abrir el archivo para leer.")
            val parsed = adapter.fromJson(text) ?: error("Archivo JSON inválido.")
            if (parsed.app != APP_TAG) error("Este archivo no es un backup de Colecta.")
            coinDao.deleteAll()
            objectDao.deleteAll()
            parsed.coins.forEach { coinDao.upsert(it) }
            parsed.objects.forEach { objectDao.upsert(it) }
            parsed.coins.size to parsed.objects.size
        }
    }

    companion object {
        const val APP_TAG = "colecta"
        const val VERSION = 1
    }
}

@JsonClass(generateAdapter = true)
data class BackupFile(
    val app: String,
    val version: Int,
    val exportedAt: String,
    val coins: List<CoinEntity>,
    val objects: List<ObjectEntity>,
)
