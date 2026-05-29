package com.colecta.app.di

import android.content.Context
import androidx.room.Room
import com.colecta.app.data.api.EbayApi
import com.colecta.app.data.api.FxApi
import com.colecta.app.data.api.NumistaApi
import com.colecta.app.data.db.AppDatabase
import com.colecta.app.data.db.CoinDao
import com.colecta.app.data.db.CollectionDao
import com.colecta.app.data.db.ObjectDao
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

/**
 * Configuración Hilt para inyección de dependencias.
 *
 * - DB: instancia única de Room sobre fichero local.
 * - Moshi: con KotlinJsonAdapterFactory para data classes Kotlin.
 * - OkHttpClient: timeouts razonables + logging de cuerpo en debug.
 * - APIs (Numista, eBay): cada una con su Retrofit propio y baseUrl distinto.
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDb(@ApplicationContext ctx: Context): AppDatabase =
        Room.databaseBuilder(ctx, AppDatabase::class.java, "colecta.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun provideCoinDao(db: AppDatabase): CoinDao = db.coinDao()
    @Provides fun provideObjectDao(db: AppDatabase): ObjectDao = db.objectDao()
    @Provides fun provideCollectionDao(db: AppDatabase): CollectionDao = db.collectionDao()

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    fun provideOkHttp(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        .build()

    @Provides
    @Singleton
    fun provideNumistaApi(client: OkHttpClient, moshi: Moshi): NumistaApi =
        Retrofit.Builder()
            .baseUrl("https://api.numista.com/api/v3/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(NumistaApi::class.java)

    @Provides
    @Singleton
    fun provideEbayApi(client: OkHttpClient, moshi: Moshi): EbayApi =
        Retrofit.Builder()
            .baseUrl("https://svcs.ebay.com/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(EbayApi::class.java)

    @Provides
    @Singleton
    fun provideFxApi(client: OkHttpClient, moshi: Moshi): FxApi =
        Retrofit.Builder()
            .baseUrl("https://api.exchangerate.host/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(FxApi::class.java)
}
