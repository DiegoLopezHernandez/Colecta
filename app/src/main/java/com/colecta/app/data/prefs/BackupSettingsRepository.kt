package com.colecta.app.data.prefs

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.backupStore by preferencesDataStore("colecta_backup")

/**
 * Configuración de backup automático persistida en DataStore.
 *
 * - `folderUri`: URI persistente concedida por el usuario vía OpenDocumentTree.
 *   Sirve para que el Worker escriba en segundo plano sin volver a pedir permiso.
 * - `frequencyDays`: cada cuántos días lanzar el worker. 0 = desactivado.
 */
@Singleton
class BackupSettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    data class Config(val folderUri: String?, val frequencyDays: Int) {
        val enabled get() = folderUri != null && frequencyDays > 0
    }

    private val folderKey = stringPreferencesKey("folder_uri")
    private val freqKey = intPreferencesKey("frequency_days")

    val config: Flow<Config> = context.backupStore.data.map { p ->
        Config(folderUri = p[folderKey], frequencyDays = p[freqKey] ?: 0)
    }

    suspend fun setFolder(uri: String?) {
        context.backupStore.edit { p ->
            if (uri == null) p.remove(folderKey) else p[folderKey] = uri
        }
    }

    suspend fun setFrequency(days: Int) {
        context.backupStore.edit { p -> p[freqKey] = days.coerceAtLeast(0) }
    }
}
