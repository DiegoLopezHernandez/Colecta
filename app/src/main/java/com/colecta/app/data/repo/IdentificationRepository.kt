package com.colecta.app.data.repo

import com.colecta.app.data.api.EbayApi
import com.colecta.app.data.api.EbayEndpoints
import com.colecta.app.data.api.EbayParser
import com.colecta.app.data.api.NumistaApi
import com.colecta.app.data.api.toCandidate
import com.colecta.app.data.api.toFull
import com.colecta.app.domain.model.EbayPrice
import com.colecta.app.domain.model.NumistaCandidate
import com.colecta.app.domain.model.NumistaFullData
import com.colecta.app.util.findCountryByCode
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Encapsula la lógica de identificar moneda en Numista y consultar precio en eBay.
 * Errores se devuelven como Result para que la UI los muestre limpiamente.
 */
@Singleton
class IdentificationRepository @Inject constructor(
    private val numista: NumistaApi,
    private val ebay: EbayApi,
) {
    suspend fun searchCandidates(
        apiKey: String,
        countryCode: String,
        year: Int,
        query: String?,
    ): Result<List<NumistaCandidate>> = runCatching {
        if (apiKey.isBlank()) error("Falta la API Key de Numista (Ajustes).")
        val slug = findCountryByCode(countryCode)?.numistaSlug
        val parts = mutableListOf<String>(year.toString())
        if (!query.isNullOrBlank()) parts += query.trim()
        val params = buildMap {
            put("category", "coin")
            if (slug != null) put("issuer", slug)
            put("q", parts.joinToString(" "))
            put("count", "50")
            put("page", "1")
            put("lang", "es")
        }
        val resp = numista.searchTypes(apiKey, params)
        val tolerance = 5
        val countryName = findCountryByCode(countryCode)?.name ?: countryCode
        resp.types
            .asSequence()
            .filter { t ->
                val maxY = t.maxYear ?: t.minYear
                val minY = t.minYear ?: t.maxYear
                if (maxY == null && minY == null) true
                else !(maxY != null && maxY < year - tolerance) &&
                    !(minY != null && minY > year + tolerance)
            }
            .sortedBy { kotlin.math.abs(((it.minYear ?: it.maxYear ?: 0) - year)) }
            .map { it.toCandidate(countryName, year) }
            .take(20)
            .toList()
    }

    suspend fun fetchFullData(apiKey: String, numistaId: Int): Result<NumistaFullData> = runCatching {
        if (apiKey.isBlank()) error("Falta la API Key de Numista (Ajustes).")
        numista.typeDetail(apiKey, numistaId).toFull()
    }

    suspend fun fetchEbayPrice(appId: String, keywords: String): Result<EbayPrice?> = runCatching {
        if (appId.isBlank()) error("Falta el App ID de eBay (Ajustes).")
        if (keywords.isBlank()) return@runCatching null

        val endpoint = EbayEndpoints.forApp(appId)

        // 1) Listings completados (vendidos)
        val completed = ebay.finding(
            url = endpoint,
            operation = "findCompletedItems",
            appId = appId,
            params = mapOf(
                "keywords" to keywords,
                "paginationInput.entriesPerPage" to "5",
                "sortOrder" to "EndTimeSoonest",
                "itemFilter(0).name" to "SoldItemsOnly",
                "itemFilter(0).value" to "true",
            ),
        )
        EbayParser.firstPrice(completed, "findCompletedItems")?.let { return@runCatching it }

        // 2) Fallback: listings activos
        val active = ebay.finding(
            url = endpoint,
            operation = "findItemsAdvanced",
            appId = appId,
            params = mapOf(
                "keywords" to keywords,
                "paginationInput.entriesPerPage" to "5",
                "sortOrder" to "EndTimeSoonest",
            ),
        )
        EbayParser.firstPrice(active, "findItemsAdvanced")
    }
}
