package com.colecta.app.data.db

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        CoinEntity::class,
        ObjectEntity::class,
        CollectionEntity::class,
        CollectionCoinCrossRef::class,
    ],
    version = 2,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun coinDao(): CoinDao
    abstract fun objectDao(): ObjectDao
    abstract fun collectionDao(): CollectionDao
}
