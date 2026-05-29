package com.colecta.app.data.api

import com.colecta.app.domain.model.EbayPrice
import com.squareup.moshi.JsonClass
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.QueryMap
import retrofit2.http.Url

/**
 * eBay Finding API (legacy). Solo precio de listings completados/activos.
 * Endpoint producción: https://svcs.ebay.com/services/search/FindingService/v1
 * Sandbox:             https://svcs.sandbox.ebay.com/...
 *
 * Auth: solo App ID (Client ID). Si contiene "SBX" usamos sandbox.
 */
interface EbayApi {
    @GET
    suspend fun finding(
        @Url url: String,
        @Header("X-EBAY-SOA-OPERATION-NAME") operation: String,
        @Header("X-EBAY-SOA-SECURITY-APPNAME") appId: String,
        @Header("X-EBAY-SOA-GLOBAL-ID") globalId: String = "EBAY-ES",
        @Header("X-EBAY-SOA-RESPONSE-DATA-FORMAT") format: String = "JSON",
        @Header("X-EBAY-SOA-SERVICE-VERSION") version: String = "1.13.0",
        @QueryMap params: Map<String, String>,
    ): Map<String, Any?>
}

object EbayEndpoints {
    private const val PROD = "https://svcs.ebay.com/services/search/FindingService/v1"
    private const val SBX = "https://svcs.sandbox.ebay.com/services/search/FindingService/v1"
    fun forApp(appId: String): String = if (appId.contains("SBX", ignoreCase = true)) SBX else PROD
}

/**
 * Parser pragmático del JSON anidado de Finding API. Devuelve el primer item
 * que tenga precio válido, o null si la respuesta no tiene resultados.
 */
object EbayParser {
    @Suppress("UNCHECKED_CAST")
    fun firstPrice(response: Map<String, Any?>, opName: String): EbayPrice? {
        val root = response["${opName}Response"] as? List<Map<String, Any?>> ?: return null
        val r = root.firstOrNull() ?: return null
        val ack = (r["ack"] as? List<*>)?.firstOrNull() as? String
        if (ack == "Failure") return null
        val searchResult = (r["searchResult"] as? List<Map<String, Any?>>)?.firstOrNull() ?: return null
        val items = searchResult["item"] as? List<Map<String, Any?>> ?: return null
        val item = items.firstOrNull() ?: return null
        val ss = (item["sellingStatus"] as? List<Map<String, Any?>>)?.firstOrNull() ?: return null
        val priceObj = ((ss["currentPrice"] as? List<Map<String, Any?>>)?.firstOrNull())
            ?: ((ss["convertedCurrentPrice"] as? List<Map<String, Any?>>)?.firstOrNull())
            ?: return null
        val amount = (priceObj["__value__"] as? String)?.toDoubleOrNull() ?: return null
        val currency = priceObj["@currencyId"] as? String ?: "EUR"
        val endTime = ((item["listingInfo"] as? List<Map<String, Any?>>)?.firstOrNull()?.get("endTime") as? List<*>)?.firstOrNull() as? String
        val url = (item["viewItemURL"] as? List<*>)?.firstOrNull() as? String
        val title = (item["title"] as? List<*>)?.firstOrNull() as? String
        return EbayPrice(amount, currency, endTime, url, title)
    }
}

@JsonClass(generateAdapter = true)
data class EbayPriceDto(
    val price: Double,
    val currency: String,
    val endDate: String?,
)
