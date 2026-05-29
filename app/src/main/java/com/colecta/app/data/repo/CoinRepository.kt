package com.colecta.app.data.repo

import android.content.Context
import com.colecta.app.data.db.CoinDao
import com.colecta.app.data.db.CoinEntity
import com.colecta.app.util.ImageUtil
import com.colecta.app.util.nowIso
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

@Singleton
class CoinRepository @Inject constructor(
    private val dao: CoinDao,
    @ApplicationContext private val context: Context,
) {
    val all: Flow<List<CoinEntity>> = dao.observeAll()

    suspend fun get(id: String): CoinEntity? = dao.byId(id)

    suspend fun upsert(entity: CoinEntity) {
        dao.upsert(entity.copy(updatedAt = nowIso()))
    }

    suspend fun delete(id: String) {
        val existing = dao.byId(id)
        dao.deleteById(id)
        existing?.let {
            ImageUtil.deleteIfPersisted(context, it.frontImageUri)
            ImageUtil.deleteIfPersisted(context, it.backImageUri)
        }
    }

    suspend fun setSortOrder(id: String, order: Int) = dao.setSortOrder(id, order)

    suspend fun count(): Int = dao.count()
}
