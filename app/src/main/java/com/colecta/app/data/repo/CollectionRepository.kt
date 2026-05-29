package com.colecta.app.data.repo

import com.colecta.app.data.db.CollectionDao
import com.colecta.app.data.db.CollectionEntity
import com.colecta.app.data.db.CoinEntity
import com.colecta.app.util.nowIso
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import java.util.UUID

@Singleton
class CollectionRepository @Inject constructor(
    private val dao: CollectionDao,
) {
    val all: Flow<List<CollectionEntity>> = dao.observeAll()
    val counts: Flow<Map<String, Int>> = kotlinx.coroutines.flow.flow {
        dao.observeCounts().collect { list ->
            emit(list.associate { it.collectionId to it.n })
        }
    }

    suspend fun get(id: String): CollectionEntity? = dao.byId(id)

    suspend fun upsert(entity: CollectionEntity) {
        dao.upsert(entity.copy(updatedAt = nowIso()))
    }

    suspend fun create(name: String, description: String?, emoji: String = "📁"): CollectionEntity {
        val now = nowIso()
        val c = CollectionEntity(
            id = UUID.randomUUID().toString(),
            name = name.trim(),
            description = description?.takeIf { it.isNotBlank() },
            emoji = emoji,
            createdAt = now,
            updatedAt = now,
        )
        dao.upsert(c)
        return c
    }

    suspend fun delete(id: String) = dao.deleteById(id)

    fun coinsIn(collectionId: String): Flow<List<CoinEntity>> = dao.observeCoinsIn(collectionId)

    suspend fun collectionsOf(coinId: String): List<String> = dao.collectionIdsFor(coinId)

    suspend fun setMembership(coinId: String, collectionIds: Set<String>) =
        dao.setMembers(coinId, collectionIds)
}
