package com.colecta.app.domain.model

import com.squareup.moshi.JsonClass

/**
 * Modelos de dominio. Las entities Room los duplican porque Room maneja mejor
 * tipos primitivos planos, pero para la UI usamos estos.
 */

enum class CoinCondition { POOR, FAIR, GOOD, VERY_GOOD, FINE, VERY_FINE, EXTREMELY_FINE, ABOUT_UNCIRCULATED, UNCIRCULATED, MINT_STATE }

fun CoinCondition.label(): String = when (this) {
    CoinCondition.POOR -> "Pobre"
    CoinCondition.FAIR -> "Regular"
    CoinCondition.GOOD -> "Bien"
    CoinCondition.VERY_GOOD -> "Muy bien"
    CoinCondition.FINE -> "Fino"
    CoinCondition.VERY_FINE -> "Muy fino"
    CoinCondition.EXTREMELY_FINE -> "Extra. fino"
    CoinCondition.ABOUT_UNCIRCULATED -> "Casi sin circular"
    CoinCondition.UNCIRCULATED -> "Sin circular"
    CoinCondition.MINT_STATE -> "Flor de cuño"
}

enum class CoinRarity { COMMON, UNCOMMON, RARE, VERY_RARE }

fun CoinRarity.label(): String = when (this) {
    CoinRarity.COMMON -> "Común"
    CoinRarity.UNCOMMON -> "Poco común"
    CoinRarity.RARE -> "Rara"
    CoinRarity.VERY_RARE -> "Muy rara"
}

enum class PossessionStatus { OWNED, WANTED, TRADE }

fun PossessionStatus.label(): String = when (this) {
    PossessionStatus.OWNED -> "Tengo"
    PossessionStatus.WANTED -> "Quiero"
    PossessionStatus.TRADE -> "Cambio"
}

fun PossessionStatus.emoji(): String = when (this) {
    PossessionStatus.OWNED -> "✅"
    PossessionStatus.WANTED -> "🎯"
    PossessionStatus.TRADE -> "🔄"
}

/**
 * Categorías de monedas predefinidas. No se editan desde la app: este MVP es
 * más simple si la categoría se elige de una lista fija.
 */
enum class CoinCategory(val display: String, val emoji: String) {
    EURO("Euro", "€"),
    EUROPA_PRE_EURO("Europa pre-Euro", "🏛"),
    EUROPA_NO_EURO("Europa no-Euro", "🇪🇺"),
    AMERICA("América", "🗽"),
    ASIA("Asia", "🐉"),
    AFRICA("África", "🌍"),
    OCEANIA("Oceanía", "🦘"),
    ANTIGUA("Antigua", "🏺"),
    OTRA("Otra", "🪙"),
}

enum class ObjectType(val display: String, val emoji: String) {
    SPORTS_CARD("Carta deportiva", "🏆"),
    POKEMON_CARD("Carta Pokémon", "🎴"),
    FIGURE("Figura", "🧸"),
    BOOK("Libro", "📚"),
    STAMP("Sello", "📮"),
    OTHER("Otro", "📦"),
}

// ─── DTOs Numista ─────────────────────────────────────────────────────────────

@JsonClass(generateAdapter = true)
data class NumistaCandidate(
    val numistaId: Int,
    val title: String,
    val country: String,
    val year: Int,
    val obverseThumb: String?,
    val reverseThumb: String?,
)

@JsonClass(generateAdapter = true)
data class NumistaFullData(
    val numistaId: Int,
    val title: String,
    val country: String,
    val year: Int,
    val denomination: String?,
    val composition: String?,
    val weightG: Double?,
    val diameterMm: Double?,
    val mintage: Long?,
    val rarity: CoinRarity?,
    val numistaMinValue: Double?,
    val numistaTypicalValue: Double?,
    val numistaMaxValue: Double?,
    val officialObverseUrl: String?,
    val officialReverseUrl: String?,
    val numistaUrl: String?,
)

data class EbayPrice(
    val price: Double,
    val currency: String,
    val endDate: String?,
    val itemUrl: String?,
    val title: String?,
)
