package com.colecta.app.data.db

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Entidades Room. Schema v2 — añade tags, sortOrder, ebayLastPriceEur,
 * y entidades Collection + CollectionCoinCrossRef para álbumes temáticos.
 *
 * Los enums se almacenan como String para facilitar lectura de la BD.
 */

@Entity(tableName = "coins")
data class CoinEntity(
    @PrimaryKey val id: String,
    val numistaId: Int?,
    val title: String,
    val country: String,
    val year: Int,
    val denomination: String?,
    val composition: String?,
    val weightG: Double?,
    val diameterMm: Double?,
    val mintage: Long?,
    val rarity: String?,
    val numistaMinValue: Double?,
    val numistaTypicalValue: Double?,
    val numistaMaxValue: Double?,
    val numistaUrl: String?,
    val ebayLastPrice: Double?,
    val ebayLastPriceCurrency: String?,
    val ebayLastPriceDate: String?,
    val ebayLastPriceUpdatedAt: String?,
    /** Precio convertido a EUR usando los rates más recientes. Lo escribe el repo al actualizar precio. */
    val ebayLastPriceEur: Double? = null,
    val ebayPriceNotFound: Boolean,
    val frontImageUri: String?,
    val backImageUri: String?,
    val officialObverseUrl: String?,
    val officialReverseUrl: String?,
    val condition: String,
    val possessionStatus: String,
    val category: String,
    /** CSV de etiquetas libres (e.g. "rara,regalo,1euro"). */
    val tags: String? = null,
    /** Posición manual del usuario. 0 = arriba. */
    val sortOrder: Int = 0,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String,
)

@Entity(tableName = "objects")
data class ObjectEntity(
    @PrimaryKey val id: String,
    val name: String,
    val type: String,
    val ebayLastPrice: Double?,
    val ebayLastPriceCurrency: String?,
    val ebayLastPriceDate: String?,
    val ebayLastPriceUpdatedAt: String?,
    val ebayLastPriceEur: Double? = null,
    val ebayPriceNotFound: Boolean,
    val frontImageUri: String?,
    val backImageUri: String?,
    val possessionStatus: String,
    val tags: String? = null,
    val sortOrder: Int = 0,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String,
)

@Entity(tableName = "collections")
data class CollectionEntity(
    @PrimaryKey val id: String,
    val name: String,
    val description: String?,
    val emoji: String,
    val sortOrder: Int = 0,
    val createdAt: String,
    val updatedAt: String,
)

/**
 * Tabla intermedia N:M moneda ↔ colección.
 * `ON DELETE CASCADE` garantiza que al borrar una moneda o colección la relación
 * se limpia sola — evita huérfanos.
 */
@Entity(
    tableName = "collection_coins",
    primaryKeys = ["collectionId", "coinId"],
    foreignKeys = [
        ForeignKey(
            entity = CollectionEntity::class,
            parentColumns = ["id"],
            childColumns = ["collectionId"],
            onDelete = ForeignKey.CASCADE,
        ),
        ForeignKey(
            entity = CoinEntity::class,
            parentColumns = ["id"],
            childColumns = ["coinId"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index("coinId")],
)
data class CollectionCoinCrossRef(
    val collectionId: String,
    val coinId: String,
)
