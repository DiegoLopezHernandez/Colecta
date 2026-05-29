package com.colecta.app.data.api

import com.squareup.moshi.JsonClass
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * Tipos de cambio diarios sin autenticación.
 *
 * Endpoint: https://api.exchangerate.host/latest?base=EUR
 * Devuelve: { base: "EUR", date: "AAAA-MM-DD", rates: { "USD": 1.07, "GBP": 0.86, ... } }
 */
interface FxApi {
    @GET("latest")
    suspend fun latest(@Query("base") base: String = "EUR"): FxResponse
}

@JsonClass(generateAdapter = true)
data class FxResponse(
    val base: String = "EUR",
    val date: String = "",
    val rates: Map<String, Double> = emptyMap(),
)
