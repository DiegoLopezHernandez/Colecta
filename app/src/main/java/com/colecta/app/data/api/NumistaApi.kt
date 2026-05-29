package com.colecta.app.data.api

import com.colecta.app.domain.model.CoinRarity
import com.colecta.app.domain.model.NumistaCandidate
import com.colecta.app.domain.model.NumistaFullData
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.QueryMap

/**
 * Numista API v3. Solo necesitamos buscar tipos por país/año/query y obtener
 * la ficha completa por ID. Endpoint base: https://api.numista.com/api/v3/
 *
 * La API se autentica con un header `Numista-API-Key`.
 */
interface NumistaApi {
    @GET("types")
    suspend fun searchTypes(
        @Header("Numista-API-Key") apiKey: String,
        @QueryMap params: Map<String, String>,
    ): NumistaTypesResponse

    @GET("types/{id}")
    suspend fun typeDetail(
        @Header("Numista-API-Key") apiKey: String,
        @Path("id") id: Int,
        @Query("lang") lang: String = "es",
    ): NumistaTypeDetailDto
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class NumistaTypesResponse(
    val count: Int = 0,
    val types: List<NumistaTypeDto> = emptyList(),
)

@JsonClass(generateAdapter = true)
data class NumistaTypeDto(
    val id: Int,
    val title: String,
    val category: String? = null,
    @Json(name = "min_year") val minYear: Int? = null,
    @Json(name = "max_year") val maxYear: Int? = null,
    val issuer: NumistaIssuerDto? = null,
    @Json(name = "obverse_thumbnail") val obverseThumbnail: String? = null,
    @Json(name = "reverse_thumbnail") val reverseThumbnail: String? = null,
)

@JsonClass(generateAdapter = true)
data class NumistaIssuerDto(
    val code: String? = null,
    val name: String? = null,
)

@JsonClass(generateAdapter = true)
data class NumistaTypeDetailDto(
    val id: Int,
    val title: String,
    val category: String? = null,
    @Json(name = "min_year") val minYear: Int? = null,
    @Json(name = "max_year") val maxYear: Int? = null,
    val issuer: NumistaIssuerDto? = null,
    val value: NumistaValueDto? = null,
    val composition: NumistaCompositionDto? = null,
    val weight: Double? = null,
    val size: Double? = null,
    val mintage: NumistaMintageDto? = null,
    val rarity: String? = null,
    val price: NumistaPriceDto? = null,
    val obverse: NumistaPicDto? = null,
    val reverse: NumistaPicDto? = null,
    val url: String? = null,
)

@JsonClass(generateAdapter = true)
data class NumistaValueDto(
    @Json(name = "numeric_value") val numericValue: Double? = null,
    val text: String? = null,
    val currency: NumistaCurrencyDto? = null,
)

@JsonClass(generateAdapter = true)
data class NumistaCurrencyDto(
    val name: String? = null,
    @Json(name = "short_name") val shortName: String? = null,
)

@JsonClass(generateAdapter = true)
data class NumistaCompositionDto(
    val text: String? = null,
    val name: String? = null,
    val base: String? = null,
)

@JsonClass(generateAdapter = true)
data class NumistaMintageDto(
    val total: Long? = null,
)

@JsonClass(generateAdapter = true)
data class NumistaPriceDto(
    val min: Double? = null,
    val avg: Double? = null,
    val max: Double? = null,
    val currency: String? = null,
)

@JsonClass(generateAdapter = true)
data class NumistaPicDto(
    val picture: String? = null,
    val thumbnail: String? = null,
    val description: String? = null,
)

// ─── Mapeo ────────────────────────────────────────────────────────────────────

internal fun NumistaTypeDto.toCandidate(fallbackCountry: String, year: Int): NumistaCandidate = NumistaCandidate(
    numistaId = id,
    title = title,
    country = issuer?.name ?: fallbackCountry,
    year = year,
    obverseThumb = obverseThumbnail,
    reverseThumb = reverseThumbnail,
)

internal fun NumistaTypeDetailDto.toFull(): NumistaFullData {
    val denom = value?.text
        ?: value?.numericValue?.let { v -> "${v}${value.currency?.shortName?.let { " $it" }.orEmpty()}" }
    val rarityMapped = when (rarity?.lowercase()) {
        null -> null
        in setOf("very rare", "very-rare") -> CoinRarity.VERY_RARE
        in setOf("rare") -> CoinRarity.RARE
        in setOf("uncommon") -> CoinRarity.UNCOMMON
        in setOf("common") -> CoinRarity.COMMON
        else -> when {
            rarity.contains("very rare", true) -> CoinRarity.VERY_RARE
            rarity.contains("rare", true) -> CoinRarity.RARE
            rarity.contains("uncommon", true) -> CoinRarity.UNCOMMON
            rarity.contains("common", true) -> CoinRarity.COMMON
            else -> null
        }
    }
    return NumistaFullData(
        numistaId = id,
        title = title,
        country = issuer?.name ?: "",
        year = minYear ?: maxYear ?: 0,
        denomination = denom,
        composition = composition?.text ?: composition?.name ?: composition?.base,
        weightG = weight,
        diameterMm = size,
        mintage = mintage?.total,
        rarity = rarityMapped,
        numistaMinValue = price?.min,
        numistaTypicalValue = price?.avg,
        numistaMaxValue = price?.max,
        officialObverseUrl = obverse?.picture ?: obverse?.thumbnail,
        officialReverseUrl = reverse?.picture ?: reverse?.thumbnail,
        numistaUrl = url,
    )
}
