package com.colecta.app.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface CoinDao {
    /** Orden manual primero, luego por updatedAt (más recientes primero). */
    @Query("SELECT * FROM coins ORDER BY sortOrder ASC, updatedAt DESC")
    fun observeAll(): Flow<List<CoinEntity>>

    @Query("SELECT * FROM coins ORDER BY sortOrder ASC, updatedAt DESC")
    suspend fun allOnce(): List<CoinEntity>

    @Query("SELECT * FROM coins WHERE id = :id")
    suspend fun byId(id: String): CoinEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: CoinEntity)

    @Query("UPDATE coins SET sortOrder = :order WHERE id = :id")
    suspend fun setSortOrder(id: String, order: Int)

    @Query("DELETE FROM coins WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM coins")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM coins")
    suspend fun count(): Int
}

@Dao
interface ObjectDao {
    @Query("SELECT * FROM objects ORDER BY sortOrder ASC, updatedAt DESC")
    fun observeAll(): Flow<List<ObjectEntity>>

    @Query("SELECT * FROM objects ORDER BY sortOrder ASC, updatedAt DESC")
    suspend fun allOnce(): List<ObjectEntity>

    @Query("SELECT * FROM objects WHERE id = :id")
    suspend fun byId(id: String): ObjectEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: ObjectEntity)

    @Query("UPDATE objects SET sortOrder = :order WHERE id = :id")
    suspend fun setSortOrder(id: String, order: Int)

    @Query("DELETE FROM objects WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM objects")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM objects")
    suspend fun count(): Int
}

@Dao
interface CollectionDao {
    @Query("SELECT * FROM collections ORDER BY sortOrder ASC, createdAt ASC")
    fun observeAll(): Flow<List<CollectionEntity>>

    @Query("SELECT * FROM collections WHERE id = :id")
    suspend fun byId(id: String): CollectionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(c: CollectionEntity)

    @Query("DELETE FROM collections WHERE id = :id")
    suspend fun deleteById(id: String)

    /** Monedas que pertenecen a una colección dada. */
    @Query(
        """
        SELECT c.* FROM coins c
        INNER JOIN collection_coins cc ON cc.coinId = c.id
        WHERE cc.collectionId = :collectionId
        ORDER BY c.sortOrder ASC, c.updatedAt DESC
        """
    )
    fun observeCoinsIn(collectionId: String): Flow<List<CoinEntity>>

    /** IDs de las colecciones a las que pertenece una moneda. */
    @Query("SELECT collectionId FROM collection_coins WHERE coinId = :coinId")
    suspend fun collectionIdsFor(coinId: String): List<String>

    /** Cuenta de monedas por colección, para mostrar en la pantalla de listas. */
    @Query("SELECT collectionId, COUNT(*) AS n FROM collection_coins GROUP BY collectionId")
    fun observeCounts(): Flow<List<CollectionCount>>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun link(ref: CollectionCoinCrossRef)

    @Query("DELETE FROM collection_coins WHERE collectionId = :collectionId AND coinId = :coinId")
    suspend fun unlink(collectionId: String, coinId: String)

    @Transaction
    suspend fun setMembers(coinId: String, collectionIds: Set<String>) {
        // Borra las membresías actuales y vuelve a crear las nuevas.
        val current = collectionIdsFor(coinId).toSet()
        (current - collectionIds).forEach { unlink(it, coinId) }
        (collectionIds - current).forEach { link(CollectionCoinCrossRef(it, coinId)) }
    }
}

data class CollectionCount(val collectionId: String, val n: Int)
