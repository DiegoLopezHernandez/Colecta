package com.colecta.app.data.repo

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.colecta.app.data.api.FxApi
import com.squareup.moshi.JsonAdapter
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.first

private val Context.fxStore by preferencesDataStore("colecta_fx")

/**
 * Cache local de los tipos de cambio (base EUR). Se refresca cada 24h o
 * cuando el cache está vacío. Si la red falla, se sigue usando el cache anterior
 * — no rompemos las stats por una conexión caída.
 *
 * Política de conversión: la moneda EUR cuenta 1:1. Si el rate no se encuentra,
 * devolvemos `null` (el llamante decide si descarta el valor o lo muestra tal cual).
 */
@Singleton
class FxRepository @Inject constructor(
    private val api: FxApi,
    private val moshi: Moshi,
    @ApplicationContext private val context: Context,
) {
    private val ratesKey = stringPreferencesKey("rates_json")
    private val updatedAtKey = longPreferencesKey("rates_updated_at")
    private val adapter: JsonAdapter<Map<String, Double>> by lazy {
        val mapType = Types.newParameterizedType(Map::class.java, String::class.java, java.lang.Double::class.java)
        moshi.adapter(mapType)
    }

    private val ttlMs = 24L * 60 * 60 * 1000L

    /** Obtiene los rates, refrescándolos si el cache supera 24h. */
    suspend fun rates(): Map<String, Double> {
        val prefs = context.fxStore.data.first()
        val cached = prefs[ratesKey]
        val updatedAt = prefs[updatedAtKey] ?: 0L
        val fresh = cached != null && (System.currentTimeMillis() - updatedAt) < ttlMs
        if (fresh && cached != null) return parse(cached)
        return runCatching {
            val resp = api.latest(base = "EUR")
            persist(resp.rates)
            resp.rates
        }.getOrElse { _ -> cached?.let(::parse) ?: emptyMap() }
    }

    /** Convierte `amount` desde `currency` a EUR. Devuelve null si no se puede. */
    suspend fun toEur(amount: Double?, currency: String?): Double? {
        if (amount == null) return null
        val cur = currency?.uppercase()?.takeIf { it.isNotBlank() } ?: return amount
        if (cur == "EUR") return amount
        val rate = rates()[cur] ?: return null
        if (rate <= 0.0) return null
        return amount / rate
    }

    private fun parse(json: String): Map<String, Double> = runCatching {
        adapter.fromJson(json) ?: emptyMap()
    }.getOrDefault(emptyMap())

    private suspend fun persist(rates: Map<String, Double>) {
        context.fxStore.edit { p ->
            p[ratesKey] = adapter.toJson(rates)
            p[updatedAtKey] = System.currentTimeMillis()
        }
    }
}
