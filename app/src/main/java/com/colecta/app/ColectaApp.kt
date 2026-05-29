package com.colecta.app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

/**
 * Application principal. Implementa `Configuration.Provider` para que
 * WorkManager use el `HiltWorkerFactory` y pueda inyectar dependencias
 * (Backup, BackupSettings…) en nuestros workers.
 */
@HiltAndroidApp
class ColectaApp : Application(), Configuration.Provider {
    @Inject lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
}
