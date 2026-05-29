package com.colecta.app.data.prefs

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore("colecta_settings")

/**
 * Almacén de preferencias persistentes: API keys de Numista y eBay.
 * Más adelante puede crecer (preferencias de filtros, etc.) sin tocar la BD.
 */
@Singleton
class SettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val numistaKey = stringPreferencesKey("numista_api_key")
    private val ebayKey = stringPreferencesKey("ebay_app_id")

    data class Keys(val numistaApiKey: String, val ebayAppId: String) {
        val hasNumista get() = numistaApiKey.isNotBlank()
        val hasEbay get() = ebayAppId.isNotBlank()
    }

    val keys: Flow<Keys> = context.dataStore.data.map { p ->
        Keys(
            numistaApiKey = p[numistaKey].orEmpty(),
            ebayAppId = p[ebayKey].orEmpty(),
        )
    }

    suspend fun setNumistaApiKey(value: String) {
        context.dataStore.edit { it[numistaKey] = value.trim() }
    }

    suspend fun setEbayAppId(value: String) {
        context.dataStore.edit { it[ebayKey] = value.trim() }
    }
}
